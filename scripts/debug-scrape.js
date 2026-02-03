/**
 * Debug script to understand The Steeping Room page structure
 */

const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  
  // First, check the collection page
  console.log('=== Checking collection page ===');
  await page.goto('https://www.thesteepingroom.com/collections/black-tea', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });
  
  const collectionData = await page.evaluate(() => {
    // Get all links
    const allLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'))
      .map(a => ({ href: a.href, text: a.textContent?.trim().substring(0, 50) }))
      .slice(0, 5);
    
    // Get product card classes
    const productCards = Array.from(document.querySelectorAll('[class*="product"]'))
      .map(el => el.className)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10);
    
    return { allLinks, productCards };
  });
  
  console.log('Product links found:', collectionData.allLinks);
  console.log('Product card classes:', collectionData.productCards);
  
  // Now check a product detail page
  if (collectionData.allLinks.length > 0) {
    const productUrl = collectionData.allLinks[0].href;
    console.log('\n=== Checking product page ===');
    console.log('URL:', productUrl);
    
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const productData = await page.evaluate(() => {
      // Try various selectors for title
      const titleSelectors = [
        'h1.product__title',
        'h1[class*="title"]',
        'h1',
        '.product__title',
        '.product-title',
        '[class*="ProductTitle"]',
      ];
      
      let title = null;
      let titleSelector = null;
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent?.trim()) {
          title = el.textContent.trim();
          titleSelector = sel;
          break;
        }
      }
      
      // Try various selectors for image
      const imgSelectors = [
        '.product__media img',
        '.product-image img',
        '[class*="product"] img',
        '.product-gallery img',
        'img[src*="cdn.shopify"]',
      ];
      
      let imageUrl = null;
      let imgSelector = null;
      for (const sel of imgSelectors) {
        const el = document.querySelector(sel);
        if (el?.src) {
          imageUrl = el.src;
          imgSelector = sel;
          break;
        }
      }
      
      // Try various selectors for description
      const descSelectors = [
        '.product__description',
        '.product-description',
        '[class*="description"]',
        '.rte',
        '.product-single__description',
      ];
      
      let description = null;
      let descSelector = null;
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent?.trim()) {
          description = el.textContent.trim().substring(0, 200);
          descSelector = sel;
          break;
        }
      }
      
      // Get all h1 elements
      const h1s = Array.from(document.querySelectorAll('h1'))
        .map(h => ({ text: h.textContent?.trim().substring(0, 50), class: h.className }));
      
      return {
        title,
        titleSelector,
        imageUrl,
        imgSelector,
        description,
        descSelector,
        h1s,
        pageTitle: document.title,
      };
    });
    
    console.log('Title found:', productData.title);
    console.log('Title selector:', productData.titleSelector);
    console.log('Image URL:', productData.imageUrl?.substring(0, 80));
    console.log('Image selector:', productData.imgSelector);
    console.log('Description:', productData.description?.substring(0, 100));
    console.log('Description selector:', productData.descSelector);
    console.log('All H1s:', productData.h1s);
    console.log('Page title:', productData.pageTitle);
  }
  
  await browser.close();
}

main().catch(console.error);
