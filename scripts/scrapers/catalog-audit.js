/**
 * TARS-20: Catalog Audit Script
 * Scrapes all Shopify brands and brand-specific scrapers, compares to Supabase,
 * and imports any missing teas.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOG_FILE = path.join(__dirname, '../../data/catalog-audit-log.json');

// Tea type detection from tags/title
function getTeaType(tags, title) {
  const text = [...tags, title].join(' ').toLowerCase();
  if (/\bpu-?erh\b|\bpuer\b|\bshou\b|\bsheng\b/.test(text)) return 'puerh';
  if (/\bmatcha\b/.test(text)) return 'green';
  if (/\brookibos\b/.test(text)) return 'rooibos';
  if (/\bmate\b|\byerba\b/.test(text)) return 'mate';
  if (/\bchai\b/.test(text)) return 'black';
  if (/\bherbal\b|\btisane\b|\bchamomile\b|\bhibiscus\b|\bmint\b|\bpeppermint\b/.test(text)) return 'herbal';
  if (/\bwhite\s*tea\b|\bsilver\s*needle\b|\bbai\s*mu\b/.test(text)) return 'white';
  if (/\boolong\b/.test(text)) return 'oolong';
  if (/\bgreen\s*tea\b|\bsencha\b|\bgunpowder\b|\bdragon\s*well\b|\bjasmine\b/.test(text)) return 'green';
  if (/\bblack\s*tea\b|\bearl\s*grey\b|\bbreakfast\b|\bdarjeeling\b|\bassam\b|\bceylon\b/.test(text)) return 'black';
  return 'herbal'; // default
}

function cleanDescription(html) {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
}

function isTeaProduct(product) {
  const title = (product.title || '').toLowerCase();
  const type = (product.product_type || '').toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());

  const excludePatterns = [
    'gift card', 'e-gift', 'subscription', 'merch', 't-shirt', 'tote', 'candle',
    'gift', 'sampler', 'variety pack', 'assortment', 'discovery box',
    'mug', 'cup', 'teapot', 'infuser', 'accessory', 'accessories',
    'honey', 'sweetener', 'cookie', 'biscuit',
    'lozenge', 'capsule', 'supplement', 'carbon offset',
    'teaware', 'gift card', 'membership', 'bundle', 'custom gift',
    'combo', 'set of',
  ];
  if (excludePatterns.some(p => title.includes(p) || type.includes(p))) return false;
  
  const includePatterns = ['tea', 'chai', 'matcha', 'tisane', 'herbal', 'infusion'];
  return includePatterns.some(p => title.includes(p) || tags.some(t => t.includes(p)));
}

// Load all BRANDS from the shopify scraper
const shopifyScript = fs.readFileSync(path.join(__dirname, 'shopify-tea-scraper.js'), 'utf-8');
// Extract brand keys
const brandKeyMatches = shopifyScript.match(/const BRANDS = \{([\s\S]*?)\n\};/);

async function getExistingTeas(companyId) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('teas')
      .select('name')
      .eq('company_id', companyId)
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    all.push(...data.map(t => t.name.toLowerCase().trim()));
    if (data.length < 1000) break;
    from += 1000;
  }
  return new Set(all);
}

async function getCompanyId(slug) {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id || null;
}

async function ensureCompany(brand) {
  let id = await getCompanyId(brand.slug);
  if (id) return id;
  
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
  
  if (error) { console.error(`  Failed to create company ${brand.name}:`, error.message); return null; }
  console.log(`  Created company: ${brand.name}`);
  return data.id;
}

async function scrapeShopifyBrand(brand) {
  try {
    const resp = await fetch(`${brand.url}/products.json?limit=250`, {
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return (data.products || []).filter(isTeaProduct);
  } catch (e) {
    console.error(`  Scrape failed for ${brand.name}: ${e.message}`);
    return null;
  }
}

async function auditBrand(brandKey, brand) {
  console.log(`\n--- ${brand.name} (${brandKey}) ---`);
  
  const companyId = await ensureCompany(brand);
  if (!companyId) return { brand: brand.name, status: 'error', error: 'no company id', added: 0 };
  
  const products = await scrapeShopifyBrand(brand);
  if (products === null) return { brand: brand.name, status: 'scrape_failed', added: 0 };
  
  console.log(`  Website has ${products.length} teas`);
  
  const existing = await getExistingTeas(companyId);
  console.log(`  DB has ${existing.size} teas`);
  
  let added = 0;
  const newTeas = [];
  
  for (const product of products) {
    const nameKey = product.title.toLowerCase().trim();
    if (existing.has(nameKey)) continue;
    
    newTeas.push(product.title);
    const teaData = {
      name: product.title,
      company_id: companyId,
      brand_name: brand.name,
      tea_type: getTeaType(product.tags || [], product.title),
      description: cleanDescription(product.body_html),
      image_url: product.images?.[0]?.src || null,
      product_url: product.handle ? `${brand.url}/products/${product.handle}` : null,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    if (error) {
      console.error(`  Failed to insert "${product.title}": ${error.message}`);
    } else {
      added++;
    }
  }
  
  if (newTeas.length > 0) {
    console.log(`  NEW TEAS: ${newTeas.join(', ')}`);
  } else {
    console.log(`  Up to date`);
  }
  
  return { brand: brand.name, status: 'ok', websiteCount: products.length, dbCount: existing.size, added, newTeas };
}

// Import the BRANDS object by requiring the file (it exports via main() but we need BRANDS)
// Instead, parse it manually from the known structure
async function main() {
  // We'll import brands dynamically
  // Temporarily override module behavior to extract BRANDS
  const vm = require('vm');
  const scriptContent = fs.readFileSync(path.join(__dirname, 'shopify-tea-scraper.js'), 'utf-8');
  
  // Extract just the BRANDS object by running the relevant portion
  const brandsMatch = scriptContent.match(/const BRANDS = (\{[\s\S]*?\n\});/);
  if (!brandsMatch) {
    console.error('Could not extract BRANDS');
    process.exit(1);
  }
  
  let BRANDS;
  try {
    BRANDS = eval('(' + brandsMatch[1] + ')');
  } catch (e) {
    console.error('Failed to parse BRANDS:', e.message);
    process.exit(1);
  }
  
  console.log(`Found ${Object.keys(BRANDS).length} brands to audit\n`);
  
  const results = [];
  const brandKeys = Object.keys(BRANDS);
  
  // Process specific brand if provided as arg
  const targetBrands = process.argv.slice(2);
  const keysToProcess = targetBrands.length > 0 ? targetBrands : brandKeys;
  
  for (const key of keysToProcess) {
    if (!BRANDS[key]) { console.error(`Unknown brand: ${key}`); continue; }
    try {
      const result = await auditBrand(key, BRANDS[key]);
      results.push(result);
    } catch (e) {
      console.error(`  Error auditing ${key}: ${e.message}`);
      results.push({ brand: BRANDS[key].name, status: 'error', error: e.message, added: 0 });
    }
  }
  
  // Summary
  console.log('\n\n========== AUDIT SUMMARY ==========');
  const totalAdded = results.reduce((s, r) => s + (r.added || 0), 0);
  const failed = results.filter(r => r.status !== 'ok');
  console.log(`Brands checked: ${results.length}`);
  console.log(`Total new teas added: ${totalAdded}`);
  if (failed.length > 0) {
    console.log(`\nFailed brands:`);
    for (const f of failed) console.log(`  - ${f.brand}: ${f.status} (${f.error || ''})`);
  }
  console.log(`\nBy brand:`);
  for (const r of results.filter(r => r.added > 0)) {
    console.log(`  ${r.brand}: +${r.added} new teas`);
  }
  
  // Save log
  fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
  console.log(`\nFull log saved to ${LOG_FILE}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
