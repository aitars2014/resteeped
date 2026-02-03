# Resteeped - Setup Guide

## Quick Start (Demo Mode)

The app works immediately without any backend setup:

```bash
cd ~/projects/resteeped
npx expo start
```

Scan the QR code with Expo Go on your iPhone.

---

## Full Setup (With Supabase Backend)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (use aitars2014@gmail.com)
2. Click "New Project"
3. Name it `resteeped`
4. Choose a region close to you (e.g., `us-east-1`)
5. Generate a strong database password (save it!)
6. Wait for project to be ready (~2 minutes)

### 2. Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/20260202_initial_schema.sql`
3. Paste and run it

### 3. Configure Google OAuth

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Enable **Google**
3. You'll need to create a Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or use existing
   - Enable "Google+ API" (or just OAuth)
   - Create OAuth credentials (Web application)
   - Add authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret back to Supabase

### 4. Configure App Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to **Settings → API** in Supabase Dashboard
   - Copy `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - Copy `anon/public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. Edit `.env` with your values

### 5. Seed the Database

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_KEY=your-service-role-key \
node scripts/seed-teas.js
```

### 6. Run the App

```bash
npx expo start
```

---

## Project Structure

```
resteeped/
├── App.js                    # Entry point
├── src/
│   ├── components/           # Reusable UI components
│   ├── screens/              # Full screen components
│   ├── navigation/           # Navigation setup
│   ├── context/              # React Context (auth, collection)
│   ├── lib/                  # Supabase client
│   ├── constants/            # Design tokens
│   └── data/                 # Seed data
├── scripts/                  # Utility scripts
│   ├── scrape-steeping-room.js
│   └── seed-teas.js
└── supabase/
    └── migrations/           # Database schema
```

---

## Features

### MVP (Current)
- [x] Browse tea catalog with real images
- [x] Search and filter by tea type
- [x] View tea details (steep temp, time, origin, flavor notes)
- [x] Brew timer with countdown and alerts
- [x] Save teas to collection (requires auth)
- [x] Rate teas 1-5 stars
- [x] Google OAuth sign in

### Coming Soon
- [ ] Text reviews
- [ ] Brew history logging
- [ ] Multiple steep tracking (oolong/puerh)
- [ ] Push notifications for timer
- [ ] Dark mode
- [ ] User-submitted teas
