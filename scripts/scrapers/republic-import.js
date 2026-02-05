/**
 * Republic of Tea Import
 * Parses product sitemap and imports tea products
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BRAND = {
  name: 'Republic of Tea',
  slug: 'republic-of-tea',
  url: 'https://www.republicoftea.com',
  description: 'Premium tea company founded in 1992, known for their "Sip by Sip Rather Than Gulp by Gulp" philosophy and extensive collection of premium teas.',
  city: 'Novato',
  state: 'CA',
  country: 'United States',
  founded: 1992,
  specialty: ['Premium tea', 'Herbal tea', 'Wellness tea'],
};

// Detect tea type from product name/URL
function getTeaType(name, url) {
  const lower = name.toLowerCase();
  
  if (lower.includes('matcha')) return 'green';
  if (lower.includes('green tea') || lower.includes('green ') || lower.includes('sencha') || lower.includes('jasmine')) return 'green';
  if (lower.includes('white tea') || lower.includes('white ')) return 'white';
  if (lower.includes('oolong')) return 'oolong';
  if (lower.includes('pu-erh') || lower.includes('puerh') || lower.includes('pu erh')) return 'puerh';
  if (lower.includes('rooibos') || lower.includes('red tea') || lower.includes('red ')) return 'herbal';
  if (lower.includes('hibiscus')) return 'herbal';
  if (lower.includes('herbal') || lower.includes('chamomile') || lower.includes('mint') || lower.includes('ginger')) return 'herbal';
  if (lower.includes('chai')) return 'black';
  if (lower.includes('black tea') || lower.includes('black ') || lower.includes('breakfast') || lower.includes('earl grey') || lower.includes('darjeeling')) return 'black';
  
  // Default to herbal for wellness teas
  if (lower.includes('get ') || lower.includes('superherb') || lower.includes('beauty') || lower.includes('adapt')) return 'herbal';
  
  return 'black'; // Default
}

function urlToTeaName(url) {
  // Extract tea name from URL
  const match = url.match(/republicoftea\.com\/([^\/]+)\/p\//);
  if (!match) return null;
  
  const slug = match[1];
  // Convert slug to name
  return slug
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/Tea Bags?$/i, 'Tea')
    .replace(/Full Leaf$/i, 'Full Leaf')
    .trim();
}

function isTeaProduct(url, name) {
  const lower = name?.toLowerCase() || url.toLowerCase();
  
  // Exclude non-tea products
  const excludePatterns = [
    'gift card', 'gift certificate', 'ebook', 'book',
    'teapot', 'kettle', 'infuser', 'mug', 'cup', 'glass',
    'spoon', 'scoop', 'rack', 'jar', 'storage', 'tin rack',
    'honey', 'agave', 'sweetener', 'spread',
    'sampler', 'assortment', 'flight', 'subscription', 'of the month',
    'custom gift', 'gift set', 'select tea',
    'tongs', 'whisk', 'bowl', 'frother', 'timer', 'lid',
    'bottle', 'press', 'tumbler', 'pitcher',
    'capsule', 'concentrate',
  ];
  
  return !excludePatterns.some(p => lower.includes(p));
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
  
  console.log('Fetching product sitemap...');
  const response = await fetch('https://www.republicoftea.com/sitemap_product1.xml');
  const xml = await response.text();
  
  // Extract product URLs
  const urlRegex = /<loc>(https:\/\/www\.republicoftea\.com\/[^<]+\/p\/[^<]+\/)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  
  console.log(`Found ${urls.length} product URLs`);
  
  // Convert to tea data
  const teaProducts = urls
    .map(url => {
      const name = urlToTeaName(url);
      return { url, name };
    })
    .filter(p => p.name && isTeaProduct(p.url, p.name));
  
  console.log(`Filtered to ${teaProducts.length} tea products`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const { url, name } of teaProducts) {
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
      tea_type: getTeaType(name, url),
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
