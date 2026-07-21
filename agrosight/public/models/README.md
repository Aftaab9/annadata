# AgroSight on-device models

## Leaf Health (SHIPPED — do not retrain)
```
agrosight_plantvillage.tflite
```
Classes: HEALTHY / SURFACE_DEFECT / BLIGHT_MOLD

## Produce Quality
```
agrosight_produce.tflite
```
Classes exported as FRESH / BORDERLINE / ROTTEN → Grade A/B/C

## Advisory ONNX (Colab 02 / 03 — present)
```
crop_rec.onnx + crop_rec_meta.json
fertilizer.onnx + fertilizer_meta.json
```

## Price forecast (Colab 04)
```
../data/price_forecast_series.json
```
