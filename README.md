# AgroSight

AI-driven quality inspection and yield optimization for rural food processing units.

**SP Jain — MAIB Program, Group 3**

## Project structure (only these folders)

```
AIO-Final/
├── AgroSight_CV_Complete.ipynb       ← Beans pilot (done)
├── AgroSight_PlantVillage_SKU.ipynb  ← Multi-SKU PlantVillage (run on Colab)
├── AgroSight_Yield_Model.ipynb       ← Yield prediction (done)
├── dashboard/
│   ├── assets/
│   │   ├── 01–03_*.png               ← Beans CV
│   │   ├── 04–06_*.png               ← Yield model
│   │   └── 07–10_*.png               ← PlantVillage multi-SKU
│   └── data/
│       ├── yield_lookup.json
│       └── sku_catalog.json          ← PlantVillage SKU metadata
├── models/
│   ├── agrosight_model/              ← Beans SavedModel
│   ├── agrosight_model.keras / .tflite
│   ├── agrosight_plantvillage/       ← PlantVillage SavedModel
│   ├── agrosight_plantvillage.keras / .tflite
│   └── agrosight_yield_model.pkl
└── README.md
```

## Notebook roles

| Notebook | Dataset | Purpose |
|----------|---------|---------|
| `AgroSight_CV_Complete.ipynb` | Beans (1.3k) | Pilot — pipeline validation ✅ |
| `AgroSight_PlantVillage_SKU.ipynb` | PlantVillage (6 SKUs, ~5k) | Multi-crop production model |
| `AgroSight_Yield_Model.ipynb` | Synthetic | Yield optimization ✅ |

## Run PlantVillage on Colab

1. Upload `AgroSight_PlantVillage_SKU.ipynb`
2. **Runtime → T4 GPU** → Cell 1 → restart → Run All from Cell 2 (~40–60 min)
3. Download new `dashboard/assets/07–10_*.png`, `dashboard/data/sku_catalog.json`, `models/agrosight_plantvillage*`

- **`dashboard/`** = presentation website + chart images
- **`models/`** = trained ML model files (not a second project)

## Run on Google Colab (recommended)

1. Upload **`AgroSight_CV_Complete.ipynb`** to [Google Colab](https://colab.research.google.com/)
2. **Runtime → Change runtime type → T4 GPU**
3. Run **Cell 1** → **Runtime → Restart session**
4. Skip Cell 1, **Run All** from Cell 2 (~25–35 min)

### Outputs (created automatically)

| Path | What |
|------|------|
| `dashboard/assets/01_samples.png` | Original + augmented bean leaf images |
| `dashboard/assets/02_model_comparison.png` | 5-model comparison |
| `dashboard/assets/03_confusion_matrix.png` | Per-class evaluation |
| `models/agrosight_model/` | SavedModel |
| `models/agrosight_model.tflite` | TF Lite for mobile |

## Dataset

Uses **HuggingFace `beans`** — same Makerere iBeans dataset as TFDS, auto-downloads online (~1,300 images). No manual download or Kaggle account needed.

> TFDS `tfds.load('beans')` is broken (GCS returns 403). HuggingFace is the working mirror.

## Expected accuracy on Colab T4

With the fixed pipeline (proper augmentation + ImageNet preprocessing): **85–95%** on the test set after fine-tuning.
