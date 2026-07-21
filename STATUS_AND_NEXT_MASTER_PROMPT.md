# Status — Annadata / AgroSight (2026-07-21)

## Done
- Dual Inspect: Leaf TFLite + Produce TFLite (real model)
- Grade Card + Market (Supabase live)
- Crop / Fertilizer: **browser ONNX RandomForest** (no longer lookup-only)
- Price forecast: Colab GBR JSON series
- Insights KPIs from Colab hold-outs
- GitHub + Vercel deploy (https://annadata-lake.vercel.app)
- Produce cross-check samples in `agrosight/public/samples/produce/`

## Honest leftovers (OK for demo)
- Yield: existing linear / lookup engine (do not retrain per brief)
- Mandi prices: live data.gov when key set; else snapshot
- LLM: Ollama → Cerebras → Groq chain (needs keys / optional local Ollama)
- Produce TFLite ~90MB local only (not pushed to GitHub — too large); Vercel prod may still use mock produce until model is hosted separately

## How to verify produce
1. Open `agrosight/public/samples/produce/`
2. Inspect → Produce Quality → upload `dataset_fresh_*` / `dataset_rotten_*`
