import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import {
  FERTILIZER_CROP_OPTIONS,
  FERTILIZER_SOIL_OPTIONS,
  fertilizerDisplayName,
  fertilizerGradeHint,
  recommendFertilizer,
  type FertilizerResult,
} from '@/services/fertilizerService'
import { cn } from '@/lib/cn'
import { probeOnnxArtifacts } from '@/lib/onnxProbe'
import { clearOnnxSessionCache } from '@/lib/onnxRuntime'

export function FertilizerPanel() {
  const fertilizerInputs = useStore((s) => s.fertilizerInputs)
  const setFertilizerInputs = useStore((s) => s.setFertilizerInputs)
  const [result, setResult] = useState<FertilizerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [onnxReady, setOnnxReady] = useState(false)

  useEffect(() => {
    clearOnnxSessionCache()
    probeOnnxArtifacts().then((s) => setOnnxReady(s.fertilizer))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t = setTimeout(() => {
      recommendFertilizer(fertilizerInputs)
        .then((r) => {
          if (!cancelled) setResult(r)
        })
        .catch((err) => {
          console.warn('[FertilizerPanel] recommend failed', err)
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
  }, [fertilizerInputs])

  const npk = [
    { key: 'N' as const, label: 'Nitrogen', color: 'text-cyan' },
    { key: 'P' as const, label: 'Phosphorus', color: 'text-indigo' },
    { key: 'K' as const, label: 'Potassium', color: 'text-teal' },
  ]

  const climate = [
    { key: 'temperature' as const, label: 'Temperature', unit: '°C', min: 10, max: 45, step: 1 },
    { key: 'humidity' as const, label: 'Humidity', unit: '%', min: 10, max: 100, step: 1 },
    { key: 'moisture' as const, label: 'Soil moisture', unit: '%', min: 5, max: 90, step: 1 },
  ]

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
            ? 'Live · fertilizer.onnx · 6 Annadata crops (84% hold-out)'
            : 'Lookup mode · drop fertilizer.onnx from Colab'}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-cyan">
          Fertilizer advice
        </p>
        <p className="mt-1 text-sm text-muted">
          Soil-test NPK + climate + crop → RandomForest. Bag codes like{' '}
          <span className="text-text">10-26-26</span> mean % Nitrogen–Phosphorus–Potassium
          (not a mystery ID). There is no “17-20-20” here — you may be seeing{' '}
          <span className="text-text">17-17-17</span> (balanced) or <span className="text-text">20-20</span> (N+P).
        </p>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-dim">
          Try a soil-test preset
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              { label: 'Low N → Urea', N: 8, P: 25, K: 20 },
              { label: 'Low P → DAP', N: 40, P: 5, K: 20 },
              { label: 'Low P+K → 10-26-26', N: 40, P: 8, K: 5 },
              { label: 'Balanced → 17-17-17', N: 40, P: 25, K: 20 },
            ] as const
          ).map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setFertilizerInputs({ N: p.N, P: p.P, K: p.K })}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-muted hover:border-teal/40 hover:text-text"
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs text-muted">
          Crop type
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
            value={fertilizerInputs.crop}
            onChange={(e) => setFertilizerInputs({ crop: e.target.value })}
          >
            {FERTILIZER_CROP_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-xs text-muted">
          Soil type
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
            value={fertilizerInputs.soil}
            onChange={(e) => setFertilizerInputs({ soil: e.target.value })}
          >
            {FERTILIZER_SOIL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 space-y-3">
          {climate.map(({ key, label, unit, min, max, step }) => (
            <label key={key} className="block">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted">{label}</span>
                <span className="font-mono text-text">
                  {fertilizerInputs[key]}
                  <span className="text-dim"> {unit}</span>
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={fertilizerInputs[key]}
                onChange={(e) =>
                  setFertilizerInputs({ [key]: Number(e.target.value) })
                }
                className="w-full accent-cyan"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {npk.map(({ key, label, color }) => (
            <label key={key} className="block">
              <div className="mb-1 flex justify-between text-xs">
                <span className={cn('font-mono', color)}>{label}</span>
                <span className="font-mono text-text">{fertilizerInputs[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={140}
                step={1}
                value={fertilizerInputs[key]}
                onChange={(e) =>
                  setFertilizerInputs({ [key]: Number(e.target.value) })
                }
                className="w-full accent-cyan"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card className={result ? 'border-teal/30 bg-teal/5' : undefined}>
        {loading && (
          <p className="font-mono text-xs text-muted">Running model…</p>
        )}
        {!loading && result && (
          <div>
            <div className="flex gap-3">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-teal">
                  Recommended fertilizer
                </p>
                <p className="mt-1 font-display text-lg text-text">
                  {fertilizerDisplayName(result.fertilizer)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-dim">
                  {fertilizerGradeHint(result.fertilizer)}
                </p>
                {result.confidence != null && (
                  <p className="mt-1 font-mono text-sm text-cyan">
                    {Math.round(result.confidence * 100)}% RF vote share
                  </p>
                )}
                <p className="mt-1 text-sm text-muted">{result.reason}</p>
              </div>
            </div>
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
                  Also consider
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.alternatives.map((alt) => (
                    <span
                      key={alt.fertilizer}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-muted"
                      title={fertilizerGradeHint(alt.fertilizer)}
                    >
                      {fertilizerDisplayName(alt.fertilizer)}
                      <span className="font-mono text-dim">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!loading && !result && (
          <p className="text-sm text-muted">
            Could not run fertilizer ONNX. Check models/fertilizer.onnx is present.
          </p>
        )}
      </Card>
    </div>
  )
}
