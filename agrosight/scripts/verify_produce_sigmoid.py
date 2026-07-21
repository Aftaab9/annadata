"""Verify sigmoid tensor vs 3-way recovery; optionally rebuild binary TFLite via strip."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BAK = ROOT / "public" / "models" / "agrosight_produce_threeway_backup.tflite"
SRC = ROOT / "public" / "models" / "agrosight_produce.tflite"
SRC_USE = BAK if BAK.exists() else SRC


def load_rgb01(path: Path) -> np.ndarray:
    img = Image.open(path).convert("RGB").resize((224, 224), Image.BILINEAR)
    return (np.asarray(img, dtype=np.float32) / 255.0)[None, ...]


def main() -> None:
    print("Using", SRC_USE)
    interp = tf.lite.Interpreter(
        model_path=str(SRC_USE),
        experimental_preserve_all_tensors=True,
    )
    interp.allocate_tensors()
    inn = interp.get_input_details()[0]
    out = interp.get_output_details()[0]
    sig_idx = None
    for t in interp.get_tensor_details():
        if "dense_2_1/Sigmoid" in t["name"]:
            sig_idx = t["index"]
            break
    print("sigmoid idx", sig_idx, "final out", out["name"], out["shape"])

    fruit = ROOT.parent / "Mock-Images" / "plantvillage" / "apple_fruit"
    paths = sorted(fruit.glob("*.jpg"))
    samples = ROOT / "public" / "samples" / "produce"
    paths += list(sorted(samples.glob("dataset_fresh*")))[:3]
    paths += list(sorted(samples.glob("dataset_rotten*")))[:3]

    rows = []
    for path in paths:
        x = load_rgb01(path)
        interp.set_tensor(inn["index"], x)
        interp.invoke()
        softmax = interp.get_tensor(out["index"]).ravel()
        p_sig = float(interp.get_tensor(sig_idx).ravel()[0])
        f, b, r = map(float, softmax[:3])
        p_rec = r / (f + r + 1e-12)
        rows.append((path.name, p_sig, p_rec, f, b, r))
        print(
            f"{path.name:28s} sigmoid={p_sig:.4f} recover={p_rec:.4f} "
            f"sm=[{f:.3f},{b:.3f},{r:.3f}] "
            f"label_sig={'ROTTEN' if p_sig > 0.5 else 'FRESH'}"
        )

    # Build a tiny wrapper SavedModel that runs the interpreter? Skip.
    # Instead write a sidecar JSON of expected checks + ensure JS uses recovery.
    assert sig_idx is not None
    # Quick diversity check
    sigs = [r[1] for r in rows]
    print("sigmoid min/max/std", min(sigs), max(sigs), float(np.std(sigs)))
    if max(sigs) - min(sigs) < 0.05:
        raise SystemExit("Model still not discriminating — preprocess/model issue")
    print("OK — binary sigmoid discriminates; JS should use R/(F+R) or re-export")


if __name__ == "__main__":
    main()
