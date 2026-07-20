# Annadata — Live demo script (~8–12 min)

**URL:** http://localhost:5173 (or Vercel)  
**Before start:** restart `npm run dev` after `.env.local` changes · hard refresh

---

## 0. Framing (30s)
> “Annadata helps a farmer across the crop cycle: **grow healthy → grade the harvest → price fairly → sell direct**. Two CV models, two honest jobs — leaf disease is not fruit quality.”

---

## 1. Landing (30s)
- Brand **Annadata** visible first
- Tap **Open Inspect** (big teal button)
- Point at bottom tabs on phone

---

## 2. Inspect — Leaf Health (2 min)
- Mode: **Leaf Health**
- Pick a crop chip → upload a **leaf** photo (or camera)
- Show: verdict, probabilities, treatment advice, HITL if &lt;70%
- Say: “This is PlantVillage TFLite on-device — disease while growing, **not** market grade.”

---

## 3. Inspect — Produce Quality (1–2 min)
- Toggle **Produce Quality**
- Upload produce photo
- If Colab TFLite not ready yet: badge says **demo heuristic** — be honest
- If live: Grade A/B/C → “This Grade Card drives fair price and market.”

---

## 4. Prices (1.5 min)
- Mandi modal from Agmarknet (or snapshot)
- Point at **Grade premium**: A +10% / B / C −20%
- Forecast row: note **heuristic** vs **trained** label
- Toggle EN / हिं · Hear price

---

## 5. Market — Supabase multi-device (2 min) ★
- Badge should read **Live · Supabase**
- Farmer: publish listing (after Produce grade if available)
- Buyer tab / second phone or incognito: **Refresh** → listing appears
- Collective pools panel

*If badge still says localStorage:* restart dev server so `VITE_SUPABASE_*` loads.

---

## 6. Advisory + Yield (1 min)
- Crop / Fertilizer: honest **lookup until ONNX** banners
- Yield: real coefficient engine; defect rate from Inspect

---

## 7. Insights + Ethics (1.5 min)
- Measured KPIs only; pending Colab slots as “—”
- Ethics: HITL gate, **leaf ≠ produce**, SDG 2/8/12

---

## 8. Assistant ✦ (1 min)
- Ask in Hindi: “इस ग्रेड का भाव क्या होना चाहिए?”
- Provider badge: cerebras / groq / ollama
- Voice mic on हिं (Whisper fallback)

---

## Closing (20s)
> “₹0 stack — no credit card. Real mandi API, real leaf TFLite, multi-user market on Supabase. Produce CNN and advisory ONNX land from Colab as they finish.”

---

## Fail-safes
| Issue | What to say |
|-------|-------------|
| Produce still mock | “Training finishes in Colab; UI is wired — drop TFLite and it’s live.” |
| Assistant offline | “Chain fell through; offline answer still contextual.” |
| Mandi API down | “6h cache / snapshot — demo continues.” |
| HITL block on market | “By design under 70% — supervisor must review.” |
