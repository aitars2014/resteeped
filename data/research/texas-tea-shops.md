# Texas Tea Shops Research

*Research Date: February 5, 2026*

## Summary

Researched dedicated tea shops in major Texas cities focusing on those with online stores (preferably Shopify) that can be scraped. Found strong candidates in Houston, Dallas, Austin, and San Antonio. Fort Worth has limited dedicated tea shop options with online stores.

---

## Houston

### 1. True Leaf Tea Co. ⭐ RECOMMENDED
- **Website:** https://trueleaftea.com
- **Platform:** Shopify ✅
- **Products:** ~76 products
- **Specialty:** Organic loose leaf tea, strong matcha focus
- **Notes:** 
  - Woman-owned, founded 2010 by Certified Tea Blending Master Kim McHugh
  - Features: black, green, white, oolong, herbal, matcha
  - Also supplies McHugh Tea Room (same owner)
  - Good product variety with recipes and health content

### 2. TEAinTEXAS ⭐ RECOMMENDED  
- **Website:** https://teaintexas.com
- **Platform:** Shopify ✅
- **Products:** ~35 products
- **Specialty:** Texas-themed artisan blends
- **Notes:**
  - Family-owned, based in Cypress (Houston area) since 2010
  - Award-winning blends with Texas themes (Big Tex English Breakfast, Austin Weirdness, Cowboy Hibiscus)
  - Partners with local Texas farms
  - Small-batch, hand-blended

### 3. The Path of Tea (Honorable Mention)
- **Website:** https://thepathoftea.com
- **Platform:** WooCommerce (NOT Shopify)
- **Specialty:** Chinese tea focus, tea education
- **Notes:**
  - Physical tea shop with online store
  - Weekly tea tastings
  - Cannot be scraped via /products.json

---

## Dallas

### 1. The Cultured Cup ⭐ HIGHLY RECOMMENDED
- **Website:** https://www.theculturedcup.com
- **Platform:** Shopify ✅
- **Products:** ~658 products (huge catalog)
- **Specialty:** Premium global teas, Mariage Frères (largest US selection)
- **Notes:**
  - 30 years in business (celebrating anniversary)
  - Located in Farmers Branch
  - Also carries coffee, sweets, accessories
  - Offers tea ceremonies and education
  - Physical store with tastings on Saturdays

### 2. Rakkasan Tea Company ⭐ RECOMMENDED
- **Website:** https://www.rakkasantea.com
- **Platform:** Shopify ✅
- **Products:** ~156 products
- **Specialty:** Teas from post-conflict countries (unique social mission)
- **Notes:**
  - Sources from war zones and post-conflict countries
  - Promotes peace through trade
  - Unique positioning - Colombian tea, Myanmar, Nepal origins
  - Good variety with ethical sourcing story

### 3. T7 Tea
- **Website:** https://t7tea.com
- **Platform:** NOT Shopify (OpenCart or similar)
- **Specialty:** Custom blend, wide variety
- **Notes:** Cannot scrape via /products.json

---

## San Antonio

### 1. Happyness Tea & Spice Company ⭐ RECOMMENDED
- **Website:** https://happynesstea.co
- **Platform:** Shopify ✅
- **Products:** ~30 products
- **Specialty:** Custom blends, tea & spice combinations
- **Notes:**
  - Local tea shop in San Antonio
  - Offers tea tastings and custom blend consultations
  - Also sells spices alongside tea
  - Smaller catalog but unique offerings

### 2. The Steeped Leaf Tea Lounge
- **Website:** https://thesteepedleaf.shop
- **Platform:** NOT Shopify
- **Specialty:** Organic loose leaf, 40+ selections
- **Notes:**
  - Certified tea specialist owner
  - Tea room experience (tea flights, gong fu cha)
  - Cannot scrape via /products.json

---

## Austin

### 1. Zhi Tea ⭐ HIGHLY RECOMMENDED
- **Website:** https://zhitea.com
- **Platform:** Shopify ✅
- **Products:** ~268 products
- **Specialty:** Premium loose leaf, sustainable focus
- **Notes:**
  - Award-winning Austin tea house
  - Sustainable agriculture focus
  - Good variety of tea types
  - Artisan approach with sample sizes available

### 2. Tea Embassy ⭐ RECOMMENDED
- **Website:** https://teaembassy.com
- **Platform:** Shopify ✅
- **Products:** ~213 products
- **Specialty:** Global premium teas, wholesale
- **Notes:**
  - In business since 2004
  - Previously had storefront, now online-only
  - Over 100 loose leaf varieties
  - Wholesale program for Austin area
  - Personal touch (handwritten notes, free samples)

---

## Fort Worth

### Limited Options Found

**Leaves Book and Tea Shop**
- **Website:** https://leaves-bakery-and-books.company.site
- **Platform:** Square (not Shopify)
- **Notes:** Primarily a bookstore that sells tea (~50 varieties in-house), no online tea sales

**Tea Hurrah Tea**
- **Website:** teahurrahtea.com (currently unavailable)
- **Notes:** 50+ varieties mentioned, but website appears to be down

**The Spice & Tea Exchange** (Stockyards location)
- National franchise chain, not a local independent shop

---

## Priority Targets for Scraping

Based on Shopify availability and product count:

| Rank | Shop | City | Products | Notes |
|------|------|------|----------|-------|
| 1 | The Cultured Cup | Dallas | 658 | Largest catalog, premium selection |
| 2 | Zhi Tea | Austin | 268 | Strong variety, sustainable focus |
| 3 | Tea Embassy | Austin | 213 | Established, wholesale focus |
| 4 | Rakkasan Tea | Dallas | 156 | Unique social mission, unique origins |
| 5 | True Leaf Tea | Houston | 76 | Organic focus, matcha specialty |
| 6 | TEAinTEXAS | Houston | 35 | Texas-themed, artisan |
| 7 | Happyness Tea | San Antonio | 30 | Custom blends, smaller but unique |

---

## Shopify API Endpoints

```
https://trueleaftea.com/products.json
https://teaintexas.com/products.json
https://www.theculturedcup.com/products.json
https://www.rakkasantea.com/products.json
https://zhitea.com/products.json
https://teaembassy.com/products.json
https://happynesstea.co/products.json
```

*Note: Use `?limit=250` and paginate with `&page=N` for stores with 250+ products*
