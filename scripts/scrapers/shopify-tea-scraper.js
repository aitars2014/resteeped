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
  numi: {
    name: 'Numi Organic Tea',
    slug: 'numi-organic-tea',
    url: 'https://numitea.com',
    description: 'Premium organic tea company founded in Oakland in 1999. Known for ethically sourced, fair trade certified teas and unique blends like Aged Earl Grey and flowering teas.',
    city: 'Oakland',
    state: 'CA',
    country: 'United States',
    founded: 1999,
    specialty: ['Organic tea', 'Pu-erh', 'Flowering tea', 'Fair Trade'],
  },
  tradmed: {
    name: 'Traditional Medicinals',
    slug: 'traditional-medicinals',
    url: 'https://www.traditionalmedicinals.com',
    description: 'Herbal wellness tea company founded in 1974 in Sebastopol, California. Pioneers in pharmacopoeial-quality herbal teas for specific health benefits.',
    city: 'Sebastopol',
    state: 'CA',
    country: 'United States',
    founded: 1974,
    specialty: ['Herbal tea', 'Wellness blends', 'Medicinal herbs'],
  },
  teaforte: {
    name: 'Tea Forté',
    slug: 'tea-forte',
    url: 'https://www.teaforte.com',
    description: 'Premium tea brand known for signature pyramid infusers and elegant tea accessories. Founded in 2003, offers high-quality loose leaf teas in distinctive packaging.',
    city: 'Concord',
    state: 'MA',
    country: 'United States',
    founded: 2003,
    specialty: ['Pyramid infusers', 'Loose leaf tea', 'Gift sets'],
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
  teapigs: {
    name: 'Teapigs',
    slug: 'teapigs',
    url: 'https://www.teapigs.com',
    description: 'UK tea brand founded in 2006, known for whole leaf tea in biodegradable tea temples. Focus on quality and sustainability.',
    city: 'London',
    state: null,
    country: 'United Kingdom',
    founded: 2006,
    specialty: ['Tea temples', 'Whole leaf tea', 'Matcha'],
  },
  smithtea: {
    name: 'Steven Smith Teamaker',
    slug: 'steven-smith-teamaker',
    url: 'https://www.smithtea.com',
    description: 'Portland-based artisan tea company founded by Steven Smith (creator of Stash and Tazo). Known for premium, handcrafted blends.',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    founded: 2009,
    specialty: ['Artisan blends', 'Premium sachets', 'Single origin'],
  },
  artoftea: {
    name: 'Art of Tea',
    slug: 'art-of-tea',
    url: 'https://www.artoftea.com',
    description: 'Los Angeles-based tea company founded in 2003, specializing in organic, hand-blended teas sourced from sustainable farms.',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    founded: 2003,
    specialty: ['Organic tea', 'Wellness blends', 'Custom blending'],
  },
  crimsonlotus: {
    name: 'Crimson Lotus Tea',
    slug: 'crimson-lotus-tea',
    url: 'https://crimsonlotustea.com',
    description: 'Seattle-based specialty tea company focused on authentic pu-erh and other Chinese teas sourced directly from Yunnan.',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    founded: 2013,
    specialty: ['Pu-erh', 'Sheng', 'Shou', 'Yunnan teas'],
  },
  yunnansourcing: {
    name: 'Yunnan Sourcing',
    slug: 'yunnan-sourcing',
    url: 'https://yunnansourcing.com',
    description: 'Premier source for Yunnan teas, specializing in pu-erh, offering hundreds of teas directly from Chinese farmers and factories.',
    city: 'Kunming',
    state: 'Yunnan',
    country: 'China',
    founded: 2004,
    specialty: ['Pu-erh', 'Yunnan teas', 'Aged teas', 'Factory productions'],
  },
  spirittea: {
    name: 'Spirit Tea',
    slug: 'spirit-tea',
    url: 'https://www.spirittea.co',
    description: 'Specialty tea company focused on rare and exceptional teas from East Asia, sourced directly from farmers.',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    founded: 2015,
    specialty: ['Rare teas', 'Vietnamese tea', 'Single origin'],
  },
  songtea: {
    name: 'Song Tea & Ceramics',
    slug: 'song-tea-ceramics',
    url: 'https://songtea.com',
    description: 'San Francisco-based tea company specializing in rare Chinese and Taiwanese teas, paired with artisan ceramics.',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    founded: 2009,
    specialty: ['Taiwanese oolong', 'Chinese tea', 'Artisan ceramics'],
  },
  teaspot: {
    name: 'The Tea Spot',
    slug: 'the-tea-spot',
    url: 'https://www.theteaspot.com',
    description: 'Boulder-based tea company founded in 2004, offering premium loose leaf teas and modern steepware.',
    city: 'Boulder',
    state: 'CO',
    country: 'United States',
    founded: 2004,
    specialty: ['Loose leaf tea', 'Steepware', 'Wellness teas'],
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
    'gift', 'sampler', 'variety pack', 'assortment', 'discovery box',
    'mug', 'cup', 'teapot', 'infuser', 'accessory', 'accessories',
    'honey', 'sweetener', 'cookie', 'biscuit',
    'lozenge', 'capsule', 'supplement', 'carbon offset', 'carbon neutral',
    'latte powder', 'drinking chocolate',
    'teaware', 'gift card', 'membership', 'bundle', 'custom gift', 'tea gift',
    'combo', 'set of',
  ];
  
  if (excludePatterns.some(p => title.includes(p) || type.includes(p))) return false;
  
  // Include if product_type explicitly mentions tea type
  if (/^(black|green|white|herbal|oolong)\s*tea$/i.test(type)) return true;
  if (type === 'assorted') return true; // Tea Forté uses this
  
  const includePatterns = ['tea', 'chai', 'matcha', 'tisane', 'herbal', 'infusion'];
  return includePatterns.some(p => title.includes(p) || tags.some(t => t.includes(p)));
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
