# ============================================================
#  ANNADATA (AgroSight) — FINAL CONSOLIDATED MASTER PROMPT
#  Use with Claude Opus in Cursor.
#  Paste this file FIRST. Then also paste / attach the
#  "AgroSight_Graphics_Addendum.md" file in the same folder —
#  reference it explicitly as instructed in Section 6 below.
# ============================================================

You are my senior full-stack engineer and creative technologist. We are building **Annadata** (tech brand: AgroSight) — an end-to-end, SDG-oriented farmer empowerment platform. Final flagship project for SP Jain School of Global Management (MAIB, Group 3), presented to Dr. Sandip Kumar Roy for AI in Operations on 22 July 2026. 40-minute slot, live prototype demo required, graded /30 on Research Depth, Innovation, Application of Techniques, and Presentation.

Read this ENTIRE prompt before writing any code. There is also a file called `AgroSight_Graphics_Addendum.md` in this project folder — READ IT FULLY too, it contains 10 fully-coded FX components (SplitText, RevealOnScroll, ScrollTrigger sequences, AnimatedSVGPath, ShaderBackground, NoisyBlob, gyroscope tilt, YieldGauge, ParticleBurst, MagneticButton) that are MANDATORY parts of this build, not optional extras. Treat that file as Section 6 of this prompt, expanded.

Confirm your understanding of both documents, propose the Phase 0 scaffold, and wait for my approval before building. Then proceed phase by phase, pausing between each.

**EVERYTHING MUST BE FREE — zero cost, zero credit card required anywhere.** This is a hard constraint, not a preference. Every data source, model, and tool below has been verified free with no billing account required. If you ever reach for something that needs a card on file (this includes Google Cloud Translation/Speech APIs — verified NOT usable here, see Section 9), stop and use the specified free alternative instead.

---

## 0. THE EVOLUTION — WHY THIS GOES FAR BEYOND THE BRIEF

The faculty brief (Group 3) asked for: CV defect classifier, yield prediction model, production scenario simulator, dashboard, and an ethics discussion for a rural food-processing SME. We already built the ML core (CV + yield models, trained in Colab on free data).

We are going far beyond into a full **farmer empowerment platform**, reframing the entire problem:

**The farmer has the least information and least power in the value chain.** Middlemen exploit three gaps: quality is subjective, price is hidden, and market access is gated. Our platform closes all three — turning our CV/yield models from standalone tools into the foundation of an end-to-end product that gives farmers proof of quality, transparent pricing, direct market access, collective bargaining power, and a personal AI advisor they can talk to in their own language.

Maps to UN SDGs 1 (No Poverty), 2 (Zero Hunger), 8 (Decent Work), 10 (Reduced Inequalities), 12 (Responsible Production) — organically, not bolted on.

### Research grounding (cite in the app's Insights screen and the written report)
- Over 80% of smallholder farmers in developing countries lack access to reliable market forecasts, causing distress sales and income instability (IJRASET 2024, crop price forecasting literature).
- LSTM/GRU deep learning models best capture agricultural price temporal patterns, evaluated across 23 commodities on 2010–2024 daily wholesale data (Nature Scientific Reports 2025, doi: s41598-025-05103-z).
- Multivariate LSTM price + arrival forecasting with anomaly detection enables "sell now or hold" decisions and flags market malpractice (IIT-Delhi, ICTD-IITD/Commodity_Analysis repo; published ACM SIGCAS 2019, ICTD '19).
- AI-based market intelligence systems for farmer collectives are a documented high-impact intervention (ACM Journal on Computing and Sustainable Societies, 2023, "AI-based Market Intelligence Systems for Farmer Collectives: A Case Study from India").
- Global food security and SDG 2 (Zero Hunger) are directly tied to agricultural commodity price dynamics and ML forecasting (IJETT 2023, HySALS hybrid SARIMA-LSTM study).

### Related work — prior art we studied and extend (cite honestly, do not present as ours)
- **sachin235/AgroAI** (GitHub) — camera-based crop quality prediction to bypass middlemen and secure fair value; validates our Pillar 1→Pillar 4 pipeline concept.
- **Kisan DSS** (GitHub) — multilingual AI platform: real-time prices, crop/market recommendations, weather-soil insights, voice chatbot, direct-selling marketplace. Validates our full feature spread is achievable.
- **AgriSens** (ravikant-diwakar/AgriSens, GitHub, cited in IJARCCE 2025 survey) — crop recommendation, plant disease ID (CNN), fertilizer recommendation, farming guide. We extend this feature set — see Section 2 (Pillar 3b: Crop & Fertilizer Advisory) below, which we are ADDING to our platform inspired by AgriSens's scope, built fresh in our own stack.
- **deadskull7/Agricultural-Price-Prediction-and-Visualization-on-Android-App** — validates consuming data.gov.in Agmarknet data market-wise/commodity-wise for farmer-facing visualization.
- We explicitly evaluated **farmOS** (Drupal/PHP farm record-keeping software) and **AgriSens** as potential foundations to build directly on top of, and made the deliberate engineering decision NOT to fork either: farmOS is architecturally incompatible (PHP/Drupal monolith vs. our React/TF.js/Vercel stack, wrong problem domain — farm record-keeping, not quality/price/market intelligence); AgriSens is a Flask/static-HTML student prototype whose stack doesn't compose with our in-browser TF.js inference, FX system, or Vercel deployment. We instead build fresh in a modern stack, informed by their proven feature sets. This evaluation itself is evidence of Research Depth — cite it in the report as "prior art survey and build-vs-adopt decision."

**Our differentiation:** nobody has integrated verified CV quality grading + live government price data + price forecasting + crop/fertilizer advisory + D2C marketplace + collective bargaining + bilingual voice AI into ONE farmer-first platform with production-grade design and an in-browser, zero-cost, zero-backend-dependency architecture. The integration and the execution quality are the innovation.

---

## 1. THE SEVEN PILLARS (expanded from six — AgriSens-inspired addition)

1. **Quality Proof** — CV defect grading (already trained) → shareable, QR-verified digital Grade Card.
2. **Price Transparency** — live Agmarknet mandi prices + trends + "sell now or wait" forecast + nearby-mandi comparison.
3a. **Yield & Harvest Advisory** — yield predictor (already trained) + weather-aware harvest timing.
3b. **Crop & Fertilizer Advisory** (NEW — AgriSens-inspired, built fresh in our stack) — given soil/climate inputs (N-P-K levels, pH, rainfall, temperature — the classic Kaggle Crop Recommendation dataset schema, free and open) recommend the best crop to plant next season, AND a fertilizer recommendation engine (given current crop + soil NPK deficiency, suggest which nutrient to add). This is a natural, low-effort extension since it's the same tabular-ML pattern as the yield model (Random Forest / XGBoost classifier), just a different target — and it rounds out the platform from "post-harvest" (quality, price, sale) to also covering "pre-harvest" (what to plant, how to feed the soil). This is what makes it truly end-to-end: advice before planting, through growing, to harvest, to sale.
4. **D2C Marketplace** — farmer lists produce with Grade Card + auto-suggested fair price; buyers browse by grade/location and buy direct.
5. **Collective Bargaining** — aggregate listings by grade + crop + region to reach bulk-buyer volumes.
6. **Bilingual Voice AI Assistant** — Ollama-powered chatbot, converses in Hindi or English (LLM responds natively in the requested language — no separate translation API needed), speech in/out via free Web Speech API, contextual to whatever screen/result the farmer is looking at.

---

## 2. FREE DATA SOURCES & APIS (all verified, zero cost, zero card required)

- **Mandi prices — Agmarknet via data.gov.in**
  `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_FREE_KEY&format=json&filters[state]=Maharashtra&filters[commodity]=Tomato&limit=100`
  Free key: generate at data.gov.in → My Account (2 min, no card). Sample key `579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b` works for first tests (max 10 records).
  Fields: state, district, market, commodity, variety, grade, arrival_date, min_price, max_price, modal_price. 3,000+ mandis, 200+ commodities.
  MUST build caching layer (localStorage, 6h TTL) + bundled JSON snapshot fallback — demo must never hang on a slow/rate-limited government API.
- **Weather — Open-Meteo** (`https://api.open-meteo.com/v1/forecast`) — free, no key, no card. Harvest timing advisory.
- **Crop recommendation dataset** — Kaggle "Crop Recommendation Dataset" (N, P, K, temperature, humidity, pH, rainfall → recommended crop, 22 classes, ~2,200 rows, free download) OR equivalent on Hugging Face if available — used to train a small Random Forest classifier in Colab, exported to the same lookup-table or ONNX/tfjs pattern as the yield model.
- **Fertilizer recommendation dataset** — Kaggle "Fertilizer Prediction / Recommendation" dataset (soil NPK + crop type → recommended fertilizer), same free pattern.
- **CV model** — our trained `agrosight_plantvillage.tflite`, loaded in-browser via `@tensorflow/tfjs-tflite`. Mock mode until dropped in.
- **Price forecast** — LSTM trained on historical Agmarknet data (Colab notebook to follow) OR a lightweight in-browser seasonal-naive/regression fallback so the feature works from day one.
- **Yield model** — our `yield_lookup.json`, nearest-neighbor match. Already built.
- **LLM assistant — Ollama**, local (`http://localhost:11434/api/chat`), model `llama3.2` or `qwen2.5`. Fully free, fully local, no card. System prompt instructs it to answer in the language the farmer used (Hindi or English) — this IS the translation layer, no separate API needed.
- **Voice — Web Speech API** (`SpeechRecognition` + `speechSynthesis`), free, browser-native, `hi-IN` + `en-US`/`en-IN`. HTTPS (Vercel) or localhost required.
- **Text translation fallback (optional, rarely needed)** — LibreTranslate (open-source, free public API, no card) ONLY if we need to translate static UI strings beyond our own maintained EN/HI string files. Do NOT use Google Cloud Translation/Speech-to-Text/Text-to-Speech APIs — verified they require a billing account with card on file even within the "free tier," which violates our zero-cost/zero-card constraint.

---

## 3. TECH STACK (all free, all decided)

- React 18 + Vite + TypeScript, React Router
- Tailwind CSS + CSS variable design system
- Zustand (state, persisted to localStorage)
- TensorFlow.js + tfjs-tflite (CV inference, in-browser)
- Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- Framer Motion + GSAP + @gsap/react + split-type (see Graphics Addendum)
- Lenis (desktop smooth scroll)
- Recharts + pre-rendered Colab PNGs
- simplex-noise
- Lucide React icons
- vite-plugin-pwa
- **Backend/DB:** Supabase free tier for marketplace listings (farmer + buyer views must persist and be visible to both). Architect behind a `marketService` interface so it can run on localStorage in "demo mode" if Supabase setup is skipped for time. Propose your recommendation in Phase 0.
- Deploy: Vercel free tier. Ollama stays local with graceful fallback (Section 8).
- Fonts: Space Grotesk + JetBrains Mono, Google Fonts (free, no card — just static font files, not an API).

---

## 4. ROUTES

```
/                → Landing (3D hero, value prop, SDG framing, enter)
/inspect         → Quality: camera/upload → defect grade → Grade Card        ← PHONE DEMO
/prices          → Price transparency: live mandi rates, trends, forecast, mandi compare
/advisory        → Yield predictor + weather harvest timing + crop recommendation + fertilizer recommendation
/market          → D2C marketplace: farmer list view + buyer browse view + collective panel
/insights        → Research dashboard: model charts, metrics, SDG impact, related-work citations, live viz
/ethics          → HITL framework, bias honesty, cost-benefit, team
```
Persistent UI: floating bilingual voice AI assistant (every route), top glass nav with language toggle (EN/हिं) + PWA install button.

---

## 5. DESIGN SYSTEM — "Premium Dark Operations Console, warmed for agriculture"

Dark, precise, premium — study linear.app, vercel.com, basement.studio for the calibre bar before writing any CSS. NOT generic Tailwind-gray, NOT Bootstrap, NOT shadcn defaults.

```css
:root{
  --bg:#06080d; --bg-2:#0a0d15;
  --surface:rgba(255,255,255,0.035); --surface-2:rgba(255,255,255,0.06); --surface-3:rgba(255,255,255,0.09);
  --border:rgba(255,255,255,0.08); --border-2:rgba(255,255,255,0.14);
  --text:#ecedf5; --muted:rgba(236,237,245,0.55); --dim:rgba(236,237,245,0.32);
  --indigo:#6366f1; --violet:#8b5cf6; --cyan:#06b6d4; --teal:#14b8a6;
  --harvest:#f59e0b; --grain:#eab308; --earth:#a16207;
  --healthy:#10b981; --warning:#f59e0b; --danger:#ef4444;
  --glow-indigo:rgba(99,102,241,0.4); --glow-cyan:rgba(6,182,212,0.35);
  --glow-green:rgba(16,185,129,0.4); --glow-harvest:rgba(245,158,11,0.4);
}
```
Glassmorphism cards (`backdrop-filter:blur(16px)`, `border:1px solid var(--border)`, `radius:20px`); JetBrains Mono uppercase section labels in cyan; gradient hero text (violet→cyan for tech moments, amber→green for farmer-warmth moments); colored glow shadows; subtle dot-grid texture; motion always eased, `prefers-reduced-motion` respected throughout, overshoot easing `cubic-bezier(0.34,1.56,0.64,1)` on key interactions.

---

## 6. GRAPHICS / FX LIBRARY — MANDATORY, SEE ADDENDUM FILE

**Read `AgroSight_Graphics_Addendum.md` in this project folder in full before starting Phase 0.** It specifies, with complete working code, these 10 components — build every one, they are not optional:

1. SplitText (GSAP + split-type word-by-word heading reveals)
2. RevealOnScroll (CSS clip-path wipe, IntersectionObserver triggered)
3. GSAP ScrollTrigger sequences (pinned hero scroll, horizontal chart scroll, batched section entrance)
4. AnimatedSVGPath (stroke-dashoffset draw-on-scroll — used for the HITL flow diagram AND the "how it works" quality→price→sale pipeline diagram)
5. ShaderBackground (Three.js GLSL fragment shader color field, mobile-throttled, CSS gradient fallback)
6. NoisyBlob (simplex-noise canvas morphing accent)
7. Gyroscope tilt hook (production-grade, iOS permission flow included)
8. YieldGauge / PriceGauge (canvas animated arc with glow)
9. ParticleBurst (green burst + haptic on HEALTHY grade result)
10. MagneticButton + ripple

Plus the earlier-established basics: Spotlight, Particles field, TiltCard, Counter, AuroraBg, LiveSignal, ScanOverlay.

Apply per this table:

| Route | FX active |
|-------|-----------|
| `/` | ShaderBackground, NoisyBlob, Particles, SplitText, MagneticButton, Spotlight, GSAP pin, Counter |
| `/inspect` | ScanOverlay, ParticleBurst, RevealOnScroll, TiltCard, RippleButton, gyroscope |
| `/prices` | PriceGauge, LiveSignal, Counter, RevealOnScroll, Recharts animated |
| `/advisory` | YieldGauge, AuroraBg, Counter, RevealOnScroll (yield + crop + fertilizer cards) |
| `/market` | TiltCard (listings), RevealOnScroll, MagneticButton, Counter |
| `/insights` | TiltCard (charts), Counter, LiveSignal, GSAP horizontal scroll, AuroraBg |
| `/ethics` | AnimatedSVGPath (HITL), RevealOnScroll staggered, SplitText |
| global | Spotlight, Lenis (desktop), assistant orb pulse |

All FX: cap devicePixelRatio at 2, throttle on mobile, pause when tab hidden, honor prefers-reduced-motion, dispose Three.js resources on unmount.

---

## 7. SCREEN SPECS

### 7.1 Landing `/`
3D hero (R3F instanced meshes): grain/particle field rippling green→amber→red as a scanning plane sweeps through it — AI inspecting a harvest. Bloom postprocessing. Reacts to mouse/gyro. SplitText headline: "Quality you can prove. Prices you can trust. Power back to the farmer." SDG badge row. Stat ribbon counters. Magnetic "Enter" CTA → /inspect.

### 7.2 Inspect `/inspect` (PHONE DEMO — flawless on mobile, this is the emotional core)
Crop chips (6 SKUs). Live camera + ScanOverlay + capture w/ haptic; upload fallback. TF.js inference (mock until model dropped in). Result reveal: color-coded verdict, star rating, confidence bar, plain-language action, spoken aloud in selected language. HITL gate <70% confidence. ParticleBurst on HEALTHY. **Grade Card** generated: crop, grade, defect %, date, QR code (free `qrcode` npm package). Buttons: "Ask assistant", "Check price →" (/prices), "List in market →" (/market, grade prefilled).

### 7.3 Prices `/prices`
State/district/commodity selectors. Live Agmarknet fetch (cached + snapshot fallback). PriceGauge hero (today's modal price). 7/30-day trend (Recharts, animated draw). "Sell now or wait" signal from forecast model, plain-language explanation. Nearby-mandi comparison table, best price highlighted. Values in ₹/quintal AND ₹/kg. Data-source attribution + "last updated" timestamp.

### 7.4 Advisory `/advisory` — now 4 sub-panels (pre-harvest through post-harvest)
- **Crop Recommendation** (NEW): sliders/inputs for N, P, K, temperature, humidity, pH, rainfall → trained classifier (Colab, Random Forest/XGBoost on the free Kaggle Crop Recommendation dataset) → recommended crop with confidence, shown as a card with an icon.
- **Fertilizer Recommendation** (NEW): current crop + soil NPK readings → recommended fertilizer/nutrient to add, with a plain-language reason ("Nitrogen is low for this crop stage — add urea-based fertilizer").
- **Yield Predictor** (existing): 7 sliders → yield_lookup nearest-neighbor → YieldGauge + output kg + efficiency + bottleneck warning; defect_rate auto-fills from a prior /inspect result (visually glowing to show the pipeline).
- **Harvest Timing** (existing): Open-Meteo 7-day forecast → plain advice on when to harvest to avoid weather damage.

This sequence — what to plant, how to feed the soil, how much you'll yield, when to harvest — is what makes the platform genuinely pre-to-post-harvest end-to-end, not just a post-harvest inspection tool.

### 7.5 Market `/market`
Farmer view (list: crop, grade auto-attached, quantity, location, auto-suggested fair price = mandi modal + grade premium, adjustable, publish) / Buyer view (browse by crop/grade/location, see Grade Card + fair-price badge, contact/buy) toggle. Collective panel: pooled tonnage by crop+grade+region, "bulk buyers notified" messaging. Supabase-backed (or localStorage demo mode behind the same interface).

### 7.6 Insights `/insights`
KPI counters (CV accuracy, yield MAPE, price-forecast error, crop-rec accuracy, models compared, crops, mandis). Model comparison charts (embedded PNGs, TiltCard). Confusion matrices. Per-SKU accuracy. Yield model + SHAP. Price forecast actual-vs-predicted. **SDG impact panel** with the ₹-gained-per-farmer math. **Related Work section** — a clean citation list of AgroAI, Kisan DSS, AgriSens, the IIT-Delhi and Nature papers, presented as a short "prior art we studied and extended" panel (this directly serves Research Depth grading). Live session analytics (defect distribution, pass/fail) accumulating during the demo. Export session report.

### 7.7 Ethics `/ethics`
Thesis: "Annadata assists rural workers and farmers — it does not replace them." Animated SVG HITL flow. Three principle cards (Transparency / Sovereignty / Skill Elevation). Cost-benefit table. "What AI does / What humans do." Bias honesty (PlantVillage is lab imagery; production needs local data + the HITL gate). SDG mapping. Team credits.

---

## 8. AI ASSISTANT (bilingual, voice, contextual, free)

Floating glass orb, expands to chat panel, every route. Ollama local (`/api/chat`, streaming). System prompt gives full Annadata context: all 7 pillars, 3 defect classes, 6 crops, price/yield/crop-rec/fertilizer logic, ethics framing, SDG mission — AND an explicit instruction: **"Always respond in the same language the farmer used — Hindi or English. Do not mix languages within a response unless asked to."** This is the entire multilingual strategy — no separate translation API, the LLM handles it natively.
Context-aware: receives current CV result / price / yield / crop-rec data and explains it in plain language.
`getAssistantResponse()`: try Ollama → optional Vercel serverless fallback → graceful "assistant available in local demo mode" message.
Voice: mic → STT (`hi-IN`/`en-US` toggle, live transcription) → assistant response → spoken via speechSynthesis in matching language. Demo line: ask in Hindi "आज टमाटर का भाव क्या है?" → spoken Hindi answer with the live mandi price.

---

## 9. WHY NOT GOOGLE SPEECH/TRANSLATION APIS (documented decision)

Verified: Google Cloud Translation API and Speech-to-Text/Text-to-Speech APIs offer a free tier (500,000 characters/month for Translation) but **require an active billing account with a payment method on file** to use at all, even within free limits, and will auto-charge past the threshold. This violates our zero-cost, zero-card constraint and introduces real financial risk on a live demo with unpredictable usage. We use the Web Speech API (fully free, browser-native, zero setup) for all speech in/out, and Ollama's native multilingual generation for all translation — both are genuinely free with no account or card required. Document this reasoning in the report; it demonstrates engineering judgment, not just feature-checking.

---

## 10. STATE, DATA LAYER, PERFORMANCE

Zustand store: language, voice on/off, cvResult, inspectionHistory[], marketListings[], selectedCrop/location, advisoryInputs. Persisted to localStorage.
Data layer behind interfaces: `priceService`, `weatherService`, `inferenceService`, `forecastService`, `cropRecService`, `fertilizerService`, `marketService`. Swappable, mockable, all working in fallback mode before any key/model exists.
Lazy-load routes + chart images (shimmer skeletons). Disable Lenis on mobile. Cap DPR at 2. Cache all API responses. Service worker for offline. TypeScript throughout, typed, minimal `any`. Accessible: aria-labels, keyboard nav, reduced-motion. Round every on-screen number.

---

## 11. FILE STRUCTURE
```
annadata/
├── public/{models/, assets/(10+ PNGs), data/(yield_lookup.json, sku_catalog.json, price_snapshot.json, crop_rec_lookup.json, fertilizer_lookup.json)}
├── src/
│   ├── App.tsx, main.tsx
│   ├── store/useStore.ts
│   ├── services/{price,weather,inference,forecast,cropRec,fertilizer,market}.ts
│   ├── lib/{assistant,speech,constants,qr}.ts
│   ├── components/{nav/,assistant/,voice/,fx/,ui/}
│   ├── routes/{Landing,Inspect,Prices,Advisory,Market,Insights,Ethics}.tsx
│   ├── three/HeroScene.tsx
│   └── styles/globals.css
├── vite.config.ts (pwa), tailwind.config.js, vercel.json, README.md
```

---

## 12. BUILD PHASES (confirm each before next — never dump the whole app at once)

- **P0 Scaffold:** deps, folders, design tokens, FX library (per Addendum), service interfaces (all mock/fallback), Supabase-vs-localStorage decision. All 7 routes render, dark theme, runs clean.
- **P1 Inspect (mock):** camera/upload/scan/result/Grade Card/QR/HITL gate. Flawless on phone.
- **P2 Prices:** Agmarknet + cache + snapshot fallback + trends + forecast fallback + mandi compare.
- **P3 Advisory:** yield sliders+gauge, crop recommendation panel, fertilizer recommendation panel, Open-Meteo harvest timing, inspect→advisory pipeline.
- **P4 Market:** farmer list + buyer browse + fair-price suggestion + collective panel + persistence.
- **P5 Insights + Ethics:** charts, counters, SDG impact math, Related Work citations, session analytics, animated HITL + pipeline diagrams, bias honesty.
- **P6 Assistant:** orb + panel + Ollama + fallback + context-awareness + language instruction.
- **P7 Voice:** bilingual STT/TTS wired into assistant + inspect + prices.
- **P8 Real models:** drop in tflite + price LSTM + crop-rec + fertilizer models, replace mocks.
- **P9 Landing 3D + PWA + deploy:** hero scene, manifest/service worker, install button, vercel.json, README (install, keys, Ollama, model drop-in, build, deploy — all free, no card anywhere).

---

## 13. QUALITY BAR

Production-grade, premium, every element intentional — reference linear.app/vercel.com calibre, not a student-project default. Fully usable in mock/fallback mode before any key or model exists. API layer must never hang the live demo (cache + snapshot everywhere). Reusable FX exactly per the Addendum. Clean typed architecture. Accessible, reduced-motion safe. README lets me reproduce and deploy end-to-end for free with zero credit card anywhere in the stack. This is the flagship of our MAIB cohort, presented live to Dr. Roy — it must work flawlessly in a 40-minute demo and read as a real, deployable product, not a prototype.

---

## 14. START HERE

1. Confirm you've read and understood this prompt AND the Graphics Addendum file, in 4-5 sentences.
2. Propose the Phase 0 scaffold: exact deps, folder structure, globals.css tokens, service interfaces, Supabase-vs-localStorage recommendation with reasoning.
3. On my approval, build Phase 0, tell me how to run it.
4. Proceed phase by phase, pausing for confirmation each time.

Let's build something exceptional — genuinely end-to-end, genuinely free, genuinely useful to the farmers it represents, and genuinely impressive to Dr. Roy.
