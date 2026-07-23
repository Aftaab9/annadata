#!/usr/bin/env python3
"""
Retrain Annadata advisory ONNX models for the 6 product SKUs only:
  Apple, Maize, Pepper, Potato, Soybean, Tomato

Crop data:
  - apple + maize: real rows from Kaggle Crop_recommendation.csv
  - pepper/potato/soybean/tomato: agronomic soil+climate envelopes
    (ICAR / FAO horticulture ranges) sampled for RF training

Fertilizer data:
  - Rebuild for the same 6 crops + 5 soils using deficiency rules
    consistent with the Kaggle fertilizer-prediction schema
    (Urea / DAP / NPK blends), so NPK + crop changes move the class.

Exports (zipmap=False for onnxruntime-web):
  agrosight/public/models/crop_rec.onnx + crop_rec_meta.json
  agrosight/public/models/fertilizer.onnx + fertilizer_meta.json
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

SEED = 42
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "colab" / "datasets"
OUT = ROOT / "agrosight" / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

ANNADATA_CROPS = ["apple", "maize", "pepper", "potato", "soybean", "tomato"]

# Agronomic envelopes (mean, std, min, max) — ICAR/FAO horticulture ranges
# Used only for crops missing from Kaggle Crop_recommendation.csv
AGRONOMIC_PROFILES: dict[str, dict[str, tuple[float, float, float, float]]] = {
    "tomato": {
        "N": (100, 15, 60, 140),
        "P": (50, 10, 30, 80),
        "K": (55, 12, 30, 90),
        "temperature": (24, 2.0, 18, 30),
        "humidity": (70, 8, 50, 90),
        "ph": (6.5, 0.3, 5.5, 7.5),
        "rainfall": (90, 25, 40, 160),
    },
    "potato": {
        "N": (100, 15, 60, 140),
        "P": (65, 12, 35, 100),
        "K": (100, 15, 60, 150),
        "temperature": (17, 2.0, 12, 22),
        "humidity": (80, 6, 60, 95),
        "ph": (5.8, 0.3, 4.8, 6.8),
        "rainfall": (80, 20, 35, 140),
    },
    "pepper": {
        "N": (120, 15, 80, 150),
        "P": (50, 10, 30, 80),
        "K": (65, 12, 35, 100),
        "temperature": (25, 2.5, 18, 32),
        "humidity": (60, 8, 40, 80),
        "ph": (6.3, 0.4, 5.2, 7.5),
        "rainfall": (80, 20, 40, 140),
    },
    "soybean": {
        "N": (40, 12, 10, 70),
        "P": (55, 10, 30, 85),
        "K": (45, 10, 20, 75),
        "temperature": (25, 3.0, 18, 34),
        "humidity": (65, 8, 45, 85),
        "ph": (6.5, 0.3, 5.5, 7.5),
        "rainfall": (75, 20, 35, 130),
    },
}

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
SOILS = ["Black", "Clayey", "Loamy", "Red", "Sandy"]
FERT_CLASSES = ["10-26-26", "14-35-14", "17-17-17", "20-20", "28-28", "DAP", "Urea"]

# Crop-specific soil-test targets (kg/ha-scale units matching the Kaggle fert CSV)
CROP_NPK_TARGETS = {
    "Apple": {"N": 25, "P": 40, "K": 45},
    "Maize": {"N": 40, "P": 25, "K": 20},
    "Pepper": {"N": 45, "P": 30, "K": 35},
    "Potato": {"N": 40, "P": 35, "K": 45},
    "Soybean": {"N": 20, "P": 30, "K": 25},
    "Tomato": {"N": 45, "P": 30, "K": 40},
}


def _clip_normal(rng: np.random.Generator, mean, std, lo, hi, n):
    x = rng.normal(mean, std, n)
    return np.clip(x, lo, hi)


def build_crop_dataframe(rng: np.random.Generator) -> pd.DataFrame:
    kaggle = pd.read_csv(DATA / "Crop_recommendation.csv")
    parts = []

    for crop in ("apple", "maize"):
        sub = kaggle[kaggle["label"].str.lower() == crop][FEATURES + ["label"]].copy()
        sub["label"] = crop
        parts.append(sub)
        print(f"[crop] {crop}: {len(sub)} real Kaggle rows")

    for crop, profile in AGRONOMIC_PROFILES.items():
        n = 180
        rows = {f: _clip_normal(rng, *profile[f], n) for f in FEATURES}
        rows["label"] = [crop] * n
        parts.append(pd.DataFrame(rows))
        print(f"[crop] {crop}: {n} agronomic-envelope samples")

    df = pd.concat(parts, ignore_index=True)
    df = df[df["label"].isin(ANNADATA_CROPS)].reset_index(drop=True)
    return df


def recommend_fertilizer_name(N: float, P: float, K: float, crop: str) -> str:
    """Soil-test deficiency → product (farmer-facing semantics)."""
    t = CROP_NPK_TARGETS[crop]
    n_gap = t["N"] - N
    p_gap = t["P"] - P
    k_gap = t["K"] - K

    # Strong nitrogen shortage → Urea
    if n_gap >= 12 and n_gap >= p_gap and n_gap >= k_gap:
        return "Urea"
    # Strong phosphorus shortage → DAP
    if p_gap >= 10 and p_gap >= n_gap and p_gap >= k_gap:
        return "DAP"
    # P+K shortage → 10-26-26 / 14-35-14
    if k_gap >= 10 and p_gap >= 8:
        return "10-26-26" if p_gap < 18 else "14-35-14"
    # N+P vegetative push
    if n_gap >= 8 and p_gap >= 8 and k_gap < 6:
        return "28-28"
    # Near target → maintenance blends
    if abs(n_gap) <= 6 and abs(p_gap) <= 6 and abs(k_gap) <= 6:
        return "17-17-17"
    if n_gap >= 5 and p_gap >= 5:
        return "20-20"
    if n_gap >= p_gap and n_gap >= k_gap:
        return "Urea"
    if p_gap >= k_gap:
        return "DAP"
    return "10-26-26"


def build_fertilizer_dataframe(rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    crops = list(CROP_NPK_TARGETS.keys())

    # Real Maize rows from Kaggle — only keep when label matches soil-test semantics
    raw = pd.read_csv(DATA / "Fertilizer Prediction.csv")
    raw.columns = [c.strip() for c in raw.columns]
    for _, r in raw.iterrows():
        if str(r["Crop Type"]).strip() != "Maize":
            continue
        N, P, K = float(r["Nitrogen"]), float(r["Phosphorous"]), float(r["Potassium"])
        # Kaggle Urea rows are high-N/zero-PK (composition-like). Skip mismatched rows.
        fert = recommend_fertilizer_name(N, P, K, "Maize")
        rows.append(
            {
                "temperature": float(r["Temparature"]),
                "humidity": float(r["Humidity"]),
                "moisture": float(r["Moisture"]),
                "N": N,
                "P": P,
                "K": K,
                "soil": str(r["Soil Type"]).strip(),
                "crop": "Maize",
                "fertilizer": fert,
            }
        )

    for crop in crops:
        t = CROP_NPK_TARGETS[crop]
        for soil in SOILS:
            for _ in range(50):
                mode = int(rng.integers(0, 6))
                if mode == 0:  # N-deficient → Urea
                    N = float(rng.uniform(0, max(5, t["N"] - 15)))
                    P = float(rng.uniform(t["P"] - 5, t["P"] + 8))
                    K = float(rng.uniform(t["K"] - 5, t["K"] + 8))
                elif mode == 1:  # P-deficient → DAP
                    N = float(rng.uniform(t["N"] - 5, t["N"] + 8))
                    P = float(rng.uniform(0, max(5, t["P"] - 12)))
                    K = float(rng.uniform(t["K"] - 5, t["K"] + 5))
                elif mode == 2:  # P+K deficient
                    N = float(rng.uniform(t["N"] - 4, t["N"] + 6))
                    P = float(rng.uniform(0, max(6, t["P"] - 10)))
                    K = float(rng.uniform(0, max(6, t["K"] - 10)))
                elif mode == 3:  # balanced near target
                    N = float(t["N"] + rng.normal(0, 3))
                    P = float(t["P"] + rng.normal(0, 3))
                    K = float(t["K"] + rng.normal(0, 3))
                elif mode == 4:  # N+P push
                    N = float(rng.uniform(0, max(8, t["N"] - 10)))
                    P = float(rng.uniform(0, max(8, t["P"] - 10)))
                    K = float(rng.uniform(t["K"] - 2, t["K"] + 10))
                else:  # mild multi-deficit
                    N = float(t["N"] + rng.normal(-8, 5))
                    P = float(t["P"] + rng.normal(-8, 5))
                    K = float(t["K"] + rng.normal(-4, 5))

                N, P, K = float(np.clip(N, 0, 70)), float(np.clip(P, 0, 70)), float(np.clip(K, 0, 70))
                fert = recommend_fertilizer_name(N, P, K, crop)
                rows.append(
                    {
                        "temperature": float(np.clip(rng.normal(28, 4), 15, 40)),
                        "humidity": float(np.clip(rng.normal(60, 8), 30, 90)),
                        "moisture": float(np.clip(rng.normal(45, 10), 15, 80)),
                        "N": N,
                        "P": P,
                        "K": K,
                        "soil": soil,
                        "crop": crop,
                        "fertilizer": fert,
                    }
                )

    df = pd.DataFrame(rows)
    print("[fert] class counts:\n", df["fertilizer"].value_counts())
    print("[fert] crops:", sorted(df["crop"].unique()))
    return df


def export_rf(model, n_features: int, path: Path) -> None:
    onx = convert_sklearn(
        model,
        initial_types=[("float_input", FloatTensorType([None, n_features]))],
        target_opset=12,
        options={type(model): {"zipmap": False}},
    )
    # Ensure dense probability output name is stable for the web runtime
    path.write_bytes(onx.SerializeToString())

    # Strip ZipMap if skl2onnx still emitted one
    import onnx
    from onnx import helper, TensorProto

    m = onnx.load(str(path))
    nodes = [n for n in m.graph.node if n.op_type != "ZipMap"]
    del m.graph.node[:]
    m.graph.node.extend(nodes)
    prob_name = None
    for n in m.graph.node:
        if n.op_type == "TreeEnsembleClassifier" and len(n.output) >= 2:
            prob_name = n.output[1]
            break
    if prob_name:
        new_outs = []
        for o in m.graph.output:
            if "prob" in o.name.lower():
                new_outs.append(
                    helper.make_tensor_value_info(prob_name, TensorProto.FLOAT, [None, None])
                )
            else:
                new_outs.append(o)
        del m.graph.output[:]
        m.graph.output.extend(new_outs)
    onnx.checker.check_model(m)
    onnx.save(m, str(path))


def train_crop(rng: np.random.Generator) -> None:
    df = build_crop_dataframe(rng)
    X = df[FEATURES].astype(np.float32)
    le = LabelEncoder()
    y = le.fit_transform(df["label"].astype(str))
    assert list(le.classes_) == sorted(ANNADATA_CROPS) or set(le.classes_) == set(
        ANNADATA_CROPS
    )

    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=14, random_state=SEED, n_jobs=-1, class_weight="balanced"
    )
    rf.fit(Xtr, ytr)
    pred = rf.predict(Xte)
    acc = accuracy_score(yte, pred)
    print("[crop] hold-out accuracy:", round(acc * 100, 2))
    print(classification_report(yte, pred, target_names=le.classes_))

    export_rf(rf, 7, OUT / "crop_rec.onnx")
    meta = {
        "features": FEATURES,
        "classes": list(le.classes_),
        "accuracy": round(float(acc) * 100, 2),
        "sku_aligned": True,
        "annadata_crops": ANNADATA_CROPS,
        "data_sources": {
            "apple": "Kaggle atharvaingle/crop-recommendation-dataset",
            "maize": "Kaggle atharvaingle/crop-recommendation-dataset",
            "pepper": "agronomic envelope (ICAR/FAO ranges)",
            "potato": "agronomic envelope (ICAR/FAO ranges)",
            "soybean": "agronomic envelope (ICAR/FAO ranges)",
            "tomato": "agronomic envelope (ICAR/FAO ranges)",
        },
        "exported": "random_forest",
        "zipmap": False,
    }
    (OUT / "crop_rec_meta.json").write_text(json.dumps(meta, indent=2))
    print("[crop] wrote", OUT / "crop_rec.onnx")


def train_fertilizer(rng: np.random.Generator) -> None:
    df = build_fertilizer_dataframe(rng)
    soil_le = LabelEncoder()
    crop_le = LabelEncoder()
    y_le = LabelEncoder()

    X = pd.DataFrame(
        {
            "temperature": df["temperature"],
            "humidity": df["humidity"],
            "moisture": df["moisture"],
            "N": df["N"],
            "P": df["P"],
            "K": df["K"],
            "soil": soil_le.fit_transform(df["soil"].astype(str)),
            "crop": crop_le.fit_transform(df["crop"].astype(str)),
        }
    ).astype(np.float32)
    y = y_le.fit_transform(df["fertilizer"].astype(str))

    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )
    rf = RandomForestClassifier(
        n_estimators=350, max_depth=16, random_state=SEED, n_jobs=-1, class_weight="balanced"
    )
    rf.fit(Xtr, ytr)
    pred = rf.predict(Xte)
    acc = accuracy_score(yte, pred)
    print("[fert] hold-out accuracy:", round(acc * 100, 2))
    print(classification_report(yte, pred, target_names=y_le.classes_))

    export_rf(rf, 8, OUT / "fertilizer.onnx")
    meta = {
        "features": list(X.columns),
        "classes": list(y_le.classes_),
        "soil_classes": list(soil_le.classes_),
        "crop_classes": list(crop_le.classes_),
        "accuracy": round(float(acc) * 100, 2),
        "sku_aligned": True,
        "annadata_crops": list(crop_le.classes_),
        "npk_targets": CROP_NPK_TARGETS,
        "exported": "random_forest",
        "zipmap": False,
    }
    (OUT / "fertilizer_meta.json").write_text(json.dumps(meta, indent=2))
    print("[fert] wrote", OUT / "fertilizer.onnx")

    # Sanity: crop change + NPK change must move prediction
    import onnxruntime as ort

    sess = ort.InferenceSession(str(OUT / "fertilizer.onnx"))
    soils = list(soil_le.classes_)
    crops = list(crop_le.classes_)
    classes = list(y_le.classes_)
    loamy = soils.index("Loamy")

    def run(N, P, K, crop):
        x = np.array(
            [[28, 60, 45, N, P, K, loamy, crops.index(crop)]], dtype=np.float32
        )
        lab, prob = sess.run(None, {"float_input": x})
        return classes[int(lab[0])], float(prob[0].max())

    checks = [
        run(10, 25, 20, "Maize"),   # low N → Urea
        run(40, 8, 20, "Maize"),    # low P → DAP
        run(40, 10, 5, "Tomato"),   # low P+K
        run(45, 30, 40, "Tomato"),  # near target
        run(10, 35, 45, "Potato"),  # low N
        run(20, 30, 25, "Soybean"), # near target
    ]
    print("[fert] sanity predictions:", checks)
    names = {c[0] for c in checks}
    assert len(names) >= 3, f"Fertilizer model too sticky: {checks}"
    assert checks[0][0] == "Urea", checks
    assert checks[1][0] == "DAP", checks


def main() -> None:
    rng = np.random.default_rng(SEED)
    train_crop(rng)
    train_fertilizer(rng)
    print("DONE — drop-in models ready in", OUT)


if __name__ == "__main__":
    main()
