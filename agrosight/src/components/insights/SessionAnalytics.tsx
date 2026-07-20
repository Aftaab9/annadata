import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Radio, Scan, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Counter } from '@/components/ui/Counter'
import { useStore } from '@/store/useStore'
import {
  buildClassDistribution,
  buildTimeSeries,
  exportSessionReport,
  summarizeSession,
} from '@/lib/sessionAnalytics'

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; payload: { verdict?: string; crop?: string } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-xs shadow-xl">
      <p className="font-mono text-cyan">{label}</p>
      <p className="mt-1 text-text">Defect rate: {row?.value}%</p>
      {row?.payload.verdict && (
        <p className="text-muted">{row.payload.verdict.replace(/_/g, ' ')}</p>
      )}
      {row?.payload.crop && <p className="text-dim">{row.payload.crop}</p>}
    </div>
  )
}

export function SessionAnalytics() {
  const { inspectionHistory, clearHistory, yieldPrediction } = useStore()

  const summary = useMemo(
    () => summarizeSession(inspectionHistory),
    [inspectionHistory],
  )
  const timeSeries = useMemo(
    () => buildTimeSeries(inspectionHistory),
    [inspectionHistory],
  )
  const distribution = useMemo(
    () => buildClassDistribution(inspectionHistory),
    [inspectionHistory],
  )

  const empty = inspectionHistory.length === 0

  return (
    <section className="relative mt-12 overflow-hidden rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/5 via-transparent to-indigo/5 p-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" aria-hidden />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="section-label">Live Session Analytics</p>
            {!empty && (
              <span className="flex items-center gap-1.5 rounded-full border border-healthy/30 bg-healthy/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-healthy">
                <Radio className="h-3 w-3 animate-pulse" aria-hidden />
                Live
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-text">
            Your demo builds a dataset in real time
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Every inspection on{' '}
            <Link to="/inspect" className="text-cyan hover:underline">
              /inspect
            </Link>{' '}
            feeds these charts — run 3–5 samples during your presentation and watch
            the dashboard come alive.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={empty}
            onClick={() => exportSessionReport(inspectionHistory, yieldPrediction)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-2)] px-4 py-2 text-sm font-medium text-text transition hover:border-cyan/40 disabled:opacity-40"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export report
          </button>
          <button
            type="button"
            disabled={empty}
            onClick={() => clearHistory()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {empty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative mt-8"
          >
            <Card className="flex flex-col items-center py-12 text-center">
              <Scan className="mb-4 h-10 w-10 text-cyan/60" aria-hidden />
              <p className="font-medium text-text">No inspections yet this session</p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                Inspect a few crops on your phone, then return here — defect
                trends and class distribution update instantly.
              </p>
              <Link
                to="/inspect"
                className="mt-6 inline-flex rounded-[var(--radius)] bg-accent px-6 py-3 text-sm font-semibold text-[oklch(0.12_0.02_145)] no-underline shadow-[0_0_24px_var(--glow-cyan)]"
              >
                Start inspecting →
              </Link>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mt-8 space-y-6"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: 'Inspections', value: summary.total, suffix: '' },
                { label: 'Pass rate', value: summary.passRate, suffix: '%' },
                { label: 'Avg defect', value: summary.avgDefectRate, suffix: '%' },
                { label: 'Avg confidence', value: summary.avgConfidence, suffix: '%' },
                { label: 'HITL flags', value: summary.hitlCount, suffix: '' },
              ].map((k) => (
                <Card key={k.label} className="text-center">
                  <p className="font-mono text-xl font-semibold text-text">
                    <Counter
                      value={k.value}
                      suffix={k.suffix}
                      decimals={k.suffix === '%' && k.label === 'Avg defect' ? 1 : 0}
                    />
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted">
                    {k.label}
                  </p>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Defect rate over time
                </p>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeries}>
                      <defs>
                        <linearGradient id="defectGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="index"
                        tick={{ fill: 'rgba(236,237,245,0.35)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 30]}
                        tick={{ fill: 'rgba(236,237,245,0.35)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        unit="%"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="defectRate"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#defectGrad)"
                        dot={{ fill: '#06b6d4', r: 4 }}
                        activeDot={{ r: 6, fill: '#6366f1' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Class distribution
                </p>
                <div className="mt-2 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {distribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#0a0c16',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {distribution.map((d) => (
                    <span
                      key={d.name}
                      className="flex items-center gap-1.5 font-mono text-[10px] text-muted"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: d.fill }}
                      />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Pass vs review / reject
              </p>
              <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-[var(--bg-2)]">
                <motion.div
                  className="bg-healthy"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(summary.passCount / summary.total) * 100}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 80 }}
                />
                <motion.div
                  className="bg-warning"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(summary.failCount / summary.total) * 100}%`,
                    }}
                  transition={{ type: 'spring', stiffness: 80, delay: 0.1 }}
                />
              </div>
              <div className="mt-3 flex justify-between font-mono text-xs text-muted">
                <span className="text-healthy">
                  Pass: {summary.passCount}
                </span>
                <span className="text-warning">
                  Review/Reject: {summary.failCount}
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
