import type { CSSProperties } from 'react'
import { YIELD_PARAM_RANGES, type YieldParams } from '@/lib/constants'
import {
  formatParamValue,
  getParamHealth,
  HEALTH_COLORS,
} from '@/lib/yieldHealth'
import { cn } from '@/lib/cn'

interface ParamSliderProps {
  paramKey: keyof YieldParams
  value: number
  onChange: (value: number) => void
  highlighted?: boolean
}

export function ParamSlider({
  paramKey,
  value,
  onChange,
  highlighted = false,
}: ParamSliderProps) {
  const meta = YIELD_PARAM_RANGES[paramKey]
  const health = getParamHealth(paramKey, value)
  const thumbColor = HEALTH_COLORS[health]

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-4 transition-all duration-300',
        highlighted
          ? 'border-cyan/60 bg-cyan/5 shadow-[0_0_24px_var(--glow-cyan)]'
          : 'border-[var(--border)] bg-[var(--surface)]',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <label
          htmlFor={`slider-${paramKey}`}
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          {meta.label}
          {highlighted && (
            <span className="ml-2 text-cyan">· from inspection</span>
          )}
        </label>
        <span
          className="font-mono text-sm font-semibold tabular-nums text-text"
          style={{ color: thumbColor }}
        >
          {formatParamValue(paramKey, value)}
        </span>
      </div>

      <input
        id={`slider-${paramKey}`}
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="yield-slider w-full"
        style={
          {
            '--thumb-color': thumbColor,
            '--track-percent': `${((value - meta.min) / (meta.max - meta.min)) * 100}%`,
          } as CSSProperties
        }
        aria-valuemin={meta.min}
        aria-valuemax={meta.max}
        aria-valuenow={value}
      />
    </div>
  )
}
