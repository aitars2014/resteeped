# TARS-20: Tea Catalog Audit — 2026-02-24

## Summary
- **70 Shopify brands** checked via shopify-tea-scraper.js BRANDS
- **5 brand-specific scrapers** checked: Harney, Tazo, Vahdam, Yogi, Two Leaves
- **Total brands audited: 75**

## New Teas Added

### From Shopify Audit (4 teas)
- **Numi Organic Tea:** +2 (Rooibos Chai Latte Powder, Matcha Maca Latte Powder)
- **DAVIDsTEA:** +2 (Organic Cinnamon Rooibos Chai Loose Leaf Tea Bag 250 g, Organic Ashwagandha Pumpkin Tea Superfood Latte Powder)

### From Harney & Sons Scraper (2 actual teas, net after cleanup)
- 2019 Raw (Sheng) Pu-Erh
- Thai Silk Tea
- (Also added ~26 HRP tin/sachet variants of existing teas, then cleaned up ~26 non-tea items)

### From Vahdam Scraper (2 teas)
- Lychee Rose Iced Tea | 26 Pitcher Tea Bags
- Vanilla Matcha Green Tea Powder, 3.53 oz

### Total: ~8 genuinely new teas added

## Scraper Issues
| Brand | Issue |
|-------|-------|
| Song Tea & Ceramics | Slug mismatch (script uses 'song-tea-ceramics', DB has 'song-tea') — no actual gaps found |
| Thistle & Sprig Tea Co. | HTTP 401 — site blocking scraper |
| STEAP Tea Bar | Fetch failed — site may be down |
| Tazo | Puppeteer scraper finds 0 products — website restructured |
| Yogi | Sitemap no longer has tea product URLs — site restructured |
| Two Leaves and a Bud | SSL cert error — site moved off Shopify to Webflow |

## Description Rewrites
- All 8 new teas had descriptions manually rewritten (Anthropic API credits exhausted)
- 3,074 existing teas still need description rewriting (blocked by API credits)

## Images
- All new teas have images ✅

## Categories
- Categories looked correct across all brands
- One non-tea item accidentally imported from Point Loma Tea ("Toy - Doll Freya Fairy") — deleted

## Database Stats (post-audit)
- Total teas: ~9,699 → ~9,705
- Total companies: ~87
