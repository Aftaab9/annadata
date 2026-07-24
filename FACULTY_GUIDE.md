# Annadata / AgroSight — Faculty Navigation Guide

**Group 3 · SP Jain MAIB · Aftaab · Isaac · Ishaan**

This file tells you where everything is — live demo, ZIP contents, sample images, Colab notebooks, and the presentation.

---

## 1. Fastest path (no install)

| Item | Link / path |
|------|-------------|
| **Live app** | https://annadata-lake.vercel.app |
| **Live presentation** | https://annadata-lake.vercel.app/presentation/workflow.html |
| **GitHub** | https://github.com/Aftaab9/annadata |

Suggested live walkthrough:
1. `/inspect` → **Leaf Health** → upload a leaf from `samples/leaf/`
2. `/inspect` → **Produce Quality** → upload fruit from `samples/produce/`
3. Use the buttons: **Yield** → **Prices** → **Market** → **Ask assistant**
4. `/advisory` → Crop + Fertilizer sliders (6 Annadata crops)
5. `/insights` → hold-out KPIs + training charts
6. `/ethics` → HITL / rural employment

---

## 2. If you received the ZIP

1. Extract the ZIP anywhere (Windows / Mac).
2. Read **this file** (`FACULTY_GUIDE.md`) and `presentation/README.txt`.
3. Open the presentation offline:  
   `presentation/workflow.html` (Chrome or Edge) · keys: `→` `←` · Space · click left/right half.
4. Optional — run the app locally:

```bash
cd agrosight
npm install
npm run dev
```

Open http://localhost:5173  
(No API keys required for Inspect / Yield / Advisory / Insights. Optional keys in `agrosight/.env.example`.)

---

## 3. Where are the sample images?

### Produce (harvested fruit / veg — Grade A/B/C)
```
agrosight/public/samples/produce/
  fresh_apple.jpg, verify_rotten_apple.jpg, fresh_tomato.jpg …
  apple_fruit/   maize_fruit/   tomato_fruit/   potato_fruit/ …
  dataset_fresh_*.jpeg   dataset_rotten_*.jpeg
```
Live: https://annadata-lake.vercel.app/samples/produce/fresh_apple.jpg

### Leaf (PlantVillage-style disease — Healthy / Surface Defect / Blight)
```
agrosight/public/samples/leaf/
  tomato/   maize/   apple/
  (healthy_*, surface_defect_*, blight_mold_* files)
```
Also mirrored under `Mock-Images/plantvillage/` in the ZIP for the original demo set.

**How to test:** Inspect page → choose Leaf or Produce → Upload → pick any of the files above.

---

## 4. Where are the Colab / training files?

```
colab/
  01_produce_quality.ipynb      ← Produce CNN bake-off → TFLite
  02_crop_recommendation.ipynb  ← Crop RF → ONNX
  03_fertilizer.ipynb           ← Fertilizer RF → ONNX
  04_price_forecast.ipynb       ← Price series
  retrain_annadata_advisory.py  ← Retrain crop+fert for 6 SKUs (local)
  datasets/
    Crop_recommendation.csv
    Fertilizer Prediction.csv
```

Root-level research notebooks (optional reading):
```
AgroSight_CV_Complete.ipynb
AgroSight_PlantVillage_SKU.ipynb
AgroSight_Yield_Model.ipynb
```

Trained artifacts used by the app (already in the ZIP / on Vercel):
```
agrosight/public/models/
  agrosight_plantvillage.tflite   ← Leaf Health
  agrosight_produce.tflite        ← Produce Quality (~90 MB)
  crop_rec.onnx + crop_rec_meta.json
  fertilizer.onnx + fertilizer_meta.json
```

Hold-out metrics shown in the app:
```
agrosight/public/data/model_metrics.json
agrosight/public/data/produce_metrics.json
```

Training charts (also embedded in Insights + presentation):
```
agrosight/public/assets/08_pv_model_comparison.png …
presentation/charts/
```

---

## 5. Presentation files

| File | Purpose |
|------|---------|
| `presentation/workflow.html` | **Main faculty deck** — real screenshots + training KPIs |
| `presentation/SCRIPT_WORKFLOW.txt` | Speaking notes (one paragraph per slide) |
| `presentation/research.html` | Longer research-style deck |
| `presentation/index.html` | Short problem pitch |
| `presentation/README.txt` | Offline open instructions |

Live copy of the workflow deck:  
https://annadata-lake.vercel.app/presentation/workflow.html

---

## 6. App source map (important folders)

```
agrosight/
  src/routes/          Inspect, Yield, Prices, Market, Advisory, Insights, Ethics
  src/lib/             inference.ts, produceInference.ts, yieldEngine.ts, onnxRuntime.ts
  src/services/        cropRec, fertilizer, market, prices
  public/models/       TFLite + ONNX (what the browser loads)
  public/samples/      Demo images for faculty trials
  public/presentation/ Same workflow deck hosted on Vercel
colab/                 Training notebooks + CSVs
presentation/          Offline HTML decks + screenshots
```

---

## 7. What each Inspect mode means

| Mode | Looks at | Classes | Next steps in app |
|------|----------|---------|-------------------|
| **Leaf Health** | On-plant leaf disease | Healthy / Surface Defect / Blight-Mold | Treatment advice → Yield (defect rate) |
| **Produce Quality** | Harvested batch freshness | Fresh / Borderline / Spoiled → Grade A/B/C | Prices / Market listing / Yield / Assistant |

Leaf ≠ Produce — two different models on purpose.

---

## 8. Honest hold-out metrics (as shown in Insights)

| Model | Metric |
|-------|--------|
| Leaf Health (EfficientNetB0) | **97.4%** accuracy |
| Produce Quality (ResNet50) | **~97%** acc / **97.1%** F1 |
| Crop recommendation (6 SKUs, RF→ONNX) | **96.7%** |
| Fertilizer (6 SKUs, RF→ONNX) | **84.4%** |
| Yield regressor | **3.52%** MAPE |
| Price forecast | **3.4%** MAPE |
| HITL gate | confidence **&lt; 70%** → human review |

---

## 9. If something looks wrong

- Hard refresh the live site: `Ctrl+Shift+R`
- Produce model is large (~90 MB) — first Produce load can take 10–30 s on Wi‑Fi
- Session history on Inspect: tap a past scan thumbnail to reopen without re-uploading
- Do **not** expect secrets (API keys) inside the ZIP — marketplace/assistant may use free public/offline fallbacks without keys

---

**Thank you for reviewing Annadata.**  
Questions: Group 3 · MAIB
