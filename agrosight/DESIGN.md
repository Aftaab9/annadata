# Annadata / AgroSight — DESIGN.md (law)

> Every screen must follow this file. Source patterns: `best-prompts-free-apis-library.md` Prompt 0 + 6 + 8 + 10 + 13.

## Brand

- **Product name:** Annadata (hero-level — never demote to nav-only)
- **Tech brand:** AgroSight (mono / secondary)
- **Thesis:** Grow healthy → Grade produce → Fair price → Sell direct

## Color (OKLCH — one accent)

| Token | Light-on-dark value | Hex approx | Use |
|-------|---------------------|------------|-----|
| `--bg` | `oklch(0.11 0.015 145)` | `#0a100e` | Page floor (cool forest tint, never pure black) |
| `--bg-2` | `oklch(0.13 0.018 145)` | `#0e1613` | Alt floor |
| `--surface` | `oklch(0.16 0.02 145 / 0.72)` | solid ladder | Dense data, forms, cards |
| `--surface-2` | `oklch(0.19 0.022 145)` | elevated | Panels |
| `--surface-3` | `oklch(0.22 0.024 145)` | overlay | Active chips |
| `--border` | `oklch(0.93 0.01 145 / 0.10)` | | Default |
| `--border-2` | `oklch(0.93 0.01 145 / 0.18)` | | Hover / emphasis |
| `--text` | `oklch(0.93 0.01 100)` | `#eceeea` | Primary |
| `--muted` | `oklch(0.72 0.02 145)` | | Secondary |
| `--dim` | `oklch(0.50 0.02 145)` | | Tertiary |
| `--accent` | `oklch(0.74 0.13 175)` | `#2ec4b6` | **ONLY** accent — CTAs, active, focus |
| `--accent-2` | `oklch(0.78 0.12 145)` | leaf | Soft companion (not a second accent for CTAs) |
| `--healthy` | `oklch(0.72 0.16 155)` | | Success |
| `--warning` | `oklch(0.78 0.14 75)` | | Watch |
| `--danger` | `oklch(0.65 0.18 25)` | | Error |

Legacy aliases: `--cyan` = `--accent`, `--indigo`/`--violet` remap to accent family (never globals) — **no purple**.

## Typography

| Role | Font | Notes |
|------|------|-------|
| Display | **Syne** | Brand + page H1 only |
| UI | **Sora** | Body, labels, nav |
| Mono | **JetBrains Mono** | Numbers, SKUs, badges |

- Headings: `text-wrap: balance`
- Body: `text-wrap: pretty`
- Numbers: `font-variant-numeric: tabular-nums`
- Min readable UI text: 13px

## Spacing & shape

- 8px grid. Section gaps 32px. Card padding 24px.
- Radii: cards 12px (`--radius`), inputs 8px, pills full.
- Borders 1px. Shadows: none on dense data; one soft ambient on floating glass only.

## Glass (Prompt 6)

Glass **only** on: top nav, assistant panel, floating toasts.  
**Never** on data tables, forms, Inspect results, KPI strips.

Recipe: `rgba` tint + `blur(12px) saturate(1.4)` + 1px white/15 + inset top highlight.

## Motion (Prompt 8)

| Token | Value |
|-------|--------|
| `--ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` |
| `--ease-in` | `cubic-bezier(0.32, 0, 0.67, 0)` |
| `--dur-hover` | 140ms |
| `--dur-toggle` | 240ms |
| `--dur-modal` | 380ms |

- Buttons: press scale 0.97; hover lift 2px
- Cards: hover `translateY(-4px)`, border → accent/40
- Skeletons: shimmer sweep 1.5s (not opacity pulse)
- Animate only `transform` / `opacity`
- Gate everything with `prefers-reduced-motion`

## Landing composition (hero budget)

First viewport may contain **only**:

1. Brand **Annadata** (display, hero-scale)
2. One headline
3. One supporting sentence
4. One CTA group
5. One dominant visual (field / WebGL)

Forbidden in first viewport: stats, SDG chips, three-card feature rows, schedules.

Below fold: bento (asymmetric), pipeline story, measured KPIs.

## Anti-slop (never)

- Purple / violet gradients
- Centered hero + three equal icon cards
- Default Tailwind blue buttons
- More than one accent for CTAs
- Emoji as icons
- Gray placeholder boxes without empty-state copy
- Full-glass data layouts
