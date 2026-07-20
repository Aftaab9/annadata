# Annadata / AgroSight

AI leaf health + produce grading, mandi prices, farmer advisory, and D2C market.

**SP Jain MAIB · Group 3 · AI in Operations · ₹0 stack (no credit card)**

## Quick start

```bash
cd agrosight
npm install
npm run dev
```

Open **http://localhost:5173** · Hard refresh: `Ctrl+Shift+R`

### Env keys (`.env.local` — never commit)

```env
VITE_DATA_GOV_API_KEY=          # data.gov.in — free
VITE_OLLAMA_MODEL=llama3.2:3b

# Server-only (Vite middleware + Vercel functions)
CEREBRAS_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=

# Marketplace multi-device (optional — see SUPABASE_SETUP.md)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Assistant chain: **Ollama → Cerebras → Groq → offline** via `/api/chat`.

---

## Routes

| URL | What |
|-----|------|
| `/` | Brand landing + bento |
| `/inspect` | **Leaf Health** + **Produce Quality** dual mode |
| `/prices` | Live mandi + fair grade premium + forecast label |
| `/advisory` | Crop / Fertilizer / Yield / Harvest |
| `/market` | Farmer publish + Buyer browse (Supabase or localStorage) |
| `/insights` | Measured KPIs only |
| `/ethics` | HITL + leaf ≠ produce honesty |

Mobile: bottom tab bar (Home · Inspect · Prices · Advice · Market).

---

## Marketplace (Supabase)

1. Follow **`SUPABASE_SETUP.md`** (SQL + keys, ~5 min)
2. Badge on `/market`: **Live · Supabase** = multi-device; otherwise localStorage fallback

SQL file: `supabase/listings.sql`

---

## Colab artifacts (when ready)

| Drop into | File |
|-----------|------|
| `public/models/` | `agrosight_produce.tflite`, `crop_rec.onnx`, `fertilizer.onnx` |
| `public/assets/` | `11_produce_*.png`, `12_produce_*.png` |
| `public/data/` | `price_forecast_series.json`, update `model_metrics.json` |

See repo root `COLAB_RUN_ME.md` / `colab/*.ipynb`.

---

## Build & Vercel

```bash
npm run build
npx vercel   # root = agrosight/
```

**Vercel env vars:** `VITE_DATA_GOV_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Honest status

| Feature | Status |
|---------|--------|
| Leaf TFLite | Real on-device |
| Produce TFLite | Needs Colab drop-in (mock until then) |
| Yield engine | Real coefficients |
| Mandi prices | Real API + cache |
| Crop/Fert | Lookup until ONNX |
| Forecast | Heuristic until Colab JSON |
| Market | Supabase when configured, else localStorage |
| Assistant | Ollama / Cerebras / Groq chain |

Stack: React · Vite · TS · Tailwind · Zustand · TF.js TFLite · Supabase · Recharts · PWA
