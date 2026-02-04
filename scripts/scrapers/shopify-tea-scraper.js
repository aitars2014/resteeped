/**
 * Generic Shopify Tea Scraper
 * Works for any Shopify-powered tea store
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Brand configurations
const BRANDS = {
  bigelow: {
    name: 'Bigelow Tea',
    slug: 'bigelow-tea',
    url: 'https://www.bigelowtea.com',
    description: 'Family-owned American tea company since 1945, known for Constant Comment and a wide variety of specialty teas.',
    city: 'Fairfield',
    state: 'CT',
    country: 'United States',
    founded: 1945,
    specialty: ['Black tea', 'Herbal tea', 'Green tea'],
  },
  stash: {
    name: 'Stash Tea',
    slug: 'stash-tea',
    url: 'https://www.stashtea.com',
    description: 'Premium tea company based in Portland, Oregon, offering a wide range of teas and herbal blends since 1972.',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    founded: 1972,
    specialty: ['Specialty tea', 'Herbal blends', 'Chai'],
  },
  twinings: {
    name: 'Twinings',
    slug: 'twinings',
    url: 'https://www.twiningsusa.com',
    description: 'One of the oldest tea brands in the world, founded in 1706. Known for English Breakfast, Earl Grey, and a wide variety of classic and specialty teas.',
    city: 'London',
    state: null,
    country: 'United Kingdom',
    founded: 1706,
    specialty: ['English Breakfast', 'Earl Grey', 'Classic blends'],
  },
  celestial: {
    name: 'Celestial Seasonings',
    slug: 'celestial-seasonings',
    url: 'https://www.celestialseasonings.com',
    description: 'American herbal tea company founded in Boulder, Colorado in 1969. Known for Sleepytime and creative herbal blends.',
    city: 'Boulder',
    state: 'CO',
    country: 'United States',
    founded: 1969,
    specialty: ['Herbal tea', 'Wellness blends', 'Sleepytime'],
  },
};

// Map tags to tea types
function getTeaType(tags, title) {
  const str = [...tags, title].join(' ').toLowerCase();
  if (str.includes('pu-erh') || str.includes('puerh')) return 'puerh';
  if (str.includes('oolong')) return 'oolong';
  if (str.includes('white tea')) return 'white';
  if (str.includes('green tea') || str.includes('matcha')) return 'green';
  if (str.includes('black tea') || str.includes('chai') || str.includes('earl grey') || str.includes('english breakfast')) return 'black';
  if (str.includes('herbal') || str.includes('rooibos') || str.includes('chamomile') || str.includes('peppermint') || str.includes('tisane')) return 'herbal';
  // Default based on keywords
  if (str.includes('green')) return 'green';
  if (str.includes('black')) return 'black';
  return 'herbal';
}

// Clean HTML description
function cleanDescription(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

// Filter for actual tea products
function isTeaProduct(product) {
  const title = product.title.toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  const type = product.product_type?.toLowerCase() || '';
  
  // Exclude non-tea items
  const excludePatterns = [
    'gift', 'sampler', 'variety pack', 'assortment',
    'mug', 'cup', 'teapot', 'infuser', 'accessory', 'accessories',
    'honey', 'sweetener', 'cookie', 'biscuit',
  ];
  
  if (excludePatterns.some(p => title.includes(p))) return false;
  
  // Include if it looks like tea
  const includePatterns = ['tea', 'chai', 'matcha', 'tisane', 'herbal', 'infusion'];
  return includePatterns.some(p => title.includes(p) || tags.some(t => t.includes(p)) || type.includes(p));
}

async function ensureCompany(brandKey) {
  const brand = BRANDS[brandKey];
  
  // Check if exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', brand.slug)
    .single();
  
  if (existing) {
    console.log(`  Company exists: ${brand.name} (${existing.id})`);
    return existing.id;
  }
  
  // Create
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      website_url: brand.url,
      headquarters_city: brand.city,
      headquarters_state: brand.state,
      headquarters_country: brand.country,
      founded_year: brand.founded,
      specialty: brand.specialty,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`  Failed to create company:`, error.message);
    return null;
  }
  
  console.log(`  Created company: ${brand.name} (${data.id})`);
  return data.id;
}

async function scrapeBrand(brandKey) {
  const brand = BRANDS[brandKey];
  console.log(`\nScraping ${brand.name}...`);
  
  const companyId = await ensureCompany(brandKey);
  if (!companyId) return { imported: 0, skipped: 0 };
  
  // Fetch products
  const response = await fetch(`${brand.url}/products.json?limit=250`);
  const data = await response.json();
  
  const teas = data.products.filter(isTeaProduct);
  console.log(`  Found ${teas.length} tea products`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const product of teas) {
    // Check for duplicate
    const { data: existing } = await supabase
      .from('teas')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', product.title)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const teaData = {
      name: product.title,
      company_id: companyId,
      brand_name: brand.name,
      tea_type: getTeaType(product.tags || [], product.title),
      description: cleanDescription(product.body_html),
      image_url: product.images?.[0]?.src || null,
      product_url: `${brand.url}/products/${product.handle}`,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    
    if (error) {
      console.error(`  Failed: ${product.title} - ${error.message}`);
    } else {
      imported++;
    }
  }
  
  console.log(`  Imported: ${imported}, Skipped: ${skipped}`);
  return { imported, skipped };
}

async function main() {
  const brands = process.argv.slice(2);
  
  if (brands.length === 0) {
    console.log('Scraping all brands:', Object.keys(BRANDS).join(', '));
    for (const brand of Object.keys(BRANDS)) {
      await scrapeBrand(brand);
    }
  } else {
    for (const brand of brands) {
      if (BRANDS[brand]) {
        await scrapeBrand(brand);
      } else {
        console.error(`Unknown brand: ${brand}`);
      }
    }
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
