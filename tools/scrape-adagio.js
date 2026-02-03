#!/usr/bin/env node
/**
 * Adagio Teas Scraper for Resteeped
 * Efficient version that extracts data from category pages and visits product pages in batches
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'scraped', 'adagio-teas.json');

// Default brewing parameters by tea type
const BREW_DEFAULTS = {
  black: { temp: 212, timeMin: 3, timeMax: 5 },
  green: { temp: 175, timeMin: 2, timeMax: 3 },
  oolong: { temp: 195, timeMin: 3, timeMax: 5 },
  white: { temp: 175, timeMin: 2, timeMax: 4 },
  puerh: { temp: 212, timeMin: 3, timeMax: 5 },
  herbal: { temp: 212, timeMin: 5, timeMax: 7 }
};

// Category URLs for Adagio
const CATEGORIES = [
  { url: 'https://www.adagio.com/black/loose_leaf_black_teas.html', type: 'black' },
  { url: 'https://www.adagio.com/green/green_teas.html', type: 'green' },
  { url: 'https://www.adagio.com/oolong/loose_leaf_oolong_teas.html', type: 'oolong' },
  { url: 'https://www.adagio.com/white/loose_leaf_white_teas.html', type: 'white' },
  { url: 'https://www.adagio.com/herbal/loose_leaf_herbal_teas.html', type: 'herbal' },
  { url: 'https://www.adagio.com/pu_erh/pu_erh_aged_teas.html', type: 'puerh' }
];

// Parse steep time from text like "2-3 mins" or "3-5 minutes"
function parseSteepTime(text) {
  if (!text) return { min: null, max: null };
  const match = text.match(/(\d+)\s*-\s*(\d+)\s*min/i);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const singleMatch = text.match(/(\d+)\s*min/i);
  if (singleMatch) return { min: parseInt(singleMatch[1]), max: parseInt(singleMatch[1]) };
  return { min: null, max: null };
}

// Parse temperature from text like "212°" or "175°F"
function parseSteepTemp(text) {
  if (!text) return null;
  const match = text.match(/(\d+)\s*[°]/);
  return match ? parseInt(match[1]) : null;
}

// Extract name from URL like "/black/earl_grey_bravo_tea.html"
function extractNameFromUrl(url) {
  const match = url.match(/\/([^/]+)_tea\.html$/);
  if (match) {
    return match[1].replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }
  return null;
}

// Scrape product details from page
async function scrapeProductDetails(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    const data = await page.evaluate(() => {
      // Get steeping info
      const steepEl = document.querySelector('.steepingInfo');
      const steepText = steepEl ? steepEl.textContent : '';
      
      // Get price
      const priceMeta = document.querySelector('meta[itemprop="price"]');
      const price = priceMeta ? parseFloat(priceMeta.getAttribute('content')) : null;
      
      // Get image
      const imgMeta = document.querySelector('meta[property="og:image"]');
      const imageUrl = imgMeta ? imgMeta.getAttribute('content') : null;
      
      // Get description from first paragraph in main content
      const descEl = document.querySelector('#mainContainer p');
      const description = descEl ? descEl.textContent.trim().substring(0, 400) : null;
      
      return { steepText, price, imageUrl, description };
    });
    
    return data;
  } catch (e) {
    console.log(`    ⚠ Error fetching ${url}: ${e.message}`);
    return null;
  }
}

// Get product URLs from category page JSON-LD
async function getCategoryProducts(page, categoryUrl, teaType) {
  console.log(`  Fetching: ${categoryUrl}`);
  
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const urls = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          return data.itemListElement
            .map(item => item.url)
            .filter(url => url && url.includes('_tea.html') && !url.includes('sampler'));
        }
      } catch (e) {}
    }
    return [];
  });
  
  return urls;
}

async function main() {
  console.log('🍵 Adagio Teas Scraper');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const products = [];
  const seenUrls = new Set();
  
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    
    for (const category of CATEGORIES) {
      console.log(`\n📦 Scraping ${category.type} teas...`);
      
      const urls = await getCategoryProducts(page, category.url, category.type);
      console.log(`  Found ${urls.length} products`);
      
      for (const url of urls) {
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        
        const name = extractNameFromUrl(url);
        if (!name) continue;
        
        // Skip non-tea items
        if (/teaware|gift|sampler|accessory|cup|kettle|infuser|portions/i.test(name)) continue;
        
        const details = await scrapeProductDetails(page, url);
        const defaults = BREW_DEFAULTS[category.type];
        
        const steepTime = details ? parseSteepTime(details.steepText) : { min: null, max: null };
        const steepTemp = details ? parseSteepTemp(details.steepText) : null;
        
        const product = {
          name: name,
          brand_name: 'Adagio Teas',
          tea_type: category.type,
          description: details?.description || null,
          origin: null,
          steep_temp_f: steepTemp || defaults.temp,
          steep_time_min: steepTime.min || defaults.timeMin,
          steep_time_max: steepTime.max || defaults.timeMax,
          flavor_notes: null,
          image_url: details?.imageUrl || null,
          price_per_oz: details?.price || null,
          source_url: url
        };
        
        products.push(product);
        console.log(`    ✓ ${product.name}`);
        
        // Small delay
        await page.waitForTimeout(200);
      }
      
      // Save after each category to avoid losing progress
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(products, null, 2));
      console.log(`  💾 Saved ${products.length} products so far`);
    }
    
    await page.close();
    
  } finally {
    await browser.close();
  }
  
  console.log(`\n✅ Scraped ${products.length} total products`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
