/**
 * Seed script to load teas into Supabase
 * Run: node scripts/seed-teas.js
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 */

const { createClient } = require('@supabase/supabase-js');
const { teas } = require('../src/data/teas');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.log('Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-teas.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedTeas() {
  console.log(`Seeding ${teas.length} teas...`);
  
  // Transform to database schema
  const dbTeas = teas.map(tea => ({
    name: tea.name,
    brand_name: tea.brandName,
    tea_type: tea.teaType,
    description: tea.description || null,
    origin: tea.origin || null,
    steep_temp_f: tea.steepTempF || null,
    steep_time_min: tea.steepTimeMin || null,
    steep_time_max: tea.steepTimeMax || null,
    flavor_notes: tea.flavorNotes || [],
    image_url: tea.imageUrl || null,
    price_per_oz: tea.pricePerOz || null,
    avg_rating: tea.avgRating || 0,
    rating_count: tea.ratingCount || 0,
  }));
  
  // Insert in batches
  const batchSize = 20;
  let inserted = 0;
  
  for (let i = 0; i < dbTeas.length; i += batchSize) {
    const batch = dbTeas.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('teas')
      .upsert(batch, { 
        onConflict: 'name,brand_name',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      inserted += data.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${data.length} teas`);
    }
  }
  
  console.log(`\n✅ Seeded ${inserted} teas total`);
}

seedTeas().catch(console.error);
