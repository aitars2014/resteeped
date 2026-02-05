/**
 * Adagio Teas Import
 * Parses sitemap and imports tea products
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BRAND = {
  name: 'Adagio Teas',
  slug: 'adagio-teas',
  url: 'https://www.adagio.com',
  description: 'Premium loose leaf tea company founded in 1999, known for direct-trade sourcing and an extensive selection of flavored and single-origin teas.',
  city: 'Garfield',
  state: 'NJ',
  country: 'United States',
  founded: 1999,
  specialty: ['Loose leaf tea', 'Flavored tea', 'Direct trade'],
};

// Category to tea type mapping
const CATEGORY_MAP = {
  'black': 'black',
  'green': 'green',
  'white': 'white',
  'oolong': 'oolong',
  'pu_erh': 'puerh',
  'herbal': 'herbal',
  'rooibos': 'herbal',
  'chai': 'black',
  'decaf': 'black',
  'flavors': 'black',
  'matcha': 'green',
  'wellness': 'herbal',
};

function urlToTeaName(url) {
  // Extract tea name from URL
  const match = url.match(/\/([^\/]+)\.html$/);
  if (!match) return null;
  
  const slug = match[1];
  // Convert slug to name
  return slug
    .replace(/_tea$/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getTeaType(url) {
  const category = url.split('/')[3]; // e.g., "black", "green", etc.
  return CATEGORY_MAP[category] || 'black';
}

function isTeaProduct(url) {
  // Filter for actual tea product pages
  const excludePatterns = [
    'index.html', 'loose_leaf', 'sampler', 'gift', 'teaware', 
    'accessories', 'starter', 'subscription', 'portions', 'sticks',
    'spices', 'honey', 'chocolates', 'faq', 'about', 'contact',
    'seasonal', 'christmas', 'valentines', 'mothers', 'fathers',
    'hostess', 'luxury', 'zodiac', 'candles'
  ];
  
  return !excludePatterns.some(p => url.includes(p));
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

async function main() {
  const companyId = await ensureCompany();
  if (!companyId) return;
  
  console.log('Fetching sitemap...');
  const response = await fetch('https://www.adagio.com/sitemap.xml');
  const xml = await response.text();
  
  // Extract product URLs
  const urlRegex = /https:\/\/www\.adagio\.com\/[^\/]+\/[^<>]+\.html/g;
  const allUrls = xml.match(urlRegex) || [];
  const teaUrls = allUrls.filter(isTeaProduct);
  
  console.log(`Found ${teaUrls.length} tea product URLs`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const url of teaUrls) {
    const name = urlToTeaName(url);
    if (!name) {
      skipped++;
      continue;
    }
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('teas')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', name)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const teaData = {
      name,
      company_id: companyId,
      brand_name: BRAND.name,
      tea_type: getTeaType(url),
      product_url: url,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    
    if (error) {
      // Likely duplicate name
      skipped++;
    } else {
      imported++;
    }
  }
  
  console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
