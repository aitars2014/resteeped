# OTA Deploy Checklist

## Rules

1. **One issue per OTA.** Never batch unrelated changes into a single update.
2. **Validate before publishing.** Always run `./scripts/ota-validate.sh` first.
3. **Wait for confirmation.** Don't mark an issue Done until the user confirms the fix works on their device.

## Deploy Process

### 1. Validate
```bash
./scripts/ota-validate.sh
```
If it fails, fix the issues before proceeding.

### 2. Commit
```bash
git add -A
git commit -m "TARS-XX: Clear description of the change"
```
Always reference the Linear issue ID in the commit message.

### 3. Publish OTA
```bash
CI=1 eas update --branch production --message "TARS-XX: description"
```

### 4. Notify
Tell the user to **force-close and reopen** the app to pull the update.

### 5. Confirm
Wait for the user to confirm the fix works. Only then mark the Linear issue as Done.

---

## If the OTA Causes Crashes

**Stop pushing OTAs immediately.**

Expo's crash protection will blacklist the OTA on-device after repeated crashes. Once blacklisted, no further OTA updates will load on that device. The only recovery is a **new native build**.

### Recovery: Native Build

1. **Bump the version** in `app.json` (e.g., 1.1.0 → 1.1.1). The current version will be rejected by the App Store.

2. **Cloud build (preferred):**
   ```bash
   eas build --platform ios --auto-submit --non-interactive
   ```

3. **Local build (if needed):**
   ```bash
   SENTRY_ALLOW_FAILURE=true eas build --platform ios --local --non-interactive
   # IMPORTANT: Local builds require a separate submit step!
   eas submit --platform ios --path <path-to-ipa> --non-interactive
   ```
   ⚠️ `--auto-submit` only works with cloud builds. Do NOT forget the separate submit for local builds.

4. Wait for App Store review and approval before telling the user to update.

---

## Common Mistakes

| Mistake | Why It's Bad |
|---------|-------------|
| Batching multiple fixes in one OTA | If one fix crashes, you can't tell which one. Rollback is all-or-nothing. |
| Pushing more OTAs after a crash | Expo blacklists the OTA channel on-device. Only a native build recovers. |
| Forgetting to bump version for native builds | App Store rejects duplicate versions. |
| `--auto-submit` with local builds | It silently does nothing. Your build never reaches the App Store. |
| Not waiting for user confirmation | The fix might not work. Moving to the next issue compounds problems. |
