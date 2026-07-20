"""Re-export PlantVillage Keras model as float32 TFLite (browser-safe).

The Colab export used float16 quantization, which breaks @tensorflow/tfjs-tflite
in the browser (all-zero outputs → fake 33% confidence).

Usage (from agrosight/):
  python scripts/export_fp32_tflite.py
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as prep_mobilenet

ROOT = Path(__file__).resolve().parents[2]
KERAS_PATH = ROOT / 'models' / 'agrosight_plantvillage.keras'
OUT_PATHS = [
    ROOT / 'models' / 'agrosight_plantvillage.tflite',
    ROOT / 'agrosight' / 'public' / 'models' / 'agrosight_plantvillage.tflite',
]


def main() -> None:
    if not KERAS_PATH.exists():
        raise SystemExit(f'Missing {KERAS_PATH} — train/export from Colab first.')

    custom = {'preprocess_input': prep_mobilenet, 'function': prep_mobilenet}
    model = tf.keras.models.load_model(str(KERAS_PATH), custom_objects=custom, compile=False)
    print(f'Loaded {KERAS_PATH.name} → {model.output_shape}')

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Do NOT set supported_types float16 — breaks browser WASM runtime
    tflite_bytes = converter.convert()

    for dest in OUT_PATHS:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(tflite_bytes)
        mb = len(tflite_bytes) / 1024 / 1024
        print(f'Wrote {dest} ({mb:.1f} MB)')

    interp = tf.lite.Interpreter(model_content=tflite_bytes)
    interp.allocate_tensors()
    inp = interp.get_input_details()[0]
    x = np.random.rand(1, 224, 224, 3).astype(np.float32) * 255
    interp.set_tensor(inp['index'], x)
    interp.invoke()
    print('Smoke test:', interp.get_tensor(interp.get_output_details()[0]['index']))


if __name__ == '__main__':
    main()
