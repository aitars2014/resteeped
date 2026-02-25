/**
 * Tazo Tea Scraper
 * Uses Gatsby page-data.json API to extract product data (no Puppeteer needed)
 */

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

const BASE_URL = 'https://www.tazo.com';

// Tazo uses Gatsby with Contentful CMS. Product data is available via page-data.json.
const CATEGORY_PAGES = [
  '/page-data/us/en/products/page-data.json',       // All products
  '/page-data/us/en/products/tea-bags/page-data.json',
  '/page-data/us/en/products/k-cup-pods/page-data.json',
];

function getTeaType(text) {
  const str = text.toLowerCase();
  if (str.includes('green') || str.includes('matcha') || str.includes('zen')) return 'green';
  if (str.includes('black') || str.includes('chai') || str.includes('earl grey') || str.includes('english breakfast') || str.includes('awake')) return 'black';
  if (str.includes('white')) return 'white';
  if (str.includes('oolong')) return 'oolong';
  return 'herbal';
}

function isTeaProduct(slug) {
  // Filter to actual tea products (tea bags and k-cups), skip lattes/concentrates
  return slug.includes('tea-bags/') || slug.includes('k-cup');
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
  const allProducts = new Map();

  for (const pagePath of CATEGORY_PAGES) {
    const url = `${BASE_URL}${pagePath}`;
    console.log(`Fetching ${url}...`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`  Skipped (HTTP ${response.status})`);
        continue;
      }

      const pageData = await response.json();
      const products = pageData?.result?.data?.contentfulPageProductsCategory?.productGrid?.products || [];

      for (const p of products) {
        if (!p.slug || !p.thumbnailTitle) continue;

        // Only include tea products (skip lattes, concentrates)
        if (!isTeaProduct(p.slug)) continue;

        const productUrl = `${BASE_URL}/us/en/${p.slug}`;
        if (allProducts.has(productUrl)) continue;

        // Extract image from thumbnail
        let imageUrl = null;
        const imgSources = p.thumbnailImage?.gatsbyImageData?.images?.sources;
        if (imgSources && imgSources.length > 0) {
          // Get the largest image from srcSet
          const srcSet = imgSources[0].srcSet || '';
          const urls = srcSet.split(',').map(s => s.trim().split(' ')[0]);
          imageUrl = urls[urls.length - 1] || null;
        }

        allProducts.set(productUrl, {
          name: p.thumbnailTitle.trim(),
          url: productUrl,
          image: imageUrl,
          sku: p.sku || null,
        });
      }

      console.log(`  Found ${products.length} products (${allProducts.size} unique tea products so far)`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  console.log(`\nTotal unique tea products: ${allProducts.size}`);
  return [...allProducts.values()];
}

async function main() {
  const companyId = await ensureCompany();
  if (!companyId) return;

  const products = await scrapeProducts();

  let imported = 0;
  let skipped = 0;

  for (const product of products) {
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
