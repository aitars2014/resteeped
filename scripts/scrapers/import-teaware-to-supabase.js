/**
 * Import Teaware to Supabase
 * Processes scraped teaware JSON and imports to database
 * 
 * Usage: node import-teaware-to-supabase.js [source]
 * Example: node import-teaware-to-supabase.js yunnan-sourcing
 */

require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Material detection from text
function detectMaterial(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('yixing') || lower.includes('zi sha') || lower.includes('zisha') || lower.includes('purple sand')) {
    return 'yixing_clay';
  }
  if (lower.includes('jianshui') || lower.includes('jian shui')) {
    return 'jianshui_clay';
  }
  if (lower.includes('porcelain') || lower.includes('jade porcelain') || lower.includes('de hua')) {
    return 'porcelain';
  }
  if (lower.includes('glass')) {
    return 'glass';
  }
  if (lower.includes('cast iron') || lower.includes('tetsubin')) {
    return 'cast_iron';
  }
  if (lower.includes('silver') || lower.includes('sterling')) {
    return 'silver';
  }
  if (lower.includes('titanium')) {
    return 'other'; // titanium not in enum, use other
  }
  if (lower.includes('jianzhan') || lower.includes('stoneware')) {
    return 'stoneware';
  }
  if (lower.includes('ceramic')) {
    return 'ceramic';
  }
  return 'ceramic'; // Default
}

// Clay type detection
function detectClayType(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('zi sha') || lower.includes('zisha') || lower.includes('purple sand')) {
    return 'zi_sha';
  }
  if (lower.includes('hong ni') || lower.includes('red clay') || lower.includes('da hong pao')) {
    return 'hong_ni';
  }
  if (lower.includes('duan ni') || lower.includes('duan clay')) {
    return 'duan_ni';
  }
  if (lower.includes('zi ni') || lower.includes('purple clay')) {
    return 'zi_ni';
  }
  if (lower.includes('qing shui') || lower.includes('clear water')) {
    return 'qing_shui_ni';
  }
  if (lower.includes('di cao qing')) {
    return 'di_cao_qing';
  }
  if (lower.includes('jianshui')) {
    return 'jianshui';
  }
  if (lower.includes('huaning')) {
    return 'huaning';
  }
  if (lower.includes('wenge ni')) {
    return 'zi_sha'; // Wenge ni is a zisha variant
  }
  return null;
}

// Category detection
function detectCategory(text, tags = []) {
  const lower = (text || '').toLowerCase();
  const tagStr = tags.join(' ').toLowerCase();
  
  if (lower.includes('gaiwan') || tagStr.includes('gaiwan')) {
    return 'gaiwan';
  }
  if (lower.includes('teapot') || lower.includes('壶') || tagStr.includes('teapot')) {
    return 'teapot';
  }
  if (lower.includes('cup') || lower.includes('杯')) {
    return 'cup';
  }
  if (lower.includes('pitcher') || lower.includes('cha hai') || lower.includes('fairness')) {
    return 'pitcher';
  }
  if (lower.includes('tea pet') || lower.includes('cha chong')) {
    return 'tea_pet';
  }
  if (lower.includes('tray') || lower.includes('tea table')) {
    return 'tea_tray';
  }
  if (lower.includes('canister') || lower.includes('storage') || lower.includes('caddy')) {
    return 'canister';
  }
  if (lower.includes('travel') || lower.includes('portable')) {
    return 'travel_set';
  }
  if (lower.includes('kettle')) {
    return 'kettle';
  }
  if (lower.includes('strainer') || lower.includes('filter') || lower.includes('tools') || lower.includes('pick') || lower.includes('towel')) {
    return 'tea_tools';
  }
  return 'other';
}

// Extract capacity from text
function extractCapacity(text) {
  const match = (text || '').match(/(\d+)\s*ml/i);
  return match ? parseInt(match[1]) : null;
}

// Extract artisan name
function extractArtisan(text) {
  // Look for patterns like "by Jin Jia Qi" or "Artist: Jin Jia Qi"
  const byMatch = (text || '').match(/by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (byMatch) return byMatch[1];
  
  const artistMatch = (text || '').match(/\[Artist(?:\s+Name)?\]\s*([^\n\[]+)/i);
  if (artistMatch) return artistMatch[1].trim();
  
  return null;
}

// Generate slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Detect recommended teas from description
function detectRecommendedTeas(text) {
  const lower = (text || '').toLowerCase();
  const teas = [];
  
  if (lower.includes('pu-erh') || lower.includes('puerh') || lower.includes('pu\'erh')) {
    teas.push('puerh');
  }
  if (lower.includes('oolong')) {
    teas.push('oolong');
  }
  if (lower.includes('black tea')) {
    teas.push('black');
  }
  if (lower.includes('green tea')) {
    teas.push('green');
  }
  if (lower.includes('white tea')) {
    teas.push('white');
  }
  if (lower.includes('dan cong') || lower.includes('dancong')) {
    teas.push('oolong');
  }
  if (lower.includes('tie guan yin') || lower.includes('tieguanyin')) {
    teas.push('oolong');
  }
  
  return teas.length > 0 ? [...new Set(teas)] : null;
}

async function getOrCreateCompany(companySlug, companyName) {
  // Check if company exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', companySlug)
    .single();
  
  if (existing) return existing.id;
  
  // Create company
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      slug: companySlug,
      website_url: `https://${companySlug.replace(/-/g, '')}.com`,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`Error creating company ${companyName}:`, error.message);
    return null;
  }
  
  return newCompany.id;
}

async function importTeaware(source = 'yunnan-sourcing') {
  console.log(`\n=== Importing Teaware from ${source} ===\n`);
  
  const dataPath = path.join(__dirname, `../../data/scraped/${source}-teaware.json`);
  
  if (!fs.existsSync(dataPath)) {
    console.error(`Data file not found: ${dataPath}`);
    console.log('Run the scraper first to generate the data file.');
    process.exit(1);
  }
  
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Found ${rawData.length} items in data file`);
  
  // Get or create company
  const companyName = source.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const companyId = await getOrCreateCompany(source, companyName);
  
  if (!companyId) {
    console.error('Failed to get/create company');
    process.exit(1);
  }
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const item of rawData) {
    const combinedText = `${item.title || item.name} ${item.body_html || item.description || ''}`;
    const tags = item.tags || [];
    
    const teaware = {
      name: item.title || item.name,
      slug: generateSlug(item.title || item.name),
      description: item.body_html 
        ? item.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 5000)
        : item.description,
      short_description: (item.title || item.name).substring(0, 200),
      category: detectCategory(combinedText, tags),
      material: detectMaterial(combinedText),
      clay_type: detectClayType(combinedText),
      capacity_ml: extractCapacity(combinedText),
      company_id: companyId,
      artisan_name: extractArtisan(combinedText) || item.vendor,
      origin_region: item.origin_region || 'China',
      price_usd: item.variants?.[0]?.price ? parseFloat(item.variants[0].price) : item.price_usd,
      product_url: (item.product_url && !item.product_url.includes('/undefined')) 
        ? item.product_url 
        : (item.handle ? `https://yunnansourcing.com/products/${item.handle}` : null),
      in_stock: item.variants?.[0]?.available ?? item.in_stock ?? true,
      image_url: item.images?.[0]?.src || item.image_url,
      images: item.images?.map(img => img.src || img) || [],
      recommended_teas: detectRecommendedTeas(combinedText),
    };
    
    // Skip if missing required fields
    if (!teaware.name || !teaware.category || !teaware.material) {
      console.log(`Skipping (missing fields): ${teaware.name || 'unknown'}`);
      skipped++;
      continue;
    }
    
    // Upsert to database
    const { error } = await supabase
      .from('teaware')
      .upsert(teaware, { onConflict: 'slug' });
    
    if (error) {
      console.error(`Error importing ${teaware.name}:`, error.message);
      errors++;
    } else {
      console.log(`✓ ${teaware.category}: ${teaware.name} ($${teaware.price_usd})`);
      imported++;
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

// Run import
const source = process.argv[2] || 'yunnan-sourcing';
importTeaware(source).catch(console.error);
