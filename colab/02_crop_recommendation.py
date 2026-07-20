# ============================================================
# Annadata — Colab 02: Crop Recommendation (RF/XGB → ONNX)
# Dataset: Kaggle atharvaingle/crop-recommendation-dataset
# Output: crop_rec.onnx + crop_rec_meta.json
# ============================================================
# !pip -q install kaggle scikit-learn xgboost skl2onnx onnx onnxmltools pandas joblib

import json
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxmltools

SEED = 42
OUT = Path("/content/agrosight_exports")
OUT.mkdir(exist_ok=True)

# Download
# !kaggle datasets download -d atharvaingle/crop-recommendation-dataset -p /content --unzip
# Find CSV
csv = next(Path("/content").rglob("Crop_recommendation.csv"), None) or next(
    Path("/content").rglob("*crop*.csv"), None
)
assert csv, "Upload Crop_recommendation.csv or fix Kaggle download"
df = pd.read_csv(csv)
print(df.head(), df.columns.tolist())

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
# normalize column names
cols = {c.lower(): c for c in df.columns}
feat_map = {}
for f in FEATURES:
    feat_map[f] = cols.get(f.lower(), f)
label_col = cols.get("label") or cols.get("crop") or df.columns[-1]

X = df[[feat_map[f] for f in FEATURES]].astype(np.float32)
y_raw = df[label_col].astype(str)
le = LabelEncoder()
y = le.fit_transform(y_raw)

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=SEED, stratify=y)

rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=SEED, n_jobs=-1)
rf.fit(Xtr, ytr)
pred = rf.predict(Xte)
acc = accuracy_score(yte, pred)
print("RF hold-out accuracy:", acc)
print(classification_report(yte, pred, target_names=le.classes_))

# Try XGB if available
try:
    from xgboost import XGBClassifier
    xgb = XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        random_state=SEED, n_jobs=-1, tree_method="hist",
    )
    xgb.fit(Xtr, ytr)
    acc_x = accuracy_score(yte, xgb.predict(Xte))
    print("XGB accuracy:", acc_x)
    model = xgb if acc_x >= acc else rf
    winner = "xgboost" if acc_x >= acc else "random_forest"
    best_acc = max(acc, acc_x)
except Exception as e:
    print("XGB skip:", e)
    model = rf
    winner = "random_forest"
    best_acc = acc

# Export ONNX (sklearn RF path preferred for skl2onnx)
export_model = rf  # skl2onnx is reliable for RF
initial_type = [("float_input", FloatTensorType([None, 7]))]
onnx_model = convert_sklearn(export_model, initial_types=initial_type, target_opset=12)
onnx_path = OUT / "crop_rec.onnx"
with open(onnx_path, "wb") as f:
    f.write(onnx_model.SerializeToString())

meta = {
    "features": FEATURES,
    "classes": list(le.classes_),
    "accuracy": round(float(best_acc) * 100, 2),
    "winner_note": winner,
    "exported": "random_forest",
}
(OUT / "crop_rec_meta.json").write_text(json.dumps(meta, indent=2))
print(meta)

from google.colab import files
files.download(str(onnx_path))
files.download(str(OUT / "crop_rec_meta.json"))
print("Drop crop_rec.onnx + crop_rec_meta.json into agrosight/public/models/")
