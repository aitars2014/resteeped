/**
 * Import scraped tea data into Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SCRAPED_DIR = path.join(__dirname, '../../data/scraped');

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Company slug mapping
const COMPANY_SLUGS = {
  'Harney & Sons': 'harney-and-sons',
  'Vahdam Teas': 'vahdam-teas',
  'Adagio Teas': 'adagio-teas',
  'Rishi Tea': 'rishi-tea',
  'Art of Tea': 'art-of-tea',
  'The Tea Spot': 'the-tea-spot',
};

async function getCompanyId(brandName) {
  const slug = COMPANY_SLUGS[brandName];
  if (!slug) {
    console.warn(`No slug mapping for brand: ${brandName}`);
    return null;
  }
  
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.warn(`Company not found for slug ${slug}:`, error.message);
    return null;
  }
  
  return data.id;
}

async function importTeas(jsonFile) {
  console.log(`\nImporting from ${jsonFile}...`);
  
  const filePath = path.join(SCRAPED_DIR, jsonFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  const teas = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Found ${teas.length} teas to import`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const tea of teas) {
    try {
      // Get company ID
      const companyId = await getCompanyId(tea.brandName);
      
      // Prepare tea record
      const teaRecord = {
        name: tea.name,
        brand_name: tea.brandName,
        tea_type: tea.teaType,
        description: tea.description?.substring(0, 2000) || null, // Truncate long descriptions
        image_url: tea.imageUrl,
        product_url: tea.productUrl,
        price_usd: tea.priceUsd,
        company_id: companyId,
        // Optional fields based on what we scraped
        steep_time_min: tea.steepTimeMin || null,
        steep_temp_f: tea.steepTempF || null,
        caffeine_level: tea.caffeineLevel || null,
      };
      
      // Upsert by name + brand (avoid duplicates)
      const { data, error } = await supabase
        .from('teas')
        .upsert(teaRecord, {
          onConflict: 'name,brand_name',
          ignoreDuplicates: false,
        })
        .select();
      
      if (error) {
        // If upsert fails, try insert
        const { error: insertError } = await supabase
          .from('teas')
          .insert(teaRecord);
        
        if (insertError) {
          if (insertError.code === '23505') { // Duplicate
            skipped++;
          } else {
            console.error(`Error importing "${tea.name}":`, insertError.message);
            errors++;
          }
        } else {
          imported++;
        }
      } else {
        imported++;
      }
      
      // Rate limit
      if (imported % 50 === 0) {
        console.log(`  Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (err) {
      console.error(`Error processing "${tea.name}":`, err.message);
      errors++;
    }
  }
  
  console.log(`\nResults for ${jsonFile}:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  
  return { imported, skipped, errors };
}

async function importAll() {
  console.log('Starting Supabase import...');
  console.log(`Looking for JSON files in: ${SCRAPED_DIR}`);
  
  if (!fs.existsSync(SCRAPED_DIR)) {
    console.error(`Scraped directory not found: ${SCRAPED_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(SCRAPED_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files: ${files.join(', ')}`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    const result = await importTeas(file);
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }
  
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Total Imported: ${totalImported}`);
  console.log(`Total Skipped: ${totalSkipped}`);
  console.log(`Total Errors: ${totalErrors}`);
}

if (require.main === module) {
  importAll().catch(console.error);
}

module.exports = { importTeas, importAll };
