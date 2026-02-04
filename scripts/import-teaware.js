#!/usr/bin/env node
/**
 * Teaware Import Script
 * Imports scraped teaware data into Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Map scraped categories to our enum
const CATEGORY_MAP = {
  'tea pets': 'tea_pet',
  'tea pet': 'tea_pet',
  'cups': 'cup',
  'teapots': 'teapot',
  'gaiwans': 'gaiwan',
  'tea sets': 'travel_set',
  'accessories': 'tea_tools',
  'pitcher': 'pitcher',
  'tea tray': 'tea_tray',
  'canister': 'canister',
  'kettle': 'kettle',
};

// Map scraped materials to our enum
const MATERIAL_MAP = {
  'jianshui clay': 'jianshui_clay',
  'jianshui': 'jianshui_clay',
  'huaning clay (glazed)': 'ceramic',
  'huaning clay': 'ceramic',
  'jianzhan clay (glazed)': 'ceramic',
  'porcelain': 'porcelain',
  'ceramic': 'ceramic',
  'ceramic (ru kiln)': 'ceramic',
  'glass': 'glass',
  'borosilicate glass': 'glass',
  'borosilicate glass, wood': 'glass',
  'borosilicate glass, stainless steel': 'glass',
  'zi ni (purple) yixing clay': 'yixing_clay',
  'yixing clay': 'yixing_clay',
  'duan ni yixing clay': 'yixing_clay',
  'steel, copper, rosewood': 'other',
  'bamboo': 'bamboo',
  'wood': 'wood',
  'cast iron': 'cast_iron',
  'silver': 'silver',
  'stoneware': 'stoneware',
};

// Map materials to clay types where applicable
const CLAY_TYPE_MAP = {
  'jianshui clay': 'jianshui',
  'jianshui': 'jianshui',
  'huaning clay (glazed)': 'huaning',
  'huaning clay': 'huaning',
  'zi ni (purple) yixing clay': 'zi_ni',
  'duan ni yixing clay': 'duan_ni',
};

// Company data for teaware vendors
const TEAWARE_COMPANIES = [
  {
    name: 'Crimson Lotus Tea',
    slug: 'crimson-lotus-tea',
    description: 'Crimson Lotus Tea is a Seattle-based tea company specializing in aged and raw pu-erh teas from Yunnan, China. Founded by Glen and Nicole, they focus on building direct relationships with farmers and offering high-quality, authentic Chinese teas alongside beautiful teaware from Jianshui and other regions.',
    short_description: 'Pu-erh specialists with premium Yunnan teaware',
    website_url: 'https://crimsonlotustea.com',
    headquarters_city: 'Seattle',
    headquarters_state: 'WA',
    headquarters_country: 'USA',
    specialty: ['Pu-erh', 'Raw Pu-erh', 'Aged Tea', 'Jianshui Teaware'],
    ships_internationally: true,
    price_range: 'premium',
    instagram_handle: 'crimsonlotustea',
  },
  {
    name: 'Teasenz',
    slug: 'teasenz',
    description: 'Teasenz is a Chinese tea company based in Xiamen, Fujian province, offering authentic loose leaf teas directly from origin. They specialize in traditional Chinese teas including oolong, pu-erh, white, and green teas, along with handcrafted teaware including Yixing clay teapots and traditional gaiwans.',
    short_description: 'Authentic Chinese teas and teaware direct from Fujian',
    website_url: 'https://www.teasenz.com',
    headquarters_city: 'Xiamen',
    headquarters_country: 'China',
    specialty: ['Oolong', 'Pu-erh', 'Yixing Teaware', 'Traditional Chinese'],
    ships_internationally: true,
    price_range: 'moderate',
  },
  {
    name: 'Yunnan Sourcing',
    slug: 'yunnan-sourcing',
    description: 'Yunnan Sourcing is one of the largest online retailers of Chinese tea, specializing in pu-erh and other teas from Yunnan province. Founded by Scott Wilson, they offer thousands of teas directly sourced from farms and factories across China, along with an extensive selection of teaware including Yixing teapots, gaiwans, and tea accessories.',
    short_description: 'Massive selection of Yunnan teas and traditional teaware',
    website_url: 'https://yunnansourcing.com',
    headquarters_city: 'Kunming',
    headquarters_country: 'China',
    specialty: ['Pu-erh', 'Yunnan Teas', 'Yixing', 'Teaware'],
    ships_internationally: true,
    price_range: 'budget',
  },
  {
    name: 'Mei Leaf',
    slug: 'mei-leaf',
    description: 'Mei Leaf is a London-based tea company founded by Don Mei, offering premium loose leaf teas sourced directly from artisan producers across China and Taiwan. Known for their educational approach to tea through detailed tasting notes and brewing guides, they also offer a curated selection of traditional and modern teaware.',
    short_description: 'Premium artisan teas with expert education',
    website_url: 'https://meileaf.com',
    headquarters_city: 'London',
    headquarters_country: 'United Kingdom',
    specialty: ['Chinese', 'Taiwanese', 'Oolong', 'Gongfu'],
    ships_internationally: true,
    price_range: 'premium',
    instagram_handle: 'meaboratory',
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseCapacity(capacityStr) {
  if (!capacityStr) return null;
  const match = capacityStr.match(/(\d+)\s*ml/i);
  return match ? parseInt(match[1], 10) : null;
}

function parseDimensions(dimStr) {
  if (!dimStr) return null;
  // Normalize format: "14.2x6.3cm" -> "14.2 x 6.3"
  return dimStr.replace(/cm/gi, '').replace(/x/g, ' x ').trim();
}

async function ensureCompanies() {
  console.log('📦 Ensuring teaware companies exist...');
  
  for (const company of TEAWARE_COMPANIES) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', company.slug)
      .single();
    
    if (existing) {
      console.log(`  ✓ ${company.name} already exists`);
      continue;
    }
    
    const { error } = await supabase
      .from('companies')
      .insert(company);
    
    if (error) {
      console.error(`  ✗ Failed to add ${company.name}:`, error.message);
    } else {
      console.log(`  + Added ${company.name}`);
    }
  }
}

async function getCompanyId(source) {
  const slugMap = {
    'crimsonlotustea.com': 'crimson-lotus-tea',
    'teasenz.com': 'teasenz',
    'yunnansourcing.com': 'yunnan-sourcing',
    'meileaf.com': 'mei-leaf',
  };
  
  const slug = slugMap[source];
  if (!slug) return null;
  
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();
  
  return data?.id || null;
}

async function importTeaware(items, sourceName) {
  console.log(`\n🍵 Importing ${items.length} items from ${sourceName}...`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const item of items) {
    // Determine category
    const categoryKey = (item.category || '').toLowerCase();
    const category = CATEGORY_MAP[categoryKey] || 'other';
    
    // Determine material
    const materialKey = (item.material || '').toLowerCase();
    const material = MATERIAL_MAP[materialKey] || 'other';
    
    // Determine clay type if applicable
    const clayType = CLAY_TYPE_MAP[materialKey] || null;
    
    // Get company ID
    const companyId = await getCompanyId(item.source);
    
    // Generate slug
    const slug = slugify(item.name) + '-' + slugify(item.source.replace('.com', ''));
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('teaware')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Build record
    const record = {
      name: item.name,
      slug,
      description: item.description,
      short_description: item.description?.substring(0, 100),
      category,
      material,
      clay_type: clayType,
      capacity_ml: parseCapacity(item.capacity),
      dimensions_cm: parseDimensions(item.dimensions),
      company_id: companyId,
      price_usd: item.price,
      product_url: item.url,
      in_stock: item.available !== false,
      image_url: item.images?.[0] || null,
      images: item.images || [],
      recommended_teas: inferRecommendedTeas(category, material, clayType),
    };
    
    const { error } = await supabase
      .from('teaware')
      .insert(record);
    
    if (error) {
      console.error(`  ✗ ${item.name}: ${error.message}`);
      errors++;
    } else {
      imported++;
    }
  }
  
  console.log(`  ✓ Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);
  return { imported, skipped, errors };
}

function inferRecommendedTeas(category, material, clayType) {
  // Recommend teas based on teaware type
  if (clayType === 'jianshui' || clayType === 'zi_ni' || clayType === 'zi_sha') {
    return ['puerh', 'oolong', 'black'];
  }
  if (clayType === 'duan_ni') {
    return ['green', 'white', 'light_oolong'];
  }
  if (material === 'porcelain' || material === 'glass') {
    return ['green', 'white', 'oolong'];
  }
  if (material === 'cast_iron') {
    return ['black', 'puerh'];
  }
  return null;
}

async function main() {
  console.log('🚀 Teaware Import Script\n');
  
  // Ensure companies exist first
  await ensureCompanies();
  
  // Load and import scraped data
  const dataDir = path.join(__dirname, '../data/scraped');
  const files = [
    'crimson-lotus-teaware.json',
    'teasenz-teaware.json',
  ];
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${file} not found, skipping`);
      continue;
    }
    
    const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!items.length) {
      console.log(`⚠️  ${file} is empty, skipping`);
      continue;
    }
    
    const result = await importTeaware(items, file);
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Total imported: ${totalImported}`);
  console.log(`  Total skipped: ${totalSkipped}`);
  console.log(`  Total errors: ${totalErrors}`);
  
  // Verify count
  const { count } = await supabase
    .from('teaware')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✅ Total teaware in database: ${count}`);
}

main().catch(console.error);
