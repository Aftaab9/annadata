# Annadata / AgroSight — Status (21 Jul 2026)

**Presentation:** ~22 Jul 2026 · SP Jain MAIB · Dr. Sandip Kumar Roy  
**App:** `agrosight/` · `npm run dev` → http://localhost:5173

---

## What’s REAL now (no Colab needed)

| Area | Status |
|------|--------|
| Dual Inspect UI (Leaf / Produce) | ✅ |
| Leaf PlantVillage TFLite | ✅ on-device |
| Produce path | ⏳ mock heuristic until Colab TFLite |
| Mandi prices (data.gov.in) | ✅ + cache + snapshot |
| Grade premiums A+10%/B/C−20% | ✅ |
| Yield engine | ✅ trained coefficients |
| Market + **Supabase** | ✅ keys in `.env.local` · table responds HTTP 200 |
| localStorage market fallback | ✅ |
| Assistant Ollama→Cerebras→Groq→OpenRouter | ✅ `/api/chat` |
| Hindi Whisper STT fallback | ✅ `/api/transcribe` |
| Insights measured-only KPIs | ✅ |
| Ethics leaf≠produce + HITL | ✅ |
| Mobile tab bar + high-contrast CTAs | ✅ |
| PWA | ✅ |

**Supabase project URL configured.** Restart `npm run dev` after env change; Market badge → **Live · Supabase**.

---

## Waiting on Colab (running in background)

1. `agrosight_produce.tflite` + chart PNGs  
2. `crop_rec.onnx` + meta  
3. `fertilizer.onnx` + meta  
4. `price_forecast_series.json`

Drop into `public/models/` or `public/data/` — app auto-detects.

---

## Optional next (not blocking demo)

- [ ] `npx vercel` deploy + paste env vars  
- [ ] GitHub push (never commit `.env.local`)  
- [ ] Optional `OPENROUTER_API_KEY` in `.env.local`  
- [ ] Enable Realtime on `listings` in Supabase dashboard  

---

## Demo

See **`DEMO_SCRIPT.md`** at repo root.

## Setup docs

- `agrosight/SUPABASE_SETUP.md`  
- `agrosight/README.md`  
- `COLAB_RUN_ME.md` / `colab/*.ipynb`  
