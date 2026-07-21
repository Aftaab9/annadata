"""Strip ThreeWay head; keep ResNet+sigmoid only. No retrain."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.lite.python import schema_py_generated as schema_fb
from tensorflow.lite.tools import flatbuffer_utils

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "public" / "models"
BAK = MODELS / "agrosight_produce_threeway_backup.tflite"
DST = MODELS / "agrosight_produce.tflite"


def main() -> None:
    if not BAK.exists():
        src = MODELS / "agrosight_produce.tflite"
        BAK.write_bytes(src.read_bytes())
        print("created backup")

    buf = bytearray(BAK.read_bytes())
    model = schema_fb.ModelT.InitFromObj(schema_fb.Model.GetRootAsModel(buf, 0))
    sg = model.subgraphs[0]

    # Locate sigmoid tensor via live interpreter names
    interp = tf.lite.Interpreter(model_path=str(BAK))
    interp.allocate_tensors()
    sig_idx = None
    for t in interp.get_tensor_details():
        if "dense_2_1/Sigmoid" in t["name"]:
            sig_idx = int(t["index"])
            print("target", sig_idx, t["name"])
            break
    assert sig_idx is not None

    # Which op produces each tensor?
    producer: dict[int, int] = {}
    for op_i, op in enumerate(sg.operators):
        for o in op.outputs:
            producer[int(o)] = op_i

    needed_ops: set[int] = set()
    stack = [sig_idx]
    seen_t = {sig_idx}
    while stack:
        t = stack.pop()
        if t not in producer:
            continue
        op_i = producer[t]
        if op_i in needed_ops:
            continue
        needed_ops.add(op_i)
        op = sg.operators[op_i]
        for inp in op.inputs:
            inp = int(inp)
            if inp < 0:
                continue
            if inp not in seen_t:
                seen_t.add(inp)
                stack.append(inp)

    print("keeping ops", len(needed_ops), "of", len(sg.operators))
    sg.operators = [sg.operators[i] for i in sorted(needed_ops)]
    sg.outputs = [sig_idx]
    print("new outputs", sg.outputs, "ops", len(sg.operators))

    flatbuffer_utils.write_model(model, str(DST))
    print("wrote", DST, DST.stat().st_size)

    # Verify in THIS process carefully
    i2 = tf.lite.Interpreter(model_path=str(DST), num_threads=1)
    i2.allocate_tensors()
    print("OUT", i2.get_output_details())
    inn = i2.get_input_details()[0]
    out = i2.get_output_details()[0]

    def run(path: Path) -> None:
        img = Image.open(path).convert("RGB").resize((224, 224), Image.BILINEAR)
        arr = (np.asarray(img, dtype=np.float32) / 255.0)[None, ...]
        i2.set_tensor(inn["index"], arr)
        i2.invoke()
        p = float(i2.get_tensor(out["index"]).ravel()[0])
        print(f"{path.name:28s} P(Rotten)={p:.4f} -> {'ROTTEN' if p > 0.5 else 'FRESH'}")

    fruit = ROOT.parent / "Mock-Images" / "plantvillage" / "apple_fruit"
    for f in sorted(fruit.glob("*.jpg")):
        run(f)

    meta = {
        "export": "binary_sigmoid_stripped_threeway",
        "preprocess": "float32_rgb_div_255",
        "output": "P(Rotten)",
        "ops_kept": len(needed_ops),
        "sigmoid_index": sig_idx,
    }
    (MODELS / "produce_export_meta.json").write_text(json.dumps(meta, indent=2))
    print("SUCCESS", meta)


if __name__ == "__main__":
    main()
