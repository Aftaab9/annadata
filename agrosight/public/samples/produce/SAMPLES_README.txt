HOW TO VERIFY PRODUCE QUALITY
1. Open Inspect — mode must be **Produce Quality** (apple icon), NOT Leaf Health
2. Wait until badge says: live TFLite (not DEMO heuristic)
3. Upload from this folder:
   - verify_fresh_apple*.jpg / dataset_fresh_*  → Fresh / Grade A–B
   - verify_rotten_apple*.jpg / dataset_rotten_* → Spoiled / Grade C
4. Bars should say Fresh / Borderline / Spoiled — never Blight (that is Leaf mode)

Fix applied: app now feeds 0–1 pixels (same as Colab training). Old 0–255 path made every image ~58% Fresh.
