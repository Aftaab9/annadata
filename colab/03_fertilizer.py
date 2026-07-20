# ============================================================
# Annadata — Colab 03: Fertilizer Recommendation → ONNX
# Dataset: Kaggle gdabhishek/fertilizer-prediction
# Output: fertilizer.onnx + fertilizer_meta.json
# ============================================================
# !pip -q install kaggle scikit-learn skl2onnx onnx pandas

import json
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

SEED = 42
OUT = Path("/content/agrosight_exports")
OUT.mkdir(exist_ok=True)

# !kaggle datasets download -d gdabhishek/fertilizer-prediction -p /content --unzip
csv = next(Path("/content").rglob("*Fertilizer*.csv"), None) or next(
    Path("/content").rglob("*fertilizer*.csv"), None
)
assert csv, "Download fertilizer CSV from Kaggle"
df = pd.read_csv(csv)
print(df.head())
print(df.columns.tolist())

# Typical columns: Temparature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous, Fertilizer Name
colmap = {c.lower().strip(): c for c in df.columns}

def pick(*names):
    for n in names:
        if n.lower() in colmap:
            return colmap[n.lower()]
    raise KeyError(names)

temp = pick("Temparature", "Temperature", "temp")
hum = pick("Humidity")
moist = pick("Moisture")
n = pick("Nitrogen", "N")
p = pick("Phosphorous", "Phosphorus", "P")
k = pick("Potassium", "K")
soil = pick("Soil Type", "Soil")
crop = pick("Crop Type", "Crop")
target = pick("Fertilizer Name", "Fertilizer", "label")

soil_le = LabelEncoder()
crop_le = LabelEncoder()
y_le = LabelEncoder()

X = pd.DataFrame({
    "temperature": df[temp].astype(float),
    "humidity": df[hum].astype(float),
    "moisture": df[moist].astype(float),
    "N": df[n].astype(float),
    "P": df[p].astype(float),
    "K": df[k].astype(float),
    "soil": soil_le.fit_transform(df[soil].astype(str)),
    "crop": crop_le.fit_transform(df[crop].astype(str)),
}).astype(np.float32)
y = y_le.fit_transform(df[target].astype(str))

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=SEED, stratify=y)
rf = RandomForestClassifier(n_estimators=250, max_depth=14, random_state=SEED, n_jobs=-1)
rf.fit(Xtr, ytr)
pred = rf.predict(Xte)
acc = accuracy_score(yte, pred)
print("Hold-out accuracy:", acc)
print(classification_report(yte, pred, target_names=y_le.classes_))

initial_type = [("float_input", FloatTensorType([None, 8]))]
onnx_model = convert_sklearn(rf, initial_types=initial_type, target_opset=12)
onnx_path = OUT / "fertilizer.onnx"
with open(onnx_path, "wb") as f:
    f.write(onnx_model.SerializeToString())

meta = {
    "features": list(X.columns),
    "classes": list(y_le.classes_),
    "soil_classes": list(soil_le.classes_),
    "crop_classes": list(crop_le.classes_),
    "accuracy": round(float(acc) * 100, 2),
}
(OUT / "fertilizer_meta.json").write_text(json.dumps(meta, indent=2))
print(meta)

from google.colab import files
files.download(str(onnx_path))
files.download(str(OUT / "fertilizer_meta.json"))
print("Drop into agrosight/public/models/")
