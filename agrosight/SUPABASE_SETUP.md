# Supabase marketplace setup (free, no credit card)

Makes Market **multi-device**: farmer on phone A publishes → buyer on phone B sees it.

## 1. Create project
1. Go to https://supabase.com → Sign up (GitHub OK) → **New project**
2. Wait for DB to finish provisioning (~1–2 min)

## 2. Run SQL
1. Dashboard → **SQL Editor** → New query
2. Paste entire file: `agrosight/supabase/listings.sql`
3. Click **Run**

## 3. Optional Realtime
Dashboard → **Database** → **Publications** → `supabase_realtime` → enable table `listings`

## 4. Copy keys into app
Dashboard → **Project Settings** → **API**:
- Project URL → `VITE_SUPABASE_URL`
- `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

Add to `agrosight/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Restart `npm run dev`.

## 5. Verify
Open `/market` — badge should say **Live · Supabase (multi-device)**.  
Publish on one browser / phone, Refresh (or wait for realtime) on another.

## If keys missing
App automatically uses **localStorage** — demo never breaks.
