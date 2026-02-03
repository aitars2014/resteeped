/**
 * Vahdam Teas Scraper
 * Uses Shopify's products.json endpoint
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.vahdamteas.com/products.json';
const OUTPUT_DIR = path.join(__dirname, '../../data/scraped');

// Tea type detection
function detectTeaType(tags, title, productType) {
  const allText = [...tags, title, productType || ''].join(' ').toLowerCase();
  
  if (allText.includes('green tea') || allText.includes('green-tea')) return 'green';
  if (allText.includes('white tea') || allText.includes('white-tea')) return 'white';
  if (allText.includes('oolong')) return 'oolong';
  if (allText.includes('chai') && !allText.includes('green')) return 'black';
  if (allText.includes('herbal') || allText.includes('tisane') || allText.includes('turmeric') || allText.includes('chamomile')) return 'herbal';
  if (allText.includes('darjeeling')) return 'black';
  if (allText.includes('assam')) return 'black';
  if (allText.includes('black tea') || allText.includes('black-tea')) return 'black';
  if (allText.includes('matcha')) return 'green';
  
  return 'black'; // Default - Vahdam specializes in Indian black teas
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function getLowestPrice(variants) {
  if (!variants || variants.length === 0) return null;
  const prices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
  return prices.length > 0 ? Math.min(...prices) : null;
}

function transformProduct(product) {
  const teaType = detectTeaType(product.tags || [], product.title, product.product_type);
  const lowestPrice = getLowestPrice(product.variants);
  const mainImage = product.images && product.images[0] ? product.images[0].src : null;
  
  return {
    name: product.title,
    brandName: 'Vahdam Teas',
    teaType: teaType,
    description: stripHtml(product.body_html),
    imageUrl: mainImage,
    productUrl: `https://www.vahdamteas.com/products/${product.handle}`,
    priceUsd: lowestPrice,
    tags: product.tags || [],
    productType: product.product_type,
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
  console.log('Starting Vahdam Teas scraper...');
  
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const products = await fetchPage(page);
      
      if (products.length === 0) {
        hasMore = false;
      } else {
        // Filter to tea products
        const teas = products.filter(p => {
          const allText = [...(p.tags || []), p.title, p.product_type || ''].join(' ').toLowerCase();
          return allText.includes('tea') || 
                 allText.includes('chai') ||
                 allText.includes('matcha') ||
                 allText.includes('tisane');
        });
        
        allProducts = allProducts.concat(teas);
        console.log(`  Page ${page}: ${products.length} products (${teas.length} teas)`);
        page++;
        
        if (page > 30) hasMore = false;
        
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
      hasMore = false;
    }
  }
  
  console.log(`\nTotal products fetched: ${allProducts.length}`);
  
  const teas = allProducts.map(transformProduct);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const outputPath = path.join(OUTPUT_DIR, 'vahdam-teas.json');
  fs.writeFileSync(outputPath, JSON.stringify(teas, null, 2));
  console.log(`\nSaved ${teas.length} teas to ${outputPath}`);
  
  // Summary
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

if (require.main === module) {
  scrapeAll().catch(console.error);
}

module.exports = { scrapeAll, transformProduct };
