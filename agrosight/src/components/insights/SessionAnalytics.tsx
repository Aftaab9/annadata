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
  const {
    inspectionHistory,
    clearHistory,
    yieldPrediction,
    yieldScenarioHistory,
    clearYieldScenarios,
  } = useStore()

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
  const yieldSeries = useMemo(
    () =>
      [...yieldScenarioHistory]
        .reverse()
        .map((p, i) => ({
          index: i + 1,
          yield: p.yield_pct,
          efficiency: p.efficiency_score,
          throughput: p.throughput_kg_per_hr,
          label: p.label,
        })),
    [yieldScenarioHistory],
  )

  const empty = inspectionHistory.length === 0
  const hasYield = yieldSeries.length > 0
  const avgEfficiency = useMemo(() => {
    if (!yieldSeries.length) return 0
    const sum = yieldSeries.reduce((a, r) => a + r.efficiency, 0)
    return Math.round((sum / yieldSeries.length) * 10) / 10
  }, [yieldSeries])
  const avgThroughput = useMemo(() => {
    if (!yieldSeries.length) return 0
    const sum = yieldSeries.reduce((a, r) => a + r.throughput, 0)
    return Math.round((sum / yieldSeries.length) * 10) / 10
  }, [yieldSeries])

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
            disabled={empty && !hasYield}
            onClick={() => {
              clearHistory()
              clearYieldScenarios()
            }}
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

      {/* Yield / process efficiency — independent of inspect history */}
      <div className="relative mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="section-label">Process efficiency</p>
            <h3 className="mt-1 text-lg font-semibold text-text">
              Yield & throughput trends
            </h3>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Scenarios from the{' '}
              <Link to="/yield" className="text-cyan hover:underline">
                Yield Optimizer
              </Link>{' '}
              — defect rate, yield %, and kg/h for the SME processing line.
            </p>
          </div>
        </div>

        {!hasYield ? (
          <Card className="mt-4 py-8 text-center">
            <p className="text-sm text-muted">
              No yield scenarios yet — open the optimizer and try Optimal vs
              Stressed.
            </p>
            <Link
              to="/yield"
              className="mt-4 inline-flex rounded-[var(--radius)] bg-accent px-5 py-2.5 text-sm font-semibold text-[oklch(0.12_0.02_145)] no-underline"
            >
              Open Yield Optimizer →
            </Link>
          </Card>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                {
                  label: 'Scenarios',
                  value: yieldSeries.length,
                  suffix: '',
                },
                {
                  label: 'Last yield',
                  value: yieldPrediction?.yield_pct ?? yieldSeries[yieldSeries.length - 1]!.yield,
                  suffix: '%',
                },
                { label: 'Avg efficiency', value: avgEfficiency, suffix: '' },
                {
                  label: 'Avg throughput',
                  value: avgThroughput,
                  suffix: ' kg/h',
                },
              ].map((k) => (
                <Card key={k.label} className="text-center">
                  <p className="font-mono text-xl font-semibold text-text">
                    <Counter
                      value={k.value}
                      suffix={k.suffix}
                      decimals={k.suffix === '%' || k.suffix === ' kg/h' ? 1 : 0}
                    />
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted">
                    {k.label}
                  </p>
                </Card>
              ))}
            </div>
            <Card>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Yield % over scenarios
              </p>
              <div className="mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yieldSeries}>
                    <defs>
                      <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="index"
                      tick={{ fill: 'rgba(236,237,245,0.35)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[40, 100]}
                      tick={{ fill: 'rgba(236,237,245,0.35)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0a0c16',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="yield"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#yieldGrad)"
                      dot={{ fill: '#10b981', r: 3 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                      fill="transparent"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 font-mono text-[10px] text-dim">
                Green = yield % · Cyan outline = process efficiency score
              </p>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
