# AgroSight on-device models

## Leaf Health (SHIPPED — do not retrain)
```
agrosight_plantvillage.tflite
```
Classes: HEALTHY / SURFACE_DEFECT / BLIGHT_MOLD

## Produce Quality (SHIPPED)
```
agrosight_produce.tflite
```
Binary Fresh/Spoiled → Borderline band · Grade A/B/C

## Advisory ONNX (Annadata 6 SKUs)
```
crop_rec.onnx + crop_rec_meta.json   → apple, maize, pepper, potato, soybean, tomato
fertilizer.onnx + fertilizer_meta.json → same 6 crops × soils → Urea/DAP/NPK blends
```
Retrain locally: `python colab/retrain_annadata_advisory.py`  
Export with dense probs (`zipmap: false`) — required for onnxruntime-web.

## Price forecast (Colab 04)
```
../data/price_forecast_series.json
```
