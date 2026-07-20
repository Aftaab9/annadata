# Annadata / AgroSight — Colab notebooks (USE THESE)

## Broken runtime? (your pip errors)

You installed TensorFlow on top of Colab’s stack. That causes pandas/protobuf/tf-keras fights.

1. **Runtime → Disconnect and delete runtime**
2. New session → **GPU (T4)**
3. File → Upload notebook → **`01_produce_quality.ipynb`**
4. Runtime → Run all

## Hard rule

**Do NOT** `pip install tensorflow` or upgrade pandas.  
Cell 1 only installs `kaggle`. Colab already has TF.

## Auth

Username `aftaabkazi` + API token are in Cell 2.  
Still click **I Agree** once on:  
https://www.kaggle.com/datasets/muhammad0subhan/fruit-and-vegetable-disease-healthy-vs-rotten

## Notebooks

| File | Output |
|------|--------|
| `01_produce_quality.ipynb` | `agrosight_produce.tflite` + PNGs |
| `02_crop_recommendation.ipynb` | `crop_rec.onnx` |
| `03_fertilizer.ipynb` | `fertilizer.onnx` |
| `04_price_forecast.ipynb` | `price_forecast_series.json` |

After Produce finishes, drop files into `agrosight/public/models/` + `public/assets/` and tell Cursor.
