#!/usr/bin/env node
/**
 * Republic of Tea Scraper for Resteeped
 * Scrapes tea products from Republic of Tea's website
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'scraped', 'republic-of-tea.json');

// Default brewing parameters by tea type
const BREW_DEFAULTS = {
  black: { temp: 212, timeMin: 3, timeMax: 5 },
  green: { temp: 175, timeMin: 2, timeMax: 3 },
  oolong: { temp: 195, timeMin: 3, timeMax: 5 },
  white: { temp: 175, timeMin: 2, timeMax: 4 },
  puerh: { temp: 212, timeMin: 3, timeMax: 5 },
  herbal: { temp: 212, timeMin: 5, timeMax: 7 }
};

// Category URLs for Republic of Tea
const CATEGORIES = [
  { url: 'https://www.republicoftea.com/black-tea/c/3/', type: 'black' },
  { url: 'https://www.republicoftea.com/green-tea/c/18/', type: 'green' },
  { url: 'https://www.republicoftea.com/oolong-tea/c/36/', type: 'oolong' },
  { url: 'https://www.republicoftea.com/white-tea/c/53/', type: 'white' },
  { url: 'https://www.republicoftea.com/herbal-tea/c/23/', type: 'herbal' },
  { url: 'https://www.republicoftea.com/chai-tea/c/10/', type: 'black' },
  { url: 'https://www.republicoftea.com/hibiscus-tea/c/25/', type: 'herbal' },
  { url: 'https://www.republicoftea.com/decaf/c/126/', type: 'black' }
];

// Parse steep time from text like "3-5 minutes"
function parseSteepTime(text) {
  if (!text) return { min: null, max: null };
  const match = text.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  const singleMatch = text.match(/(\d+)\s*min/i);
  if (singleMatch) {
    return { min: parseInt(singleMatch[1]), max: parseInt(singleMatch[1]) };
  }
  return { min: null, max: null };
}

// Get product URLs from category page
async function getProductUrls(page, categoryUrl) {
  console.log(`  Fetching category: ${categoryUrl}`);
  
  try {
    await page.goto(categoryUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Scroll to load lazy content
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }
    
    // Extract product URLs
    const urls = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/p/"]');
      const productUrls = [];
      
      for (const link of links) {
        const href = link.href;
        if (href && href.includes('/p/') && !productUrls.includes(href)) {
          productUrls.push(href);
        }
      }
      
      return productUrls;
    });
    
    // Filter out non-tea items
    return urls.filter(url => 
      !url.includes('gift-certificate') &&
      !url.includes('teapot') &&
      !url.includes('cup') &&
      !url.includes('accessory') &&
      url.match(/\/p\/v?\d+/i)
    );
    
  } catch (e) {
    console.log(`    Error fetching category: ${e.message}`);
    return [];
  }
}

// Scrape individual product page
async function scrapeProduct(page, url, teaType) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2000);
    
    const productData = await page.evaluate(() => {
      // Get JSON-LD data
      let jsonLd = null;
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            jsonLd = data;
            break;
          }
        } catch (e) {}
      }
      
      // Get title
      const titleEl = document.querySelector('h1');
      const title = titleEl ? titleEl.textContent.trim() : (jsonLd?.name || null);
      
      // Get description
      let description = jsonLd?.description || null;
      if (!description) {
        const descEl = document.querySelector('#product-details-card-body p');
        if (descEl) description = descEl.textContent.trim().substring(0, 500);
      }
      
      // Get image
      let imageUrl = null;
      if (jsonLd?.image) {
        imageUrl = jsonLd.image;
      } else {
        const imgEl = document.querySelector('.product-image img, [data-zoom-id] img');
        if (imgEl) imageUrl = imgEl.src;
      }
      
      // Get price from JSON-LD
      let price = null;
      if (jsonLd?.offers) {
        if (jsonLd.offers.lowPrice) {
          price = parseFloat(jsonLd.offers.lowPrice);
        } else if (jsonLd.offers.price) {
          price = parseFloat(jsonLd.offers.price);
        }
      }
      
      // Get steeping info from page content
      let steepInfo = {};
      const pageText = document.body.innerText;
      
      // Look for steeping instructions
      const steepMatch = pageText.match(/steep\s+for\s+(\d+)\s*-\s*(\d+)\s*min/i);
      if (steepMatch) {
        steepInfo.timeMin = parseInt(steepMatch[1]);
        steepInfo.timeMax = parseInt(steepMatch[2]);
      }
      
      // Look for temperature
      const tempMatch = pageText.match(/rolling\s+boil|212|boiling/i);
      if (tempMatch) {
        steepInfo.temp = 212;
      } else if (pageText.match(/175|lower\s+temperature/i)) {
        steepInfo.temp = 175;
      } else if (pageText.match(/195/i)) {
        steepInfo.temp = 195;
      }
      
      // Get ingredients
      let ingredients = null;
      const ingredientsMatch = pageText.match(/Ingredients\n([^\n]+)/i);
      if (ingredientsMatch) {
        ingredients = ingredientsMatch[1].trim();
      }
      
      // Get origin/country
      let origin = null;
      const originMatch = pageText.match(/Country of Origin\n([^\n]+)/i);
      if (originMatch) {
        origin = originMatch[1].trim();
      }
      
      // Get caffeine info
      let caffeine = null;
      if (pageText.toLowerCase().includes('caffeine-free') || 
          pageText.toLowerCase().includes('herbal tea')) {
        caffeine = 'none';
      } else if (pageText.toLowerCase().includes('high caffeine')) {
        caffeine = 'high';
      } else if (pageText.toLowerCase().includes('black tea')) {
        caffeine = 'moderate';
      } else if (pageText.toLowerCase().includes('green tea') || 
                 pageText.toLowerCase().includes('white tea')) {
        caffeine = 'low';
      }
      
      return {
        title,
        description,
        imageUrl,
        price,
        steepInfo,
        ingredients,
        origin,
        caffeine,
        sourceUrl: window.location.href,
        sku: jsonLd?.sku || null
      };
    });
    
    if (!productData.title) {
      console.log(`    ✗ No title found for ${url}`);
      return null;
    }
    
    // Skip non-tea items
    const skipKeywords = ['teaware', 'gift card', 'certificate', 'accessory', 'cup', 'kettle', 
                         'infuser', 'honey', 'sweetener', 'book', 'music'];
    if (skipKeywords.some(kw => productData.title.toLowerCase().includes(kw))) {
      return null;
    }
    
    const defaults = BREW_DEFAULTS[teaType] || BREW_DEFAULTS.black;
    
    const product = {
      name: productData.title,
      brand_name: 'The Republic of Tea',
      tea_type: teaType,
      description: productData.description,
      origin: productData.origin,
      steep_temp_f: productData.steepInfo.temp || defaults.temp,
      steep_time_min: productData.steepInfo.timeMin || defaults.timeMin,
      steep_time_max: productData.steepInfo.timeMax || defaults.timeMax,
      flavor_notes: null,
      image_url: productData.imageUrl,
      price_per_oz: productData.price,
      source_url: productData.sourceUrl,
      sku: productData.sku,
      ingredients: productData.ingredients,
      caffeine_level: productData.caffeine
    };
    
    console.log(`    ✓ ${product.name}`);
    return product;
    
  } catch (e) {
    console.log(`    ✗ Error scraping ${url}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('🍵 Republic of Tea Scraper');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const products = [];
  const seenUrls = new Set();
  
  try {
    const page = await browser.newPage();
    
    // Set reasonable viewport and user agent
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
    
    for (const category of CATEGORIES) {
      console.log(`\n📦 Scraping ${category.type} teas...`);
      
      const urls = await getProductUrls(page, category.url);
      console.log(`  Found ${urls.length} products`);
      
      // Limit to first 50 per category to avoid overloading
      const limitedUrls = urls.slice(0, 50);
      
      for (const url of limitedUrls) {
        // Skip duplicates
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        
        const product = await scrapeProduct(page, url, category.type);
        if (product) {
          products.push(product);
        }
        
        // Delay between requests to be respectful
        await page.waitForTimeout(1000);
      }
    }
    
    await page.close();
    
  } finally {
    await browser.close();
  }
  
  // Deduplicate by name
  const seen = new Set();
  const uniqueProducts = products.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
  
  // Save results
  console.log('\n💾 Saving results...');
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(uniqueProducts, null, 2));
  
  console.log(`\n✅ Scraped ${uniqueProducts.length} products`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
