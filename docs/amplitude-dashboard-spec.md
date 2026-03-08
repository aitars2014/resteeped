# Amplitude Dashboard Spec — Resteeped

*Generated Mar 8, 2026. TARS-97.*

---

## Event Taxonomy (currently tracked)

### Onboarding
| Event | Properties | Notes |
|-------|-----------|-------|
| `onboarding_started` | — | Fires when onboarding screen loads |
| `onboarding_completed` | `preferences_selected`, `skipped` | User finishes onboarding |
| `onboarding_skipped` | `step` | User skips onboarding |
| `onboarding_preferences_saved` | `tea_types`, `caffeine_preference` | Preference capture screen |
| `onboarding_preferences_skipped` | `step` | Skipped preference capture |

### Authentication
| Event | Properties | Notes |
|-------|-----------|-------|
| `sign_up` | `method` (apple/google) | New user registration |
| `sign_in` | `method` (apple/google/dev_mode) | Returning user login |
| `sign_out` | — | User signs out |

### Tea Discovery
| Event | Properties | Notes |
|-------|-----------|-------|
| `tea_viewed` | `tea_id`, `tea_name`, `company`, `tea_type` | Tea detail page opened |
| `tea_searched` | `query`, `results_count` | Search executed |
| `tea_filtered` | `tea_type`, `filter_type` | Filter applied on discovery screen |
| `company_viewed` | `company_id`, `company_name` | Company profile viewed |

### Collection
| Event | Properties | Notes |
|-------|-----------|-------|
| `tea_added_to_collection` | `tea_id`, `source` | Tea added to user collection |
| `tea_removed_from_collection` | `tea_id` | Tea removed from collection |
| `collection_viewed` | — | Collection screen opened |

### Brewing
| Event | Properties | Notes |
|-------|-----------|-------|
| `brew_started` | `tea_id`, `tea_name`, `duration` | Timer started |
| `brew_completed` | `tea_id`, `tea_name`, `duration`, `infusion_number` | Timer completed |
| `brew_cancelled` | — | Timer cancelled |
| `steep_preference_saved` | `tea_id`, `temperature`, `duration` | Custom steep prefs saved |
| `brew_history_viewed` | — | Brew history screen opened |

### Reviews & Tasting
| Event | Properties | Notes |
|-------|-----------|-------|
| `review_submitted` | `tea_id`, `rating` | Review posted |
| `review_edited` | `tea_id` | Review updated |
| `tasting_notes_saved` | — | Tasting notes captured |

### Tea Finder (AI)
| Event | Properties | Notes |
|-------|-----------|-------|
| `tea_finder_search` | — | AI tea finder opened |
| `tea_finder_result_tap` | — | AI recommendation tapped |
| `tea_sommelier_message` | `message_length` | Message sent to AI sommelier |
| `tea_sommelier_recommendations` | `count` | AI returned recommendations |

### Social & Community
| Event | Properties | Notes |
|-------|-----------|-------|
| `tea_shared` | — | Tea shared externally |
| `profile_viewed` | — | User profile viewed |
| `feed_viewed` | — | Community feed opened |
| `feed_refreshed` | — | Feed pull-to-refresh |

### Teaware
| Event | Properties | Notes |
|-------|-----------|-------|
| `teaware_viewed` | — | Teaware item viewed |
| `teaware_added` | — | Teaware added to collection |

### Monetization
| Event | Properties | Notes |
|-------|-----------|-------|
| `paywall_viewed` | `source` | Paywall screen shown |
| `subscription_started` | `plan` | Subscription purchased |

---

## Dashboard 1: Acquisition Funnel

**Purpose:** Where do new users drop off?

**Funnel steps:**
1. `sign_up` → 2. `onboarding_started` → 3. `onboarding_completed` OR `onboarding_skipped` → 4. `tea_added_to_collection` → 5. `brew_started`

**Breakdown by:** `sign_up.method` (Apple vs Google)

**Key questions:**
- What % of signups complete onboarding?
- What % add their first tea?
- What % brew their first cup?
- Does sign-up method affect completion?

---

## Dashboard 2: Retention Cohorts

**Purpose:** Are users coming back?

**Charts:**
1. **N-day retention curve** — Day 0, 1, 3, 7, 14, 30
2. **Weekly retention cohorts** — grouped by signup week
3. **Retention by signup method** — Apple vs Google

**Return event:** Any active event (session_start or any tracked event)

**Key questions:**
- What's D1/D7/D30 retention?
- Is retention improving week-over-week?
- Which signup cohorts retain best?

---

## Dashboard 3: Feature Adoption

**Purpose:** Which features do users actually use?

**Charts (% of weekly active users):**
1. `tea_viewed` — Browse/discovery
2. `tea_searched` — Search
3. `tea_added_to_collection` — Collection building
4. `brew_started` — Brewing timer
5. `review_submitted` — Reviews
6. `tea_sommelier_message` — AI tea finder
7. `feed_viewed` — Community feed
8. `teaware_viewed` — Teaware

**Key questions:**
- Which features are most/least used?
- What's the "aha moment" feature that correlates with retention?
- Are users discovering the AI tea finder?

---

## Dashboard 4: Engagement Depth

**Purpose:** How deeply are users engaging?

**Charts:**
1. **Sessions per user per week** (distribution)
2. **Teas added per user per week**
3. **Brews per user per week**
4. **Reviews per user per week**
5. **Power users** — users with 5+ sessions/week

**Key questions:**
- What does a "healthy" user look like?
- How many teas does the average user collect?
- Are there power users? What do they do differently?

---

## Dashboard 5: Monetization Funnel

**Purpose:** How effective is our paywall?

**Funnel steps:**
1. Any active event → 2. `paywall_viewed` → 3. `subscription_started`

**Breakdown by:** `paywall_viewed.source`

**Charts:**
1. Paywall view rate (% of active users who see paywall)
2. Conversion rate (paywall → subscription)
3. Paywall views by source (what triggers it?)

---

## Event Gaps (recommended additions)

These events would improve our analytics but aren't currently tracked:

| Event | Where | Why |
|-------|-------|-----|
| `app_opened` | App.js | Track DAU/WAU/MAU accurately |
| `collection_sorted` | CollectionScreen | Understand collection usage patterns |
| `tea_detail_scroll_depth` | TeaDetailScreen | Do users read full descriptions? |
| `share_method_selected` | Share flow | Which share channels are used? |
| `search_no_results` | DiscoveryScreen | What are users searching for that we don't have? |
| `onboarding_step_viewed` | OnboardingScreen | Which onboarding step has highest drop-off? |

---

## Setup Instructions (for Taylor)

Since I can't access the Amplitude dashboard directly, here's how to create these:

1. **Log in** to [app.amplitude.com](https://app.amplitude.com)
2. **Create a new Dashboard** called "Resteeped Product Analytics"
3. For each dashboard above:
   - Click **+ New Chart**
   - **Funnels** → use the funnel steps listed
   - **Retention** → use the retention config above
   - **Event Segmentation** → for feature adoption & engagement charts
4. **Save each chart** to the dashboard

Or — get the browser relay working and I'll build them all myself.
