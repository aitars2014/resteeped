# TARS-90: App Store Optimization Plan

## Current State
- **App Name:** Resteeped
- **Subtitle:** (not set or unknown)
- **Keywords:** (unknown — needs check in App Store Connect)
- **Category:** Food & Drink
- **Version:** 1.1.1

## Competitor Analysis

| App | Subtitle | Key Differentiator | Ratings |
|-----|----------|-------------------|---------|
| MyTeaPal | "Brew tea, journal, and connect" | All-in-one (timer + journal + community), free | 4.8 (215) |
| Teafinity | "Tea Timer, Scanner & Guides" | AI leaf scanner, 170+ guides | 4.9 (32) |
| Steep | "Green, Black, Herbal Tea Timer" | Apple Watch focus, minimal | 5.0 (2) |
| Tea Brew Timer & Journal | (timer + journal) | Beautiful journal, tea master wisdom | new |

### Resteeped's Competitive Advantages
- **Largest catalog:** 8,000+ teas vs 170 (Teafinity) or manual-only (MyTeaPal)
- **Discovery-first:** FlavorRadar, AI Tea Finder, Tea Randomizer
- **Brand profiles:** 70+ tea shops with company pages
- **Modern UX:** clean, mobile-native design
- **Community:** Activity feed, comparisons, collections

## Recommended ASO Metadata

### App Name (30 chars max)
**Current:** `Resteeped`
**Recommended:** `Resteeped: Discover Tea` (23 chars)

Rationale: "Discover" signals the primary use case and adds a relevant keyword. Keeps the brand name prominent.

### Subtitle (30 chars max)
**Recommended:** `Tea Timer, Journal & Explorer` (29 chars)

Rationale: Hits three high-value keywords that match search intent:
- "Tea Timer" — highest search volume keyword in the category
- "Journal" — captures the tracking/logging audience
- "Explorer" — unique differentiator vs competitors who all use "Timer" or "Guide"

### Keyword Field (100 chars max, comma-separated, no spaces after commas)
```
tea,brewing,steep,brew timer,tasting notes,oolong,matcha,green tea,herbal,collection,flavor,review
```

**Keyword strategy:**
- Core: tea, brewing, steep, brew timer
- Tea types: oolong, matcha, green tea, herbal (popular search terms)
- Features: tasting notes, collection, flavor, review
- Excluded (already in title/subtitle): discover, journal, timer, explorer
- Excluded (too competitive/generic): recipe, health, caffeine, drink

### Description (4000 chars max)

```
Discover your next favorite tea from 8,000+ varieties across 70+ specialty brands.

Resteeped is the tea companion app that serious tea drinkers have been waiting for. Whether you're exploring your first loose-leaf oolong or hunting down a rare pu-erh, Resteeped helps you discover, brew, and track every cup.

EXPLORE 8,000+ TEAS
Browse the largest mobile tea database — from everyday English Breakfast to single-origin Taiwanese oolongs. Filter by type, brand, flavor profile, or let our AI Tea Finder match you with your perfect cup.

FLAVORRADAR™ VISUALIZATION
See any tea's flavor profile at a glance with our unique radar chart. Compare teas side-by-side and discover new favorites based on the flavors you love.

BUILT-IN BREW TIMER
Never over-steep again. Auto-populated temperatures and times for every tea, with support for multiple infusions and cold brew.

TRACK YOUR TEA JOURNEY
Build your personal collection — mark teas as tried, want to try, or owned. Write tasting notes, rate your sessions, and see your tea insights over time.

70+ TEA SHOPS & BRANDS
Discover independent tea vendors with detailed brand profiles. From Harney & Sons to boutique artisan roasters, find your next source.

AI-POWERED RECOMMENDATIONS
Tell the Tea Finder what you're in the mood for and get instant, personalized suggestions from the full catalog.

COMMUNITY ACTIVITY FEED
See what other tea enthusiasts are drinking, reviewing, and collecting. Get inspired by the community.

PLUS:
• Tea Randomizer — can't decide what to brew? Let Resteeped choose
• Tea Comparisons — side-by-side battles between any two teas
• Seasonal Collections — curated picks for every season
• Teaware Catalog — browse gaiwans, kyusu, yixing, and more
• Dark Mode — beautiful in any light
• Export Collection — take your data with you

Free to download. Premium subscription unlocks unlimited access to the full catalog and advanced features.

Whether you're a curious beginner or a gongfu veteran, Resteeped is your guide to better tea.
```

### What's New (for this build)
```
• Push notifications — get tea suggestions, brew reminders, and seasonal picks (all opt-in from Settings)
• Notification preferences — granular control over what notifications you receive
• Performance improvements and bug fixes
```

## Screenshot Strategy

### Slide Order (6 screenshots, 6.7" iPhone 15 Pro Max)

1. **Hero** — Home screen with tea of the day, "Your personal tea companion" headline
2. **Discovery** — Discover tab with search + filter pills, "Explore 8,000+ teas"
3. **FlavorRadar** — Tea detail page showing radar chart, "Understand every flavor"
4. **Brew Timer** — Active timer with tea info, "Perfect steep, every time"
5. **Collection** — My Teas tab with tried/want tabs, "Track your tea journey"
6. **Tea Finder** — AI chat interface, "AI-powered recommendations"

### Screenshot Production Process
1. Boot iPhone 15 Pro Max simulator (or 16 Pro Max if available)
2. Set time to 9:41 (standard for App Store screenshots)
3. Take clean screenshots of each screen with representative data
4. Use phone mockup script (from instagram-app-marketing skill) on gradient backgrounds
5. Add headline text overlay per slide
6. Generate for all required sizes:
   - 6.7" (iPhone 15 Pro Max): 1290 x 2796
   - 6.5" (iPhone 11 Pro Max): 1284 x 2778
   - 5.5" (iPhone 8 Plus): 1242 x 2208 (if supporting)

### Design Notes
- Use Resteeped brand colors (warm cream #FAF9F6 background, accent green)
- Phone mockups on gradient backgrounds (match Instagram style)
- Clean, minimal text — let the app UI speak
- Show real tea data (not placeholder content)

## Version Bump
- Current: 1.1.1
- **New version: 1.2.0** (significant feature addition: push notifications)
- Build number: auto-incremented by EAS

## Checklist Before Build
- [ ] Apply Supabase migration (push_tokens table + notification_preferences column)
- [ ] Deploy send-notifications Edge Function
- [ ] Update app.json version to 1.2.0
- [ ] Generate App Store screenshots (all sizes)
- [ ] Update App Store Connect metadata (subtitle, keywords, description, what's new)
- [ ] Review screenshots on all device sizes
- [ ] Build: `eas build --platform ios --auto-submit --non-interactive`
- [ ] After approval: test push notifications on physical device
