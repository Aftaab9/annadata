import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import {
  FERTILIZER_CROP_OPTIONS,
  FERTILIZER_SOIL_OPTIONS,
  recommendFertilizer,
  type FertilizerResult,
} from '@/services/fertilizerService'
import { cn } from '@/lib/cn'
import { probeOnnxArtifacts } from '@/lib/onnxProbe'

export function FertilizerPanel() {
  const fertilizerInputs = useStore((s) => s.fertilizerInputs)
  const setFertilizerInputs = useStore((s) => s.setFertilizerInputs)
  const [result, setResult] = useState<FertilizerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [onnxReady, setOnnxReady] = useState(false)

  useEffect(() => {
    probeOnnxArtifacts().then((s) => setOnnxReady(s.fertilizer))
  }, [])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      recommendFertilizer(fertilizerInputs)
        .then(setResult)
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(t)
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
            ? 'Live · fertilizer.onnx RandomForest (100% hold-out)'
            : 'Lookup mode · drop fertilizer.onnx from Colab'}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-cyan">
          Fertilizer advice
        </p>
        <p className="mt-1 text-sm text-muted">
          Soil + climate + NPK → Colab-trained RF class (Urea, DAP, NPK blends…).
        </p>

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

      <Card>
        {loading && (
          <p className="font-mono text-xs text-muted">Running model…</p>
        )}
        {!loading && result && (
          <div className="flex gap-3">
            <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
            <div>
              <p className="font-display text-lg text-text">{result.fertilizer}</p>
              <p className="mt-1 text-sm text-muted">{result.reason}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
