import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PriceTrendSeries } from '@/services/types'
import { cn } from '@/lib/cn'

interface PriceTrendChartProps {
  trend7: PriceTrendSeries
  trend30: PriceTrendSeries
  className?: string
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-xs shadow-xl">
      <p className="font-mono text-cyan">{label}</p>
      <p className="mt-1 font-semibold text-harvest">
        ₹{payload[0]?.value.toLocaleString('en-IN')} /q
      </p>
    </div>
  )
}

export function PriceTrendChart({ trend7, trend30, className }: PriceTrendChartProps) {
  const [range, setRange] = useState<7 | 30>(7)
  const active = range === 7 ? trend7 : trend30

  const yDomain = useMemo(() => {
    const prices = active.points.map((p) => p.modal_price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const pad = Math.max(100, (max - min) * 0.12)
    return [Math.floor(min - pad), Math.ceil(max + pad)]
  }, [active.points])

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
            Modal price trend
          </p>
          <p
            className={cn(
              'mt-1 font-mono text-sm font-medium',
              active.change_pct >= 0 ? 'text-healthy' : 'text-danger',
            )}
          >
            {active.change_pct >= 0 ? '+' : ''}
            {active.change_pct}% over {range} days
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--border)] p-0.5">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRange(d)}
              className={cn(
                'rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors',
                range === d
                  ? 'bg-cyan/15 text-cyan'
                  : 'text-muted hover:text-text',
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={active.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(236,237,245,0.45)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={range === 7 ? 0 : 4}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: 'rgba(236,237,245,0.45)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => `₹${Math.round(v / 100) / 10}k`}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="modal_price"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#priceTrendFill)"
              animationDuration={800}
              animationEasing="ease-out"
              dot={false}
              activeDot={{ r: 4, fill: '#a5b4fc', stroke: '#6366f1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
