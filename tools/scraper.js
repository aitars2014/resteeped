#!/usr/bin/env node
/**
 * Tea Shop Scraper for Resteeped
 * Scrapes tea products from Republic of Tea, Rishi Tea, and Adagio
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'scraped');

// Default brewing parameters by tea type
const BREW_DEFAULTS = {
  black: { temp: 212, timeMin: 3, timeMax: 5 },
  green: { temp: 175, timeMin: 2, timeMax: 3 },
  oolong: { temp: 195, timeMin: 3, timeMax: 5 },
  white: { temp: 175, timeMin: 2, timeMax: 4 },
  puerh: { temp: 212, timeMin: 3, timeMax: 5 },
  herbal: { temp: 212, timeMin: 5, timeMax: 7 }
};

// Scrape Rishi Tea - use Shopify's JSON API
async function scrapeRishi(browser) {
  console.log('\n🍵 Scraping Rishi Tea...');
  const page = await browser.newPage();
  const products = [];
  
  const collections = [
    { handle: 'black-tea', type: 'black' },
    { handle: 'green-tea', type: 'green' },
    { handle: 'oolong-tea', type: 'oolong' },
    { handle: 'white-tea', type: 'white' },
    { handle: 'puer-tea', type: 'puerh' },
    { handle: 'herbal-tea', type: 'herbal' }
  ];
  
  for (const col of collections) {
    console.log(`  📦 Scraping ${col.type}...`);
    try {
      // Shopify stores have a JSON endpoint
      const response = await page.goto(
        `https://www.rishi-tea.com/collections/${col.handle}/products.json?limit=50`,
        { waitUntil: 'domcontentloaded', timeout: 30000 }
      );
      
      const text = await page.evaluate(() => document.body.innerText);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Fall back to HTML scraping
        console.log(`    Using HTML fallback for ${col.type}`);
        await page.goto(`https://www.rishi-tea.com/collections/${col.handle}`, { 
          waitUntil: 'networkidle', timeout: 45000 
        });
        await page.waitForTimeout(3000);
        
        const htmlProducts = await page.evaluate(() => {
          const items = [];
          // Rishi uses specific product card structure
          document.querySelectorAll('[data-product-card], .product-card, [class*="ProductCard"]').forEach(card => {
            const linkEl = card.querySelector('a[href*="/products/"]');
            const nameEl = card.querySelector('[class*="title"], h3, h4');
            const imgEl = card.querySelector('img');
            const priceEl = card.querySelector('[class*="price"]');
            const profileEl = card.querySelector('[class*="profile"], [class*="flavor"]');
            
            if (!nameEl) return;
            
            items.push({
              title: nameEl.textContent.trim(),
              handle: linkEl?.href?.split('/products/')[1]?.split('?')[0] || '',
              body_html: '',
              images: imgEl?.src ? [{ src: imgEl.src }] : [],
              variants: [{ price: priceEl?.textContent?.match(/\$([\d.]+)/)?.[1] || '0' }],
              tags: profileEl?.textContent?.split('|').map(s => s.trim()) || []
            });
          });
          return items;
        });
        
        data = { products: htmlProducts };
      }
      
      if (data.products) {
        const defaults = BREW_DEFAULTS[col.type];
        
        for (const p of data.products) {
          // Skip non-tea items
          if (p.title.toLowerCase().includes('teaware') ||
              p.title.toLowerCase().includes('gift') ||
              p.title.toLowerCase().includes('sampler') ||
              p.title.toLowerCase().includes('accessory')) continue;
          
          // Extract flavor notes from tags or profile
          let flavorNotes = [];
          if (p.tags && Array.isArray(p.tags)) {
            flavorNotes = p.tags
              .filter(t => typeof t === 'string' && t.length < 25 && !t.includes(':'))
              .slice(0, 5);
          }
          
          products.push({
            name: p.title,
            brand_name: 'Rishi Tea',
            tea_type: col.type,
            description: p.body_html?.replace(/<[^>]+>/g, '')?.substring(0, 500)?.trim() || null,
            origin: null,
            steep_temp_f: defaults.temp,
            steep_time_min: defaults.timeMin,
            steep_time_max: defaults.timeMax,
            flavor_notes: flavorNotes.length > 0 ? flavorNotes : null,
            image_url: p.images?.[0]?.src || null,
            price_per_oz: null,
            source_url: `https://www.rishi-tea.com/products/${p.handle}`
          });
          console.log(`    ✓ ${p.title}`);
        }
      }
      
    } catch (e) {
      console.log(`    ✗ Error: ${e.message}`);
    }
  }
  
  await page.close();
  
  // Deduplicate by name
  const seen = new Set();
  return products.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

// Scrape Adagio - navigate their category pages
async function scrapeAdagio(browser) {
  console.log('\n🍵 Scraping Adagio Teas...');
  const page = await browser.newPage();
  const products = [];
  
  // Adagio has a specific product grid structure
  const categories = [
    { url: 'https://www.adagio.com/black/black_tea.html', type: 'black' },
    { url: 'https://www.adagio.com/green/green_tea.html', type: 'green' },
    { url: 'https://www.adagio.com/oolong/oolong_tea.html', type: 'oolong' },
    { url: 'https://www.adagio.com/white/white_tea.html', type: 'white' },
    { url: 'https://www.adagio.com/herbal/herbal_tea.html', type: 'herbal' },
    { url: 'https://www.adagio.com/puerh/puerh_tea.html', type: 'puerh' }
  ];
  
  for (const cat of categories) {
    console.log(`  📦 Scraping ${cat.type}...`);
    try {
      await page.goto(cat.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(3000);
      
      // Scroll to load lazy content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(2000);
      
      const pageProducts = await page.evaluate(() => {
        const items = [];
        
        // Adagio uses teabox class for product tiles
        document.querySelectorAll('.teabox, .product-tile, [class*="product-item"]').forEach(tile => {
          const linkEl = tile.querySelector('a');
          const nameEl = tile.querySelector('.tea-title, h3, h4, [class*="title"]');
          const imgEl = tile.querySelector('img');
          const priceEl = tile.querySelector('.price, [class*="price"]');
          const descEl = tile.querySelector('.description, p');
          
          if (!nameEl || !linkEl) return;
          
          const name = nameEl.textContent.trim();
          if (name.toLowerCase().includes('teaware') ||
              name.toLowerCase().includes('accessory') ||
              name.toLowerCase().includes('gift set')) return;
          
          let href = linkEl.href;
          if (!href.startsWith('http')) {
            href = 'https://www.adagio.com' + href;
          }
          
          let imgSrc = imgEl?.src || imgEl?.getAttribute('data-src');
          if (imgSrc && !imgSrc.startsWith('http')) {
            imgSrc = 'https://www.adagio.com' + imgSrc;
          }
          
          items.push({
            name,
            sourceUrl: href,
            imageUrl: imgSrc,
            description: descEl?.textContent?.trim()?.substring(0, 300) || null,
            price: priceEl?.textContent?.match(/\$([\d.]+)/)?.[1] || null
          });
        });
        
        return items;
      });
      
      const defaults = BREW_DEFAULTS[cat.type];
      
      for (const p of pageProducts) {
        products.push({
          name: p.name,
          brand_name: 'Adagio Teas',
          tea_type: cat.type,
          description: p.description,
          origin: null,
          steep_temp_f: defaults.temp,
          steep_time_min: defaults.timeMin,
          steep_time_max: defaults.timeMax,
          flavor_notes: null,
          image_url: p.imageUrl,
          price_per_oz: p.price ? parseFloat(p.price) : null,
          source_url: p.sourceUrl
        });
        console.log(`    ✓ ${p.name}`);
      }
      
      console.log(`    Found ${pageProducts.length} products`);
      
    } catch (e) {
      console.log(`    ✗ Error: ${e.message}`);
    }
  }
  
  await page.close();
  
  // Deduplicate
  const seen = new Set();
  return products.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

// Scrape Republic of Tea
async function scrapeRepublicOfTea(browser) {
  console.log('\n🍵 Scraping Republic of Tea...');
  const page = await browser.newPage();
  const products = [];
  
  // Republic uses /c/ for categories
  const categories = [
    { url: 'https://www.republicoftea.com/c/black-teas/', type: 'black' },
    { url: 'https://www.republicoftea.com/c/green-teas/', type: 'green' },
    { url: 'https://www.republicoftea.com/c/oolong-teas/', type: 'oolong' },
    { url: 'https://www.republicoftea.com/c/white-teas/', type: 'white' },
    { url: 'https://www.republicoftea.com/c/herbal-teas/', type: 'herbal' },
    { url: 'https://www.republicoftea.com/c/pu-erh-teas/', type: 'puerh' }
  ];
  
  for (const cat of categories) {
    console.log(`  📦 Scraping ${cat.type}...`);
    try {
      await page.goto(cat.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(4000);
      
      // Multiple scrolls to load lazy content
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1500);
      }
      
      const pageProducts = await page.evaluate(() => {
        const items = [];
        
        // Republic uses product-tile or similar
        document.querySelectorAll('[class*="product-tile"], [class*="ProductTile"], .tile, article').forEach(tile => {
          const linkEl = tile.querySelector('a[href*="/p/"]');
          const nameEl = tile.querySelector('[class*="name"], [class*="title"], h2, h3');
          const imgEl = tile.querySelector('img');
          const priceEl = tile.querySelector('[class*="price"]');
          
          if (!nameEl || !linkEl) return;
          
          const name = nameEl.textContent.trim();
          if (!name || 
              name.length > 80 ||
              name.toLowerCase().includes('teaware') ||
              name.toLowerCase().includes('gift')) return;
          
          items.push({
            name,
            sourceUrl: linkEl.href,
            imageUrl: imgEl?.src || imgEl?.getAttribute('data-src'),
            price: priceEl?.textContent?.match(/\$([\d.]+)/)?.[1] || null
          });
        });
        
        return items;
      });
      
      const defaults = BREW_DEFAULTS[cat.type];
      
      for (const p of pageProducts) {
        products.push({
          name: p.name,
          brand_name: 'The Republic of Tea',
          tea_type: cat.type,
          description: null,
          origin: null,
          steep_temp_f: defaults.temp,
          steep_time_min: defaults.timeMin,
          steep_time_max: defaults.timeMax,
          flavor_notes: null,
          image_url: p.imageUrl,
          price_per_oz: null,
          source_url: p.sourceUrl
        });
        console.log(`    ✓ ${p.name}`);
      }
      
      console.log(`    Found ${pageProducts.length} products`);
      
    } catch (e) {
      console.log(`    ✗ Error: ${e.message}`);
    }
  }
  
  await page.close();
  
  // Deduplicate
  const seen = new Set();
  return products.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting Tea Scraper for Resteeped\n');
  console.log('Output directory:', OUTPUT_DIR);
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Scrape sequentially
    const rishiProducts = await scrapeRishi(browser);
    const adagioProducts = await scrapeAdagio(browser);
    const republicProducts = await scrapeRepublicOfTea(browser);
    
    // Save results
    console.log('\n💾 Saving results...');
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'rishi-tea.json'),
      JSON.stringify(rishiProducts, null, 2)
    );
    console.log(`  ✓ rishi-tea.json (${rishiProducts.length} products)`);
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'adagio-teas.json'),
      JSON.stringify(adagioProducts, null, 2)
    );
    console.log(`  ✓ adagio-teas.json (${adagioProducts.length} products)`);
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'republic-of-tea.json'),
      JSON.stringify(republicProducts, null, 2)
    );
    console.log(`  ✓ republic-of-tea.json (${republicProducts.length} products)`);
    
    // Combined file for easy import
    const allProducts = [...rishiProducts, ...adagioProducts, ...republicProducts];
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'all-teas.json'),
      JSON.stringify(allProducts, null, 2)
    );
    console.log(`  ✓ all-teas.json (${allProducts.length} products combined)`);
    
    // Summary
    console.log(`\n✅ Scraping complete!`);
    console.log(`   Rishi Tea: ${rishiProducts.length}`);
    console.log(`   Adagio: ${adagioProducts.length}`);
    console.log(`   Republic of Tea: ${republicProducts.length}`);
    console.log(`   Total: ${allProducts.length}`);
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
