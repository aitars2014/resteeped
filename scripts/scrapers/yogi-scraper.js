/**
 * Yogi Tea Scraper
 * Uses Puppeteer to scrape the JS-rendered product grid on yogi-life.com
 * (Site moved to Next.js + Hygraph CMS + Shopify; sitemap no longer has product URLs)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BRAND = {
  name: 'Yogi Tea',
  slug: 'yogi-tea',
  url: 'https://yogi-life.com',
  description: 'Herbal tea company founded in 1984, known for functional wellness teas with Ayurvedic roots. Popular for Bedtime, Stress Relief, and Detox blends.',
  city: 'Eugene',
  state: 'OR',
  country: 'United States',
  founded: 1984,
  specialty: ['Herbal tea', 'Ayurvedic blends', 'Wellness teas'],
};

function getTeaType(text) {
  const str = text.toLowerCase();
  if (str.includes('green tea') || str.includes('green ·') || str.includes('matcha')) return 'green';
  if (str.includes('black tea') || str.includes('black ·')) return 'black';
  if (str.includes('oolong')) return 'oolong';
  if (str.includes('puerh') || str.includes('pu-erh') || str.includes('puer')) return 'puerh';
  if (str.includes('rooibos')) return 'herbal';
  return 'herbal'; // Most Yogi teas are herbal
}

function cleanProductName(rawText) {
  // Raw text from the card includes UI elements like "Go to slide 0Go to slide 1Add"
  // and type/price info like "Herbal · Fruity$6.99 USD"
  let name = rawText
    .replace(/Go to slide \d+/g, '')
    .replace(/^(Add|Coming soon)/, '')
    .trim();

  // Remove the type descriptors and price at the end
  // Pattern: "Product NameType · Descriptor$6.99 USD"
  const priceIdx = name.indexOf('$');
  if (priceIdx > 0) {
    name = name.substring(0, priceIdx);
  }

  // Remove trailing type descriptors (e.g., "Herbal · Fruity")
  // These follow the product name and contain · separators
  const parts = name.split(/(?:Herbal|Green|Black|Oolong|Puerh|Rooibos|Chai)\s*·/i);
  if (parts.length > 1) {
    name = parts[0].trim();
  } else {
    // Try to split on common descriptors
    name = name.replace(/(?:Herbal|Green|Black|Oolong|Puerh|Rooibos)\s*(?:·[^]*)?$/i, '').trim();
  }

  return name;
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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Loading product page...');
  await page.goto('https://yogi-life.com/en-US/product', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for product cards to render
  await new Promise(r => setTimeout(r, 3000));

  // Scroll down to load all products (lazy loading)
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 2000));

  // Extract product data from rendered page
  const products = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/product/"]');
    const items = [];
    const seen = new Set();

    links.forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.includes('product-types') || href.includes('benefits') || seen.has(href)) return;
      seen.add(href);

      const rawText = a.textContent.trim();
      const img = a.querySelector('img');

      items.push({
        rawText,
        url: href,
        image: img?.src || '',
      });
    });

    return items;
  });

  await browser.close();

  // Clean up product names and build final list
  const cleaned = products.map(p => {
    // Extract product name from URL slug (more reliable than raw text)
    const slug = p.url.split('/').pop();
    // Remove trailing UPC code
    const nameSlug = slug.replace(/-\d{12,}$/, '');
    const nameFromSlug = nameSlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      name: nameFromSlug,
      url: `https://yogi-life.com${p.url}`,
      image: p.image || null,
      teaType: getTeaType(p.rawText),
    };
  });

  console.log(`Found ${cleaned.length} products`);
  return cleaned;
}

async function main() {
  const companyId = await ensureCompany();
  if (!companyId) return;

  const products = await scrapeProducts();

  let imported = 0;
  let skipped = 0;

  for (const product of products) {
    // Skip bundles/samplers
    const name = product.name.toLowerCase();
    if (name.includes('gift') || name.includes('sampler') || name.includes('bundle') || name.includes('variety')) {
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
      tea_type: product.teaType,
      image_url: product.image,
      product_url: product.url,
    };

    const { error } = await supabase.from('teas').insert(teaData);

    if (error) {
      console.error(`  Failed: ${product.name} - ${error.message}`);
    } else {
      imported++;
      process.stdout.write(`\r  Imported: ${imported}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
