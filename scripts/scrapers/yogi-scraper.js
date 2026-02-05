/**
 * Yogi Tea Scraper
 * Scrapes product data from yogi-life.com sitemap and product pages
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BRAND = {
  name: 'Yogi Tea',
  slug: 'yogi-tea',
  url: 'https://yogi-life.com',
  description: 'Herbal tea company founded in 1984, known for functional wellness teas with Ayurvedic roots. Popular for Bedtime, Stress Relief, and Detox blends.',
  city: 'Eugene',
  state: 'OR',
  country: 'United States',
  founded: 1984,
  specialty: ['Herbal tea', 'Ayurvedic blends', 'Wellness teas'],
};

// Get tea type from product info
function getTeaType(text) {
  const str = text.toLowerCase();
  if (str.includes('green tea')) return 'green';
  if (str.includes('black tea')) return 'black';
  if (str.includes('rooibos')) return 'herbal';
  return 'herbal'; // Most Yogi teas are herbal
}

// Parse product page content
function parseProduct(html, url) {
  // Extract title from URL slug
  const slug = url.split('/').pop().replace(/-\d+$/, '').replace(/-/g, ' ');
  const title = slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  // Extract description - look for "Made For:" section
  const madeForMatch = html.match(/Made For:\s*([^*]+)/);
  const description = madeForMatch ? madeForMatch[1].trim().slice(0, 500) : '';
  
  // Extract ingredients
  const ingredientMatch = html.match(/Organic [^.]+\./);
  const ingredients = ingredientMatch ? ingredientMatch[0] : '';
  
  return {
    title,
    description: description || ingredients,
    teaType: getTeaType(html),
    url,
  };
}

async function ensureCompany() {
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', BRAND.slug)
    .single();
  
  if (existing) {
    console.log(`Company exists: ${BRAND.name} (${existing.id})`);
    return existing.id;
  }
  
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: BRAND.name,
      slug: BRAND.slug,
      description: BRAND.description,
      website_url: BRAND.url,
      headquarters_city: BRAND.city,
      headquarters_state: BRAND.state,
      headquarters_country: BRAND.country,
      founded_year: BRAND.founded,
      specialty: BRAND.specialty,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create company:', error.message);
    return null;
  }
  
  console.log(`Created company: ${BRAND.name} (${data.id})`);
  return data.id;
}

async function getProductUrls() {
  console.log('Fetching sitemap...');
  const response = await fetch('https://yogi-life.com/sitemap.xml');
  const xml = await response.text();
  
  // Extract US product URLs (excluding category pages)
  const regex = /https:\/\/yogi-life\.com\/en-US\/product\/[^<]+/g;
  const allUrls = xml.match(regex) || [];
  
  // Filter to actual product pages (have SKU in URL)
  const productUrls = allUrls.filter(url => 
    /\d{12}$/.test(url) && // Has UPC at end
    !url.includes('/benefits/') && 
    !url.includes('/product-types/')
  );
  
  console.log(`Found ${productUrls.length} product URLs`);
  return productUrls;
}

async function scrapeProduct(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const html = await response.text();
    return parseProduct(html, url);
  } catch (err) {
    console.error(`  Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function main() {
  const companyId = await ensureCompany();
  if (!companyId) return;
  
  const urls = await getProductUrls();
  
  let imported = 0;
  let skipped = 0;
  
  for (const url of urls) {
    const product = await scrapeProduct(url);
    if (!product) {
      skipped++;
      continue;
    }
    
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
      brand_name: BRAND.name,
      tea_type: product.teaType,
      description: product.description,
      product_url: product.url,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    
    if (error) {
      console.error(`  Failed: ${product.title} - ${error.message}`);
    } else {
      imported++;
      process.stdout.write(`\r  Imported: ${imported}`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
