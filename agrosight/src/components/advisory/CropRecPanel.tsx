import { useEffect, useState } from 'react'
import { Sprout } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import { recommendCrop, type CropRecResult } from '@/services'
import type { CropRecInputs } from '@/services/types'
import { cropIcon } from '@/lib/cropIcons'
import { probeOnnxArtifacts } from '@/lib/onnxProbe'
import { clearOnnxSessionCache } from '@/lib/onnxRuntime'
import { cn } from '@/lib/cn'

const FIELD_META: {
  key: keyof CropRecInputs
  label: string
  unit: string
  step: number
  min: number
  max: number
}[] = [
  { key: 'N', label: 'Nitrogen', unit: 'kg/ha', step: 1, min: 0, max: 140 },
  { key: 'P', label: 'Phosphorus', unit: 'kg/ha', step: 1, min: 0, max: 145 },
  { key: 'K', label: 'Potassium', unit: 'kg/ha', step: 1, min: 0, max: 205 },
  { key: 'temperature', label: 'Temperature', unit: '°C', step: 0.5, min: 8, max: 44 },
  { key: 'humidity', label: 'Humidity', unit: '%', step: 1, min: 14, max: 100 },
  { key: 'ph', label: 'Soil pH', unit: '', step: 0.1, min: 3.5, max: 10 },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', step: 5, min: 20, max: 300 },
]

/** Demo presets — click to jump sliders to a profile that yields that crop. */
const CROP_PRESETS: { id: string; label: string; values: CropRecInputs }[] = [
  {
    id: 'maize',
    label: 'Maize',
    values: { N: 78, P: 48, K: 20, temperature: 22, humidity: 65, ph: 6.2, rainfall: 85 },
  },
  {
    id: 'apple',
    label: 'Apple',
    values: { N: 20, P: 134, K: 200, temperature: 22, humidity: 92, ph: 5.9, rainfall: 115 },
  },
  {
    id: 'potato',
    label: 'Potato',
    values: { N: 100, P: 65, K: 100, temperature: 17, humidity: 80, ph: 5.8, rainfall: 80 },
  },
  {
    id: 'tomato',
    label: 'Tomato',
    values: { N: 100, P: 50, K: 55, temperature: 24, humidity: 70, ph: 6.5, rainfall: 90 },
  },
  {
    id: 'soybean',
    label: 'Soybean',
    values: { N: 40, P: 55, K: 45, temperature: 25, humidity: 65, ph: 6.5, rainfall: 75 },
  },
  {
    id: 'pepper',
    label: 'Pepper',
    values: { N: 120, P: 50, K: 65, temperature: 25, humidity: 60, ph: 6.3, rainfall: 80 },
  },
]

export function CropRecPanel() {
  const cropRecInputs = useStore((s) => s.cropRecInputs)
  const setCropRecInputs = useStore((s) => s.setCropRecInputs)
  const [result, setResult] = useState<CropRecResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [onnxReady, setOnnxReady] = useState(false)

  useEffect(() => {
    clearOnnxSessionCache()
    probeOnnxArtifacts().then((s) => setOnnxReady(s.cropRec))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t = setTimeout(() => {
      recommendCrop(cropRecInputs)
        .then((r) => {
          if (!cancelled) setResult(r)
        })
        .catch((err) => {
          console.warn('[CropRecPanel] recommend failed', err)
          if (!cancelled) setResult(null)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [cropRecInputs])

  return (
    <div className="space-y-4">
      <Card>
        <p
          className={cn(
            'rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest',
            onnxReady
              ? 'border-healthy/30 bg-healthy/10 text-healthy'
              : 'border-warning/30 bg-warning/10 text-warning',
          )}
        >
          {onnxReady
            ? 'Live · crop_rec.onnx · 6 Annadata SKUs (96.7% hold-out)'
            : 'Lookup mode · drop crop_rec.onnx from Colab for trained RF'}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-cyan">
          Crop recommendation
        </p>
        <p className="mt-1 text-sm text-muted">
          {onnxReady
            ? 'Soil + climate → RandomForest ONNX for Apple, Maize, Pepper, Potato, Soybean, Tomato.'
            : 'Soil + climate → nearest Annadata crop centroid until ONNX loads.'}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-dim">
          Try a soil profile
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CROP_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCropRecInputs(p.values)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                result?.crop === p.id
                  ? 'border-cyan/50 bg-cyan/15 text-cyan'
                  : 'border-[var(--border)] bg-[var(--surface)] text-muted hover:border-cyan/40 hover:text-text',
              )}
            >
              <span aria-hidden>{cropIcon(p.id)}</span>
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-4">
          {FIELD_META.map(({ key, label, unit, step, min, max }) => (
            <label key={key} className="block">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted">{label}</span>
                <span className="font-mono text-text">
                  {cropRecInputs[key]}
                  {unit && <span className="text-dim"> {unit}</span>}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={cropRecInputs[key]}
                onChange={(e) =>
                  setCropRecInputs({ [key]: Number(e.target.value) })
                }
                className="w-full accent-cyan"
              />
            </label>
          ))}
        </div>
      </Card>

      {result && (
        <Card className="border-healthy/30 bg-healthy/5">
          <div className="flex items-start gap-4">
            <span className="text-4xl" aria-hidden>
              {cropIcon(result.crop)}
            </span>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-healthy">
                Recommended crop
              </p>
              <p className="mt-1 text-2xl font-bold text-text">{result.label}</p>
              <p className="mt-1 font-mono text-sm text-cyan">
                {Math.round(result.confidence * 100)}% RF vote share · ONNX
                  RandomForest
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{result.reason}</p>
            </div>
          </div>
          {loading && (
            <p className="mt-3 font-mono text-[10px] text-dim">Recalculating…</p>
          )}
          {result.alternatives && result.alternatives.length > 0 && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
                Also consider
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.alternatives.map((alt) => (
                  <span
                    key={alt.crop}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-muted"
                  >
                    <span aria-hidden>{cropIcon(alt.crop)}</span>
                    {alt.label}
                    <span className="font-mono text-dim">
                      {Math.round(alt.confidence * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {!result && loading && (
        <Card className="animate-pulse py-8 text-center text-sm text-muted">
          <Sprout className="mx-auto h-6 w-6 text-cyan" aria-hidden />
          <p className="mt-2">Analyzing soil profile…</p>
        </Card>
      )}

      {!result && !loading && (
        <Card className="border-warning/30 bg-warning/5 py-6 text-center text-sm text-muted">
          <p>Could not compute a crop recommendation. Adjust sliders and try again.</p>
        </Card>
      )}
    </div>
  )
}
