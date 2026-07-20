import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { CROPS } from '@/lib/constants'
import { useStore } from '@/store/useStore'
import { recommendFertilizer, type FertilizerResult } from '@/services'
import { cn } from '@/lib/cn'

export function FertilizerPanel() {
  const fertilizerInputs = useStore((s) => s.fertilizerInputs)
  const setFertilizerInputs = useStore((s) => s.setFertilizerInputs)
  const selectedCrop = useStore((s) => s.selectedCrop)
  const [result, setResult] = useState<FertilizerResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fertilizerInputs.crop) {
      setFertilizerInputs({ crop: selectedCrop.label })
    }
  }, [fertilizerInputs.crop, selectedCrop.label, setFertilizerInputs])

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

  return (
    <div className="space-y-4">
      <Card>
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-warning">
          Lookup mode · drop fertilizer.onnx from Colab for trained RF
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-cyan">
          Fertilizer advice
        </p>
        <p className="mt-1 text-sm text-muted">
          NPK vs crop targets — rules until ONNX model is dropped in.
        </p>

        <label className="mt-4 block text-xs text-muted">
          Current crop
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text"
            value={fertilizerInputs.crop}
            onChange={(e) => setFertilizerInputs({ crop: e.target.value })}
          >
            {CROPS.map((c) => (
              <option key={c.sku} value={c.label}>
                {c.label}
              </option>
            ))}
            <option value="Maize">Maize</option>
            <option value="Wheat">Wheat</option>
          </select>
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {npk.map(({ key, label, color }) => (
            <label key={key} className="block">
              <div className="mb-1 flex justify-between text-xs">
                <span className={cn('font-medium', color)}>{label}</span>
                <span className="font-mono text-text">{fertilizerInputs[key]}</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
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

      {result && (
        <Card className="border-teal/30 bg-teal/5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/15">
              <FlaskConical className="h-5 w-5 text-teal" aria-hidden />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-teal">
                Apply next
              </p>
              <p className="mt-1 text-lg font-semibold text-text">{result.fertilizer}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{result.reason}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">
                Source: {result.source === 'model' ? 'Kaggle lookup' : 'fallback'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {loading && !result && (
        <Card className="animate-pulse py-6 text-center text-sm text-muted">
          Checking NPK balance…
        </Card>
      )}
    </div>
  )
}
