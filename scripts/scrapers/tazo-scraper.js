/**
 * Tazo Tea Scraper
 * Uses Puppeteer to scrape the JS-rendered product pages
 */

const puppeteer = require('puppeteer');
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
  description: 'Premium tea brand founded in Portland in 1994, known for bold, exotic blends like Chai and Passion. Now owned by Unilever.',
  city: 'Portland',
  state: 'OR',
  country: 'United States',
  founded: 1994,
  specialty: ['Chai', 'Herbal blends', 'Exotic flavors'],
};

function getTeaType(text) {
  const str = text.toLowerCase();
  if (str.includes('green')) return 'green';
  if (str.includes('black') || str.includes('chai') || str.includes('earl grey')) return 'black';
  if (str.includes('white')) return 'white';
  if (str.includes('oolong')) return 'oolong';
  return 'herbal';
}

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

async function scrapeProducts() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  
  const page = await browser.newPage();
  
  // Spoof user agent to look like a real browser
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });
  
  // Remove webdriver detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  
  const products = [];
  const categories = [
    'https://www.tazo.com/us/en/products/tea-bags.html',
    'https://www.tazo.com/us/en/products/k-cup-pods.html',
  ];
  
  for (const url of categories) {
    console.log(`Scraping ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Give JS time to render
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.log(`  Warning: ${e.message}`);
    }
    
    // Wait for products to load
    await page.waitForSelector('.product-card, .product-tile, [class*="product"]', { timeout: 10000 }).catch(() => {});
    
    // Scroll to load all products
    await autoScroll(page);
    
    // Extract product data
    const pageProducts = await page.evaluate(() => {
      const items = [];
      
      // Try various selectors that Tazo might use
      const cards = document.querySelectorAll('a[href*="/products/"]');
      
      cards.forEach(card => {
        const href = card.getAttribute('href');
        if (!href || href.includes('products.html') || items.some(p => p.url === href)) return;
        
        // Get product name from various possible locations
        const nameEl = card.querySelector('h2, h3, h4, .product-name, [class*="title"], [class*="name"]');
        const name = nameEl?.textContent?.trim() || '';
        
        // Get image
        const imgEl = card.querySelector('img');
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';
        
        if (name && href) {
          items.push({
            name,
            url: href.startsWith('http') ? href : `https://www.tazo.com${href}`,
            image,
          });
        }
      });
      
      return items;
    });
    
    products.push(...pageProducts);
    console.log(`  Found ${pageProducts.length} products`);
  }
  
  await browser.close();
  
  // Dedupe by URL
  const unique = [...new Map(products.map(p => [p.url, p])).values()];
  console.log(`Total unique products: ${unique.length}`);
  
  return unique;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  // Wait for any lazy-loaded content
  await new Promise(r => setTimeout(r, 1000));
}

async function main() {
  const companyId = await ensureCompany();
  if (!companyId) return;
  
  const products = await scrapeProducts();
  
  let imported = 0;
  let skipped = 0;
  
  for (const product of products) {
    // Skip non-tea items
    const name = product.name.toLowerCase();
    if (name.includes('gift') || name.includes('sampler') || name.includes('variety')) {
      skipped++;
      continue;
    }
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('teas')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', product.name)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const teaData = {
      name: product.name,
      company_id: companyId,
      brand_name: BRAND.name,
      tea_type: getTeaType(product.name),
      image_url: product.image || null,
      product_url: product.url,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    
    if (error) {
      console.error(`  Failed: ${product.name} - ${error.message}`);
    } else {
      imported++;
    }
  }
  
  console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
