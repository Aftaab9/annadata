#!/usr/bin/env python3
"""
Download PlantVillage color images for AgroSight testing.

1. Fetches split lists + data.zip from Hugging Face (mohanty/PlantVillage)
2. Extracts to pv_data/ (one-time ~800MB)
3. Copies a curated test pack to Mock-Images/plantvillage/ (~24 leaf images)

Usage:
  python scripts/download_plantvillage.py
  python scripts/download_plantvillage.py --samples-only   # skip zip if pv_data exists
"""
from __future__ import annotations

import argparse
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PV_ROOT = ROOT / "pv_data"
SAMPLES_DIR = ROOT / "Mock-Images" / "plantvillage"

SKU_MAP = {
    "Corn_(maize)": "maize",
    "Soybean": "soybean",
    "Pepper,_bell": "pepper",
    "Tomato": "tomato",
    "Potato": "potato",
    "Apple": "apple",
}
SELECTED_CROPS = set(SKU_MAP.keys())


def map_to_defect(name: str) -> str:
    n = name.lower()
    if "healthy" in n:
        return "HEALTHY"
    blight_kw = ["blight", "rot", "rust", "mildew", "mold", "esca", "greening", "curl"]
    if any(k in n for k in blight_kw):
        return "BLIGHT_MOLD"
    return "SURFACE_DEFECT"


def path_to_crop(rel_path: str) -> str:
    folder = rel_path.replace("\\", "/").split("/")[-2]
    return folder.split("___")[0]


def path_to_class_name(rel_path: str) -> str:
    return rel_path.replace("\\", "/").split("/")[-2]


def read_paths(txt_file: str) -> list[str]:
    with open(txt_file, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def resolve_image(rel_path: str) -> Path:
    rel = rel_path.replace("\\", "/")
    for base in [PV_ROOT, PV_ROOT / "data"]:
        p = base / rel
        if p.exists():
            return p
    raise FileNotFoundError(rel_path)


def ensure_dataset(force: bool = False) -> None:
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        raise SystemExit("Install: pip install huggingface_hub")

    has_images = (PV_ROOT / "color").exists() or (PV_ROOT / "data" / "color").exists()
    if has_images and not force:
        print(f"[ok] pv_data already extracted at {PV_ROOT}")
        return

    print("Downloading PlantVillage from Hugging Face (~800MB, one-time)...")
    zip_path = hf_hub_download(
        repo_id="mohanty/PlantVillage",
        filename="data.zip",
        repo_type="dataset",
    )
    PV_ROOT.mkdir(parents=True, exist_ok=True)
    print(f"Extracting {zip_path} -> {PV_ROOT} ...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(PV_ROOT)
    print("[ok] Extraction complete")


def download_splits() -> tuple[list[str], list[str]]:
    from huggingface_hub import hf_hub_download

    train_txt = hf_hub_download(
        repo_id="mohanty/PlantVillage",
        filename="splits/color_train.txt",
        repo_type="dataset",
    )
    test_txt = hf_hub_download(
        repo_id="mohanty/PlantVillage",
        filename="splits/color_test.txt",
        repo_type="dataset",
    )
    train = [p for p in read_paths(train_txt) if "color" in p.replace("\\", "/")]
    test = [p for p in read_paths(test_txt) if "color" in p.replace("\\", "/")]
    return train, test


def build_sample_pack(test_paths: list[str], per_defect: int = 1) -> int:
    """Copy curated leaf images into Mock-Images/plantvillage/."""
    if SAMPLES_DIR.exists():
        shutil.rmtree(SAMPLES_DIR)
    SAMPLES_DIR.mkdir(parents=True)

    # bucket[crop][defect] -> list of rel paths
    bucket: dict[str, dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))

    for rel in test_paths:
        crop = path_to_crop(rel)
        if crop not in SELECTED_CROPS:
            continue
        defect = map_to_defect(path_to_class_name(rel))
        if len(bucket[crop][defect]) < per_defect:
            bucket[crop][defect].append(rel)

    copied = 0
    for crop in sorted(SELECTED_CROPS):
        slug = SKU_MAP[crop]
        crop_dir = SAMPLES_DIR / slug
        crop_dir.mkdir(parents=True, exist_ok=True)

        for defect in ["HEALTHY", "SURFACE_DEFECT", "BLIGHT_MOLD"]:
            paths = bucket[crop].get(defect, [])
            for i, rel in enumerate(paths, start=1):
                src = resolve_image(rel)
                class_folder = path_to_class_name(rel)
                dest = crop_dir / f"{defect.lower()}_{i}_{class_folder}{src.suffix.lower()}"
                shutil.copy2(src, dest)
                copied += 1
                print(f"  copied {dest.relative_to(ROOT)}")

    # README for quick reference
    readme = SAMPLES_DIR / "README.txt"
    readme.write_text(
        "PlantVillage leaf samples for AgroSight /inspect testing.\n"
        "Use close-up LEAF photos (not whole fruit). Pick matching crop chip.\n"
        "Folders: apple, maize, soybean, pepper, tomato, potato\n"
        "Filenames: healthy_*, surface_defect_*, blight_mold_*\n",
        encoding="utf-8",
    )
    return copied


def main() -> None:
    parser = argparse.ArgumentParser(description="Download PlantVillage for AgroSight")
    parser.add_argument(
        "--samples-only",
        action="store_true",
        help="Only build sample pack (pv_data must already exist)",
    )
    parser.add_argument(
        "--per-defect",
        type=int,
        default=2,
        help="Images per defect class per crop (default: 2)",
    )
    args = parser.parse_args()

    if not args.samples_only:
        ensure_dataset()
    elif not (PV_ROOT / "color").exists() and not (PV_ROOT / "data" / "color").exists():
        raise SystemExit(
            f"pv_data not found at {PV_ROOT}. Run without --samples-only first."
        )

    print("Fetching split lists...")
    _, test_paths = download_splits()
    print(f"Building test pack in {SAMPLES_DIR} ...")
    n = build_sample_pack(test_paths, per_defect=args.per_defect)
    print(f"\nDone — {n} images in Mock-Images/plantvillage/")
    print("Upload these in /inspect for high-confidence TFLite results.")


if __name__ == "__main__":
    main()
