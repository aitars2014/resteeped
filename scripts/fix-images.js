/**
 * Quick script to test and fix image scraping
 */

const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  
  // Test a product page
  const url = 'https://www.thesteepingroom.com/products/naka-sundried-black-tea-from-yunnan';
  console.log('Testing:', url);
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  const data = await page.evaluate(() => {
    // Find all images and their details
    const allImgs = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src?.substring(0, 100),
      alt: img.alt,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      className: img.className,
    }));
    
    // Look specifically for product images
    const productImg = document.querySelector('.product_gallery img, .product-gallery img, .product__media-item img, [data-product-image] img, .product-single__photo img');
    
    // Look for srcset
    const imgWithSrcset = document.querySelector('img[srcset*="products"]');
    
    // Look in noscript
    const noscriptImgs = [];
    document.querySelectorAll('noscript').forEach(ns => {
      const match = ns.textContent?.match(/src="([^"]+products[^"]+)"/);
      if (match) {
        noscriptImgs.push(match[1]);
      }
    });
    
    // Look for data-src
    const dataSrcImg = document.querySelector('img[data-src*="products"]');
    
    return {
      totalImgs: allImgs.length,
      sampleImgs: allImgs.slice(0, 10),
      productImg: productImg?.src,
      imgWithSrcset: imgWithSrcset?.src || imgWithSrcset?.srcset?.substring(0, 100),
      noscriptImgs,
      dataSrcImg: dataSrcImg?.getAttribute('data-src'),
    };
  });
  
  console.log('Total images:', data.totalImgs);
  console.log('\nSample images:');
  data.sampleImgs.forEach(img => {
    console.log(`  ${img.width}x${img.height} | ${img.src}`);
  });
  console.log('\nProduct img selector:', data.productImg);
  console.log('Srcset img:', data.imgWithSrcset);
  console.log('Noscript imgs:', data.noscriptImgs);
  console.log('Data-src img:', data.dataSrcImg);
  
  await browser.close();
}

main().catch(console.error);
