# Annadata Colab — fixed notebooks (use these)

## You broke the runtime — fix first

Those errors mean you upgraded TensorFlow/pandas on top of Colab’s stack. **Do this once:**

1. **Runtime → Disconnect and delete runtime**
2. Reconnect → **Runtime → Change runtime type → T4 GPU**
3. Upload / open **`colab/01_produce_quality.ipynb`** (not the old `.py`)

## Rule

**Never** `pip install tensorflow` or upgrade `pandas` in Colab.  
Notebook 01 only installs `kaggle`. TF is already there.

## Kaggle

Username `aftaabkazi` + your API token are already in Cell 2 of each notebook.  
Still open the dataset once and click **I Agree**:  
https://www.kaggle.com/datasets/muhammad0subhan/fruit-and-vegetable-disease-healthy-vs-rotten

## Files

| Notebook | What you get |
|----------|----------------|
| `01_produce_quality.ipynb` | `agrosight_produce.tflite` + chart PNGs |
| `02_crop_recommendation.ipynb` | `crop_rec.onnx` |
| `03_fertilizer.ipynb` | `fertilizer.onnx` |
| `04_price_forecast.ipynb` | `price_forecast_series.json` |

Drop Produce files into `agrosight/public/models/` and `public/assets/`, then tell Cursor.

**Security:** API key is in the notebook — don’t push this repo public without rotating the Kaggle token.
