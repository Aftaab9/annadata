# The Best Prompts & Free APIs Library (researched July 2026)

A reusable kit for building beautiful, animated, data-rich web apps with AI coding agents.
Everything below was researched online in July 2026 — sources are cited so you know nothing is invented.
**How to use:** copy a prompt, replace the `[BRACKETED]` placeholders, paste it into Cursor / Claude Code / v0 / Lovable.

---

## PART 1 — What the research found (techniques + where they came from)

| # | Technique / Pattern | Source | Why it matters |
|---|---|---|---|
| 1 | **Anti-slop block** — explicitly forbid AI defaults ("no purple gradients, no centered hero, no three-card row") | [Superdesign — Claude Code Design Prompts](https://www.superdesign.dev/blog/claude-code-design-prompts), [How to Make Claude Code UI Look Good](https://www.superdesign.dev/blog/how-to-make-claude-code-ui-look-good) | Naming the defaults is the fastest way to avoid generic "AI slop" UI |
| 2 | **Trade adjectives for constraints** — "clean & modern" returns the average; "two fonts max, one accent color, 8px grid" returns a decision | Superdesign (above), [Glyph — Vibe Coding UI Prompt Guide](https://glyph.software/guides/vibe-coding-ui-prompt) | Constraints are executable; adjectives are not |
| 3 | **Persistent design system file (DESIGN.md)** — lock hex codes, font pairs, spacing tokens in a file the agent must follow | Superdesign, Glyph (above) | Agents have no design memory between sessions; a file stops drift |
| 4 | **Reference-grounded prompts + state checklist** — paste a reference screenshot, demand empty/loading/error states and mobile reflow | Superdesign, [Rocket — Best AI Prompts for Dashboard UI 2026](https://www.rocket.new/blog/the-best-ai-prompts-for-dashboard-ui-components) | Agents are "blind"; references + explicit states close the gap |
| 5 | **Screenshot–compare–refine loop** — have the agent render, screenshot, and compare against the reference before calling it done | Superdesign (above) | The single biggest quality multiplier for agent-built UI |
| 6 | **Spec-grade "scale correction" prompts** — demand native feel at 1512px, minimum sidebar widths, single-row KPI strips | [arhamkhnz/ui-prompts on GitHub](https://github.com/arhamkhnz/ui-prompts) (community prompt repo) | Prevents the "shrunken screenshot" look AI dashboards often have |
| 7 | **Restrained glassmorphism (2026 edition)** — glass only on nav/modals/floating panels, solid surfaces for dense data, 8–16px blur | [Setproduct — Liquid Glass vs Glassmorphism 2026](https://www.setproduct.com/blog/liquid-glass-vs-glassmorphism), [Rajesh R Nair — UI Trends 2026](https://rajeshrnair.com/blog/design/ui-ux/ui-design-trends-2026-bento-grids-glassmorphism.html) | Full-glass layouts are dead; glass as accent is what actually ships |
| 8 | **Bento grids** — the layout pattern still shipping at scale in 2026 for marketing/feature pages | Rajesh R Nair (above) | Modern layout without WebGL cost |
| 9 | **Lenis + GSAP ScrollTrigger stack** — the 2026 immersive-web standard (all GSAP plugins free since Webflow acquisition) | [Adamarant — Immersive web stack 2026](https://adamarant.com/en/blog/immersive-web-stack-in-2026-lenis-gsap-and-what-to-skip), [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | Two libraries + native CSS scroll animations replace five-library pipelines |
| 10 | **Motion (ex-Framer Motion)** for React component transitions; GSAP for scroll-bound sequences | [motion.dev](https://motion.dev/), Adamarant (above) | Motion drops frames past ~60 animated elements; GSAP wins scroll timelines |
| 11 | **Awwwards-level WebGL touches** — cursor-reactive shaders, curl-noise fluid displacement, chromatic aberration on cursor velocity, film grain — via React Three Fiber + drei | [Creative-Folio repo](https://github.com/mdhossain-2437/Creative-Folio), [folio-2026 repo](https://github.com/iTzRitual/folio-2026), [Codrops — Shader.se WebGPU pipeline](https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/) | Concrete, named effects pulled from real award-grade sites |
| 12 | **shadcn/ui + Recharts v3** — the default dashboard chart stack; ECharts for 100k+ points/realtime | [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart), [LogRocket — Best React chart libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/) | Recharts has ~48M weekly downloads and powers shadcn charts |
| 13 | **`prefers-reduced-motion` gating** — every animation must respect it (GSAP `matchMedia()`, Motion `useReducedMotion`) | Adamarant (above) | Accessibility + it's what separates pros from demos |

---

## PART 2 — The Prompts (copy, fill brackets, paste)

### Prompt 0 — The Design System Lock (run FIRST on every project)

> Source pattern: Superdesign "DESIGN.md prompt" + Glyph brand-system prompt.

```text
Before writing any UI code, create a DESIGN.md file at the project root and treat it
as law for every screen you build in this project.

Define in it:
- Color tokens as exact hex codes (not color names):
  background [#HEX], surface [#HEX], border [#HEX], text-primary [#HEX],
  text-muted [#HEX], accent [#HEX] (ONE accent only), success [#HEX],
  warning [#HEX], danger [#HEX].
- Typography: [DISPLAY FONT, e.g. "Instrument Serif"] for page headers,
  [UI FONT, e.g. "Manrope" or "Inter"] for body/labels, and a mono font
  ([e.g. "JetBrains Mono"]) for all numbers and code. Two fonts max plus mono.
- Spacing: strict 8px grid. Section gaps 32px, card padding 24px, never mix.
- Radii: [e.g. 12px cards, 8px inputs, full for pills]. Borders 1px,
  black/5 (light) or white/10 (dark).
- Shadows: [e.g. "none — use borders" OR "one soft ambient shadow only"].
- Motion rules: durations 150–300ms, one easing curve (cubic-bezier(0.22, 1, 0.36, 1)),
  everything gated behind prefers-reduced-motion.

FORBIDDEN (anti-slop list — never do these):
- purple/violet gradients on anything
- centered hero with three icon cards below it
- default Tailwind blue-500 buttons
- more than one accent color
- emoji as icons (use lucide-react)
- placeholder gray boxes instead of real empty states

Every component you generate afterwards must reference these tokens.
If I ask for a new screen, re-read DESIGN.md first.
```

### Prompt 1 — Premium Analytics / SaaS Dashboard

> Source pattern: Superdesign dashboard prompt + Rocket 3-layer framework (context → design intent → specifics) + ui-prompts "scale correction" rules.

```text
Build [DASHBOARD NAME] — a [DOMAIN, e.g. "crypto portfolio" / "fleet tracking" /
"marketing analytics"] dashboard for [USER ROLE, e.g. "a trading desk operator"].

Stack: Next.js (App Router) + Tailwind + shadcn/ui + Recharts v3 (via shadcn chart
components). Numbers in a mono font. Dark theme by default with a light toggle.

Visual thesis: calm, precise, operator-facing, quietly dense — like a mature product,
not a concept shot. Follow DESIGN.md exactly.

Layout (desktop 1512px is the rendering target — it must feel NATIVE at that size,
not like a shrunken screenshot):
- Left sidebar, min 240px, never narrower: logo, nav groups with lucide icons,
  user block pinned to bottom.
- Top strip: page title, global date-range picker, search (cmd+K), notification bell.
- KPI strip: exactly [4] stat cards in ONE row (never wrap to two rows on desktop):
  [METRIC 1], [METRIC 2], [METRIC 3], [METRIC 4] — each with value, % change vs
  previous period (green/red + arrow), and a tiny sparkline.
- Main analytical row: [PRIMARY CHART, e.g. "area chart of revenue over time"]
  taking 2/3 width, and [SECONDARY PANEL, e.g. "donut of category breakdown"] 1/3.
- Bottom: dense data table, 32px row height, sticky header, sortable columns,
  row hover state, pagination. Columns: [COL LIST].

Non-negotiables:
- Include loading (skeletons matching real layout), empty (helpful, with a CTA,
  not a sad illustration), and error states for every data region.
- Show me the mobile reflow (sidebar becomes bottom sheet or drawer).
- No hero sections, no gradients, no decorative cards. Whitespace ~16px rhythm,
  not airy 48px marketing spacing.
- One accent color total, used only for primary actions and active states.

Final quality test before you finish: does the KPI strip stay on one row at 1512px?
Does the sidebar feel like real product nav? Does it read as a command center,
not an infographic? Take a screenshot and compare against these criteria.
```

### Prompt 2 — Awwwards-Style Landing Page / Portfolio (WebGL + scroll)

> Source pattern: techniques pulled from Creative-Folio and folio-2026 GitHub repos + Codrops Shader.se writeup + the 2026 Lenis/GSAP stack article.

```text
Build a landing page / portfolio for [PROJECT/PERSON] that feels like an
Awwwards site-of-the-day, but performs well on a mid-range phone.

Stack: Next.js + Tailwind + Lenis (smooth scroll) + GSAP ScrollTrigger (all GSAP
plugins are free now) + Motion (motion/react) for component enter/exit +
React Three Fiber + drei for one WebGL moment.

Wire Lenis into GSAP the canonical way:
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

The experience:
1. HERO — full-viewport WebGL fragment shader background: [PICK ONE:
   "cursor-attracted fbm noise field with a warm/cool color ramp, subtle film
   grain and vignette" / "animated gradient mesh — overlapping radial gradients
   drifting on Lissajous curves" / "curl-noise fluid displacement behind the
   headline with mix-blend-screen"]. Headline set in [DISPLAY FONT], animated
   in with a per-character stagger (translate-y + clip-path reveal).
2. SCROLL STORY — 3–4 pinned sections with GSAP ScrollTrigger: images scale
   from 0.9→1, text parallax at different speeds, one horizontal-scroll strip
   for [WORK/FEATURES].
3. MICRO-DETAILS — custom cursor with a lagging ghost dot; magnetic hover on
   buttons; text scramble on nav links; marquee band of [LOGOS/KEYWORDS].
4. CTA/FOOTER — oversized type, hover reveals [CONTACT/EMAIL] with a chromatic
   aberration flicker driven by cursor velocity.

Performance & accessibility rules (non-negotiable):
- One WebGL context total. Cap canvas DPR at 1.5. Pause rendering when the
  canvas is off-screen (IntersectionObserver).
- Shader gracefully no-ops to a static gradient when WebGL is unavailable.
- All motion inside prefers-reduced-motion guards: gsap.matchMedia() and
  useReducedMotion(). Reduced-motion users get instant, static layouts.
- Lighthouse performance ≥ 90 on mobile. If an effect breaks that, cut the
  effect, not the layout.
```

### Prompt 3 — Live Map Dashboard (free stack, no credit card)

> Source pattern: MapLibre recommendation from PkgPulse Maps 2026 guide + free tile providers verified in Part 3.

```text
Build [APP NAME] — a live map application showing [WHAT, e.g. "aircraft over
Europe" / "delivery vehicles" / "earthquakes"].

Map stack (100% free, no credit card):
- MapLibre GL JS (MIT-licensed Mapbox fork, WebGL vector tiles, no API key
  for rendering) via react-map-gl.
- Basemap tiles from OpenFreeMap (https://openfreemap.org — public instance,
  no key, no usage limits) with a dark style, OR MapTiler free tier
  (100k tiles/month) if we need their styles.
- Geocoding: [Nominatim at 1 req/s with a proper User-Agent + caching /
  Geoapify free tier 3,000 credits/day] — never hammer Nominatim.

Features:
- Live markers updating every [N] seconds from [API — see api list],
  animated position transitions (no teleporting pins).
- Click a marker → glassmorphic detail panel slides in from the right
  (backdrop-blur 12px, semi-transparent tint layer under the text for
  legibility, 1px white/10 border) — glass on the floating panel ONLY,
  solid surfaces everywhere data is dense.
- Cluster markers past [50] visible points. Bbox-filter API requests to the
  current viewport — never fetch the whole world.
- A collapsible left stats rail: total visible, top [CATEGORY], last-update
  timestamp with a pulsing live dot.
- Attribution for the tile provider and data source visible in the corner
  (required by their licenses).

States: skeleton map shimmer while tiles load, "no data in this area" empty
state, and a reconnecting banner when the feed drops (exponential backoff
starting at 1s, max 30s).
```

### Prompt 4 — Real-Time Streaming Dashboard (WebSocket)

> Source pattern: Finnhub/Binance WebSocket free tiers (verified in Part 3) + dashboard density rules from Prompt 1.

```text
Build a real-time [ASSET/DOMAIN] dashboard streaming live data over WebSocket.

Data (free, verified):
- [Binance WSS wss://stream.binance.com:9443 — no key needed for public
  market streams / Finnhub WSS — free key, up to 30 symbols].
- Fallback to REST polling every 10s if the socket fails; show a
  "reconnecting" pill with attempt count. Exponential backoff 1s→30s.

UI behavior that makes it feel ALIVE:
- Price cells flash green/red on tick (150ms fade) — background flash, not
  text color change.
- A streaming sparkline/area chart that appends points smoothly (use Apache
  ECharts if points exceed ~5k, otherwise Recharts).
- Numbers in mono font, tabular-nums, so columns don't jitter.
- Connection status dot: green pulsing = live, amber = reconnecting,
  red = down. Show ms latency next to it.
- Batch DOM updates: buffer socket messages and render at most every 250ms —
  never re-render per message.

Layout follows Prompt 1 rules (dense, one accent, dark, empty/loading/error
states, 32px table rows).
```

### Prompt 5 — The Screenshot–Compare–Refine Loop (run AFTER any UI prompt)

> Source pattern: Superdesign's feedback-loop prompt — the highest-leverage step.

```text
Now render the app, take a screenshot of [SCREEN] at 1512x861 and at 390px
wide, and critique your own output against DESIGN.md and the original spec:

1. Is spacing consistent with the 8px grid? Name every violation.
2. Is exactly one accent color present? List any stray colors.
3. Do the empty, loading, and error states exist and look intentional?
4. Does anything look like the forbidden defaults (purple gradient, centered
   hero, three-card row, default blue buttons)?
5. Does desktop feel native (not a shrunken screenshot)? Is any text under
   13px? Any KPI row wrapping?

Fix everything you found, then screenshot again and show me before/after.
Do not ask me for approval between fixes — loop until all five checks pass.
```

### Prompt 6 — Tasteful Glassmorphism Block (drop into any prompt)

> Source pattern: Setproduct 2026 glass guide + UX Collective 2026 trends accessibility notes.

```text
Glass treatment rules for this project:
- Glass ONLY on: top nav, modals, floating action panels, toasts. NEVER on
  data tables, forms, or dense content — those get solid surfaces.
- Recipe: background rgba(255,255,255,0.08) on dark (0.55 on light),
  backdrop-filter: blur(12px) saturate(1.4), 1px border white/15,
  plus a subtle inner top highlight (inset 0 1px 0 white/10).
- Always layer a semi-transparent solid tint behind text — blur alone fails
  WCAG contrast on uncontrolled backgrounds.
- @supports not (backdrop-filter: blur(1px)) → fall back to a solid surface.
- Max [3] glass panels visible at once (GPU cost). Respect
  prefers-reduced-transparency by swapping glass for solid.
```

### Prompt 7 — Bento Grid Feature/Marketing Section

> Source pattern: Rajesh R Nair 2026 trends (bento grids are what's actually shipping).

```text
Add a bento grid section presenting [FEATURES/STATS/PROJECTS]:
- CSS grid, 12 columns, 16px gap. Cells span asymmetrically: one 2x2 hero
  cell, two 2x1, rest 1x1 — no uniform three-card rows.
- Each cell: solid surface, 1px border, 16px radius, content-first (real
  numbers, real micro-demos, a tiny live chart or animated counter — not
  icon + title + lorem).
- On hover: border brightens to accent/40 and content shifts 2px up,
  150ms ease. One cell may contain a subtle looping visual
  ([sparkline / mini globe / animated keyboard]), muted colors.
- Collapses to a single column on mobile in a deliberate order (hero cell
  first), not source order.
```

---

## PART 3 — Free & Freemium APIs (limits verified July 2026)

> Rate limits change often — the doc links are the source of truth. "Verified" = checked against live docs/current comparisons during this research.

### Maps / Geo

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **MapLibre GL JS** | WebGL vector-tile map rendering library (MIT fork of Mapbox GL) | Free forever, no key for rendering | No | [maplibre.org](https://maplibre.org/) — rec. per [PkgPulse 2026 guide](https://www.pkgpulse.com/guides/mapbox-vs-leaflet-vs-maplibre-interactive-maps-2026) |
| **OpenFreeMap** | Hosted OSM vector basemap tiles | Unlimited public use, donation-funded | No | [openfreemap.org](https://openfreemap.org/) |
| **MapTiler Cloud** | Tiles, styles, geocoding | 100,000 tile requests/mo; service stops (no surprise bill) on overage | Yes | [maptiler.com/cloud](https://www.maptiler.com/cloud/) |
| **Mapbox** | Maps, geocoding, directions | 50k map loads/mo (web), 100k geocoding req/mo, 100k directions req/mo | Yes | [mapbox.com/pricing](https://www.mapbox.com/pricing) |
| **Geoapify** | Geocoding, routing, places, tiles | 3,000 credits/day, limited commercial use OK | Yes | [geoapify.com](https://www.geoapify.com/) |
| **Nominatim (OSM)** | Forward/reverse geocoding | Free, absolute max 1 req/s, custom User-Agent required, cache results; no bulk | No | [Usage policy](https://operations.osmfoundation.org/policies/nominatim/) |
| **OpenCage** | Geocoding, GDPR-friendly, 40+ SDKs | 2,500 req/day | Yes | [opencagedata.com](https://opencagedata.com/) |
| **US Census Geocoder** | US address geocoding, batch up to 10k records | Free, no key, reasonable use | No | [geocoding.geo.census.gov](https://geocoding.geo.census.gov/geocoder/) |
| **ip-api.com** | IP → location | 45 req/min (HTTP on free tier) | No | [ip-api.com/docs](https://ip-api.com/docs) |

### Live / Real-Time Data

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **Binance (direct)** | Crypto prices — REST + **WebSocket streams** | 1,200 req/min REST; free WSS for public market data | No (public data) | [binance-docs.github.io](https://developers.binance.com/docs/binance-spot-api-docs) |
| **Finnhub** | US stocks — real-time quotes + **WebSocket** | 60 calls/min, ~300/day REST; WSS up to 30 symbols; incl. pre/post-market | Yes (free) | [finnhub.io/docs/api](https://finnhub.io/docs/api) |
| **CoinGecko** | Crypto aggregate data, 14k+ coins | 30 req/min, no daily cap (no WSS) | Demo key | [docs.coingecko.com](https://docs.coingecko.com/) |
| **Open-Meteo** | Weather forecasts, 30+ models, history to 1940 | 10,000 calls/day non-commercial, CC BY 4.0 | No | [open-meteo.com/en/docs](https://open-meteo.com/en/docs) |
| **OpenSky Network** | Live aircraft positions (ADS-B) | Credit system: 400 credits/day anonymous, 4,000/day registered; non-commercial | Optional | [openskynetwork.github.io/opensky-api](https://openskynetwork.github.io/opensky-api/rest.html) |
| **USGS Earthquakes** | Live global earthquake GeoJSON feeds (updated ~1 min) | Free, no key | No | [earthquake.usgs.gov/fdsnws/event/1](https://earthquake.usgs.gov/fdsnws/event/1/) |
| **Where the ISS at?** | Live ISS position (HTTPS) | ~1 req/s, no key | No | [wheretheiss.at/w/developer](https://wheretheiss.at/w/developer) |
| **TerminalFeed** | One-call world snapshot: crypto, stocks, quakes, news, service status | Free, no key, cached 15s–10min per endpoint | No | [terminalfeed.io/developers](https://terminalfeed.io/developers) |
| **Frankfurter** | Currency exchange rates (ECB) | Free, no key | No | [frankfurter.dev](https://frankfurter.dev/) |

### Images / Media

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **Unsplash** | Premium photos | 50 req/hr demo → 5,000 req/hr after production approval; hotlinking + attribution required | Yes | [unsplash.com/documentation](https://unsplash.com/documentation) |
| **Pexels** | Photos + videos | 200 req/hr, 20,000 req/mo; unlimited free on request if terms met | Yes | [pexels.com/api/documentation](https://www.pexels.com/api/documentation/) |
| **Pixabay** | Photos, videos, illustrations | 100 req/60s; cache required, no permanent hotlinking | Yes | [pixabay.com/api/docs](https://pixabay.com/api/docs/) |
| **Lorem Picsum** | Placeholder images | No published limit | No | [picsum.photos](https://picsum.photos/) |

### AI / ML Enrichment

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **Hugging Face Inference Providers** | Unified API to 38k+ models (text, image, embeddings) across 15+ providers | $0.10/mo credits free users; $2/mo on PRO ($9/mo) + pay-as-you-go; PRO adds 25 min/day H200 ZeroGPU | Yes (HF token) | [huggingface.co/docs/inference-providers/pricing](https://huggingface.co/docs/inference-providers/en/pricing) |
| **Transformers.js** | Run HF models **in the browser** (WebGPU/WASM) — zero API cost, zero key: sentiment, embeddings, image classification | Unlimited (client-side) | No | [huggingface.co/docs/transformers.js](https://huggingface.co/docs/transformers.js/index) |
| **Google Gemini API** | LLM, vision, embeddings | Free tier with per-model daily/rpm quotas (check live limits page — changes frequently) | Yes | [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits) |

### Reference / Misc (all keyless)

| API | What it does | Limit | Docs |
|---|---|---|---|
| **REST Countries** | Country metadata, flags, currencies, languages | Unlimited | [restcountries.com](https://restcountries.com/) |
| **Open Library** | Book metadata + covers | Fair use | [openlibrary.org/developers/api](https://openlibrary.org/developers/api) |
| **Hacker News (Firebase)** | Stories, comments, live top lists | Unlimited | [github.com/HackerNews/API](https://github.com/HackerNews/API) |
| **GitHub REST** | Repos, users, code search | 60 req/hr unauth, 5,000/hr with token | [docs.github.com/rest](https://docs.github.com/en/rest) |
| **Zippopotam.us** | Postal code ↔ place (~60 countries) | Unlimited | [zippopotam.us](https://www.zippopotam.us/) |

---

## PART 4 — The stack cheat-sheet (what to name in prompts, 2026)

- **UI base:** Next.js App Router + Tailwind + shadcn/ui.
- **Charts:** Recharts v3 via shadcn chart components (default) → Apache ECharts for >5k points or realtime streams → visx only for fully bespoke viz. ([LogRocket 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/))
- **Scroll & motion:** Lenis 1.3+ (smooth scroll) + GSAP ScrollTrigger (scroll-bound, all plugins free) + Motion `motion/react` (component enter/exit) + native CSS scroll-driven animations for simple parallax. Never combine Lenis with GSAP ScrollSmoother. ([Adamarant 2026](https://adamarant.com/en/blog/immersive-web-stack-in-2026-lenis-gsap-and-what-to-skip))
- **3D/WebGL:** React Three Fiber + drei + @react-three/postprocessing; ShaderGradient for declarative gradient shaders without writing GLSL.
- **Maps:** MapLibre GL JS + react-map-gl + OpenFreeMap/MapTiler tiles.
- **Icons:** lucide-react. **Fonts:** one display + one UI sans + one mono, via next/font.
- Everything animated respects `prefers-reduced-motion`.

---
---

# EXPANSION PACK (round 2 research, July 2026)

## PART 5 — More techniques that make a project look expensive

| # | Technique | Source | The gist |
|---|---|---|---|
| 14 | **Motion as design tokens** — spring constants, durations, and curves documented like type/color | [Creative Alive — Micro-Interactions 2026](https://creativealive.com/micro-interactions-2026-motion-ux-rules/) | Products that treat motion as afterthought polish now read as dated |
| 15 | **The 60/30/10 easing ratio** — 60% workhorse ease-out, 30% snap/ease-in exits, 10% springs/drama | [baraa.app — Easing curves are a design language](https://www.baraa.app/blog/easing-curves-are-a-design-language) | Keeps UI calm, reserves expressiveness for moments that matter |
| 16 | **Named easing/duration table** — hover 100–150ms, toggles 200–300ms, modals 300–500ms, nothing over 600ms | [KitLab — cubic-bezier guide 2026](https://kitlab.app/en/blog/cubic-bezier-css-easing-guide-2026) | Perceived quality is mostly the curve: `cubic-bezier(0.4,0,0.2,1)` feels "pro", default linear feels "cheap" |
| 17 | **Shimmer skeletons** — gradient sweep at 200% width over 1.5s, not opacity pulses | [Rune Hub — Premium UX Patterns 2026](https://rune.codes/hub/tech-trends/ui-micro-interactions-the-details-that-make-apps-feel-premium) | The difference between "prototype" and "product" |
| 18 | **Modern CSS replaces JS libraries** — `:has()`, container queries, nesting, `oklch()`/`color-mix()`, `text-wrap: balance/pretty` are production-ready everywhere; View Transitions (same-document) and scroll-driven animations as progressive enhancement | [dev.to — Modern CSS 2026](https://dev.to/alexcloudstar/modern-css-in-2026-the-javascript-you-can-finally-delete-2l15), [CODERCOPS — State of CSS 2026](https://www.codercops.com/blog/state-of-css-2026) | One team deleted a 45KB scroll library + 900-line color system this way |
| 19 | **`@starting-style` entry animations** — animate from `display: none` without JS timing hacks | [modern-css.com — What's New 2026](https://modern-css.com/whats-new-in-css-2026/) | Native dialog/toast entrances, zero JavaScript |
| 20 | **Aurora gradient backgrounds done right** — 3–5 blurred radial-gradient blobs (blur 80–100px), each drifting via `transform`+`opacity` on different cycle lengths (14–25s), `mix-blend-mode: screen`; never animate gradient stops | [Animation Patterns — Aurora gradient](https://animationpatterns.art/animations/aurora-gradient-sweep/), [RageDesigner — 2026 trends](https://ragedesigner.com/2026-design-trends) | Compositor-only work = 60fps; this is "the background glassmorphism needs" |
| 21 | **Noise/grain overlay** — SVG noise at ~1.5% opacity over solid backgrounds | [Alex Mayhew — Neo-Brutalism guide](https://alexmayhew.dev/blog/neo-brutalism-developer-guide), [Fireart — 2026 trends](https://fireart.studio/blog/the-best-web-design-trends/) | "Shouldn't be visible — it should be felt"; fakes physical texture without WebGL cost |
| 22 | **Neo-brutalism (when you want anti-generic)** — hard shadows `4px 4px 0 #000`, 3–4px borders, 0 radius, 2-color palette, mono type | Alex Mayhew (above) | Works for portfolios/creative tools/indie products; skip for enterprise/health |
| 23 | **Kinetic/variable typography** — variable font weight/width mapped to scroll position; viewport-scaled headlines replacing hero images | Fireart, [LogDart — Tactile Brutalism](https://codewithlog.com/blog/the-aesthetic-of-precision-mastering-tactile-brutalism-in-2026/) | Typography as the interface, one file, no image weight |
| 24 | **OKLCH dark mode as a separate design, not an inversion** — near-black tinted bg (L≈0.10), off-white text (L≈0.93), chroma −15–25% on accents, surface ladder in 3–5 L steps | [Zepixo — Dark palette guide](https://www.zepixo.com/blog/dark-mode-color-palette), [ColorUI — Dark Mode Done Right](https://colorui.io/blog/dark-mode-done-right) | Auto-inverted palettes look amateur ("gray soup") |

## PART 6 — More prompts

### Prompt 8 — The Micro-Interaction Polish Pass (run on any finished UI)

> Source pattern: Rune Hub premium patterns + KitLab easing table + baraa.app easing ratio.

```text
Do a full micro-interaction polish pass on the existing UI. Motion is a design
token, not decoration. Add a motion section to DESIGN.md first:

- Easing tokens: --ease-out: cubic-bezier(0.33, 1, 0.68, 1) (the workhorse,
  ~60% of animations); --ease-in: cubic-bezier(0.32, 0, 0.67, 0) (exits only);
  --ease-spring: spring(stiffness 400, damping 15) via Motion (reserve for
  ~10%: modals, toasts, drag settle).
- Duration tokens: hover/focus 100-150ms, toggles/accordions 200-300ms,
  modals/drawers 300-500ms. NOTHING over 600ms.

Then apply:
1. Buttons: scale 0.97 on press, 2px lift + shadow deepen on hover. Springy,
   immediate.
2. Cards: 4px translate-y lift on hover, border brightens, child arrow/heading
   animates in sync via group-hover. 200ms ease-out.
3. Skeletons: replace any opacity-pulse placeholders with a shimmer — a
   gradient highlight 200% of element width sweeping left over 1.5s, matching
   the real content's exact layout.
4. Form errors: 200ms horizontal shake (3 oscillations) + border to danger
   color + inline message slides down. Never a browser alert.
5. Numbers/KPIs: count up on first view (600ms max, ease-out), tabular-nums.
6. Toasts: enter with easeOutBack cubic-bezier(0.34, 1.56, 0.64, 1), exit
   ease-in. Stack with 8px offset.
7. Only animate transform, opacity, and (sparingly) box-shadow — nothing that
   triggers layout. CSS transitions where possible; Motion only for springs,
   exits, and gestures.
8. Everything inside prefers-reduced-motion guards — reduced users get
   crossfades or instant changes.
```

### Prompt 9 — Modern CSS Block (paste into any project prompt)

> Source pattern: dev.to Modern CSS 2026 + CODERCOPS State of CSS + modern-css.com.

```text
Use 2026-baseline CSS instead of JavaScript wherever possible:
- :has() for parent/conditional styling (universal support — no fallback needed).
- Container queries for component responsiveness instead of viewport media
  queries on reusable components.
- text-wrap: balance on headings, text-wrap: pretty on body copy.
- Colors in oklch() with color-mix() for hover/active derivations and
  light-dark() for theming.
- Scroll reveal via CSS scroll-driven animations (animation-timeline: view())
  wrapped in @supports (animation-timeline: view()) — falls back to visible
  content, and delete any IntersectionObserver fade-in code it replaces.
- Same-document View Transitions API for tab/list/state changes; @starting-style
  for dialog and toast entry animations from display:none.
- Popover API + anchor positioning for tooltips/menus instead of a floating
  UI library, where support allows (progressive enhancement).
No JS scroll listeners for anything CSS can do on the compositor.
```

### Prompt 10 — Aurora + Grain Hero (the tasteful alternative to WebGL)

> Source pattern: Animation Patterns aurora technique + RageDesigner blob specs + noise overlay from Neo-Brutalism guide.

```text
Build a hero section with an aurora gradient background — pure CSS, no WebGL:
- 4 oversized radial-gradient blobs ([COLOR 1], [COLOR 2], [COLOR 3],
  [COLOR 4] — pick from DESIGN.md, low chroma), each blurred 80-100px,
  positioned partially off-canvas.
- Animate each blob's transform (translate + slight scale) on different cycle
  lengths: 14s, 17s, 22s, 25s, so the pattern never visibly repeats.
  mix-blend-mode: screen for additive light mixing. NEVER animate the
  gradient stops themselves — transform/opacity only (compositor work).
- Overlay: SVG fractal noise at 1.5% opacity, full-bleed, pointer-events none
  — felt, not seen.
- Foreground: headline on a legibility surface (subtle solid tint) so the
  aurora never fights the text. text-wrap: balance on the headline.
- Reduced motion: blobs freeze at a pleasant static composition.
- This is a hero/header treatment only — do not run ambient motion behind
  dense text or forms.
```

### Prompt 11 — Neo-Brutalist Project (anti-generic direction)

> Source pattern: Alex Mayhew's developer guide + RageDesigner constraint system.

```text
Build [PROJECT] in a polished neo-brutalist style (deliberate, not careless):
- Palette: [#111111]-class ink + [#f5f5f0]-class paper + ONE saturated accent
  [#HEX]. Nothing else.
- Hard shadows only: 4px 4px 0px #000 on cards/buttons; on press, the element
  translates 4px into its shadow (shadow collapses to 0) — tactile click.
- Borders 3px solid, border-radius 0 everywhere. Expose the box model.
- Type: oversized grotesque for headlines, monospace for data/labels/buttons.
  Left-aligned, never centered blocks.
- Hover states: instant color inversion (background↔text), 80ms or none.
- Texture: SVG noise overlay at 1.5% opacity for a screen-printed feel.
- FORBIDDEN: soft/blurred shadows, gradients, backdrop-filter, rounded-*,
  opacity < 1 on surfaces, pure black backgrounds.
- Keep full accessibility: real focus rings (3px accent outline), WCAG AA
  contrast, semantic HTML.
```

### Prompt 12 — Kinetic Typography Section

> Source pattern: Fireart 2026 trends + LogDart tactile brutalism typography.

```text
Add a typography-driven section for [MESSAGE/MANIFESTO]:
- One variable font ([e.g. "Fraunces" or "Inter" variable]) — map font weight
  (300→800) and width to scroll progress via a CSS scroll-driven animation
  (animation-timeline: view()), with a JS ScrollTrigger fallback inside
  @supports not.
- Headline scaled to the viewport (clamp(3rem, 12vw, 11rem)), text-wrap:
  balance, tight leading (0.95).
- Words reveal on scroll with a per-word stagger (60ms) — translate-y 20px +
  opacity, each word slightly delayed so it reads as hand-set type.
- One accent word per headline gets [italic serif / the accent color / an
  animated underline draw].
- No hero image — the type IS the visual. Reduced motion: static text at
  final weight.
```

### Prompt 13 — OKLCH Dark Mode Token System

> Source pattern: Zepixo + Brainy Papers + ColorUI dark mode guides.

```text
Create the color system as OKLCH semantic tokens with light and dark as two
value sets of the SAME tokens (swap via data-theme attribute + 
prefers-color-scheme default). Dark is designed, not inverted:

- Dark background floor: near-black with a subtle [warm/cool] tint,
  oklch(0.10-0.11 ~0.01 [HUE]) — never pure black.
- Surface ladder upward in ~4 L steps: bg → surface (0.14) → elevated (0.18)
  → overlay (0.22). Borders one step above their surface.
- Text: primary oklch(0.93 ...) (off-white, never pure white), secondary
  ~0.65-0.70, disabled ~0.42.
- Accent: keep the hue from light mode, raise L, DROP chroma 15-25% so it
  doesn't burn on dark. Derive hover/active states with color-mix(in oklch).
- Status colors re-derived for dark the same way (lighter, less chroma).
- Validate every text/surface pair: WCAG 2.2 AA minimum (4.5:1 body text,
  3:1 UI), and re-test the dark set separately — never trust the light
  ratios. List the computed ratios in a comment in the tokens file.
```

### Prompt 14 — Performance Budget Block (paste into any build prompt)

> Source pattern: Core Web Vitals 2026 guides (pagespeedmatters.com, corewebvitals.io, digitalapplied.com).

```text
Hold these Core Web Vitals budgets — treat them as failing tests:
- LCP ≤ 2.5s: preload the hero/LCP image with fetchpriority="high", serve
  AVIF/WebP, NEVER lazy-load the LCP element; lazy-load everything below
  the fold.
- INP ≤ 200ms: break any main-thread task over 50ms (scheduler.yield),
  defer third-party scripts, debounce input handlers, buffer high-frequency
  updates (sockets) and render at most every 250ms.
- CLS ≤ 0.1: explicit width/height (or aspect-ratio) on every image, video,
  iframe, and ad/embed slot; reserve space for async content; fonts with
  font-display: swap PLUS size-adjust/ascent-override/descent-override on the
  fallback so the swap doesn't reflow.
- Fonts: self-host, subset to used glyphs, preload the one critical file.
- Animate only transform/opacity. No scroll listeners where CSS scroll-driven
  animations work.
- Run Lighthouse (mobile) when done and report the three numbers to me. If any
  budget fails, fix and re-run — don't hand it back failing.
```

## PART 7 — More free APIs (verified July 2026)

### Entertainment / Media / Culture

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **TMDB** | Movies, TV, people — posters, metadata, discovery | Free with mandatory attribution; soft limit ~40 req/s per IP. Commercial license $149/mo above $1M revenue | Yes | [developer.themoviedb.org](https://developer.themoviedb.org/docs) |
| **Open Library** | Books, covers, authors | Fair use, no key | No | [openlibrary.org/developers/api](https://openlibrary.org/developers/api) |
| **NASA Open APIs** (APOD, Mars photos, NeoWs, EONET, EPIC…) | Space imagery + data; several sub-APIs need no key at all (EONET, EPIC, Image Library) | `DEMO_KEY`: 30/hr, 50/day; free registered key: 1,000/hr | Free key (some endpoints keyless) | [api.nasa.gov](https://api.nasa.gov/) |

### News

| API | What it does | Free tier | Commercial use? | Docs |
|---|---|---|---|---|
| **The Guardian Open Platform** | Full article text from one high-quality outlet | Developer tier ~5,000 calls/day, 12/s | Non-commercial on free key, attribution required | [open-platform.theguardian.com](https://open-platform.theguardian.com/) |
| **Currents API** | Multi-source aggregator, 22k+ sources | ~600 req/day, no credit card | Yes (per 2026 comparisons — verify ToS) | [currentsapi.services](https://currentsapi.services/) |
| **NewsData.io** | Aggregator, 89 languages | 200 credits/day (1 credit ≈ 1 article, ~10 results/req) | Yes | [newsdata.io/documentation](https://newsdata.io/documentation) |
| **GNews** | Google-News-style headlines | ~100 req/day, 10 articles/req | Restricted — non-commercial on free | [gnews.io/docs](https://gnews.io/docs/v4) |
| **NewsAPI.org** | Biggest source index (80k+) | 100 req/day — **localhost/dev only, no production** | No | [newsapi.org/docs](https://newsapi.org/docs) |

### Environment / Science / Sports

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **OpenAQ** | Global air quality measurements | 60 req/min, 2,000/hr | Yes (free) | [docs.openaq.org](https://docs.openaq.org/) |
| **USGS Earthquakes** | Live earthquake GeoJSON | Free, no key | No | [earthquake.usgs.gov](https://earthquake.usgs.gov/fdsnws/event/1/) |
| **football-data.org** | Football scores, fixtures, standings (major competitions) | 10 req/min registered free plan | Yes (free) | [docs.football-data.org](https://docs.football-data.org/general/v4/index.html) |

### Free infrastructure tiers (for the backend of any project)

| Service | What you get free | Watch out for | Docs |
|---|---|---|---|
| **Supabase** | 500MB Postgres + auth (50k MAU) + 1GB storage + realtime (200 conns) + 500k edge fn invocations | Projects pause after 1 week idle (manual restore); 2 active projects | [supabase.com/pricing](https://supabase.com/pricing) |
| **Neon** | Serverless Postgres: up to 100 projects × 0.5GB, 100 CU-hrs/mo, branching, scale-to-zero (~570ms wake) | DB only — no bundled auth/storage/realtime (Neon Auth is new) | [neon.tech/pricing](https://neon.tech/pricing) |
| **Cloudflare** | Workers 100k req/day (<5ms cold start), D1 SQLite 5GB, R2 10GB with $0 egress, Pages unlimited bandwidth | D1 is SQLite not Postgres; 10ms CPU cap per request on free Workers | [developers.cloudflare.com](https://developers.cloudflare.com/workers/platform/pricing/) |
| **Vercel Hobby** | Next.js hosting, 100GB bandwidth, serverless functions | No free database — pair with Supabase/Neon; non-commercial | [vercel.com/pricing](https://vercel.com/pricing) |

> Comparisons sourced from [AgentDeals DB free-tier comparison 2026](https://agentdeals.dev/database-free-tier-comparison-2026), [DevToolReviews D1 vs Neon vs Supabase](https://www.devtoolreviews.com/reviews/cloudflare-d1-vs-neon-vs-supabase-postgres-2026), [CodePick Cloudflare vs Vercel vs Supabase](https://codepick.dev/en/practices/cloudflare-vs-vercel-vs-supabase/).

## PART 8 — Best practices checklist (bake into every project)

**Performance (Core Web Vitals — Google ranking signals, measured on real users):**
- LCP ≤ 2.5s / INP ≤ 200ms / CLS ≤ 0.1 at the 75th percentile. INP is the most-failed vital in 2026 (~43% of sites). ([digitalapplied.com](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide))
- The three highest-impact fixes: preload LCP image with `fetchpriority="high"` + AVIF/WebP; width/height on every image; defer third-party scripts. ([pagespeedmatters.com](https://www.pagespeedmatters.com/resources/guides/complete-core-web-vitals-guide))
- Fonts: self-host, subset (100KB+ → under 20KB), preload the critical file, `font-display: swap` + metric overrides (`size-adjust`, `ascent-override`) so the swap doesn't shift layout. ([corewebvitals.io checklist](https://www.corewebvitals.io/core-web-vitals/ultimate-checklist))

**Motion & accessibility:**
- ~35% of users have some motion sensitivity — every animation needs a reduced variant (crossfade or instant), gated by `prefers-reduced-motion`. Not optional. ([Creative Alive](https://creativealive.com/micro-interactions-2026-motion-ux-rules/))
- Animate `transform`/`opacity` only; entrances ease-out, exits ease-in; nothing over 600ms.

**Color & theming:**
- Semantic tokens (`--color-surface`, not raw hex in components), OKLCH values, light/dark as two value sets of the same tokens via `data-theme`.
- WCAG 2.2 AA minimum (4.5:1 body, 3:1 UI), re-validated separately for dark mode; APCA as a supplementary check. ([socialanimal.dev color system guide](https://socialanimal.dev/blog/build-color-system-web-design-2026/))

**API hygiene (keeps free tiers free):**
- Cache aggressively (respect each API's cache headers/policy — Nominatim and Pixabay require it).
- Exponential backoff on 429s (1s → 30s cap); read `X-RateLimit-Remaining` headers where offered (Pexels, Unsplash, OpenSky).
- Keys in `.env`, never in client code — proxy through a route handler / Cloudflare Worker; bbox/viewport-filter geo requests.
- Attribution where required: TMDB (mandatory logo/link), Unsplash (photographer + hotlinks), Open-Meteo (CC BY 4.0), OSM tiles (© OpenStreetMap), Guardian.
- Re-verify free-tier limits from live docs before building anything production on them — several providers (PlanetScale) have removed free tiers entirely with little warning.

---
---

# EXPANSION PACK 2 (round 3 deep research, July 2026)

## PART 9 — Even more techniques: where dashboards are actually heading in 2026

| # | Technique / Pattern | Source | The gist |
|---|---|---|---|
| 25 | **Prescriptive over descriptive dashboards** — surface a recommended next action next to the metric, not just the metric | [Fuselab Creative — 2026 Data Viz Trends](https://fuselabcreative.com/top-data-visualization-trends-2026/) | 2026's dashboards are shifting from "here's what happened" to "here's what to do about it" — an action chip beside a KPI reads as far more current than a bare number |
| 26 | **Conversational / natural-language query bar** — a chat-style input above the dashboard that lets the user ask "show me revenue by region last quarter" and get a chart back | [Luzmo — Data Viz Trends 2026](https://www.luzmo.com/blog/data-visualization-trends), [ThoughtSpot — AI Data Viz Tools](https://www.thoughtspot.com/data-trends/ai/ai-tools-for-data-visualization) | In Luzmo's 2026 survey of 200+ SaaS leaders, 42% of users want better filtering/drill-down and 38% want personalization baked in — an NLQ bar answers both at once |
| 27 | **Anomaly/deviation call-outs** — a small red/amber flag pinned directly on the chart at the point something deviated from trend, with a one-line plain-English explanation | Fuselab Creative (above) | Surfacing the anomaly on the visual itself (not a buried alerts tab) is what separates a "report" from a "decision tool" |
| 28 | **Role-aware layout density** — the same dashboard shows a compressed single-recommended-action view for an operator and a dense multi-panel view for an analyst, driven by the logged-in role, not a manual toggle | [Fuselab Creative — Dashboard Trends](https://fuselabcreative.com/top-dashboard-design-trends-2025/) | Real field lesson cited in the research: a clinical dashboard that showed a full patient overview by default was ignored — clinicians only used a version stripped down to one recommended action per step |
| 29 | **Time-of-day contextual switching** — the simplest version of "adaptive" dashboards: a summary view in the morning, operational detail view in the afternoon, no calendar/behavioral integration required | Fuselab Creative (above) | Cited as the safest first step into adaptive UI — ship this before anything more ambitious, then only add complexity if users keep it on |
| 30 | **Scrollytelling data narratives** — chart-locked sections that update/annotate as the user scrolls, borrowed from data-journalism (NYT/Pudding-style), now showing up in product dashboards and investor decks | [Scrollytelling.ai guide](https://scrollytelling.ai/scrollytelling-tools/), [Flourish — Scrollytelling](https://flourish.studio/visualisations/scrollytelling/) | Turns a wall of charts into a guided walkthrough — pin a chart with `position: sticky` or GSAP ScrollTrigger, swap/annotate its data as captions scroll past beside it |
| 31 | **Embedded-everywhere charts** — instead of one big "analytics" tab, small charts/sparklines are pushed into the exact workflow moment they're needed (inline in a table row, in a hover card, in a toast) | Luzmo (above) | Matches the 72%-export-to-Excel problem Luzmo found — the fix wasn't a better dashboard page, it was fewer reasons to leave the workflow at all |
| 32 | **Explainable-AI panels** — when a dashboard surfaces a prediction or recommendation, show the confidence score and top contributing factors right next to it, not just the number | [Fuselab Creative — Data Viz Trends 2026](https://fuselabcreative.com/top-data-visualization-trends-2026/) | Lets a non-technical stakeholder interrogate an AI recommendation in place instead of waiting on an analyst |

## PART 10 — More prompts

### Prompt 15 — The Insight Layer (turn any dashboard from descriptive → prescriptive)

> Source pattern: Fuselab Creative prescriptive-dashboard research + explainable-AI panel pattern.

```text
Add an "insight layer" on top of the existing dashboard. This is not another
chart — it's a strip of 2-4 insight cards above or beside the main charts.

Each insight card must contain:
- A one-sentence plain-English finding (e.g. "Enterprise churn jumped 3.5pts
  in March — the sharpest single-month move in the dataset").
- A confidence/severity indicator (color-coded pill: info / watch / urgent).
- A single recommended next action as a small text link or button
  (e.g. "Review March enterprise support tickets →") — never just the number
  with no follow-up.
- On hover/click: expand to show the 2-3 contributing factors behind the
  finding (e.g. "driven by: Plan X renewals down 12%, support response time
  up 40%").

Rules:
- Generate these from the actual data you're rendering (compute real
  deltas/outliers), never invent a finding that isn't in the dataset.
- Pin an anomaly flag directly on the chart at the point of deviation (a
  small marker + one-line label), not just in the card — the flag and the
  card should reference the same event.
- Keep the tone analytical, not alarmist. No emoji, no exclamation points.
- Respect DESIGN.md tokens — severity colors come from the existing
  success/warning/danger tokens, not new ad-hoc colors.
```

### Prompt 16 — Conversational Query Bar (natural-language → chart)

> Source pattern: Luzmo 2026 survey + ThoughtSpot/ Domo conversational-analytics pattern.

```text
Add a natural-language query bar pinned above the dashboard (glass treatment,
per the glassmorphism block, since this is a floating control surface).

Behavior:
- Placeholder text rotates through 3 example queries relevant to this
  dataset (e.g. "Try: revenue by region last quarter").
- On submit, parse the query against the known schema of [DATASET/FIELDS]
  and render the matching chart type (bar for comparisons, line for trends
  over time, table for lists) directly below the bar — don't navigate away.
- If the query is ambiguous, ask ONE clarifying question as a small inline
  chip-select (e.g. "Weekly or monthly?") rather than guessing silently.
- Keep a small history strip of the last 3 queries as clickable chips so the
  user can re-run or tweak a previous one.
- If [LLM API — e.g. Hugging Face Inference or Gemini free tier] is
  available, use it for the parsing step; otherwise implement a rule-based
  fallback that matches on field names, common date ranges, and chart-type
  keywords ("trend", "compare", "breakdown", "top N").
- Never let the query bar execute anything beyond read-only chart rendering.
```

### Prompt 17 — Scrollytelling Data Narrative

> Source pattern: Scrollytelling.ai + Flourish scrollytelling pattern, adapted for a coded (not no-code) build.

```text
Build a scrollytelling section that walks the reader through [DATA STORY —
e.g. "how usage grew across 4 product launches"].

Structure:
- A chart/visual pinned via position: sticky (or GSAP ScrollTrigger `pin`)
  on one side of the viewport (60% width on desktop, full-bleed background
  on mobile with the text overlaid on a legibility scrim).
- 4-6 short caption "beats" scroll past on the other side, each one
  triggering the pinned chart to update: highlight a series, annotate a
  point, zoom into a date range, or swap the chart type entirely.
- Use ScrollTrigger with `scrub: true` for the chart transitions so they
  track scroll position 1:1, not just fire once.
- Each beat is short — one finding per beat, not a paragraph. Numbers in
  mono font, bolded.
- End with a summary beat that unpins the chart into a normal static
  position so the reader can keep exploring after the story ends.
- Reduced motion: skip the scrub-tied transitions, show each beat's final
  chart state as a normal static sequence instead.
- This is for the story/landing moment of a project, not the operational
  dashboard itself — don't scrollytell a live ops screen.
```

### Prompt 18 — Adaptive Role/Time Layout

> Source pattern: Fuselab Creative role-aware + time-of-day contextual dashboard research.

```text
Make the dashboard layout adapt along ONE axis to start (don't combine
multiple adaptive dimensions at once):

OPTION A — Role-aware: given [ROLE A, e.g. "operator"] vs [ROLE B, e.g.
"analyst"], render a compressed single-recommended-action view for Role A
(one KPI, one chart, one action button, nothing else) and the full dense
multi-panel view (per Prompt 1) for Role B. Same underlying data, different
information hierarchy — decide this from the data/role model, not a manual
UI toggle the user has to remember to flip.

OPTION B — Time-of-day: show a compressed summary view (top 3 KPIs, no
table) before [12pm local time] and the full operational detail view (full
table, all charts) after — computed from the client's local time, with a
manual override toggle always visible so the user isn't locked into it.

Pick ONE option above based on [WHICH FITS THE PROJECT], ship it, and note
in a comment that the other axis could be added later once this one is
validated with real usage — don't build both at once.
```

### Prompt 19 — Live Generative/Particle Background (lightweight alternative to WebGL)

> Source pattern: general 2026 generative-background technique (tsParticles/Vanta), paired with the performance-budget rules already in this file.

```text
Add a subtle generative particle background to [HERO/LOGIN/EMPTY STATE] using
tsParticles (MIT, no key, npm install @tsparticles/react) — lighter-weight
than a custom WebGL shader for this use case.

Config:
- Particle count capped at [40-60] on desktop, [15-20] on mobile (test actual
  FPS, don't guess).
- Particles: small dots or thin lines, color from the DESIGN.md accent token
  at low opacity (15-25%), slow drift (speed 0.3-0.6), gentle link-lines
  between nearby particles (max distance ~120px) for a "constellation" feel.
- React to cursor position with a subtle repulse or attract mode (radius
  ~100px) — a nice-to-have, not the focus.
- Pause the animation entirely when the canvas scrolls off-screen
  (IntersectionObserver) and under prefers-reduced-motion.
- This sits BEHIND content at low opacity — it should never compete with
  text or KPI numbers for attention. If it's noticeable as "a background
  animation" rather than "atmosphere," reduce particle count/opacity further.
```

### Prompt 20 — Export/Print-Ready Snapshot View

> Source pattern: general reporting/deliverable-quality workflow gap (dashboards need a "hand this to a stakeholder" mode).

```text
Add a "Snapshot" mode to the dashboard for sharing/printing/exporting to PDF:
- A dedicated route or modal that renders the current view in a clean,
  single-column, print-friendly layout: no sidebar, no nav chrome, no hover
  states, charts re-rendered at higher contrast for print (avoid low-opacity
  glass/gradients that vanish on paper).
- Include a header with report title, date range, and generation timestamp.
- Use `window.print()` with a dedicated `@media print` stylesheet (hide
  interactive-only elements via `.no-print`), OR generate a real PDF via a
  headless render if the stack supports it.
- Preserve the DESIGN.md accent color as the only color allowed on charts in
  this mode — no gradient fills, since they print poorly.
- Add a "Copy shareable link" action that deep-links back to this exact
  filtered/date-ranged view (encode filters in the URL query string).
```

## PART 11 — Even more free APIs (verified July 2026)

### Finance / Economic / Government Open Data

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **FRED (Federal Reserve Economic Data)** | 800k+ US/global economic time series (GDP, inflation, rates, employment) | Free, generous rate limits | Yes (free, instant) | [fred.stlouisfed.org/docs/api](https://fred.stlouisfed.org/docs/api/fred/) |
| **SEC EDGAR full-text & company facts API** | Company filings, structured financial facts (XBRL) straight from the SEC | Free, no key, fair-use rate limit (~10 req/s) | No | [sec.gov/edgar/sec-api-documentation](https://www.sec.gov/edgar/sec-api-documentation) |
| **U.S. Treasury Fiscal Data API** | US federal debt, spending, revenue datasets | Free, no key | No | [fiscaldata.treasury.gov/api-documentation](https://fiscaldata.treasury.gov/api-documentation/) |
| **World Bank Open Data API** | Global development/economic indicators, 200+ countries | Free, no key | No | [datahelpdesk.worldbank.org](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392) |
| **data.gov / data.gov.uk (CKAN APIs)** | Thousands of open government datasets (transit, health, environment, etc.) | Free, no key for most | Varies by dataset | [data.gov](https://data.gov/) |

### Sports & Live Scores

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **TheSportsDB** | Multi-sport teams, leagues, live scores, badges/artwork | Free tier with test key `3`, patreon key for higher limits | Yes (free test key) | [thesportsdb.com/api.php](https://www.thesportsdb.com/api.php) |
| **balldontlie** | NBA stats, scores, players (also NFL/MLB tiers) | Free tier, rate-limited (~60 req/min) | Yes (free) | [balldontlie.io](https://www.balldontlie.io/) |
| **football-data.org** | Football scores, fixtures, standings (already in Part 7) | 10 req/min free | Yes | [docs.football-data.org](https://docs.football-data.org/general/v4/index.html) |

### Space & Science (good for live-data dashboard demos)

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **Launch Library 2 (The Space Devs)** | Upcoming/live rocket launches, launch pads, agencies | Free, ~15 req/hr unauthenticated | No (optional patreon key for more) | [thespacedevs.com/llapi](https://thespacedevs.com/llapi) |
| **Open Notify** | ISS location + "people in space" (simple, classic demo API) | Free, no key | No | [open-notify.org](http://open-notify.org/Open-Notify-API/) |
| **NASA Open APIs** | (already in Part 7 — APOD, Mars photos, EONET, EPIC) | DEMO_KEY 30/hr, registered 1,000/hr | Free key | [api.nasa.gov](https://api.nasa.gov/) |

### Fun / Micro-data (great for empty states, loading screens, easter eggs)

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **Bored API** | Random activity suggestions — nice for empty-state copy | Free, no key | No | community-hosted, search "bored api github" for current mirror |
| **Advice Slip API** | Random one-line advice strings | Free, no key | No | [api.adviceslip.com](https://api.adviceslip.com/) |
| **Numbers API** | Trivia/math/date facts about any number — nice for KPI hover fun-facts | Free, no key | No | [numbersapi.com](http://numbersapi.com/) |
| **Agify / Genderize / Nationalize** | Predict age/gender/nationality from a name (novelty demos, not for real decisions) | Free tier ~100-1,000 req/day | No (higher limits with key) | [agify.io](https://agify.io/), [genderize.io](https://genderize.io/), [nationalize.io](https://nationalize.io/) |

### More free image/avatar/asset generators

| API | What it does | Free tier | Key? | Docs |
|---|---|---|---|---|
| **DiceBear** | Procedural avatar generation, many art styles (already in Part 1 list — expanding here) | Free, self-hostable, no key for the hosted API | No | [dicebear.com](https://www.dicebear.com/) |
| **Boring Avatars** | Minimal geometric SVG avatars generated from a string seed | Free, open-source, runs client-side (React component) | No | [boringavatars.com](https://boringavatars.com/) |
| **unDraw** | Free open-source SVG illustrations, recolorable to match DESIGN.md accent | Free, no key (download/self-host, not a live API) | No | [undraw.co](https://undraw.co/) |

### Generative-background / lightweight visual libraries (not APIs, but pair well with these prompts)

| Library | What it does | License | Docs |
|---|---|---|---|
| **tsParticles** | Configurable particle backgrounds (constellations, snow, fireflies, links) | MIT, free | [particles.js.org](https://particles.js.org/) |
| **Vanta.js** | Drop-in animated WebGL backgrounds (waves, birds, net, fog) | MIT, free | [vantajs.com](https://www.vantajs.com/) |
| **globe.gl** | Interactive WebGL 3D globe for geo dashboards (arcs, points, heatmaps on a sphere) | MIT, free | [globe.gl](https://globe.gl/) |

> Note: rate limits, free-tier terms, and even whether a free tier exists at all change often — the "watch out for" notes and doc links throughout this file are there so you (or the agent) can re-verify before shipping anything to production, not just at prototype time.
