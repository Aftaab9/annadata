# ============================================================
#  AGROSIGHT — MASTER BUILD PROMPT FOR CURSOR (use with Opus)
# ============================================================
# Paste this entire file into Cursor's chat as your first message.
# Then work through the build phases in order.
# ============================================================

You are my senior full-stack engineer and creative technologist. We are building **AgroSight** — an AI-driven quality inspection and yield optimization platform for rural food processing units. This is the flagship final project for SP Jain School of Global Management (MAIB program, Group 3), being presented to Dr. Sandip Kumar Roy for the AI in Operations course.

This is not a class exercise. We are building a production-grade, deployable web application that goes far beyond the faculty brief. The bar is: every person in the room — technical or not — instantly understands the value, and the faculty is genuinely impressed by both the engineering depth and the design polish.

Read this ENTIRE prompt before writing any code. Then confirm your understanding and propose the project scaffold before building.

---

## 0. THE FACULTY BRIEF (what's required — the floor, not the ceiling)

The original problem statement (Group 3):
- Build a computer vision model to classify product defects from images ✅ (done in Colab)
- Develop a predictive model to estimate yield from raw material quality, moisture, processing parameters ✅ (done in Colab)
- Simulate production scenarios to identify bottlenecks and optimize throughput
- Create a dashboard showing defect rate, yield trends, and process efficiency
- Discuss ethical implications of automation on rural employment and skill displacement

The context: a rural food-processing SME (spices, grains, dairy, pulses) wants to reduce defects, improve yield, and automate quality checks using AI vision and predictive analytics — while keeping cost low and NOT displacing rural workers.

**We have already done all the ML.** Models are trained. This build is the APPLICATION that brings it to life.

---

## 1. WHAT WE'RE ACTUALLY BUILDING (the ceiling)

A polished, installable, bilingual, voice-enabled Progressive Web App with:

1. **Live defect inspection** — phone camera or upload → on-device TF.js inference → defect class + confidence + recommended action
2. **Yield simulator** — 7-parameter scenario engine wired to the CV result (defect → yield pipeline)
3. **Insights dashboard** — research evidence, model comparisons, animated metrics, live monitoring viz
4. **Ethics / HITL framework** — human-in-the-loop, cost-benefit, role-elevation argument
5. **AI assistant** (beyond-brief #1) — local Ollama-powered conversational agent that explains any result in plain language
6. **Bilingual voice** (beyond-brief #2) — understands and responds in English + Hindi via Web Speech API (zero cost)
7. **Batch history + analytics** (beyond-brief #3) — accumulates inspections over a session, builds a live dashboard
8. **3D/WebGL hero moment** (beyond-brief #4) — a Three.js hero that makes the faculty lean forward

Deployment target: **Vercel**. Stack must be Vercel-compatible.

---

## 2. TECH STACK (non-negotiable choices)

- **Framework:** React 18 + Vite + TypeScript
- **Routing:** React Router (4 main routes + landing)
- **Styling:** Tailwind CSS + custom CSS variables for the design system
- **CV inference:** TensorFlow.js (`@tensorflow/tfjs`) loading the converted model in-browser
- **3D:** Three.js (`three` + `@react-three/fiber` + `@react-three/drei`)
- **Animation:** Framer Motion (`framer-motion`) for component transitions + GSAP for scroll-driven sequences
- **Smooth scroll:** Lenis (`@studio-freight/lenis`) — desktop only, disable on mobile
- **Charts:** Recharts for interactive charts + the pre-rendered PNGs for model comparisons
- **State:** Zustand (lightweight global store — survives route changes, holds CV result for the pipeline)
- **AI assistant:** Ollama (local) via fetch to `http://localhost:11434/api/chat`, with a hosted fallback (see section 9)
- **Voice:** Web Speech API — `SpeechRecognition` (STT) + `SpeechSynthesis` (TTS), both supporting `en-US` and `hi-IN`
- **PWA:** `vite-plugin-pwa` for service worker + manifest (offline + installable)
- **Icons:** Lucide React
- **Fonts:** Space Grotesk (headings/UI) + JetBrains Mono (data/labels) via Google Fonts

---

## 3. DESIGN SYSTEM — "Premium Dark Operations Console"

The aesthetic is a high-end operations command center: dark, precise, data-dense but breathable, with moments of cinematic motion. Think Linear.app meets a Bloomberg terminal meets a luxury car dashboard. NOT a typical student project. NOT a generic Bootstrap dashboard.

### Color tokens (CSS variables on :root)
```css
:root {
  /* Surfaces — near-black, layered */
  --bg:        #06070d;   /* deepest background */
  --bg-2:      #0a0c16;   /* section background */
  --surface:   rgba(255,255,255,0.035);
  --surface-2: rgba(255,255,255,0.06);
  --surface-3: rgba(255,255,255,0.09);

  /* Borders */
  --border:    rgba(255,255,255,0.08);
  --border-2:  rgba(255,255,255,0.14);

  /* Text */
  --text:      #ecedf5;
  --muted:     rgba(236,237,245,0.55);
  --dim:       rgba(236,237,245,0.32);

  /* Brand accents */
  --indigo:    #6366f1;
  --violet:    #8b5cf6;
  --cyan:      #06b6d4;
  --teal:      #14b8a6;

  /* Semantic (defect states) */
  --healthy:   #10b981;   /* green */
  --warning:   #f59e0b;   /* amber — surface defect */
  --danger:    #ef4444;   /* red — blight/mold */

  /* Glows (for shadows/accents) */
  --glow-indigo: rgba(99,102,241,0.4);
  --glow-cyan:   rgba(6,182,212,0.35);
  --glow-green:  rgba(16,185,129,0.4);
}
```

### Typography
- Headings: Space Grotesk, weights 500/600/700, tight letter-spacing (-0.02em to -0.03em)
- Body: Space Grotesk 400
- Data/labels/code: JetBrains Mono 400/500, letter-spacing 0.03em–0.05em, often uppercase for labels
- Hero display: clamp(2.5rem, 7vw, 6rem)

### Core visual language
- **Glassmorphism cards:** `background: var(--surface); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 20px`
- **Section labels:** small JetBrains Mono, uppercase, cyan, letter-spacing 0.15em, with a short leading line `—`
- **Gradient text** for hero words: `linear-gradient(135deg, #fff, #a78bfa 50%, #38bdf8)`
- **Glow accents:** colored box-shadows on key elements, e.g. `box-shadow: 0 0 40px var(--glow-indigo)`
- **Grid texture:** subtle dot-grid or line-grid background on dark sections (CSS radial-gradient or SVG), very low opacity
- **Noise overlay:** optional 2% opacity noise texture over the whole app for filmic depth

### Motion principles
- Nothing appears instantly — everything eases in (Framer Motion `initial/animate` with spring or custom cubic-bezier)
- Page transitions: fade + subtle slide (12px)
- Hover states: 200ms ease, slight lift + border brighten
- Scroll: elements reveal via Intersection Observer / GSAP ScrollTrigger
- Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful overshoot on key interactions
- Respect `prefers-reduced-motion` — wrap non-essential animation

---

## 4. APP STRUCTURE & ROUTES

```
/                → Landing / Hero (3D WebGL moment, value prop, enter app)
/inspect         → Defect inspection (camera + upload + result)  ← PHONE DEMO
/yield           → Yield simulator (sliders + gauge + pipeline)
/insights        → Research dashboard (charts, metrics, live viz)
/ethics          → HITL framework + cost-benefit + team
```

Plus persistent UI:
- **Floating AI assistant** — bottom-right orb, expandable chat panel, available on every route
- **Voice button** — mic toggle, available in the assistant and on the inspect screen
- **Top nav** — glass bar, route links, language toggle (EN / हिं), "Install app" button when PWA-installable

---

## 5. SCREEN-BY-SCREEN SPECIFICATION

### 5.1 LANDING (`/`) — The "lean forward" moment

This is the first thing Dr. Roy sees. It must land in 3 seconds.

- **3D hero (Three.js / R3F):** A slowly rotating, abstract representation of "AI inspecting crops" — options (pick the most achievable + striking):
  - A field of low-poly grain/particle instances that ripple and shift color (green→amber→red) as a scanning plane sweeps through them, representing defect detection across a batch
  - OR a wireframe globe of distributed rural processing nodes lighting up
  - Particles react to mouse on desktop, to device gyro on mobile
  - Use instanced meshes for performance (thousands of points at 60fps)
  - Add @react-three/postprocessing bloom for the cinematic glow
- **Headline:** gradient text, e.g. "Quality you can see. Yield you can predict." — animate in word by word (SplitType + GSAP or Framer stagger)
- **Sub-line:** one sentence on the value prop for rural food processors
- **Primary CTA:** "Start Inspecting" → /inspect, magnetic button on desktop
- **Stat ribbon:** 3 animated counters (97% accuracy, 6 crops, ₹2,500/mo) that count up on load
- **Scroll hint** at the bottom
- Cursor spotlight effect over the whole hero (radial gradient following pointer)

### 5.2 INSPECT (`/inspect`) — THE PHONE DEMO, the core

This screen runs on the phone during the live demo. It must be flawless on mobile.

**Layout (mobile-first):**
- Crop selector chips at top — 6 SKUs from `sku_catalog.json` (Maize, Soybean, Pepper, Tomato, Potato, Apple), horizontally scrollable, selected chip glows
- Camera viewfinder — full-width, rounded, live `getUserMedia` stream into `<video>`
  - Scanning overlay: an animated corner-bracket frame + a sweeping scan line (CSS animation) that activates during inference
  - Toggle: front/back camera
- Capture button — large (72px), centered below viewfinder, with a satisfying press animation + haptic (`navigator.vibrate(15)`)
- Upload alternative — "or upload an image" — drag-drop zone + file picker
- **Result reveal** (the magic moment):
  - Card slides up with clip-path reveal
  - Big defect verdict with color: HEALTHY (green) / SURFACE DEFECT (amber) / BLIGHT & MOLD (red)
  - Confidence bar — animates fill with spring overshoot, shows %
  - Per-class probability breakdown (3 mini bars)
  - Plain-language recommended action:
    - HEALTHY → "✓ Batch passes quality check. Proceed to packaging."
    - SURFACE_DEFECT → "⚠ Minor defects detected. Flag for supervisor review."
    - BLIGHT_MOLD → "✕ Contamination risk. Reject and quarantine this batch."
  - **HITL gate:** if confidence < 70% → override the action with "AI confidence is low. A human supervisor must inspect this batch." in a distinct style. This is critical for the ethics story — show it live.
  - On HEALTHY: green particle burst (canvas, ~30 particles, 1s)
  - "Ask the assistant about this result" button → opens AI panel pre-loaded with the result
  - "Use in Yield Simulator →" button → stores result in Zustand, navigates to /yield with defect_rate pre-filled

**TF.js inference details:**
- Load the converted PlantVillage model (see section 8 for conversion)
- Preprocess: resize to 224×224, normalize per the winning backbone's `preprocess_input` (check Colab output — likely MobileNetV2 or EfficientNetB0)
- Output: softmax over 3 classes [HEALTHY, SURFACE_DEFECT, BLIGHT_MOLD]
- Show a model-loading state on first visit (model is ~5-20MB; cache via service worker)
- Run inference off the main thread if possible; show the scan animation during compute

### 5.3 YIELD (`/yield`) — The simulator + pipeline payoff

**The pipeline link is the star:** if the user arrived from /inspect, the defect_rate slider is pre-filled and glows cyan with a label "auto-filled from your inspection." Mapping: HEALTHY→2%, SURFACE_DEFECT→10%, BLIGHT_MOLD→25%. This single feature demonstrates systems thinking — make it visually obvious.

**Layout:**
- 7 sliders, each with live JetBrains Mono readout:
  - Moisture % (8–25), Batch weight kg (10–500), Ambient temp °C (18–42), Processing duration min (15–180), Machine speed RPM (200–1200), Raw material grade (1–5), Defect rate % (0–30)
  - Slider thumbs shift color (green→amber→red) as values enter sub-optimal ranges
- **Yield gauge:** a Canvas/SVG animated arc (semicircle) that sweeps to the predicted yield %, with the number counting up in the center. Color-coded: >75% green, 60-75% amber, <60% red.
- Three output stat cards: Yield %, Output kg (yield% × batch_weight), Efficiency Score
- **Bottleneck warning:** if lookup returns `bottleneck: true`, show a pulsing amber alert card naming the limiting factor
- Prediction logic: load `yield_lookup.json`, find nearest-neighbor row to the 7 slider values (Euclidean distance on normalized params), display its yield_pct / yield_kg / bottleneck / efficiency_score. Interpolate between nearest neighbors for smoothness.
- "Explain this scenario" → AI assistant with the parameters + result
- Reset button

### 5.4 INSIGHTS (`/insights`) — The research evidence (laptop)

This is the credibility screen for the faculty. Scroll-driven narrative.

**Sections (revealed on scroll via GSAP ScrollTrigger):**
- **KPI counters** (Intersection Observer triggered): 97.4% CV accuracy, 3.52% yield MAPE, 5 models compared, 6 crops, ~6,000 images trained. Each counts up from 0.
- **Model comparison story:** embed `02_model_comparison.png` and `08_pv_model_comparison.png` in elegant glass frames. Add a short narrative: "We didn't guess. We trained 5 architectures under identical conditions and selected on a composite score." 3D tilt on the chart cards.
- **Confusion matrices:** `03_confusion_matrix.png`, `09_pv_confusion_matrix.png` — with captions explaining per-class precision.
- **Per-SKU accuracy:** `10_pv_sku_accuracy.png`
- **Yield model:** `04_yield_model_comparison.png`, `05_yield_predictions.png`, `06_shap_importance.png` — explain SHAP: "These are the factors that actually drive yield, ranked by impact."
- **Live monitoring demo:** a Canvas live-signal waveform (defect rate over time) with a pulsing LIVE badge — shows what real-time sensor integration would look like.
- All chart images: lazy-load with shimmer skeletons, hover to zoom (Framer Motion layout animation).

### 5.5 ETHICS (`/ethics`) — The HITL framework (laptop)

Where other projects are empty, this is rich. This is what gets the top marks from Dr. Roy.

**Sections:**
- **The thesis:** large statement — "AgroSight is built to assist rural workers, not replace them." 
- **HITL flow diagram** (animated SVG, draws on scroll via stroke-dashoffset): Image captured → AI classifies + confidence → [if <70%: human inspects] → worker confirms or overrides → decision logged → builds worker's skill record
- **Three principle cards** (slide in alternating sides on scroll):
  - Transparency — every prediction shows its confidence; no silent automation
  - Sovereignty — model runs on the worker's own device; their data stays theirs
  - Skill elevation — AI handles repetitive scanning; workers move to higher-value quality validation
- **Cost-benefit table** (rows reveal with stagger): ₹2,500/month deployment vs ₹1,000 saved per batch → payback in 3 batches. Include the defect-reduction math (8%→3% on a 50kg batch at ₹400/kg).
- **"What AI does / What humans do"** — two-column comparison reinforcing role elevation.
- **Bias acknowledgment** (shows intellectual honesty Dr. Roy will respect): "PlantVillage is lab-captured imagery. Real field conditions differ. Production deployment requires local data collection and the HITL confidence gate precisely because the model will be uncertain on unfamiliar inputs." 
- **Team section:** SP Jain MAIB, Group 3, your names.

---

## 6. THE AI ASSISTANT (beyond-brief #1)

A floating, always-available conversational agent. Bottom-right glowing orb that expands into a glass chat panel.

**Behavior:**
- Powered by **Ollama running locally** (`http://localhost:11434/api/chat`, model e.g. `llama3.2` or `qwen2.5`). This works perfectly for the laptop demo.
- **System prompt** gives it full context: it knows it's AgroSight's assistant, knows the 3 defect classes, the 6 crops, the yield parameters, and the ethics framing. It can explain any result in plain language.
- **Context-aware:** when opened from a CV result or yield scenario, it receives that data and explains it ("Your batch shows surface defects at 82% confidence. Here's what that means and what to do...").
- **Streaming responses** (Ollama supports streaming — render token by token).
- **Fallback (section 9):** if Ollama isn't reachable (e.g. app opened on phone or deployed), gracefully fall back to a hosted endpoint OR a friendly "assistant available in local demo mode" message. Build the abstraction so the assistant calls a single `getAssistantResponse()` function that tries Ollama first, then fallback.

**Design:** glass panel, messages with subtle fade-in, typing indicator (three pulsing dots), the orb pulses gently when idle and spins when thinking.

---

## 7. BILINGUAL VOICE (beyond-brief #2) — zero cost

Use the **Web Speech API** (built into Chrome/Edge — free, no API key, supports Hindi).

**Speech-to-text (input):**
- `webkitSpeechRecognition` / `SpeechRecognition`
- Language toggle: `en-US` and `hi-IN`
- Mic button in the assistant panel and on /inspect
- Show live transcription as the user speaks
- Auto-detect: offer both, let user pick; optionally try `hi-IN` and `en-US` and use whichever returns higher confidence

**Text-to-speech (output):**
- `speechSynthesis` with `SpeechSynthesisUtterance`
- Pick a `hi-IN` voice for Hindi responses, `en-US`/`en-IN` for English
- The assistant speaks its responses aloud when voice mode is on
- Toggle: voice on/off, language EN/हिं

**The demo flow:** you tap mic, say in Hindi "इस बैच की गुणवत्ता कैसी है?" (how is this batch's quality?), the assistant understands, responds in Hindi both in text and spoken aloud. This will genuinely impress — bilingual, voice-driven, and free.

**Important:** Web Speech STT requires the page be served over HTTPS (Vercel gives this) or localhost. Note this in the README.

---

## 8. BATCH HISTORY + ANALYTICS (beyond-brief #3)

A session-accumulating layer that makes the demo feel alive.

- Every inspection on /inspect is pushed to a Zustand store (persisted to localStorage)
- A **history strip** on /inspect shows recent inspections as thumbnails with their verdicts
- On /insights, a **session analytics panel**: as you inspect more items during the demo, live charts update — defect rate over time, class distribution donut, pass/fail ratio. By the end of the demo you've built a real dataset live in front of the faculty.
- "Export session report" button → generates a clean JSON or downloadable PDF summary of all inspections + yield scenarios run during the session.

---

## 9. MODEL CONVERSION (TFLite → TF.js)

The Colab notebooks export `.tflite` and `.keras`. TF.js in-browser needs either a `tfjs` graph model or can use the `.tflite` via `@tensorflow/tfjs-tflite`.

**Recommended path:** use `@tensorflow/tfjs-tflite` to load `agrosight_plantvillage.tflite` directly in the browser. Simpler than re-converting.

**Alternative:** convert the SavedModel to TF.js format with `tensorflowjs_converter`:
```
tensorflowjs_converter --input_format=keras \
  agrosight_plantvillage.keras \
  public/models/agrosight_tfjs/
```
Then load with `tf.loadLayersModel('/models/agrosight_tfjs/model.json')`.

**Action for Cursor:** scaffold both loaders behind a single `loadModel()` / `classifyImage()` abstraction so we can switch. Include a clear TODO + instructions in the README for me to drop the model files into `public/models/`. Provide a **mock inference mode** (returns plausible fake predictions) so the entire app is fully testable BEFORE the real model file is added — this is critical so we can build and style everything without blocking on the model.

---

## 10. FALLBACK / DEPLOYMENT STRATEGY

- **Ollama** = local only. On Vercel it won't be reachable. Build `getAssistantResponse()` to: try `localhost:11434` → on failure, hit an optional hosted fallback (a simple Vercel serverless function proxying to an API if I add a key later) → on failure, return a graceful canned/offline message. The laptop demo uses Ollama; the deployed link degrades gracefully.
- **TF.js model** = works fully client-side on Vercel (model files served from `/public`).
- **Voice** = works on Vercel (HTTPS).
- **Yield lookup** = static JSON, works everywhere.
- Provide `vercel.json` if needed, and ensure `vite-plugin-pwa` is configured for offline.
- The deployed Vercel link should be fully functional for inspection, yield, insights, ethics, and voice — only the AI assistant depends on local Ollama (with graceful fallback).

---

## 11. FILE / FOLDER STRUCTURE (propose and scaffold this)

```
agrosight/
├── public/
│   ├── models/                    # TF.js / tflite model files (I add these)
│   ├── assets/                    # the 10 PNG charts from Colab
│   └── data/
│       ├── yield_lookup.json
│       └── sku_catalog.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # router + layout + Lenis + persistent UI
│   ├── store/
│   │   └── useStore.ts            # Zustand: cvResult, history, language, voice
│   ├── lib/
│   │   ├── inference.ts           # loadModel, classifyImage, mock mode
│   │   ├── yieldEngine.ts         # nearest-neighbor lookup + interpolation
│   │   ├── assistant.ts           # getAssistantResponse (Ollama + fallback)
│   │   ├── speech.ts              # STT + TTS, EN/HI
│   │   └── constants.ts           # defect classes, crops, action messages
│   ├── components/
│   │   ├── nav/TopNav.tsx
│   │   ├── assistant/AssistantOrb.tsx, AssistantPanel.tsx
│   │   ├── voice/VoiceButton.tsx
│   │   ├── fx/                     # Spotlight, Particles, TiltCard, Counter, AuroraBg, LiveSignal, MagneticButton
│   │   └── ui/                     # Button, Card, Slider, Chip, StatCard, Gauge
│   ├── routes/
│   │   ├── Landing.tsx
│   │   ├── Inspect.tsx
│   │   ├── Yield.tsx
│   │   ├── Insights.tsx
│   │   └── Ethics.tsx
│   ├── three/
│   │   └── HeroScene.tsx           # R3F scene for the landing
│   └── styles/
│       └── globals.css             # design tokens, base styles
├── index.html
├── tailwind.config.js
├── vite.config.ts                 # + vite-plugin-pwa
├── vercel.json
└── README.md                       # setup, model drop-in, Ollama, deploy steps
```

---

## 12. FX COMPONENT LIBRARY (build these as reusable components)

- **Spotlight** — radial gradient follows pointer (mousemove + touchmove), wraps any section
- **Particles** — canvas particle field, mouse/touch repulsion, connection lines; particle count = `navigator.maxTouchPoints > 0 ? 40 : 90`
- **TiltCard** — 3D tilt on desktop (mousemove), gyroscope on mobile (deviceorientation); glare overlay
- **Counter** — eased count-up, Intersection Observer triggered
- **AuroraBg** — canvas sine-wave color layers for section backgrounds
- **LiveSignal** — canvas real-time waveform with gradient fill + pulsing live dot
- **MagneticButton** — desktop magnetic pull toward cursor; falls back gracefully on touch
- **ScanOverlay** — the camera scanning frame + sweep line for /inspect
- **RippleButton** — material-style touch ripple on all primary buttons
- All FX respect `prefers-reduced-motion` and cap `devicePixelRatio` at 2 for mobile perf

---

## 13. PERFORMANCE & MOBILE RULES

- Mobile particle count reduced; cap canvas pixelRatio at 2
- Lazy-load route components (`React.lazy` + Suspense)
- Lazy-load the 10 chart PNGs with shimmer skeletons
- Disable Lenis smooth scroll on mobile (native is fine)
- Three.js hero: use instanced meshes, limit pixel ratio, pause render when off-screen, provide a static fallback on very low-end devices
- All touch targets ≥ 44×44px
- Test the /inspect flow specifically on a real Android phone (that's the live demo surface)
- Service worker caches model + assets for offline / fast reload

---

## 14. BUILD PHASES (work in this order — confirm each before moving on)

**Phase 0 — Scaffold:** Vite + React + TS + Tailwind + router + design tokens + folder structure + mock inference mode. Get all 5 routes rendering with the nav and the dark theme. Confirm it runs.

**Phase 1 — Inspect (mock):** Full /inspect screen with camera, upload, scan animation, and result card using MOCK inference. Make the phone experience flawless. This is the demo centerpiece.

**Phase 2 — Yield + pipeline:** /yield with sliders, gauge, lookup engine, and the auto-fill pipeline from the CV result (using mock data).

**Phase 3 — Real inference:** wire TF.js, load the real model, replace mock. (I'll provide the model file; until then mock stays.)

**Phase 4 — Insights + Ethics:** both scroll-driven screens with charts, counters, animated SVG HITL diagram, cost-benefit.

**Phase 5 — AI assistant:** floating orb + panel, Ollama integration + fallback abstraction, context-awareness.

**Phase 6 — Voice:** bilingual STT + TTS wired into the assistant and /inspect.

**Phase 7 — Batch history + session analytics:** Zustand history, history strip, live session charts on /insights, export report.

**Phase 8 — Landing 3D:** the Three.js hero moment, polish, magnetic CTA, counters.

**Phase 9 — PWA + deploy:** service worker, manifest, install button, Vercel config, README. Final polish pass on all motion and responsiveness.

---

## 15. QUALITY BAR (hold yourself to this)

- TypeScript throughout, properly typed, no `any` unless unavoidable
- Clean component architecture, reusable FX, no copy-paste duplication
- Every number that hits the screen is rounded (no float artifacts)
- Accessible: aria-labels on icon buttons, keyboard nav, reduced-motion respected
- The app must be fully usable in MOCK mode before any model file exists
- Every screen must look intentional and premium — no default Tailwind-gray placeholder energy
- Comment the non-obvious parts (inference preprocessing, yield nearest-neighbor, speech language handling)
- Write a README that lets me: install deps, run dev, drop in the model, run Ollama, build, and deploy to Vercel — step by step

---

## 16. START HERE

First, do NOT write all the code at once. Instead:
1. Confirm you've understood the full scope in 3-4 sentences.
2. Propose the exact scaffold (dependencies, folder structure, design token file) for Phase 0.
3. Once I approve, build Phase 0 completely and tell me how to run it.
4. Then proceed phase by phase, pausing for my confirmation between each.

Remember: this is for Dr. Roy, it's the flagship of our MAIB program, and we're aiming to set the benchmark for the entire cohort. Premium, innovative, and it must actually work in a live demo. Let's build something exceptional.
