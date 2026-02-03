#!/usr/bin/env node
/**
 * Import scraped teas into Supabase
 * 
 * Usage: node tools/import-teas.js
 * 
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
 * (Use service key for admin access, not anon key)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.error('Add SUPABASE_SERVICE_KEY to your .env file (get from Supabase dashboard → Settings → API)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map brand names to company slugs
const BRAND_TO_SLUG = {
  'Rishi Tea': 'rishi-tea',
  'Republic of Tea': 'republic-of-tea',
  'The Republic of Tea': 'republic-of-tea',
  'Adagio Teas': 'adagio-teas',
  'Adagio': 'adagio-teas',
  'The Steeping Room': 'the-steeping-room',
};

// Clean up flavor notes - filter out tags that aren't real flavors
const FLAVOR_BLACKLIST = [
  'coffee_lovers', 'kosher', 'organic', 'pdqreview', 'mae_taeng',
  'ingredient-', 'fair_trade', 'caffeine_free', 'bestseller',
  'new', 'sale', 'gift', 'sampler', 'subscription'
];

function cleanFlavorNotes(notes) {
  if (!notes || !Array.isArray(notes)) return [];
  
  return notes
    .filter(note => {
      const lower = note.toLowerCase();
      return !FLAVOR_BLACKLIST.some(blocked => lower.includes(blocked));
    })
    .map(note => {
      // Clean up formatting
      return note
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
    })
    .filter(note => note.length > 0 && note.length < 30);
}

// Normalize tea type
function normalizeTeaType(type) {
  if (!type) return 'herbal';
  const lower = type.toLowerCase();
  
  if (lower.includes('black')) return 'black';
  if (lower.includes('green')) return 'green';
  if (lower.includes('oolong')) return 'oolong';
  if (lower.includes('white')) return 'white';
  if (lower.includes('pu-erh') || lower.includes('puerh') || lower.includes('pu erh')) return 'puerh';
  if (lower.includes('herbal') || lower.includes('tisane') || lower.includes('rooibos')) return 'herbal';
  
  return 'herbal'; // Default
}

async function getCompanyIds() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, slug, name');
  
  if (error) {
    console.error('Error fetching companies:', error);
    return {};
  }
  
  const map = {};
  for (const company of data) {
    map[company.slug] = company.id;
    map[company.name] = company.id;
  }
  return map;
}

async function importTeas(filePath, companyMap) {
  console.log(`\nImporting from ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  File not found, skipping`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  if (!fileContent.trim() || fileContent.trim() === '[]') {
    console.log(`  Empty file, skipping`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  let teas;
  try {
    teas = JSON.parse(fileContent);
  } catch (e) {
    console.error(`  Invalid JSON: ${e.message}`);
    return { imported: 0, skipped: 0, errors: 1 };
  }
  
  if (!Array.isArray(teas) || teas.length === 0) {
    console.log(`  No teas in file`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  console.log(`  Found ${teas.length} teas`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const tea of teas) {
    // Find company ID
    const brandSlug = BRAND_TO_SLUG[tea.brand_name] || tea.brand_name;
    const companyId = companyMap[brandSlug] || companyMap[tea.brand_name];
    
    // Prepare tea record
    const record = {
      name: tea.name,
      brand_name: tea.brand_name,
      tea_type: normalizeTeaType(tea.tea_type),
      description: tea.description || null,
      origin: tea.origin || null,
      steep_temp_f: tea.steep_temp_f || null,
      steep_time_min: tea.steep_time_min || null,
      steep_time_max: tea.steep_time_max || null,
      flavor_notes: cleanFlavorNotes(tea.flavor_notes),
      image_url: tea.image_url || null,
      price_per_oz: tea.price_per_oz || null,
      company_id: companyId || null,
    };
    
    // Check for duplicates by name + brand
    const { data: existing } = await supabase
      .from('teas')
      .select('id')
      .eq('name', record.name)
      .eq('brand_name', record.brand_name)
      .maybeSingle();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('teas')
        .update(record)
        .eq('id', existing.id);
      
      if (error) {
        console.error(`  Error updating "${tea.name}": ${error.message}`);
        errors++;
      } else {
        skipped++; // Updated, not new
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('teas')
        .insert(record);
      
      if (error) {
        console.error(`  Error inserting "${tea.name}": ${error.message}`);
        errors++;
      } else {
        imported++;
      }
    }
  }
  
  console.log(`  ✓ Imported: ${imported}, Updated: ${skipped}, Errors: ${errors}`);
  return { imported, skipped, errors };
}

async function linkExistingTeasToCompanies(companyMap) {
  console.log('\nLinking existing teas to companies...');
  
  // Get teas without company_id
  const { data: teas, error } = await supabase
    .from('teas')
    .select('id, brand_name')
    .is('company_id', null);
  
  if (error) {
    console.error('Error fetching teas:', error);
    return;
  }
  
  let linked = 0;
  for (const tea of teas || []) {
    const brandSlug = BRAND_TO_SLUG[tea.brand_name] || tea.brand_name;
    const companyId = companyMap[brandSlug] || companyMap[tea.brand_name];
    
    if (companyId) {
      const { error: updateError } = await supabase
        .from('teas')
        .update({ company_id: companyId })
        .eq('id', tea.id);
      
      if (!updateError) linked++;
    }
  }
  
  console.log(`  ✓ Linked ${linked} teas to their companies`);
}

async function main() {
  console.log('=== Resteeped Tea Importer ===\n');
  
  // First, get company IDs
  console.log('Fetching companies...');
  const companyMap = await getCompanyIds();
  
  if (Object.keys(companyMap).length === 0) {
    console.error('No companies found! Run the company profiles migration first:');
    console.error('  → Supabase SQL Editor → Run 20260203_add_company_profiles.sql');
    process.exit(1);
  }
  
  console.log(`Found ${Object.keys(companyMap).length / 2} companies`);
  
  // Import from each scraped file
  const scrapedDir = path.join(__dirname, '..', 'data', 'scraped');
  const files = [
    'rishi-tea.json',
    'adagio-teas.json', 
    'republic-of-tea.json',
  ];
  
  let totalImported = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    const result = await importTeas(path.join(scrapedDir, file), companyMap);
    totalImported += result.imported;
    totalUpdated += result.skipped;
    totalErrors += result.errors;
  }
  
  // Link any existing teas that don't have company_id
  await linkExistingTeasToCompanies(companyMap);
  
  console.log('\n=== Summary ===');
  console.log(`New teas imported: ${totalImported}`);
  console.log(`Existing teas updated: ${totalUpdated}`);
  console.log(`Errors: ${totalErrors}`);
  
  // Get final count
  const { count } = await supabase
    .from('teas')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal teas in database: ${count}`);
}

main().catch(console.error);
