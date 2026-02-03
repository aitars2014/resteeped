/**
 * Harney & Sons Tea Scraper
 * Uses Shopify's products.json endpoint
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.harney.com/products.json';
const OUTPUT_DIR = path.join(__dirname, '../../data/scraped');

// Tea type detection from tags
function detectTeaType(tags, title) {
  const tagStr = tags.join(' ').toLowerCase();
  const titleLower = title.toLowerCase();
  
  if (tagStr.includes('green-tea') || titleLower.includes('green tea')) return 'green';
  if (tagStr.includes('white-tea') || titleLower.includes('white tea')) return 'white';
  if (tagStr.includes('oolong') || titleLower.includes('oolong')) return 'oolong';
  if (tagStr.includes('pu-erh') || tagStr.includes('puerh') || titleLower.includes('pu-erh')) return 'puerh';
  if (tagStr.includes('herbal') || tagStr.includes('rooibos') || tagStr.includes('chamomile')) return 'herbal';
  if (tagStr.includes('matcha') || titleLower.includes('matcha')) return 'green'; // Matcha is green
  if (tagStr.includes('black-tea') || tagStr.includes('assam') || tagStr.includes('darjeeling')) return 'black';
  if (titleLower.includes('earl grey') || titleLower.includes('english breakfast')) return 'black';
  
  return 'black'; // Default to black tea
}

// Strip HTML tags
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Get the lowest price variant
function getLowestPrice(variants) {
  if (!variants || variants.length === 0) return null;
  const prices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
  return prices.length > 0 ? Math.min(...prices) : null;
}

// Transform Shopify product to our tea format
function transformProduct(product) {
  const teaType = detectTeaType(product.tags || [], product.title);
  const lowestPrice = getLowestPrice(product.variants);
  const mainImage = product.images && product.images[0] ? product.images[0].src : null;
  
  return {
    name: product.title,
    brandName: 'Harney & Sons',
    teaType: teaType,
    description: stripHtml(product.body_html),
    imageUrl: mainImage,
    productUrl: `https://www.harney.com/products/${product.handle}`,
    priceUsd: lowestPrice,
    tags: product.tags || [],
    shopifyId: product.id,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

async function fetchPage(page = 1, limit = 250) {
  const url = `${BASE_URL}?page=${page}&limit=${limit}`;
  console.log(`Fetching page ${page}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.products || [];
}

async function scrapeAll() {
  console.log('Starting Harney & Sons scraper...');
  
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const products = await fetchPage(page);
    
    if (products.length === 0) {
      hasMore = false;
    } else {
      // Filter to only tea products (exclude accessories, gifts, etc.)
      const teas = products.filter(p => {
        const tags = (p.tags || []).join(' ').toLowerCase();
        return tags.includes('tea') || 
               tags.includes('loose') || 
               tags.includes('sachet') ||
               tags.includes('black-tea') ||
               tags.includes('green-tea') ||
               tags.includes('herbal');
      });
      
      allProducts = allProducts.concat(teas);
      console.log(`  Page ${page}: ${products.length} products (${teas.length} teas)`);
      page++;
      
      // Shopify limits to ~50 pages typically
      if (page > 50) hasMore = false;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`\nTotal products fetched: ${allProducts.length}`);
  
  // Transform to our format
  const teas = allProducts.map(transformProduct);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Save to file
  const outputPath = path.join(OUTPUT_DIR, 'harney-teas.json');
  fs.writeFileSync(outputPath, JSON.stringify(teas, null, 2));
  console.log(`\nSaved ${teas.length} teas to ${outputPath}`);
  
  // Print summary by type
  const byType = {};
  teas.forEach(t => {
    byType[t.teaType] = (byType[t.teaType] || 0) + 1;
  });
  console.log('\nBy tea type:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  return teas;
}

// Run if called directly
if (require.main === module) {
  scrapeAll().catch(console.error);
}

module.exports = { scrapeAll, transformProduct };
