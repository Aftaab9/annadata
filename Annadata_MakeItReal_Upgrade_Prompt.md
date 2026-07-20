# ============================================================
#  ANNADATA / AGROSIGHT — "MAKE IT ALL REAL" UPGRADE PROMPT
#  Use with Claude Opus in Cursor. Existing repo: agrosight/
#  Paste this AFTER Cursor has read STATUS_AND_NEXT_MASTER_PROMPT.md
#  and the AgroSight_Graphics_Addendum.md already in the folder.
# ============================================================

You are upgrading **Annadata** (tech brand AgroSight), an existing React+Vite+TS farmer platform in `agrosight/`. First READ these files already in the repo: `STATUS_AND_NEXT_MASTER_PROMPT.md` (honest current status) and `AgroSight_Graphics_Addendum.md` (mandatory FX components). Then confirm understanding and propose your plan before building. Work phase by phase, pausing for my approval after each.

## THE MISSION

The app currently has an honesty problem I want fully fixed: several farmer-facing features are lookups/mocks pretending to be AI (crop rec, fertilizer rec, price forecast), and — most importantly — **we grade "batch quality" using a leaf-disease model, which is scientifically wrong.** A PlantVillage leaf model cannot judge the quality of a harvested fruit, vegetable, or grain. Dr. Roy will catch this instantly.

**Every farmer-facing output must come from a REAL trained artifact** (TFLite / ONNX / exported tree / real API), not hand-tuned lookups. No fakes. No mocks presented as models. When something is a heuristic, the app must say so honestly. This is both an integrity requirement and the single biggest scoring lever with Dr. Roy.

**HARD RULES (never violate):**
- Zero paid APIs. Zero credit card anywhere. Every service below is verified free with no card.
- Do NOT retrain the existing PlantVillage leaf TFLite or the yield linear model — they are done and correct for their real jobs.
- Keep the HITL confidence gate (<70% → human review) everywhere a model makes a call.
- Never claim a capability a trained model doesn't back. Leaf disease ≠ produce quality — two separate models, two separate honest jobs.
- Build against mock/fallback first so the app always runs; swap in real artifacts as they're trained.

---

## PART A — THE TWO-MODEL CV FIX (the headline change)

Inspect becomes **dual-mode** with a clear toggle at the top:

### Mode 1: "Leaf Health" (pre-harvest / in-field) — EXISTING MODEL, keep as-is
- Uses the existing `agrosight_plantvillage.tflite` (HEALTHY / SURFACE_DEFECT / BLIGHT_MOLD).
- Purpose reframed correctly: this diagnoses PLANT DISEASE on leaves while the crop is growing, and recommends treatment. It is NOT a produce grader.
- Keep the existing `defectAdvice.ts` treatment recommendations (quarantine / irrigation / KVK steps).

### Mode 2: "Produce Quality" (post-harvest / batch grading) — NEW REAL MODEL
- **Train a new CNN** on the free **"Fruit and Vegetable Disease (Healthy vs Rotten)" dataset** (Kaggle: muhammad0subhan/fruit-and-vegetable-disease-healthy-vs-rotten — 28 directories, 14 produce types: apple, banana, orange, tomato, potato, bellpepper, cucumber, grape, guava, jujube, mango, pomegranate, strawberry, carrot; each healthy + rotten). Free, no card.
- This is the model that actually grades a harvested batch: input a photo of the produce → output freshness/quality class → map to Grade A / B / C with a defect/spoilage %.
- Train in Colab exactly like the existing pipeline (transfer learning, MobileNetV2 or EfficientNetB0 backbone, 5-model comparison for the authentic "we tested and selected" story, 2-phase fine-tune, composite-score selection). Export `agrosight_produce.tflite` (fp16) + comparison PNGs + confusion matrix.
- Grade mapping logic (document it honestly): fresh + high confidence → Grade A; fresh + moderate confidence OR minor spoilage signal → Grade B; rotten/spoiled → Grade C / reject. Tie Grade → fair-price premium on the Prices screen (A = modal +10%, B = modal, C = modal −20%, all clearly shown as indicative).
- The Grade Card now comes from THIS model (produce), not the leaf model. This finally makes the quality→price→market chain scientifically honest.

### The reframed product story (use everywhere)
"Grow healthy (Leaf Health diagnoses disease in the field) → Harvest → Grade the batch (Produce Quality grades the picked produce) → Price it fairly (mandi + grade premium) → Sell direct (D2C market)." Two real CV models, each doing its real job across the crop lifecycle. This is a STRONGER story than one fake model — lead with it in the demo and Insights.

---

## PART B — MAKE ADVISORY REAL (replace all lookups with trained artifacts)

### B1. Crop Recommendation — real trained classifier
- Train RandomForest/XGBoost in Colab on the free **Kaggle Crop Recommendation Dataset** (N, P, K, temperature, humidity, pH, rainfall → 22 crop classes, ~2,200 rows).
- Export as **ONNX** (via skl2onnx) and load in-browser with **onnxruntime-web** — OR export the tree structure as JSON and run a real tree-traversal in JS (not a centroid lookup). Either way it must be the ACTUAL trained model's decision logic, not a KNN-on-centroids approximation.
- Replace `cropRecService` entirely. Show real hold-out accuracy from training on the Insights KPI (remove the hard-coded 91%).

### B2. Fertilizer Recommendation — real trained classifier
- Train on the free **Kaggle Fertilizer Prediction dataset** (temperature, humidity, moisture, soil type, crop type, N/P/K → fertilizer class).
- Same export path (ONNX + onnxruntime-web, or real JSON tree traversal). Replace the threshold-lookup `fertilizerService` with the real model.
- Plain-language output with reason ("Nitrogen low for this crop stage → apply urea").

### B3. Price Forecast — real model
- Train a compact **LSTM** (or Prophet, or even a properly-fit SARIMA/gradient-boosted regressor if LSTM export is heavy) on historical Agmarknet series for the top demo commodities. Source history from data.gov.in or a public mandi CSV.
- Export weights to TF.js OR precompute a real forecast series per commodity and ship it as data the app reads — but it must be a REAL model's output, labeled with the model used and its backtest error (MAPE), not a synthetic seasonal curve.
- Replace `forecastService` mock. The "sell now or wait" signal must derive from the real forecast + a stated confidence.

Every replaced service: keep the same interface so the app never breaks; swap the internals from mock → real artifact.

---

## PART C — ASSISTANT: MULTI-PROVIDER FREE FALLBACK CHAIN (reliability fix)

You've had Groq and Gemini fail. The fix is not picking one provider — it's a **fallback chain across several free, no-card providers**, tried in order until one responds. This is how real apps get reliability from free tiers.

**Why Ollama can't run on deployed Vercel (so you understand the architecture):** Ollama serves at localhost on YOUR machine; it needs GBs of RAM held resident and a GPU. Vercel serverless functions are short-lived (~10s), have no GPU, and can't hold a model in memory. A deployed visitor's "localhost" is THEIR device, which has no Ollama. So Ollama = local demo only; the deployed link needs a cloud LLM.

Implement `getAssistantResponse()` as an ordered chain, each behind an env key, each with a 6–8s timeout, falling through on any error/timeout:
1. **Ollama** (`http://localhost:11434`, `llama3.2:3b`) — used automatically when running locally (fast, free, offline).
2. **Cerebras** (`https://api.cerebras.ai/v1`, OpenAI-compatible, model e.g. `llama-3.3-70b` or `qwen-3-32b`) — 1M free tokens/day, no credit card, ~2,600 tok/s, excellent Hindi via Qwen. Sign up cloud.cerebras.ai, instant key. PRIMARY cloud provider.
3. **Groq** (`https://api.groq.com/openai/v1`, `llama-3.3-70b-versatile`) — free, no card. First backup.
4. **OpenRouter** (`https://openrouter.ai/api/v1`, a `:free` model like `meta-llama/llama-3.3-70b-instruct:free`) — free, no card. Second backup.
5. **Offline canned response** — graceful "assistant is in offline mode" with a helpful static answer from local context.

All are OpenAI-compatible, so one client with a swappable baseURL/key/model handles the whole chain — clean to implement. Store keys in env (`VITE_CEREBRAS_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_OPENROUTER_API_KEY`); on Vercel these go in project env vars, never committed. Route cloud calls through a Vercel serverless function so keys aren't exposed client-side. Log which provider answered (dev only) so we can see the chain working.

System prompt (all providers): full Annadata context — the two CV models and their DISTINCT jobs, the 3 leaf classes + produce grades, the 6+ crops, live mandi modal price passed in, grade card, defect/treatment advice, yield/crop-rec/fertilizer context, ethics/HITL framing, SDG mission. Plus: **"Always answer in the same language the farmer used (Hindi or English). Keep answers short, concrete, and financially useful to a small farmer."**

---

## PART D — VOICE: BILINGUAL, WITH WHISPER FALLBACK FOR HINDI

- Keep Web Speech API as default STT/TTS (free, browser-native, works offline-ish).
- Add **Groq Whisper** (`whisper-large-v3`, free tier 2,000 audio req/day, no card) as a FALLBACK for speech-to-text when the browser API is unavailable or when the user selects Hindi (browser Hindi STT is weak; Whisper is dramatically better at Hindi). Record audio in-browser → send to Groq Whisper endpoint → get transcript. Behind the same `speech.ts` interface.
- TTS: keep speechSynthesis but continue the dash-sanitization fix, pick a proper `hi-IN` neural voice when available, speak the full reply once (not mid-stream token by token), and strip markdown/emojis before speaking.
- Language toggle EN/हिं drives STT language, TTS voice, AND the assistant's response language consistently.

---

## PART E — MARKETPLACE: SUPABASE WITH LOCALSTORAGE FALLBACK

- Wire the existing `marketService` interface to **Supabase** free tier (no card): a `listings` table (crop, grade, grade_card_json, quantity, price, location, farmer_id, created_at) + basic RLS. Farmer publishes → persists → buyer on ANOTHER device sees it. This makes the D2C story real (multi-user), which is far more impressive than single-device localStorage.
- Keep the localStorage implementation behind the same interface as an automatic fallback if Supabase env isn't set or setup runs long — so the demo never breaks. A clear flag shows which mode is active.
- Collective pool panel aggregates real listings by crop+grade+region.

---

## PART F — INSIGHTS: SHOW MEASURED, REAL METRICS ONLY

- Replace every hard-coded KPI (e.g. "crop-rec accuracy 91%") with the ACTUAL hold-out metric measured during that model's Colab training. If a number isn't measured, don't show it.
- Add the new produce-quality model's comparison chart + confusion matrix (from its Colab run) alongside the existing leaf/yield PNGs.
- Add a small honest "How each number was measured" note per metric (dataset, split, metric) — this reads as rigor to Dr. Roy.
- Keep Related Work citations visible (AgroAI, Kisan DSS, AgriSens, IIT-Delhi Commodity_Analysis, Nature 2025 LSTM, ACM 2023 collectives).
- Keep live session analytics accumulating during the demo.

---

## PART G — DEPLOY (free, no card)

- Push to GitHub (never commit `.env.local` / keys; provide `.env.example`).
- Deploy to Vercel free tier, root = `agrosight/`.
- Vercel serverless function(s) for the LLM fallback chain + (optionally) the Groq Whisper proxy, so keys stay server-side.
- Env vars in Vercel: `VITE_DATA_GOV_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, Supabase URL/anon key.
- README: full setup — install, all free keys and where to get them (each is no-card), Ollama local instructions, model drop-in, Colab notebook links, build, deploy. State explicitly that the whole stack costs ₹0 with no credit card anywhere.

---

## COLAB NOTEBOOKS TO PRODUCE (all free datasets, T4 GPU)

1. **Produce Quality CNN** — Fresh vs Rotten dataset → 5-model comparison → `agrosight_produce.tflite` + charts. (Reuse the proven pipeline structure from the existing leaf notebook; protobuf fix + HF/GCS-safe loading as learned.)
2. **Crop Recommendation** — RandomForest/XGBoost → ONNX (skl2onnx) + accuracy report.
3. **Fertilizer Recommendation** — RandomForest/XGBoost → ONNX + accuracy report.
4. **Price Forecast** — LSTM/Prophet/GBR on Agmarknet history → exported forecast + backtest MAPE.
Each notebook: clean cells, dark-theme plots, saves artifacts ready to drop into `public/models/` or `public/data/`.

---

## BUILD ORDER (pause after each for my approval)

- **U0** — Read status + addendum files. Confirm understanding. Propose scaffold changes (new services, dual-mode Inspect, provider chain, Supabase). No code yet.
- **U1** — Dual-mode Inspect UI + wire existing leaf model into Mode 1; Mode 2 on MOCK until the produce model is trained. Reframe all copy (leaf ≠ produce).
- **U2** — Colab: train Produce Quality model; drop `agrosight_produce.tflite` in; wire Mode 2 for real; Grade Card now from produce model.
- **U3** — Colab: train Crop Rec + Fertilizer; export ONNX; replace those services with onnxruntime-web (real inference).
- **U4** — Colab: train Price forecast; replace forecastService with real output + backtest MAPE.
- **U5** — Assistant multi-provider fallback chain (Ollama→Cerebras→Groq→OpenRouter→offline) via serverless; context pack; language rule.
- **U6** — Voice: Whisper fallback for Hindi STT; TTS polish; language toggle wiring.
- **U7** — Marketplace: Supabase real backend + localStorage fallback.
- **U8** — Insights: real measured metrics only; new produce charts; honesty notes.
- **U9** — GitHub + Vercel deploy; env; README; final polish; verify every feature is real or honestly labeled.

## QUALITY BAR
Every farmer-facing output traces to a real trained artifact or real API. Nothing fake unlabeled. HITL <70% everywhere. Bilingual EN/हिं works end-to-end (STT+LLM+TTS all in the chosen language). Assistant never dies (4-provider chain + offline). Marketplace is genuinely multi-user. Deployed on Vercel, ₹0, no credit card anywhere. Premium UI per the Addendum. It must run flawlessly in a live 40-min demo AND be a real deployable product, not a localhost toy.

## START
Confirm you've read the two existing files and this prompt (4–5 sentences), then give me your U0 plan and the exact list of free API keys I need to create (with the no-card signup URL for each). Then wait for my go-ahead.
