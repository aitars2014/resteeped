# Top 25 Tea Shops for Resteeped

## Current Status
- **The Steeping Room** (Austin, TX) - 58 teas ✅
- **Rishi Tea** (Milwaukee, WI) - 105 teas ✅
- **Republic of Tea** - seeded, no teas
- **Adagio Teas** - seeded, no teas

**Total: 163 teas, 4 companies**

---

## Recommended Top 25 Tea Shops

### Tier 1: Large Catalogs (200+ teas) - High Priority
These have extensive, well-organized catalogs that will bulk up our database quickly.

| # | Shop | Location | Specialty | Est. Teas | Website |
|---|------|----------|-----------|-----------|---------|
| 1 | **Harney & Sons** | NY | Variety, Blends | 300+ | harney.com |
| 2 | **Adagio Teas** | NJ | Variety, Custom Blends | 400+ | adagio.com |
| 3 | **Republic of Tea** | CA | Flavored, Wellness | 350+ | republicoftea.com |
| 4 | **David's Tea** | Canada | Flavored, Trendy | 200+ | davidstea.com |
| 5 | **Teavana/Starbucks** | WA | Premium Blends | 150+ | starbucks.com/tea |

### Tier 2: Premium/Specialty (50-200 teas) - Core Experience
High-quality shops that appeal to tea enthusiasts.

| # | Shop | Location | Specialty | Est. Teas | Website |
|---|------|----------|-----------|-----------|---------|
| 6 | **Rishi Tea** | WI | Organic, Direct Trade | 105 | rishi-tea.com ✅ |
| 7 | **Art of Tea** | CA | Organic, Blends | 100+ | artoftea.com |
| 8 | **In Pursuit of Tea** | NY | Single Origin | 80+ | inpursuitoftea.com |
| 9 | **Vahdam Teas** | India | Indian Teas, Direct | 150+ | vahdamteas.com |
| 10 | **The Tea Spot** | CO | Wellness, Steepware | 100+ | theteaspot.com |
| 11 | **Teapigs** | UK | Biodegradable Temples | 50+ | teapigs.com |
| 12 | **Steven Smith Teamaker** | OR | Craft Blends | 50+ | smithtea.com |
| 13 | **Bellocq** | NY | Luxury, Blends | 40+ | bellocq.com |

### Tier 3: Boutique/Artisan (20-50 teas) - Curated Quality
Smaller shops with devoted followings and unique offerings.

| # | Shop | Location | Specialty | Est. Teas | Website |
|---|------|----------|-----------|-----------|---------|
| 14 | **Song Tea & Ceramics** | CA | Chinese, Taiwanese | 40+ | songtea.com |
| 15 | **Tea Drunk** | NY | Chinese, Rare | 50+ | tea-drunk.com |
| 16 | **Samovar Tea** | CA | Meditation, Wellness | 40+ | samovartea.com |
| 17 | **Spirit Tea** | IL | Seasonal, Rotating | 30+ | spirittea.co |
| 18 | **Floating Leaves Tea** | WA | Taiwanese Oolong | 50+ | floatingleaves.com |
| 19 | **Verdant Tea** | MN | Chinese, Direct Trade | 60+ | verdanttea.com |
| 20 | **Harken Tea** | IL | Chinese Classics | 25+ | harkentea.com |

### Tier 4: Specialty/Niche - Adds Depth
Unique shops that add variety and interest.

| # | Shop | Location | Specialty | Est. Teas | Website |
|---|------|----------|-----------|-----------|---------|
| 21 | **Mountain Rose Herbs** | OR | Herbal/Tisanes | 100+ | mountainroseherbs.com |
| 22 | **Herbs & Kettles** | GA | Indian Single Origin | 40+ | herbsandkettles.com |
| 23 | **Great Mississippi Tea** | MS | American Grown | 20+ | greatmsteacompany.com |
| 24 | **Teavivre** | China | Chinese Direct | 100+ | teavivre.com |
| 25 | **Mariage Frères** | France | French Luxury | 100+ | mariagefreres.com |

---

## Data Sourcing Strategy

### Option A: Manual Scraping (Current Approach)
**Pros:** Full control, customizable
**Cons:** Time-intensive, breaks when sites change, legal gray area

**Scrape-friendly sites (structured HTML):**
- Adagio, Harney & Sons, Republic of Tea, Art of Tea
- Vahdam, The Tea Spot, Teapigs

**Difficult to scrape (JS-heavy, anti-bot):**
- David's Tea, Teavana/Starbucks
- Song Tea, Bellocq

### Option B: API/Data Partnerships
Some tea companies have affiliate programs or may provide data feeds:
- **Adagio** - Has affiliate program with product feeds
- **Harney & Sons** - Known to work with apps
- **Vahdam** - Active digital presence, might share data

### Option C: Crowdsourced + User Submissions
Let users add teas they discover. Benefits:
- No scraping legal concerns
- Community engagement
- Natural growth based on what people actually drink

### Option D: Hybrid Approach (Recommended)

**Phase 1: Bulk Data (Week 1)**
1. Complete Adagio scraper (their site is scraper-friendly)
2. Complete Republic of Tea (similar structure)
3. Scrape Harney & Sons

**Phase 2: Premium Shops (Week 2)**
4. Art of Tea
5. The Tea Spot
6. Vahdam Teas
7. Steven Smith Teamaker

**Phase 3: Specialty (Week 3-4)**
8-12. Boutique shops (smaller, more manual curation needed)

**Phase 4: User Contributions**
- Add "Submit a Tea" feature
- Verification queue for quality

---

## Scraper Architecture

```
/scripts/scrapers/
├── base-scraper.js      # Shared utilities
├── adagio.js
├── harney.js
├── republic.js
├── art-of-tea.js
├── vahdam.js
└── run-all.sh
```

Each scraper outputs:
```json
{
  "name": "Earl Grey Supreme",
  "brand": "Harney & Sons",
  "type": "black",
  "description": "...",
  "ingredients": ["black tea", "bergamot oil"],
  "caffeine_level": "medium",
  "steep_time_min": 4,
  "steep_temp_f": 212,
  "price_usd": 12.00,
  "size_oz": 4,
  "image_url": "...",
  "product_url": "...",
  "flavor_notes": ["citrus", "floral", "malty"]
}
```

---

## Priority Recommendation

**Start with these 5 (nets ~1,000+ teas):**
1. ✅ Rishi Tea (done - 105 teas)
2. Adagio Teas (~400 teas)
3. Harney & Sons (~300 teas)
4. Republic of Tea (~350 teas)
5. Vahdam Teas (~150 teas)

This gives us massive variety across:
- Tea types (black, green, oolong, white, pu-erh, herbal)
- Price points ($5-$50)
- Origins (India, China, Japan, Taiwan, Sri Lanka)
- Styles (single origin, blends, flavored, wellness)

**Target: 1,500+ teas from 10+ shops by end of week**
