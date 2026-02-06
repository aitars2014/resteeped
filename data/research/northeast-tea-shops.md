# Northeast US Tea Shop Research

**Research Date:** February 5, 2026  
**Focus:** Dedicated tea shops with online stores (preferably Shopify) for scraping

---

## Summary

| City | Shop | Shopify? | Est. Products | Specialty |
|------|------|----------|---------------|-----------|
| NYC | Tea Drunk | ✅ Yes | 100+ | Chinese tea (gongfu, rare teas) |
| NYC | Sullivan Street Tea & Spice | ✅ Yes | 300+ | Organic teas, spices, teaware |
| Boston | MEM Tea | ✅ Yes | 150+ | Multi-origin, loose leaf, blends |
| Philadelphia | Premium Steap | ✅ Yes | 100+ | Loose leaf, Indian teas, blends |
| Pittsburgh | Blue Monkey Tea | ❌ BigCommerce | 200+ | Multi-origin, British imports |
| Baltimore | Cuples Tea House | ✅ Yes | 75+ | Premium loose leaf, Black-owned |
| DC | Teaism | ❌ Custom | 50+ | Asian-inspired, tea house focus |

---

## ✅ SHOPIFY STORES (Scrapeable)

### 1. Tea Drunk - New York City
- **Website:** https://www.teadrunk.com
- **Products JSON:** https://www.teadrunk.com/products.json ✅
- **Specialty:** Premium Chinese tea, gongfu style, rare/terroir-focused teas
- **Tea Count:** ~100+ products (mostly high-end Chinese teas)
- **Categories:** Green, White, Yellow, Wu Long (Oolong), Red (Black), Pu-Erh
- **Price Range:** Premium ($23-$118+ for small quantities)
- **Notable:** Founded by Shunan Teng, focuses on "top terroir" Chinese teas, educational approach
- **Highlights:** 
  - Six categories of Chinese tea
  - Vintage/terroir-specific offerings
  - Tea education events and classes
  - East Village location with tasting room

### 2. Sullivan Street Tea & Spice Company - New York City
- **Website:** https://www.onsullivan.com
- **Products JSON:** https://www.onsullivan.com/products.json ✅
- **Specialty:** Organic teas, spices, teaware, gourmet items
- **Tea Count:** 300+ total products (teas + spices + accessories)
- **Tea Categories:** Organic teas, loose leaf, specialty blends
- **Price Range:** Mid-range ($8-$35)
- **Location:** Greenwich Village, NYC
- **Notable:** Tea AND spice company, artisan chocolates, kitchenware

### 3. MEM Tea - Boston
- **Website:** https://memteaimports.com
- **Products JSON:** https://memteaimports.com/products.json ✅
- **Specialty:** Carefully sourced loose leaf teas, signature blends
- **Tea Count:** ~150+ products
- **Categories:** 
  - Black tea (Earl Grey, Chai, single origin)
  - Green tea (Jasmine, Sencha, etc.)
  - Herbal/Tisanes (caffeine-free)
  - White tea
  - Oolong
  - Pu-erh
  - Pyramid tea bags
- **Price Range:** Mid-range ($4-$36)
- **Notable:** 
  - 25th Anniversary (established business)
  - Serves many high-end Boston restaurants
  - Sample sizes available
  - Strong signature blends (Founder's Foundation Collection)

### 4. Premium Steap - Philadelphia
- **Website:** https://premiumsteap.com
- **Products JSON:** https://premiumsteap.com/products.json ✅
- **Specialty:** Premium loose leaf tea, specialty Indian teas
- **Tea Count:** ~100+ products
- **Categories:**
  - Indian teas (Assam, Darjeeling, Nilgiri)
  - Flavored blends
  - Jasmine teas
  - Fruit tisanes
  - Rooibos
  - Black/Green basics
- **Price Range:** Affordable ($7.75-$21.50 for 2oz)
- **Sizes:** 2oz, 4oz, 8oz bags
- **Notable:**
  - Strong Indian tea selection (1st flush Darjeelings)
  - Physical store + online
  - Good variety of accessories

### 5. Cuples Tea House - Baltimore
- **Website:** https://cuplesteahouse.com
- **Products JSON:** https://cuplesteahouse.com/products.json ✅
- **Specialty:** Premium loose leaf tea, tea education
- **Tea Count:** ~75+ products
- **Categories:**
  - Black tea (Darjeeling, Keemun, Ceylon)
  - White tea
  - Oolong
  - Green tea
  - Herbal/Wellness blends
  - Chai varieties
  - Seasonal specials
- **Price Range:** Mid-range ($10-$24 for 4oz)
- **Notable:**
  - Black/Woman-owned business
  - Focus on tea culture education
  - Virtual tea tastings offered
  - Signature blends (Autumn Leaves, White Chai)
  - Baltimore local

---

## ❌ NON-SHOPIFY STORES (Not easily scrapeable)

### Blue Monkey Tea - Pittsburgh
- **Website:** https://bluemonkeytea.com
- **Platform:** BigCommerce
- **Specialty:** Wide variety of loose leaf teas, British imports
- **Tea Count:** 200+ teas
- **Categories:** Black, Green, Oolong, White, Pu-erh, Chai, Herbal, British brands (Barry's, PG Tips, Taylors)
- **Notable:** Long-established Pittsburgh tea shop, extensive selection
- **Scraping:** Would need different approach (no /products.json)

### Teaism - Washington DC
- **Website:** https://www.teaism.com
- **Platform:** Custom/Unknown
- **Specialty:** Asian-inspired tea house and restaurant
- **Locations:** Penn Quarter, Dupont Circle, Lafayette Park
- **Focus:** Restaurant/tea house experience + online tea sales
- **Notable:** One of DC's most famous tea houses, food menu emphasis
- **Scraping:** No standard API

### Ching Ching Cha - Washington DC
- **Website:** https://www.chingchingcha.com
- **Platform:** Squarespace
- **Specialty:** Traditional Chinese tea house
- **Location:** Dupont Circle (formerly Georgetown for 25 years)
- **Focus:** In-person tea service, private events
- **Notable:** Established 1998, authentic Chinese tea experience
- **Scraping:** Limited online store, mainly tea room experience

### Pearl Fine Teas - Washington DC
- **Website:** https://www.pearlfineteas.com
- **Platform:** Squarespace
- **Specialty:** Single estate, rare, organic teas
- **Categories:** White, Green, Yellow, Oolong, Black, Aged/Pu-erh, Chai, Earl Grey, Rooibos, Wellness
- **Sales:** Primarily farmers markets + local cafes
- **Notable:** "DC's finest tea purveyor," farmers market presence
- **Scraping:** No products.json, website-based only

### Gryphon's Tea - Pittsburgh
- **Website:** https://www.gryphonstea.com
- **Platform:** Unknown (site issues)
- **Specialty:** Premium loose leaf, organic herbs, spices
- **Notable:** Woman-owned, Pittsburgh Public Market presence
- **Status:** Website had 404 issues during research

---

## Recommendations for Scraping

### Tier 1 - Priority (Shopify, active, good variety)
1. **MEM Tea** (Boston) - Well-structured products, good variety, established
2. **Tea Drunk** (NYC) - Premium Chinese tea focus, clean data
3. **Premium Steap** (Philadelphia) - Good product count, Indian specialty

### Tier 2 - Good options
4. **Sullivan Street** (NYC) - Large catalog but includes non-tea items
5. **Cuples Tea House** (Baltimore) - Smaller but quality selection

### Tier 3 - Non-Shopify alternatives
6. **Blue Monkey Tea** (Pittsburgh) - BigCommerce, would need custom scraping

---

## API Endpoints

```
# Shopify stores - append ?limit=250 for more products
https://memteaimports.com/products.json
https://www.teadrunk.com/products.json
https://premiumsteap.com/products.json
https://www.onsullivan.com/products.json
https://cuplesteahouse.com/products.json
```

---

## Notes

- Most dedicated tea shops in the Northeast are small operations
- NYC has the most options, DC surprisingly lacks Shopify-based tea shops
- Pittsburgh tea scene is smaller, Blue Monkey dominates
- Many "tea shops" are actually coffee shops or general cafes
- Shopify stores provide easy access via `/products.json` endpoint
- Product counts are estimates based on API responses (truncated at 50KB)
