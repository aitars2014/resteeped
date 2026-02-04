/**
 * Two Leaves and a Bud Tea Scraper
 * Shopify store - uses products.json API
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../data/scraped');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'two-leaves-teas.json');

// Map Shopify tags to our tea types
function getTeaType(tags) {
  const tagStr = tags.join(' ').toLowerCase();
  if (tagStr.includes('black tea')) return 'black';
  if (tagStr.includes('green tea')) return 'green';
  if (tagStr.includes('white tea')) return 'white';
  if (tagStr.includes('oolong')) return 'oolong';
  if (tagStr.includes('herbal')) return 'herbal';
  if (tagStr.includes('rooibos')) return 'herbal';
  if (tagStr.includes('chai')) return 'black';
  if (tagStr.includes('matcha')) return 'green';
  return 'herbal'; // default for tisanes
}

// Check if it's caffeinated
function isCaffeinated(tags) {
  const tagStr = tags.join(' ').toLowerCase();
  if (tagStr.includes('caffeine free') || tagStr.includes('no buzz')) return false;
  if (tagStr.includes('herbal') || tagStr.includes('rooibos') || tagStr.includes('chamomile')) return false;
  return true;
}

// Extract description from HTML
function cleanDescription(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

async function scrape() {
  console.log('Fetching Two Leaves products...');
  
  const response = await fetch('https://twoleavestea.com/products.json?limit=250');
  const data = await response.json();
  
  const teas = data.products
    .filter(p => {
      // Filter for actual tea products, not gift boxes or accessories
      const tags = p.tags || [];
      const title = p.title.toLowerCase();
      const isGiftSet = title.includes('trio') || title.includes('sampler') || title.includes('gift');
      const isAccessory = tags.some(t => t.toLowerCase().includes('teaware') || t.toLowerCase().includes('accessory'));
      const isTea = tags.some(t => t.toLowerCase().includes('tea'));
      return isTea && !isGiftSet && !isAccessory;
    })
    .map(p => {
      const tags = p.tags || [];
      const variant = p.variants[0];
      
      return {
        name: p.title,
        brand: 'Two Leaves and a Bud',
        type: getTeaType(tags),
        description: cleanDescription(p.body_html),
        caffeinated: isCaffeinated(tags),
        organic: tags.some(t => t.toLowerCase().includes('organic')),
        price: variant ? parseFloat(variant.price) : null,
        image_url: p.images[0]?.src || null,
        source_url: `https://twoleavestea.com/products/${p.handle}`,
        tags: tags.filter(t => 
          !t.startsWith('_') && 
          !t.includes('wholesale') && 
          !t.includes('retail')
        ),
      };
    });
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(teas, null, 2));
  console.log(`Saved ${teas.length} teas to ${OUTPUT_FILE}`);
  
  // Summary
  const types = {};
  teas.forEach(t => {
    types[t.type] = (types[t.type] || 0) + 1;
  });
  console.log('\nBy type:', types);
  
  return teas;
}

scrape().catch(console.error);
