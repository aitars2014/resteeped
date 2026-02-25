# Resteeped — Amplitude Dashboard Spec

> **TARS-56** | Created 2026-02-25
> Ready to implement in Amplitude UI at https://app.amplitude.com

---

## Event Inventory

### All Tracked Events

| Event Name | Source | Key Properties |
|---|---|---|
| `sign_up` | AuthContext | `method` (apple/google) |
| `sign_in` | AuthContext | `method` (apple/google/dev_mode) |
| `sign_out` | AuthContext | — |
| `onboarding_started` | OnboardingScreen | — |
| `onboarding_completed` | OnboardingScreen | step count, selections |
| `onboarding_skipped` | OnboardingScreen | step count, selections |
| `onboarding_preferences_saved` | PreferenceCaptureScreen | preference details |
| `onboarding_preferences_skipped` | PreferenceCaptureScreen | step info |
| `tea_viewed` | TeaDetailScreen | tea name, type, company |
| `tea_searched` | DiscoveryScreen | query text |
| `tea_filtered` | DiscoveryScreen | `tea_type`, filter details |
| `tea_added_to_collection` | CollectionContext | tea info |
| `tea_removed_from_collection` | CollectionContext | `tea_id` |
| `brew_started` | TimerScreen | tea type, steep params |
| `brew_completed` | TimerScreen | tea type, duration |
| `brew_cancelled` | (defined, check if used) | — |
| `review_submitted` | TeaDetailScreen | tea info, rating |
| `review_edited` | (defined, check if used) | — |
| `tea_shared` | (defined, check if used) | — |
| `profile_viewed` | (defined, check if used) | — |
| `company_viewed` | CompanyProfileScreen | company name |
| `teaware_viewed` | (defined, check if used) | — |
| `teaware_added` | (defined, check if used) | — |
| `tea_finder_search` | (defined, check if used) | — |
| `tea_finder_result_tap` | (defined, check if used) | — |
| `tea_sommelier_message` | TeaFinderScreen | `message_length` |
| `tea_sommelier_recommendations` | TeaFinderScreen | recommendation count |
| `feed_viewed` | ActivityFeedScreen | — |
| `feed_refreshed` | (defined, check if used) | — |
| `brew_history_viewed` | BrewHistoryScreen | — |
| `paywall_viewed` | PaywallScreen | `source` |
| `subscription_started` | PaywallScreen | `plan` |
| `steep_preference_saved` | TimerScreen | steep params |
| `tasting_notes_saved` | (defined, check if used) | — |
| `collection_viewed` | (defined, check if used) | — |

### Auto-tracked by Amplitude SDK
- **Session Start / Session End** (defaultTracking.sessions: true)
- **App Lifecycle** events (defaultTracking.appLifecycles: true)
- App Install, App Open, App Updated, App Backgrounded

---

## Dashboard 1: Product Overview

**Purpose:** High-level health metrics at a glance

### Charts to Create

1. **Daily Active Users (DAU)**
   - Type: Line chart
   - Event: Any Active Event
   - Time: Last 30 days, daily

2. **Weekly Active Users (WAU)**
   - Type: Line chart
   - Event: Any Active Event
   - Time: Last 12 weeks, weekly

3. **New Users vs Returning**
   - Type: Stacked area
   - Segment 1: `sign_up` (new)
   - Segment 2: `sign_in` (returning)
   - Time: Last 30 days, daily

4. **Top Events (Feature Usage)**
   - Type: Bar chart / Event Segmentation
   - Events: All custom events
   - Group by: Event name
   - Time: Last 30 days

5. **Sessions per User**
   - Type: Line chart
   - Metric: Avg sessions per user
   - Time: Last 30 days, daily

6. **Session Duration Distribution**
   - Type: Distribution / histogram
   - Metric: Session length
   - Time: Last 30 days

---

## Dashboard 2: Core Feature Engagement

**Purpose:** Which features drive usage

### Charts to Create

1. **Tea Discovery Funnel**
   - Type: Funnel
   - Steps: `tea_searched` OR `tea_filtered` → `tea_viewed` → `tea_added_to_collection`
   - Time: Last 30 days

2. **Brewing Funnel**
   - Type: Funnel
   - Steps: `tea_viewed` → `brew_started` → `brew_completed`
   - Time: Last 30 days

3. **Collection Activity**
   - Type: Line chart
   - Events: `tea_added_to_collection`, `tea_removed_from_collection`
   - Time: Last 30 days, daily

4. **Tea Sommelier Usage**
   - Type: Line chart
   - Events: `tea_sommelier_message`, `tea_sommelier_recommendations`
   - Time: Last 30 days, daily

5. **Review Submissions**
   - Type: Line chart
   - Event: `review_submitted`
   - Time: Last 30 days, daily

6. **Screen Popularity**
   - Type: Bar chart
   - Events: `tea_viewed`, `feed_viewed`, `brew_history_viewed`, `company_viewed`, `collection_viewed`
   - Metric: Total count
   - Time: Last 30 days

7. **Most Viewed Tea Types**
   - Type: Bar chart
   - Event: `tea_filtered`
   - Group by: `tea_type` property
   - Time: Last 30 days

---

## Dashboard 3: Onboarding & Conversion

**Purpose:** How well we convert new users

### Charts to Create

1. **Onboarding Funnel**
   - Type: Funnel
   - Steps: `sign_up` → `onboarding_started` → `onboarding_preferences_saved` → `onboarding_completed`
   - Time: Last 90 days

2. **Onboarding Skip Rate**
   - Type: Segmentation
   - Events: `onboarding_completed` vs `onboarding_skipped`
   - Show as: Ratio / percentage
   - Time: Last 90 days

3. **Sign-up Method Breakdown**
   - Type: Pie/bar chart
   - Event: `sign_up`
   - Group by: `method` property
   - Time: Last 90 days

4. **Paywall Conversion Funnel**
   - Type: Funnel
   - Steps: `paywall_viewed` → `subscription_started`
   - Time: Last 90 days

5. **Paywall Source Analysis**
   - Type: Bar chart
   - Event: `paywall_viewed`
   - Group by: `source` property
   - Time: Last 90 days

6. **New User Activation** (performed key action within first 7 days)
   - Type: Funnel
   - Steps: `sign_up` → `tea_added_to_collection` OR `brew_started`
   - Conversion window: 7 days
   - Time: Last 90 days

---

## Dashboard 4: Retention

**Purpose:** Are users coming back?

### Charts to Create

1. **N-day Retention**
   - Type: Retention chart
   - Start: `sign_up`
   - Return: Any Active Event
   - Time: Last 90 days
   - Show: Day 1, Day 7, Day 14, Day 30

2. **Feature Retention — Brewing**
   - Type: Retention chart
   - Start: `brew_completed`
   - Return: `brew_completed`
   - Time: Last 90 days

3. **Feature Retention — Collection**
   - Type: Retention chart
   - Start: `tea_added_to_collection`
   - Return: `tea_added_to_collection`
   - Time: Last 90 days

4. **Engagement Buckets**
   - Type: Segmentation
   - Show users by # of days active in last 30 days
   - Buckets: 1 day, 2-3 days, 4-7 days, 8-14 days, 15+ days

---

## Implementation Notes

- **API Key:** `6fd906d7c65b96543a683b332461044b` (in `.env.local`)
- **Project:** Check Amplitude Settings → Projects to find project name/ID
- **Secret Key needed** for REST API access — find in Amplitude Settings → Projects → API Keys
- All dashboards can be created in Amplitude's web UI under Analytics → Dashboards → New Dashboard
- Consider setting up a **Saved Segment** for "Activated Users" (users who've completed at least one brew) for reuse across charts

## Events Defined But Possibly Not Tracked

These are in `AnalyticsEvents` but I didn't find corresponding `trackEvent()` calls — verify and add tracking if needed:

- `brew_cancelled`
- `review_edited`
- `tea_shared`
- `profile_viewed`
- `teaware_viewed` / `teaware_added`
- `tea_finder_search` / `tea_finder_result_tap`
- `feed_refreshed`
- `tasting_notes_saved`
- `collection_viewed`
