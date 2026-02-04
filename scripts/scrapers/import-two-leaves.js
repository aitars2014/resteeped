/**
 * Import Two Leaves teas into Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SCRAPED_FILE = path.join(__dirname, '../../data/scraped/two-leaves-teas.json');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureCompany() {
  const companyData = {
    name: 'Two Leaves and a Bud',
    slug: 'two-leaves-and-a-bud',
    description: 'Colorado-based organic tea company known for whole leaf tea sachets. Founded with a mission to bring premium, organic teas to everyday tea drinkers.',
    website_url: 'https://twoleavestea.com',
    headquarters_city: 'Basalt',
    headquarters_state: 'CO',
    headquarters_country: 'United States',
    founded_year: 1995,
    specialty: ['Organic tea', 'Whole leaf sachets'],
  };
  
  // Check if exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', companyData.slug)
    .single();
  
  if (existing) {
    console.log('Company already exists, ID:', existing.id);
    return existing.id;
  }
  
  // Create company
  const { data, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create company:', error);
    process.exit(1);
  }
  
  console.log('Created company, ID:', data.id);
  return data.id;
}

async function importTeas(companyId) {
  const teas = JSON.parse(fs.readFileSync(SCRAPED_FILE, 'utf-8'));
  
  let imported = 0;
  let skipped = 0;
  
  for (const tea of teas) {
    // Check if tea already exists
    const { data: existing } = await supabase
      .from('teas')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', tea.name)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const teaData = {
      name: tea.name,
      company_id: companyId,
      brand_name: 'Two Leaves and a Bud',
      tea_type: tea.type,
      description: tea.description || null,
      image_url: tea.image_url,
      product_url: tea.source_url,
    };
    
    const { error } = await supabase
      .from('teas')
      .insert(teaData);
    
    if (error) {
      console.error(`Failed to insert ${tea.name}:`, error.message);
    } else {
      imported++;
    }
  }
  
  console.log(`\nImported: ${imported}, Skipped (duplicates): ${skipped}`);
}

async function main() {
  console.log('Importing Two Leaves teas...\n');
  const companyId = await ensureCompany();
  await importTeas(companyId);
  console.log('\nDone!');
}

main().catch(console.error);
