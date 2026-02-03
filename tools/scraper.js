#!/usr/bin/env node
/**
 * Tea Shop Scraper for Resteeped
 * Scrapes tea products from Republic of Tea, Rishi Tea, and Adagio
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'scraped');

// Helper to normalize tea type
function normalizeTeaType(type) {
  if (!type) return null;
  const t = type.toLowerCase().trim();
  if (t.includes('black')) return 'black';
  if (t.includes('green') || t.includes('matcha')) return 'green';
  if (t.includes('oolong')) return 'oolong';
  if (t.includes('white')) return 'white';
  if (t.includes('puerh') || t.includes('pu-erh') || t.includes('puer')) return 'puerh';
  if (t.includes('herbal') || t.includes('rooibos') || t.includes('tisane') || t.includes('caffeine-free') || t.includes('botanical')) return 'herbal';
  if (t.includes('chai')) return 'black'; // Chai is typically black tea based
  return null;
}

// Helper to parse temperature
function parseTemp(text) {
  if (!text) return null;
  const match = text.match(/(\d+)\s*[°]?\s*F/i);
  if (match) return parseInt(match[1]);
  // Convert from Celsius if needed
  const cMatch = text.match(/(\d+)\s*[°]?\s*C/i);
  if (cMatch) return Math.round(parseInt(cMatch[1]) * 9/5 + 32);
  return null;
}

// Helper to parse steep time
function parseSteepTime(text) {
  if (!text) return { min: null, max: null };
  // Match patterns like "3-5 min", "3 to 5 minutes", "3-5 minutes"
  const rangeMatch = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*min/i);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }
  const singleMatch = text.match(/(\d+)\s*min/i);
  if (singleMatch) {
    return { min: parseInt(singleMatch[1]), max: parseInt(singleMatch[1]) };
  }
  return { min: null, max: null };
}

// Scrape Rishi Tea
async function scrapeRishi(browser) {
  console.log('\n🍵 Scraping Rishi Tea...');
  const page = await browser.newPage();
  const products = [];
  
  try {
    // Get all tea collections
    const collections = ['black-tea', 'green-tea', 'oolong-tea', 'white-tea', 'puer-tea', 'herbal-tea'];
    
    for (const collection of collections) {
      console.log(`  📦 Scraping ${collection}...`);
      await page.goto(`https://www.rishi-tea.com/collections/${collection}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      
      // Get product links
      const productLinks = await page.$$eval('a[href*="/products/"]', links => 
        [...new Set(links.map(a => a.href).filter(h => h.includes('/products/')))]
      );
      
      console.log(`    Found ${productLinks.length} products`);
      
      for (const link of productLinks.slice(0, 15)) { // Limit per collection
        try {
          await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(1500);
          
          const product = await page.evaluate(() => {
            const name = document.querySelector('h1')?.textContent?.trim();
            const description = document.querySelector('[class*="product"] p, .product-description, [data-product-description]')?.textContent?.trim();
            const priceEl = document.querySelector('[class*="price"], .product-price');
            const priceText = priceEl?.textContent || '';
            const priceMatch = priceText.match(/\$?([\d.]+)/);
            
            const imageEl = document.querySelector('.product-gallery img, [class*="product"] img, img[src*="cdn.shopify"]');
            const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src');
            
            // Extract origin
            const originEl = document.body.innerText.match(/Origin[:\s]*([A-Za-z\s,]+)/i);
            const origin = originEl ? originEl[1].trim() : null;
            
            // Extract flavor notes from taste descriptors
            const flavorEl = document.querySelector('[class*="flavor"], [class*="taste"], [class*="profile"]');
            let flavorNotes = [];
            if (flavorEl) {
              flavorNotes = flavorEl.textContent.split(/[|,]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 30);
            }
            
            // Get tea type from breadcrumb or category
            const typeEl = document.querySelector('[class*="breadcrumb"] a, .product-type');
            const typeText = typeEl?.textContent || '';
            
            return { name, description, priceText, imageUrl, origin, flavorNotes, typeText };
          });
          
          if (product.name) {
            products.push({
              name: product.name,
              brand_name: 'Rishi Tea',
              tea_type: normalizeTeaType(collection) || normalizeTeaType(product.typeText),
              description: product.description || null,
              origin: product.origin,
              steep_temp_f: collection.includes('green') ? 175 : collection.includes('white') ? 175 : collection.includes('oolong') ? 195 : 212,
              steep_time_min: collection.includes('green') || collection.includes('white') ? 2 : 3,
              steep_time_max: collection.includes('green') || collection.includes('white') ? 3 : 5,
              flavor_notes: product.flavorNotes.length > 0 ? product.flavorNotes : null,
              image_url: product.imageUrl,
              price_per_oz: null, // Rishi sells by pound, complex to calculate
              source_url: link
            });
            console.log(`      ✓ ${product.name}`);
          }
        } catch (e) {
          console.log(`      ✗ Failed: ${e.message}`);
        }
      }
    }
  } finally {
    await page.close();
  }
  
  return products;
}

// Scrape Adagio
async function scrapeAdagio(browser) {
  console.log('\n🍵 Scraping Adagio Teas...');
  const page = await browser.newPage();
  const products = [];
  
  try {
    const categories = [
      { url: 'https://www.adagio.com/black/loose_leaf_black_teas.html', type: 'black' },
      { url: 'https://www.adagio.com/green/loose_leaf_green_teas.html', type: 'green' },
      { url: 'https://www.adagio.com/oolong/loose_leaf_oolong_teas.html', type: 'oolong' },
      { url: 'https://www.adagio.com/white/loose_leaf_white_teas.html', type: 'white' },
      { url: 'https://www.adagio.com/herbal/loose_leaf_herbal_teas.html', type: 'herbal' },
      { url: 'https://www.adagio.com/puerh/index.html', type: 'puerh' }
    ];
    
    for (const cat of categories) {
      console.log(`  📦 Scraping ${cat.type}...`);
      await page.goto(cat.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      
      // Get product links from the grid
      const productLinks = await page.$$eval('a[href*=".html"]', (links, baseUrl) => {
        return [...new Set(links
          .map(a => a.href)
          .filter(h => h.includes('/') && !h.includes('index.html') && !h.includes('loose_leaf'))
        )].slice(0, 20);
      }, cat.url);
      
      console.log(`    Found ${productLinks.length} products`);
      
      for (const link of productLinks.slice(0, 12)) {
        try {
          await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(1500);
          
          const product = await page.evaluate(() => {
            const name = document.querySelector('h1, .product-name, [itemprop="name"]')?.textContent?.trim();
            const description = document.querySelector('.product-description, [itemprop="description"], .description p')?.textContent?.trim();
            
            // Price - Adagio shows per oz pricing
            const priceEl = document.querySelector('.price, [itemprop="price"], .product-price');
            const priceText = priceEl?.textContent || '';
            const priceMatch = priceText.match(/\$?([\d.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : null;
            
            // Image
            const imageEl = document.querySelector('.product-image img, [itemprop="image"], img.main-image');
            let imageUrl = imageEl?.src || imageEl?.getAttribute('data-src');
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = 'https://www.adagio.com' + imageUrl;
            }
            
            // Brewing info
            const brewingText = document.body.innerText;
            const tempMatch = brewingText.match(/(\d{3})\s*[°]?\s*F/);
            const timeMatch = brewingText.match(/(\d+)\s*[-–]?\s*(\d*)\s*min/i);
            
            // Origin
            const originMatch = brewingText.match(/(?:Origin|Grown in|From)[:\s]*([A-Za-z\s,]+)/i);
            
            // Flavor notes from tasting notes section
            const flavorSection = document.querySelector('.tasting-notes, .flavor-notes');
            let flavorNotes = [];
            if (flavorSection) {
              flavorNotes = flavorSection.textContent.split(/[,|]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 30);
            }
            
            return {
              name,
              description,
              price,
              imageUrl,
              temp: tempMatch ? parseInt(tempMatch[1]) : null,
              timeMin: timeMatch ? parseInt(timeMatch[1]) : null,
              timeMax: timeMatch && timeMatch[2] ? parseInt(timeMatch[2]) : null,
              origin: originMatch ? originMatch[1].trim() : null,
              flavorNotes
            };
          });
          
          if (product.name && !product.name.toLowerCase().includes('teaware')) {
            products.push({
              name: product.name,
              brand_name: 'Adagio Teas',
              tea_type: cat.type,
              description: product.description || null,
              origin: product.origin,
              steep_temp_f: product.temp || (cat.type === 'green' ? 175 : cat.type === 'white' ? 175 : 212),
              steep_time_min: product.timeMin || 3,
              steep_time_max: product.timeMax || product.timeMin || 5,
              flavor_notes: product.flavorNotes.length > 0 ? product.flavorNotes : null,
              image_url: product.imageUrl,
              price_per_oz: product.price,
              source_url: link
            });
            console.log(`      ✓ ${product.name}`);
          }
        } catch (e) {
          console.log(`      ✗ Failed: ${e.message}`);
        }
      }
    }
  } finally {
    await page.close();
  }
  
  return products;
}

// Scrape Republic of Tea
async function scrapeRepublicOfTea(browser) {
  console.log('\n🍵 Scraping Republic of Tea...');
  const page = await browser.newPage();
  const products = [];
  
  try {
    const categories = [
      { url: 'https://www.republicoftea.com/tea/black-tea/', type: 'black' },
      { url: 'https://www.republicoftea.com/tea/green-tea/', type: 'green' },
      { url: 'https://www.republicoftea.com/tea/oolong-tea/', type: 'oolong' },
      { url: 'https://www.republicoftea.com/tea/white-tea/', type: 'white' },
      { url: 'https://www.republicoftea.com/tea/herbal-tea/', type: 'herbal' },
      { url: 'https://www.republicoftea.com/tea/pu-erh-tea/', type: 'puerh' }
    ];
    
    for (const cat of categories) {
      console.log(`  📦 Scraping ${cat.type}...`);
      try {
        await page.goto(cat.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
        
        // Get product links
        const productLinks = await page.$$eval('a[href*="/tea/"]', links => 
          [...new Set(links.map(a => a.href).filter(h => 
            h.includes('/tea/') && 
            !h.endsWith('-tea/') && 
            !h.includes('/c/') &&
            h.match(/\/tea\/[^\/]+\/?$/)
          ))]
        );
        
        console.log(`    Found ${productLinks.length} products`);
        
        for (const link of productLinks.slice(0, 12)) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000);
            
            const product = await page.evaluate(() => {
              const name = document.querySelector('h1, .product-name')?.textContent?.trim();
              const description = document.querySelector('.product-description, .pdp-description, [itemprop="description"]')?.textContent?.trim();
              
              // Price
              const priceEl = document.querySelector('.price, .product-price, [itemprop="price"]');
              const priceText = priceEl?.textContent || '';
              const priceMatch = priceText.match(/\$?([\d.]+)/);
              
              // Image
              const imageEl = document.querySelector('.product-image img, img[itemprop="image"], .pdp-image img');
              let imageUrl = imageEl?.src || imageEl?.getAttribute('data-src');
              
              // Brewing info - look for brewing instructions section
              const bodyText = document.body.innerText;
              const tempMatch = bodyText.match(/(\d{3})\s*[°]?\s*F/);
              const timeMatch = bodyText.match(/(\d+)\s*[-–to]*\s*(\d*)\s*min/i);
              
              // Origin
              const originMatch = bodyText.match(/(?:Origin|Region|Country)[:\s]*([A-Za-z\s,]+)/i);
              
              return {
                name,
                description,
                price: priceMatch ? parseFloat(priceMatch[1]) : null,
                imageUrl,
                temp: tempMatch ? parseInt(tempMatch[1]) : null,
                timeMin: timeMatch ? parseInt(timeMatch[1]) : null,
                timeMax: timeMatch && timeMatch[2] ? parseInt(timeMatch[2]) : null,
                origin: originMatch ? originMatch[1].trim() : null
              };
            });
            
            if (product.name && product.name.length < 100) {
              products.push({
                name: product.name,
                brand_name: 'The Republic of Tea',
                tea_type: cat.type,
                description: product.description || null,
                origin: product.origin,
                steep_temp_f: product.temp || (cat.type === 'green' ? 175 : cat.type === 'white' ? 175 : 212),
                steep_time_min: product.timeMin || 3,
                steep_time_max: product.timeMax || product.timeMin || 5,
                flavor_notes: null,
                image_url: product.imageUrl,
                price_per_oz: null,
                source_url: link
              });
              console.log(`      ✓ ${product.name}`);
            }
          } catch (e) {
            console.log(`      ✗ Failed: ${e.message}`);
          }
        }
      } catch (e) {
        console.log(`    ✗ Category failed: ${e.message}`);
      }
    }
  } finally {
    await page.close();
  }
  
  return products;
}

// Main execution
async function main() {
  console.log('🚀 Starting Tea Scraper for Resteeped\n');
  console.log('Output directory:', OUTPUT_DIR);
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  try {
    // Scrape all sites
    const [rishiProducts, adagioProducts, republicProducts] = await Promise.all([
      scrapeRishi(browser),
      scrapeAdagio(browser),
      scrapeRepublicOfTea(browser)
    ]);
    
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
    
    // Summary
    const total = rishiProducts.length + adagioProducts.length + republicProducts.length;
    console.log(`\n✅ Scraping complete! Total: ${total} products`);
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
