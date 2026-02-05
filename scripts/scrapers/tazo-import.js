/**
 * Tazo Tea Direct Import
 * Imports Tazo's core tea lineup directly from curated data
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BRAND = {
  name: 'Tazo',
  slug: 'tazo',
  url: 'https://www.tazo.com',
  description: 'Premium tea brand founded in Portland in 1994, known for bold, exotic blends like Chai and Passion. Acquired by Starbucks in 1999, now owned by Unilever.',
  city: 'Portland',
  state: 'OR',
  country: 'United States',
  founded: 1994,
  specialty: ['Chai', 'Herbal blends', 'Exotic flavors'],
};

// Tazo's core tea lineup (curated from official sources)
const TAZO_TEAS = [
  // Black Teas
  { name: 'Awake English Breakfast', type: 'black', description: 'A bold, full-bodied blend of black teas to jumpstart your morning.' },
  { name: 'Organic Awake English Breakfast', type: 'black', description: 'USDA Organic bold English breakfast blend with malty notes.' },
  { name: 'Earl Grey', type: 'black', description: 'Classic black tea scented with bergamot oil for a citrus twist.' },
  { name: 'Organic Earl Grey', type: 'black', description: 'Organic black tea with organic bergamot oil.' },
  { name: 'Vanilla Bean Macaron', type: 'black', description: 'Dessert-inspired black tea with vanilla, cocoa, and cardamom.' },
  { name: 'Vanilla Caramel Chai', type: 'black', description: 'Sweet chai blend with vanilla, caramel, cinnamon, and ginger.' },
  { name: 'Classic Chai', type: 'black', description: 'Traditional spiced chai with cinnamon, cardamom, ginger, and cloves.' },
  { name: 'Organic Chai', type: 'black', description: 'USDA Organic traditional chai with warming spices.' },
  { name: 'Pumpkin Spice Chai', type: 'black', description: 'Seasonal chai blend with pumpkin spice flavors.' },
  
  // Green Teas
  { name: 'Zen', type: 'green', description: 'Green tea with spearmint, lemongrass, and lemon verbena for a refreshing blend.' },
  { name: 'Organic Zen', type: 'green', description: 'USDA Organic green tea with spearmint and lemongrass.' },
  { name: 'Green Ginger', type: 'green', description: 'Green tea with ginger, lemongrass, and pear flavors.' },
  { name: 'Organic Green Ginger', type: 'green', description: 'Organic green tea with bright ginger and citrus notes.' },
  { name: 'Peachy Green', type: 'green', description: 'Green tea with sweet peach and cucumber notes.' },
  { name: 'Organic Peachy Green', type: 'green', description: 'Organic green and black tea blend with peach and cucumber.' },
  { name: 'China Green Tips', type: 'green', description: 'Delicate Chinese green tea with subtle floral notes.' },
  
  // Herbal Teas (Caffeine-Free)
  { name: 'Passion', type: 'herbal', description: 'Hibiscus, orange peel, and passion fruit for a tangy, tropical blend.' },
  { name: 'Calm Chamomile', type: 'herbal', description: 'Soothing chamomile with spearmint and hibiscus for relaxation.' },
  { name: 'Organic Calm Chamomile', type: 'herbal', description: 'USDA Organic chamomile blend for peaceful evenings.' },
  { name: 'Refresh Mint', type: 'herbal', description: 'Peppermint and spearmint blend for a cooling, refreshing tea.' },
  { name: 'Organic Refresh Mint', type: 'herbal', description: 'Organic peppermint and spearmint with tarragon.' },
  { name: 'Wild Sweet Orange', type: 'herbal', description: 'Citrusy herbal blend with orange, rose petals, and licorice.' },
  { name: 'Dream', type: 'herbal', description: 'Relaxing blend with chamomile, valerian, and blackberry leaves.' },
  { name: 'Organic Dream', type: 'herbal', description: 'Organic bedtime blend with chamomile and calming herbs.' },
  { name: 'Glazed Lemon Loaf', type: 'herbal', description: 'Dessert-inspired herbal tea with lemon, apple, and vanilla.' },
  
  // Foragers Collection (Herbal)
  { name: 'Prickly Pear Cactus', type: 'herbal', description: 'Southwest-inspired blend with hibiscus and prickly pear.' },
  { name: 'Juniper Mint Honey', type: 'herbal', description: 'Rocky Mountain-inspired blend with juniper, mint, and honey.' },
  { name: 'Elderberry Blackberry', type: 'herbal', description: 'New England forest-inspired blend with elderberries and chamomile.' },
  { name: 'Desert Lime Cactus', type: 'herbal', description: 'Desert-inspired blend with lime and prickly pear.' },
  
  // Iced Teas
  { name: 'Iced Passion', type: 'herbal', description: 'Hibiscus and passion fruit blend, perfect for iced tea.' },
  { name: 'Iced Zen', type: 'green', description: 'Refreshing green tea blend designed for iced preparation.' },
  { name: 'Iced Peachy Green', type: 'green', description: 'Peach green tea blend ideal for iced tea.' },
  
  // K-Cup Varieties
  { name: 'Awake English Breakfast K-Cup', type: 'black', description: 'Bold breakfast blend in convenient K-Cup pods.' },
  { name: 'Zen K-Cup', type: 'green', description: 'Green tea with spearmint in K-Cup format.' },
  { name: 'Calm Chamomile K-Cup', type: 'herbal', description: 'Soothing chamomile blend in K-Cup pods.' },
  { name: 'Passion K-Cup', type: 'herbal', description: 'Hibiscus passion fruit tea in K-Cup format.' },
  { name: 'Chai K-Cup', type: 'black', description: 'Classic spiced chai in convenient K-Cup pods.' },
];

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
  
  console.log(`Importing ${TAZO_TEAS.length} Tazo teas...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const tea of TAZO_TEAS) {
    // Check for duplicate
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
      brand_name: BRAND.name,
      tea_type: tea.type,
      description: tea.description,
      product_url: `https://www.tazo.com/us/en/products/`,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    
    if (error) {
      console.error(`  Failed: ${tea.name} - ${error.message}`);
    } else {
      imported++;
    }
  }
  
  console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
