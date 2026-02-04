# Resteeped QA Tracker

*Last updated: 2026-02-04*

## Status Summary

| Status | Count |
|--------|-------|
| ✅ Done | 21 |
| 🔄 In Progress | 0 |
| ⏳ To Do | 2 |
| 🚧 Blocked | 0 |

---

## Completed ✅

### Critical Blockers
- [x] Compare button on Tea Battles does nothing → Added `CompareTeas` to HomeStack
- [x] Community profiles "navigation property doesn't exist" error → Fixed prop passing
- [x] Custom tea not showing in collection after adding → Now inserts into `user_teas`
- [x] Brew activity not recording data → Fixed AsyncStorage persistence
- [x] Brew history not populating → Same fix as above

### UX Polish
- [x] Tea type selection dark mode visibility → Added 3px border + bg tint when selected
- [x] No way to clear search box → Added X button
- [x] Search persists when clicking collections (Featured Teas, etc.) → Now clears
- [x] No way to unselect single filter → Tap active filter to toggle off
- [x] Need better discover sort (brand mixing) → Added `interleaveTeasByBrand()`
- [x] Shop profile banners + logo scaling → Gradient banner + contain resize
- [x] Shops review button not working → Wired to WriteCompanyReviewModal
- [x] Scroll-to-top on Discover page → Floating button after 400px scroll
- [x] Tea shop counter showing 4 → Updated DEMO_COMPANIES with all 17
- [x] Search box text alignment → Added `height: 100%`, `textAlignVertical: 'center'`
- [x] "What should I brew" → Now prompts when collection empty: add teas OR get random suggestion
- [x] Tea reviews display → App reviews first, then "View X reviews on [Brand]" link
- [x] Timer completion sound → Tibetan singing bowl via expo-av

### Features
- [x] Rename "Brew Timer" to "Tea Timer" → Done
- [x] Push notification headline → "It's tea time!"
- [x] Auto-mark tea as "tried" after brewing → Updates `user_teas` status
- [x] Prompt for review after brewing (if not rated) → Added review modal

---

## To Do ⏳

### Medium Priority
- [ ] **Emoji library update** — Consider replacing emojis with custom icons for premium aesthetic, or use a consistent emoji set (Twemoji/Noto)

### Low Priority / Deferred
- [ ] **Apple Watch sync** — Requires WatchKit integration (significant native work, ~2-3 days)

---

## QA Checklist (Production Readiness)

### Core Flows
- [ ] Sign up → confirm email → profile setup
- [ ] Browse teas → filter → view detail → add to collection
- [ ] Add custom tea → photo upload → appears in collection
- [ ] Timer → completion → mark tried → review prompt
- [ ] Search → filter → clear → return to browse
- [ ] Shop profiles → reviews → external links

### Edge Cases
- [ ] Empty states (no teas, no reviews, new user)
- [ ] Network errors / offline behavior
- [ ] Image loading failures
- [ ] Deep linking
- [ ] Push notification permissions denied

### Visual/UX
- [ ] All screens in dark mode
- [ ] All screens in light mode
- [ ] Typography hierarchy consistent
- [ ] Touch targets 44pt minimum
- [ ] Loading states (skeletons)
- [ ] Error states with retry

### Performance
- [ ] Cold start time
- [ ] List scroll smoothness (60fps)
- [ ] Image memory management
- [ ] API response caching

### Platform Specific
- [ ] iOS notch/Dynamic Island handling
- [ ] Android back button behavior
- [ ] Keyboard avoiding views
- [ ] Status bar styling

---

## TARS QA Findings (2026-02-04)

### Bugs Found & Fixed
- [x] `CompanyProfileScreen`: "See All" teas navigation broken → Was navigating to non-existent 'Discovery' screen

### Accessibility Issues (High Priority for Production)
- [ ] **Very few accessibility labels** — Only 2 accessibility attributes in entire codebase
- [ ] Add `accessibilityLabel` to all interactive elements
- [ ] Add `accessibilityRole` to buttons, links, images
- [ ] Add `accessibilityHint` for complex interactions

### Code Quality Notes
- ✅ Good error handling in contexts
- ✅ Proper loading states on most screens
- ✅ Skeleton loaders implemented
- ✅ Image fallbacks/error handling in place
- ✅ SafeAreaView usage throughout
- ✅ No hardcoded HTTP/localhost URLs
- ✅ No TODO/FIXME comments left

### Recommended Before Production
1. **Accessibility audit** — Critical for App Store compliance
2. **Error boundaries** — Catch rendering errors gracefully
3. **Analytics integration** — Track user flows
4. **Crash reporting** — Sentry or similar
5. **Performance profiling** — Check for unnecessary re-renders

---

## How to Report Issues

1. Add issue to appropriate section above
2. Include: what you expected vs what happened
3. Note device/OS if platform-specific
4. Screenshots appreciated

---

## Commits (Recent)
- `3506dbb` - Update DEMO_COMPANIES to all 17 tea shops
- `2e4e967` - Allow filter deselect by tapping
- `57a85b4` - Floating scroll-to-top button
- `5340b7f` - Interleave teas by brand
- `10c54de` - Gradient banner + logo scaling
- `ef6a705` - Shop review button
