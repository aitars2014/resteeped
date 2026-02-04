/**
 * Yunnan Sourcing Teaware Scraper
 * Scrapes gaiwans, teapots, and other teaware from yunnansourcing.com
 * 
 * Usage: node scrape-yunnan-sourcing-teaware.js
 */

const fs = require('fs');
const path = require('path');

// Categories to scrape
const CATEGORIES = [
  { url: 'https://yunnansourcing.com/collections/gaiwans', category: 'gaiwan' },
  { url: 'https://yunnansourcing.com/collections/yixing-teapots', category: 'teapot' },
  { url: 'https://yunnansourcing.com/collections/tea-cups', category: 'cup' },
  { url: 'https://yunnansourcing.com/collections/gong-dao-bei-fairness-cups', category: 'pitcher' },
  { url: 'https://yunnansourcing.com/collections/cha-hai-tea-pets', category: 'tea_pet' },
  { url: 'https://yunnansourcing.com/collections/tea-brewing-accessories', category: 'tea_tools' },
];

// Material detection from title/description
function detectMaterial(text) {
  const lower = text.toLowerCase();
  if (lower.includes('yixing') || lower.includes('zi sha') || lower.includes('zisha')) {
    return 'yixing_clay';
  }
  if (lower.includes('jianshui') || lower.includes('jian shui')) {
    return 'jianshui_clay';
  }
  if (lower.includes('porcelain') || lower.includes('ceramic')) {
    return 'porcelain';
  }
  if (lower.includes('glass')) {
    return 'glass';
  }
  if (lower.includes('cast iron') || lower.includes('tetsubin')) {
    return 'cast_iron';
  }
  if (lower.includes('silver')) {
    return 'silver';
  }
  return 'ceramic'; // Default
}

// Clay type detection
function detectClayType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('zi sha') || lower.includes('zisha') || lower.includes('purple sand')) {
    return 'zi_sha';
  }
  if (lower.includes('hong ni') || lower.includes('red clay')) {
    return 'hong_ni';
  }
  if (lower.includes('duan ni') || lower.includes('duan clay')) {
    return 'duan_ni';
  }
  if (lower.includes('zi ni')) {
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
  return null;
}

// Extract capacity from text
function extractCapacity(text) {
  const match = text.match(/(\d+)\s*ml/i);
  return match ? parseInt(match[1]) : null;
}

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Main scraping function (using fetch + regex parsing)
async function scrapeCategory(categoryUrl, category) {
  console.log(`\nScraping ${category} from ${categoryUrl}...`);
  
  const items = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= 10) { // Max 10 pages per category
    const url = `${categoryUrl}?page=${page}`;
    console.log(`  Page ${page}...`);
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Check if we have products on this page
      if (!html.includes('product-card') && !html.includes('ProductItem')) {
        hasMore = false;
        continue;
      }
      
      // Parse product data using Shopify JSON endpoint
      const jsonUrl = `${categoryUrl}/products.json?page=${page}&limit=50`;
      const jsonResponse = await fetch(jsonUrl);
      
      if (!jsonResponse.ok) {
        // Fallback: try to parse from HTML
        console.log(`  JSON endpoint unavailable, skipping...`);
        hasMore = false;
        continue;
      }
      
      const data = await jsonResponse.json();
      
      if (!data.products || data.products.length === 0) {
        hasMore = false;
        continue;
      }
      
      for (const product of data.products) {
        const combinedText = `${product.title} ${product.body_html || ''}`;
        
        const item = {
          name: product.title,
          slug: generateSlug(product.title),
          description: product.body_html 
            ? product.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            : null,
          category,
          material: detectMaterial(combinedText),
          clay_type: detectClayType(combinedText),
          capacity_ml: extractCapacity(combinedText),
          company_slug: 'yunnan-sourcing',
          artisan_name: null, // Could parse from description
          origin_region: 'Yunnan, China',
          price_usd: product.variants?.[0]?.price 
            ? parseFloat(product.variants[0].price) 
            : null,
          product_url: `https://yunnansourcing.com/products/${product.handle}`,
          in_stock: product.variants?.[0]?.available ?? true,
          image_url: product.images?.[0]?.src || null,
          images: product.images?.map(img => img.src) || [],
          vendor: product.vendor,
          tags: product.tags || [],
          created_at: product.created_at,
        };
        
        items.push(item);
      }
      
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`  Error on page ${page}: ${error.message}`);
      hasMore = false;
    }
  }
  
  console.log(`  Found ${items.length} items in ${category}`);
  return items;
}

async function main() {
  console.log('=== Yunnan Sourcing Teaware Scraper ===\n');
  
  const allItems = [];
  
  for (const { url, category } of CATEGORIES) {
    const items = await scrapeCategory(url, category);
    allItems.push(...items);
  }
  
  // Output directory
  const outputDir = path.join(__dirname, '../../data/scraped');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save results
  const outputPath = path.join(outputDir, 'yunnan-sourcing-teaware.json');
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
  
  console.log(`\n=== Summary ===`);
  console.log(`Total items scraped: ${allItems.length}`);
  console.log(`Output saved to: ${outputPath}`);
  
  // Category breakdown
  const breakdown = {};
  for (const item of allItems) {
    breakdown[item.category] = (breakdown[item.category] || 0) + 1;
  }
  console.log('\nBy category:');
  for (const [cat, count] of Object.entries(breakdown)) {
    console.log(`  ${cat}: ${count}`);
  }
  
  return allItems;
}

main().catch(console.error);
