# Southeast US Tea Shop Research

*Research Date: February 5, 2026*

## Summary

Researched 7 Southeast US cities for dedicated tea shops with online stores. Found **8 shops with Shopify stores** that can be scraped via `/products.json` API.

---

## 🏆 HIGH PRIORITY - Shopify Stores (Scrapable)

### 1. Just Add Honey Tea Company
- **City:** Atlanta, GA
- **Website:** https://justaddhoney.net
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~50-75 products (mix of teas, accessories, classes, gifts)
- **Specialty:** Original tea blends, Black tea, Green tea, Herbal, Southern-inspired flavors
- **Notes:** Located on the Atlanta BeltLine. Active café + retail. Good variety of loose-leaf teas sold in tins. Woman-owned. Strong local presence.

### 2. Thistle & Sprig Tea Co.
- **City:** Atlanta, GA  
- **Website:** https://thistleandsprig.com
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~40-60 products (teas, teaware, gift sets)
- **Specialty:** Artisan blends, Black tea, Green tea, Herbal, Matcha accessories
- **Notes:** ⚠️ **Online shop temporarily closed** as of Feb 2026. Ethically-sourced, sustainably packaged. Good selection of matcha and Japanese teaware.

### 3. Uptown Tea Shop
- **City:** Charlotte, NC (Waxhaw area)
- **Website:** https://uptownteashop.com
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~100-150+ products (extensive tea selection + events)
- **Specialty:** British-style teas, Premium loose leaf, High Tea events, Cream Tea experiences
- **Notes:** Hosts "London's Calling" British Cream Tea events. Good variety including traditional English Breakfast, Darjeeling, flavored blacks. Located in Waxhaw, NC.

### 4. New Orleans Tea Company
- **City:** New Orleans, LA
- **Website:** https://neworleansteacompany.com
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~30-50 products (curated New Orleans-inspired teas)
- **Specialty:** NOLA-inspired blends, Flavored blacks, Chai
- **Notes:** Woman-owned, located in French Quarter. Unique blends like "Big Chief Chai" and "Commander's Palace Blood Orange Sazerac" (collab with the famous restaurant). Strong local/regional identity.

### 5. Tandem Tea Company
- **City:** New Orleans, LA
- **Website:** https://tandemtea.com
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~50-70 products
- **Specialty:** Single-origin teas, Chinese teas (Pu'Erh, Oolong), Indian (Assam, Darjeeling), Chai blends
- **Notes:** Focuses on sourcing high-quality loose leaf from around the world. Good selection of traditional Chinese and Indian teas. More connoisseur-focused.

### 6. Nashville Tea Co
- **City:** Nashville, TN
- **Website:** https://nashvilletea.com
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~30-50 products
- **Specialty:** Wellness teas, Herbal blends, Green tea, Faith-inspired branding
- **Notes:** "Old World sophistication wrapped in Southern charm." Has unique wellness-focused blends. Christian/faith-based messaging in product descriptions.

### 7. Milk-n-Honey Tea Company
- **City:** Orlando, FL
- **Website:** https://milknhoneytea.com
- **Shopify:** ✅ Yes - `/products.json` accessible
- **Products:** ~50-80 products (teas + accessories + gift sets)
- **Specialty:** Hand-blended gourmet teas, Black tea, Green tea, Herbal, Gift samplers
- **Notes:** Orlando-based, hand-blends and curates gourmet loose leaf teas. Good selection of samplers and gift sets. Active retail presence.

---

## ⚠️ NO SHOPIFY / LIMITED ONLINE

### TeBella Tea Company
- **City:** Tampa, FL
- **Website:** https://tebellatea.com
- **Shopify:** ❌ No (uses different platform, `/products.json` returns 404)
- **Products:** Extensive (100+ teas listed in navigation)
- **Specialty:** Wide variety - Black, Green, White, Oolong, Matè, Herbals, Rooibos
- **Notes:** Good physical presence with multiple locations in Tampa Bay area. Has extensive online store but not standard Shopify. Would require different scraping approach (HTML parsing or check for WooCommerce/other APIs).

### Orlando Tea Company
- **City:** Orlando, FL (Winter Park)
- **Website:** https://orlandoteacompany.com
- **Shopify:** ❌ No (uses WooCommerce or similar)
- **Products:** ~50-80 teas (based on navigation categories)
- **Specialty:** Traditional teas, Chai, Earl Grey, Oolong, Caffeine-free options
- **Notes:** Physical retail in Winter Park. Has online ordering but not Shopify-based.

### The Pauline Tea-Bar Apothecary
- **City:** Charlotte, NC
- **Website:** https://www.thepaulineteabar.com
- **Shopify:** ❌ No
- **Specialty:** Herbal tea lounge, Apothecary-style
- **Notes:** More of a tea lounge/café experience. Limited or no online tea retail.

### specialTEA Lounge
- **City:** Miami, FL
- **Website:** https://www.specialtealounge.com
- **Shopify:** ❌ No (no online store)
- **Products:** 60+ premium loose leaf teas (in-store only)
- **Specialty:** Premium loose leaf, Tisanes
- **Notes:** Physical café near FIU since 2009. Order online for pickup but no e-commerce shipping.

---

## Cities Without Strong Dedicated Tea Shops

### Tampa, FL
- TeBella is the standout but not Shopify-based
- Other options are primarily The Spice & Tea Exchange (franchise)

### Miami, FL
- Mostly bubble tea shops or generic cafés
- specialTEA Lounge is good but no e-commerce
- No strong local dedicated tea shops with Shopify stores found

---

## Recommended Scraping Priority

1. **Just Add Honey** (Atlanta) - Active, good variety, strong brand
2. **Uptown Tea Shop** (Charlotte) - Large selection, British specialty
3. **New Orleans Tea Company** - Unique NOLA identity, quality products
4. **Tandem Tea** (New Orleans) - Single-origin focus, quality teas
5. **Milk-n-Honey** (Orlando) - Good handcrafted blends
6. **Nashville Tea Co** - Unique wellness angle
7. **Thistle & Sprig** (Atlanta) - Currently closed but quality when open

---

## API Endpoints for Scraping

```
https://justaddhoney.net/products.json
https://thistleandsprig.com/products.json
https://uptownteashop.com/products.json
https://neworleansteacompany.com/products.json
https://tandemtea.com/products.json
https://nashvilletea.com/products.json
https://milknhoneytea.com/products.json
```

All support `?limit=250` parameter for pagination.
