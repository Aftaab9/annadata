# AgroSight on-device models

## Leaf Health (SHIPPED — do not retrain)
```
agrosight_plantvillage.tflite
```
Classes: HEALTHY / SURFACE_DEFECT / BLIGHT_MOLD

## Produce Quality (YOU train in Colab — see `../../COLAB_RUN_ME.md`)
```
agrosight_produce.tflite
```
Classes exported as FRESH / BORDERLINE / ROTTEN → Grade A/B/C

Until this file exists, Inspect → Produce Quality runs an **honest demo heuristic** (labeled in UI).

## Advisory ONNX (after Colab 02 / 03)
```
crop_rec.onnx
crop_rec_meta.json
fertilizer.onnx
fertilizer_meta.json
```

```bash
npm run copy-model   # copies from ../../models if present
npm run dev
```
