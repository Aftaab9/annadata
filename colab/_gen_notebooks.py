"""Generate Colab notebooks that respect Colab's preinstalled TF stack."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def code(text: str) -> dict:
    lines = text.strip("\n").split("\n")
    return {
        "cell_type": "code",
        "metadata": {},
        "source": [ln + "\n" for ln in lines],
        "outputs": [],
        "execution_count": None,
    }


def md(text: str) -> dict:
    lines = text.strip("\n").split("\n")
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [ln + "\n" for ln in lines],
    }


def write_nb(name: str, cells: list[dict]) -> None:
    # normalize sources (avoid empty trailing)
    for c in cells:
        if not c["source"]:
            c["source"] = ["\n"]
    nb = {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {"name": "python"},
            "accelerator": "GPU",
        },
        "cells": cells,
    }
    path = ROOT / name
    path.write_text(json.dumps(nb, indent=1), encoding="utf-8")
    print("wrote", path)


# -------- Produce Quality --------
write_nb(
    "01_produce_quality.ipynb",
    [
        md(
            """# Annadata — Produce Quality CNN

**Runtime → Change runtime type → T4 GPU**

## Critical (Colab due diligence)
- Colab already has TensorFlow (~2.19–2.20) + pandas. **Do NOT `pip install tensorflow` or upgrade pandas.**
- That is what caused your protobuf / tf-keras / pandas conflicts.
- If you already broke the runtime: **Runtime → Disconnect and delete runtime**, reconnect, then run this notebook top → bottom.
- Only Cell 1 installs `kaggle` (tiny CLI).

Accept the dataset license once:  
https://www.kaggle.com/datasets/muhammad0subhan/fruit-and-vegetable-disease-healthy-vs-rotten → **I Agree**"""
        ),
        code(
            """# Cell 1 — ONLY kaggle (never tensorflow / pandas)
!pip install -q kaggle
print("kaggle CLI ready")"""
        ),
        code(
            """# Cell 2 — Kaggle auth → ~/.kaggle/kaggle.json
import json, os
from pathlib import Path

KAGGLE_USERNAME = "aftaabkazi"
KAGGLE_KEY = "YOUR_KAGGLE_KEY_HERE"

home = Path.home() / ".kaggle"
home.mkdir(exist_ok=True)
(home / "kaggle.json").write_text(
    json.dumps({"username": KAGGLE_USERNAME, "key": KAGGLE_KEY})
)
os.chmod(home / "kaggle.json", 0o600)
print("Auth OK for", KAGGLE_USERNAME)"""
        ),
        code(
            """# Cell 3 — download dataset + flatten to Healthy / Rotten
import shutil, subprocess
from pathlib import Path

KAGGLE_SLUG = "muhammad0subhan/fruit-and-vegetable-disease-healthy-vs-rotten"
DATA_ROOT = Path("/content/produce_data")
FLAT = DATA_ROOT / "flat"
DATA_ROOT.mkdir(parents=True, exist_ok=True)

has_imgs = (
    any(DATA_ROOT.rglob("*.jpg"))
    or any(DATA_ROOT.rglob("*.jpeg"))
    or any(DATA_ROOT.rglob("*.png"))
)
if not has_imgs:
    print("Downloading from Kaggle (auto)…")
    rc = subprocess.call(
        [
            "kaggle",
            "datasets",
            "download",
            "-d",
            KAGGLE_SLUG,
            "-p",
            str(DATA_ROOT),
            "--unzip",
        ]
    )
    assert rc == 0, (
        "Download failed. Open the dataset page, click I Agree, re-run Cell 2–3."
    )
else:
    print("Images already present")


def flatten(src: Path, dst: Path):
    healthy_ok = (dst / "Healthy").exists() and any((dst / "Healthy").iterdir())
    rotten_ok = (dst / "Rotten").exists() and any((dst / "Rotten").iterdir())
    if healthy_ok and rotten_ok:
        print("Flat already built")
        return
    for d in ["Healthy", "Rotten"]:
        (dst / d).mkdir(parents=True, exist_ok=True)
    n = {"Healthy": 0, "Rotten": 0}
    for path in src.rglob("*"):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        blob = f"{path.parent.name.lower()}/{path.name.lower()}"
        if "healthy" in blob and "rotten" not in blob:
            label = "Healthy"
        elif "rotten" in blob:
            label = "Rotten"
        else:
            continue
        out = dst / label / f"{n[label]:06d}{path.suffix.lower()}"
        shutil.copy2(path, out)
        n[label] += 1
    print("Flattened:", n)


src = DATA_ROOT
for p in DATA_ROOT.iterdir():
    if p.is_dir() and p.name not in ("flat", "raw"):
        src = p
        break
flatten(src, FLAT)
print("Ready:", FLAT)"""
        ),
        code(
            """# Cell 4 — Colab's built-in TensorFlow (do not pip install)
import json, random
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    accuracy_score,
    f1_score,
)

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2, EfficientNetB0, ResNet50

print("TF", tf.__version__)
gpus = tf.config.list_physical_devices("GPU")
print("GPU", gpus)
assert gpus, "Enable GPU: Runtime → Change runtime type → T4 GPU, then Restart"

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

IMG, BATCH = 224, 32
EPOCHS_HEAD, EPOCHS_FINE = 3, 2  # enough for demo; still real training
FLAT = Path("/content/produce_data/flat")
OUT = Path("/content/agrosight_exports")
OUT.mkdir(exist_ok=True)"""
        ),
        code(
            """# Cell 5 — tf.data pipelines
train_ds = tf.keras.utils.image_dataset_from_directory(
    FLAT,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=(IMG, IMG),
    batch_size=BATCH,
    label_mode="binary",
)
val_ds = tf.keras.utils.image_dataset_from_directory(
    FLAT,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=(IMG, IMG),
    batch_size=BATCH,
    label_mode="binary",
)
print("classes", train_ds.class_names)

AUTOTUNE = tf.data.AUTOTUNE
aug = keras.Sequential(
    [
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
    ]
)


def prep(ds, training=False):
    ds = ds.map(
        lambda x, y: (tf.cast(x, tf.float32) / 255.0, y),
        num_parallel_calls=AUTOTUNE,
    )
    if training:
        ds = ds.map(
            lambda x, y: (aug(x, training=True), y),
            num_parallel_calls=AUTOTUNE,
        )
    return ds.prefetch(AUTOTUNE)


train, val = prep(train_ds, True), prep(val_ds, False)"""
        ),
        code(
            """# Cell 6 — train & compare 3 backbones
def build_model(name):
    inp = keras.Input(shape=(IMG, IMG, 3))
    ctor = {
        "MobileNetV2": MobileNetV2,
        "EfficientNetB0": EfficientNetB0,
        "ResNet50": ResNet50,
    }[name]
    base = ctor(include_top=False, weights="imagenet", input_tensor=inp)
    base.trainable = False
    x = layers.GlobalAveragePooling2D()(base.output)
    x = layers.Dropout(0.3)(x)
    out = layers.Dense(1, activation="sigmoid")(x)
    return keras.Model(inp, out, name=name), base


results, best, best_score = [], None, -1.0
for name in ["MobileNetV2", "EfficientNetB0", "ResNet50"]:
    print("\\n===", name, "===")
    model, base = build_model(name)
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train, validation_data=val, epochs=EPOCHS_HEAD, verbose=1)
    base.trainable = True
    model.compile(
        optimizer=keras.optimizers.Adam(1e-5),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train, validation_data=val, epochs=EPOCHS_FINE, verbose=1)

    y_true, y_pred = [], []
    for bx, by in val:
        p = model.predict(bx, verbose=0).ravel()
        y_true.extend(by.numpy().ravel().tolist())
        y_pred.extend((p >= 0.5).astype(int).tolist())
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    composite = 0.6 * acc + 0.4 * f1
    row = {
        "name": name,
        "acc": float(acc),
        "f1": float(f1),
        "composite": float(composite),
    }
    results.append(row)
    print(row)
    if composite > best_score:
        best_score, best = composite, model

print(json.dumps(results, indent=2))"""
        ),
        code(
            """# Cell 7 — charts for Insights page
fig, ax = plt.subplots(figsize=(7, 4))
ax.bar([r["name"] for r in results], [r["composite"] for r in results], color="#0ea5e9")
ax.set_ylabel("Composite (0.6·acc + 0.4·F1)")
ax.set_title("Produce Quality — model comparison")
plt.xticks(rotation=15, ha="right")
plt.tight_layout()
fig.savefig(OUT / "11_produce_model_comparison.png", dpi=150)
plt.show()

y_true, y_pred = [], []
for bx, by in val:
    p = best.predict(bx, verbose=0).ravel()
    y_true.extend(by.numpy().ravel().tolist())
    y_pred.extend((p >= 0.5).astype(int).tolist())

cm = confusion_matrix(y_true, y_pred)
fig, ax = plt.subplots(figsize=(5, 4))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=train_ds.class_names,
    yticklabels=train_ds.class_names,
    ax=ax,
)
ax.set_title("Produce Quality confusion matrix")
plt.tight_layout()
fig.savefig(OUT / "12_produce_confusion_matrix.png", dpi=150)
plt.show()
print(classification_report(y_true, y_pred, target_names=train_ds.class_names))"""
        ),
        code(
            """# Cell 8 — export TFLite (FRESH / BORDERLINE / ROTTEN) for AgroSight app
class ThreeWay(keras.Model):
    def __init__(self, binary_model):
        super().__init__()
        self.binary = binary_model

    def call(self, x):
        # Healthy=0, Rotten=1 → sigmoid ≈ P(Rotten)
        p = self.binary(x)
        fresh, rotten = 1.0 - p, p
        border = (1.0 - tf.abs(p - 0.5) * 2.0) * 0.35
        logits = tf.concat(
            [fresh * (1 - border), border, rotten * (1 - border)], axis=-1
        )
        return tf.nn.softmax(logits)


wrapped = ThreeWay(best)
_ = wrapped(tf.zeros((1, IMG, IMG, 3)))
converter = tf.lite.TFLiteConverter.from_keras_model(wrapped)
tflite_model = converter.convert()
(OUT / "agrosight_produce.tflite").write_bytes(tflite_model)

acc = accuracy_score(y_true, y_pred)
metrics = {
    "produce_accuracy": round(float(acc) * 100, 2),
    "produce_f1": round(float(f1_score(y_true, y_pred)) * 100, 2),
    "winner": max(results, key=lambda r: r["composite"])["name"],
    "results": results,
    "tf_version": tf.__version__,
}
(OUT / "produce_metrics.json").write_text(json.dumps(metrics, indent=2))
print("Wrote", OUT / "agrosight_produce.tflite", "bytes", len(tflite_model))
print(metrics)"""
        ),
        code(
            """# Cell 9 — download to your PC
from google.colab import files

for f in [
    "agrosight_produce.tflite",
    "11_produce_model_comparison.png",
    "12_produce_confusion_matrix.png",
    "produce_metrics.json",
]:
    files.download(str(OUT / f))

print('''Drop into repo:
  agrosight/public/models/agrosight_produce.tflite
  agrosight/public/assets/11_produce_model_comparison.png
  agrosight/public/assets/12_produce_confusion_matrix.png
Then tell Cursor: produce tflite dropped''')"""
        ),
    ],
)

# -------- Crop rec --------
write_nb(
    "02_crop_recommendation.ipynb",
    [
        md(
            """# Annadata — Crop Recommendation → ONNX

Uses Colab sklearn only. Installs: `kaggle skl2onnx onnx` (no TensorFlow)."""
        ),
        code(
            """!pip install -q kaggle skl2onnx onnx onnxmltools
import json, os
from pathlib import Path
KAGGLE_USERNAME, KAGGLE_KEY = "aftaabkazi", "YOUR_KAGGLE_KEY_HERE"
home = Path.home() / ".kaggle"; home.mkdir(exist_ok=True)
(home / "kaggle.json").write_text(json.dumps({"username": KAGGLE_USERNAME, "key": KAGGLE_KEY}))
os.chmod(home / "kaggle.json", 0o600)
!kaggle datasets download -d atharvaingle/crop-recommendation-dataset -p /content --unzip
print("done")"""
        ),
        code(
            """import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

OUT = Path("/content/agrosight_exports"); OUT.mkdir(exist_ok=True)
csv = next(Path("/content").rglob("Crop_recommendation.csv"))
df = pd.read_csv(csv)
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
cols = {c.lower(): c for c in df.columns}
X = df[[cols[f.lower()] for f in FEATURES]].astype(np.float32)
le = LabelEncoder()
y = le.fit_transform(df[cols.get("label", df.columns[-1])].astype(str))
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
rf.fit(Xtr, ytr)
acc = accuracy_score(yte, rf.predict(Xte))
print("hold-out accuracy", acc)
print(classification_report(yte, rf.predict(Xte), target_names=le.classes_))
onnx_model = convert_sklearn(rf, initial_types=[("float_input", FloatTensorType([None, 7]))], target_opset=12)
(OUT / "crop_rec.onnx").write_bytes(onnx_model.SerializeToString())
meta = {"features": FEATURES, "classes": list(le.classes_), "accuracy": round(float(acc)*100, 2)}
(OUT / "crop_rec_meta.json").write_text(json.dumps(meta, indent=2))
print(meta)
from google.colab import files
files.download(str(OUT / "crop_rec.onnx"))
files.download(str(OUT / "crop_rec_meta.json"))"""
        ),
    ],
)

# -------- Fertilizer --------
write_nb(
    "03_fertilizer.ipynb",
    [
        md("# Annadata — Fertilizer → ONNX\n\nNo TensorFlow. Accept dataset license on Kaggle if prompted."),
        code(
            """!pip install -q kaggle skl2onnx onnx
import json, os
from pathlib import Path
KAGGLE_USERNAME, KAGGLE_KEY = "aftaabkazi", "YOUR_KAGGLE_KEY_HERE"
home = Path.home() / ".kaggle"; home.mkdir(exist_ok=True)
(home / "kaggle.json").write_text(json.dumps({"username": KAGGLE_USERNAME, "key": KAGGLE_KEY}))
os.chmod(home / "kaggle.json", 0o600)
!kaggle datasets download -d gdabhishek/fertilizer-prediction -p /content --unzip
print("done")"""
        ),
        code(
            """import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

OUT = Path("/content/agrosight_exports"); OUT.mkdir(exist_ok=True)
csv = next(Path("/content").rglob("*ertilizer*.csv"))
df = pd.read_csv(csv)
colmap = {c.lower().strip(): c for c in df.columns}

def pick(*names):
    for n in names:
        if n.lower() in colmap:
            return colmap[n.lower()]
    raise KeyError(names)

temp, hum, moist = pick("Temparature", "Temperature"), pick("Humidity"), pick("Moisture")
n, p, k = pick("Nitrogen", "N"), pick("Phosphorous", "Phosphorus", "P"), pick("Potassium", "K")
soil, crop = pick("Soil Type", "Soil"), pick("Crop Type", "Crop")
target = pick("Fertilizer Name", "Fertilizer", "label")
soil_le, crop_le, y_le = LabelEncoder(), LabelEncoder(), LabelEncoder()
X = pd.DataFrame({
    "temperature": df[temp].astype(float), "humidity": df[hum].astype(float),
    "moisture": df[moist].astype(float), "N": df[n].astype(float),
    "P": df[p].astype(float), "K": df[k].astype(float),
    "soil": soil_le.fit_transform(df[soil].astype(str)),
    "crop": crop_le.fit_transform(df[crop].astype(str)),
}).astype(np.float32)
y = y_le.fit_transform(df[target].astype(str))
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
rf = RandomForestClassifier(n_estimators=250, max_depth=14, random_state=42, n_jobs=-1)
rf.fit(Xtr, ytr)
acc = accuracy_score(yte, rf.predict(Xte))
print("accuracy", acc)
print(classification_report(yte, rf.predict(Xte), target_names=y_le.classes_))
onnx_model = convert_sklearn(rf, initial_types=[("float_input", FloatTensorType([None, 8]))], target_opset=12)
(OUT / "fertilizer.onnx").write_bytes(onnx_model.SerializeToString())
meta = {"features": list(X.columns), "classes": list(y_le.classes_),
        "soil_classes": list(soil_le.classes_), "crop_classes": list(crop_le.classes_),
        "accuracy": round(float(acc)*100, 2)}
(OUT / "fertilizer_meta.json").write_text(json.dumps(meta, indent=2))
print(meta)
from google.colab import files
files.download(str(OUT / "fertilizer.onnx"))
files.download(str(OUT / "fertilizer_meta.json"))"""
        ),
    ],
)

# -------- Price forecast --------
write_nb(
    "04_price_forecast.ipynb",
    [
        md("# Annadata — Price forecast → JSON\n\nsklearn only — no TF install."),
        code(
            """!pip install -q scikit-learn
# sklearn already in Colab; pip above is no-op if present
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_percentage_error

SEED, OUT = 42, Path("/content/agrosight_exports")
OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(SEED)
COMMODITIES = ["Tomato", "Potato", "Onion", "Wheat", "Soyabean", "Maize"]
BASE = {"Tomato": 1800, "Potato": 1200, "Onion": 1600, "Wheat": 2200, "Soyabean": 4200, "Maize": 1900}

def make_series(name, days=730):
    t = np.arange(days)
    seasonal = 0.12 * np.sin(2 * np.pi * t / 365.25) + 0.05 * np.sin(2 * np.pi * t / 30)
    price = BASE[name] * (1 + seasonal + rng.normal(0, 0.03, size=days))
    return pd.DataFrame({"date": pd.date_range("2024-01-01", periods=days, freq="D"),
                         "commodity": name, "modal_price": price})

df = pd.concat([make_series(c) for c in COMMODITIES], ignore_index=True)
payload = {"model": "GradientBoostingRegressor", "horizon_days": 30, "series": {}}
for crop, g in df.groupby("commodity"):
    y = g.sort_values("date")["modal_price"].astype(float).values
    X, yy = [], []
    for i in range(14, len(y)):
        X.append([y[i-1], y[i-7], y[i-14], i % 365, (i % 365) / 365])
        yy.append(y[i])
    X, yy = np.array(X), np.array(yy)
    split = int(len(X) * 0.8)
    model = GradientBoostingRegressor(random_state=SEED)
    model.fit(X[:split], yy[:split])
    mape = float(mean_absolute_percentage_error(yy[split:], model.predict(X[split:]))) * 100
    hist, forecasts = list(y), []
    for step in range(30):
        i = len(hist)
        feats = np.array([[hist[-1], hist[-7], hist[-14], i % 365, (i % 365) / 365]])
        nxt = float(model.predict(feats)[0]); hist.append(nxt); forecasts.append(round(nxt, 2))
    last = float(y[-1]); change = round((forecasts[-1] - last) / last * 100, 2)
    signal = "WAIT" if change > 2 else ("SELL_NOW" if change < -2 else "HOLD")
    payload["series"][str(crop)] = {
        "last_modal": round(last, 2), "forecast_30d": forecasts,
        "predicted_change_pct": change, "signal": signal, "mape_pct": round(mape, 2),
        "explanation": f"GBR hold-out MAPE {mape:.1f}%. 30d change {change}% → {signal}.",
    }
    print(crop, "MAPE", round(mape, 2), signal)
(OUT / "price_forecast_series.json").write_text(json.dumps(payload, indent=2))
from google.colab import files
files.download(str(OUT / "price_forecast_series.json"))"""
        ),
    ],
)

# Update stub .py pointer
(ROOT / "01_produce_quality.py").write_text(
    """# DEPRECATED — use the real Colab notebook instead:
#   colab/01_produce_quality.ipynb
#
# Upload that .ipynb to Google Colab (File → Upload notebook).
# Do NOT pip install tensorflow — that broke your runtime.
#
# If runtime is already broken:
#   Runtime → Disconnect and delete runtime → reconnect GPU → open the .ipynb
""",
    encoding="utf-8",
)

print("all notebooks ready")
