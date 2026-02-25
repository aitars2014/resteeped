# OTA Deploy Checklist

## Before You Start

- [ ] **One issue per OTA.** Never batch unrelated changes into one update.
- [ ] Commit references a Linear issue (e.g., `TARS-XX: description`)

## Pre-Publish Validation

```bash
./scripts/ota-validate.sh
```

This checks for:
- `require()` inside useEffect hooks (crash pattern)
- Dead state variables / unreferenced modals
- ESLint errors
- TypeScript errors
- Successful bundle export

**Do not deploy if validation fails.**

## Deploy

```bash
# Commit your changes
git add -A && git commit -m "TARS-XX: description"

# Publish OTA
CI=1 eas update --branch production --message "TARS-XX: description"
```

## Post-Deploy

1. Tell Taylor to **force-close and reopen** the app to pull the update
2. **Wait for Taylor to confirm** it works
3. Only mark the Linear issue as Done after confirmation

## If OTA Causes Crashes

> ⚠️ **Expo crash protection will blacklist the OTA on-device after repeated crashes.**
> The only fix is a new native build. Do NOT keep pushing OTAs hoping they'll load.

### Recovery: Native Build

1. **Bump version in `app.json`** (the current production version will be rejected)
   - e.g., `1.1.0` → `1.1.1`

2. **Cloud build (preferred — auto-submits to App Store):**
   ```bash
   eas build --platform ios --auto-submit --non-interactive
   ```

3. **Local build (must manually submit after):**
   ```bash
   SENTRY_ALLOW_FAILURE=true eas build --platform ios --local --non-interactive
   # Then submit separately:
   eas submit --platform ios --path <ipa-file> --non-interactive
   ```

   ⚠️ `--auto-submit` only works with cloud builds. Local builds require a separate `eas submit` step.

## Lessons Learned

- **The Great Rollback (Feb 24, 2026):** Batched unrelated fixes caused cascading crashes. Expo blacklisted the OTA on-device. Required version bump + native rebuild to recover.
- **Silent failures are the worst bugs.** Dead code and silently-bailing guards waste hours of debugging.
- **Local tea data uses numeric IDs; Supabase uses UUIDs.** Always use `useResolvedTeaId(tea)` for DB operations.
