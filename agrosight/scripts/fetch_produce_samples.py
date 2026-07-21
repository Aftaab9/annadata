"""Pull labeled fresh/rotten images from HF parquet / zip for Inspect cross-check."""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

from huggingface_hub import hf_hub_download
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "public" / "samples" / "produce"
OUT.mkdir(parents=True, exist_ok=True)


def save_img(img: Image.Image, kind: str, n: int) -> None:
    path = OUT / f"dataset_{kind}_{n:02d}.jpg"
    img.convert("RGB").save(path, quality=90)
    print("saved", path.name)


def from_agml_parquet(max_each: int = 8) -> dict[str, int]:
    import pyarrow.parquet as pq

    counts = {"fresh": 0, "rotten": 0}
    for part in [
        "raw/train-00000-of-00004.parquet",
        "raw/train-00001-of-00004.parquet",
    ]:
        local = hf_hub_download(
            "Project-AgML/fresh_rotten_fruit_classification",
            part,
            repo_type="dataset",
        )
        table = pq.read_table(local)
        cols = {c.lower(): c for c in table.column_names}
        label_col = cols.get("label") or cols.get("labels") or cols.get("class")
        image_col = cols.get("image") or cols.get("img")
        if not label_col or not image_col:
            print("columns", table.column_names)
            continue
        labels = table[label_col].to_pylist()
        images = table[image_col].to_pylist()
        for label, img_obj in zip(labels, images):
            text = str(label).lower()
            kind = None
            if "rotten" in text:
                kind = "rotten"
            elif "fresh" in text:
                kind = "fresh"
            if kind is None or counts[kind] >= max_each:
                if counts["fresh"] >= max_each and counts["rotten"] >= max_each:
                    return counts
                continue
            # HF Image feature often dict {bytes, path}
            if isinstance(img_obj, dict) and "bytes" in img_obj and img_obj["bytes"]:
                img = Image.open(io.BytesIO(img_obj["bytes"]))
            elif isinstance(img_obj, dict) and img_obj.get("path"):
                img = Image.open(img_obj["path"])
            elif isinstance(img_obj, (bytes, bytearray)):
                img = Image.open(io.BytesIO(img_obj))
            else:
                continue
            counts[kind] += 1
            save_img(img, kind, counts[kind])
            if counts["fresh"] >= max_each and counts["rotten"] >= max_each:
                return counts
    return counts


def from_zip(max_each: int = 8) -> dict[str, int]:
    counts = {"fresh": 0, "rotten": 0}
    zpath = hf_hub_download(
        "Densu341/Fresh-rotten-fruit",
        "freshness_fruit.zip",
        repo_type="dataset",
    )
    with zipfile.ZipFile(zpath) as zf:
        for name in zf.namelist():
            low = name.lower()
            if not low.endswith((".jpg", ".jpeg", ".png")):
                continue
            kind = None
            if "rotten" in low:
                kind = "rotten"
            elif "fresh" in low:
                kind = "fresh"
            if kind is None or counts[kind] >= max_each:
                continue
            with zf.open(name) as f:
                img = Image.open(io.BytesIO(f.read()))
            counts[kind] += 1
            save_img(img, kind, counts[kind])
            if counts["fresh"] >= max_each and counts["rotten"] >= max_each:
                break
    return counts


def main() -> None:
    try:
        counts = from_agml_parquet()
    except Exception as e:  # noqa: BLE001
        print("parquet path failed:", e)
        counts = {"fresh": 0, "rotten": 0}
    if counts["fresh"] < 4 or counts["rotten"] < 4:
        print("trying zip fallback…")
        zc = from_zip()
        for k in counts:
            counts[k] = max(counts[k], zc[k])
    (OUT / "SAMPLES_README.txt").write_text(
        "Labeled fresh/rotten samples for Produce Quality cross-check.\n"
        "Upload dataset_fresh_*.jpg → expect Fresh / Grade A–B\n"
        "Upload dataset_rotten_*.jpg → expect Rotten / Grade C\n"
        f"Counts: {counts}\n",
        encoding="utf-8",
    )
    print("DONE", counts)
    if counts["fresh"] == 0 or counts["rotten"] == 0:
        raise SystemExit("Need both fresh and rotten samples")


if __name__ == "__main__":
    main()
