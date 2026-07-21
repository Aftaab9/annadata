import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gauge, MessageCircle, RotateCcw, Scan, Sparkles } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import {
  predictYield,
  predictYieldSync,
  type YieldPrediction,
} from '@/lib/yieldEngine'
import { getBottleneckReasons } from '@/lib/yieldHealth'
import {
  YIELD_PARAM_RANGES,
  YIELD_SCENARIOS,
  type YieldParams,
} from '@/lib/constants'
import { RevealOnScroll, SplitText, YieldGauge } from '@/components/fx'
import { ParamSlider } from '@/components/yield/ParamSlider'
import { PipelineBanner } from '@/components/yield/PipelineBanner'
import { BottleneckAlert } from '@/components/yield/BottleneckAlert'
import { YieldStatCard } from '@/components/yield/YieldStatCard'
import { cn } from '@/lib/cn'

const PARAM_KEYS = Object.keys(YIELD_PARAM_RANGES) as (keyof YieldParams)[]

const DEFAULT_PREDICTION: YieldPrediction = predictYieldSync(
  YIELD_SCENARIOS.find((s) => s.id === 'baseline')!.params,
)

export default function Yield() {
  const {
    yieldParams,
    setYieldParams,
    resetYieldParams,
    defectRateAutoFilled,
    setDefectRateAutoFilled,
    cvResult,
    selectedCrop,
    setAssistantOpen,
    setAssistantPrompt,
    setYieldPrediction,
    pushYieldScenario,
  } = useStore()

  const [prediction, setPrediction] = useState<YieldPrediction>(DEFAULT_PREDICTION)
  const [loading, setLoading] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>('baseline')

  const runPrediction = useCallback(
    async (params: YieldParams, label?: string) => {
      setLoading(true)
      try {
        const p = await predictYield(params)
        setPrediction(p)
        setYieldPrediction(p)
        pushYieldScenario({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          yield_pct: p.yield_pct,
          efficiency_score: p.efficiency_score,
          throughput_kg_per_hr: p.throughput_kg_per_hr,
          label: label ?? 'manual',
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [setYieldPrediction, pushYieldScenario],
  )

  useEffect(() => {
    const t = setTimeout(() => runPrediction(yieldParams), 160)
    return () => clearTimeout(t)
  }, [yieldParams, runPrediction])

  const handleParamChange = (key: keyof YieldParams, value: number) => {
    if (key === 'defect_rate_pct' && defectRateAutoFilled) {
      setDefectRateAutoFilled(false)
    }
    setActiveScenario(null)
    setYieldParams({ [key]: value })
  }

  const applyScenario = (id: (typeof YIELD_SCENARIOS)[number]['id']) => {
    const scenario = YIELD_SCENARIOS.find((s) => s.id === id)
    if (!scenario) return
    setActiveScenario(id)
    setDefectRateAutoFilled(false)
    setYieldParams(scenario.params)
  }

  const handleOptimize = () => {
    applyScenario('optimal')
  }

  const handleReset = () => {
    resetYieldParams()
    setDefectRateAutoFilled(false)
    setActiveScenario('baseline')
  }

  const explainScenario = () => {
    setAssistantPrompt(
      'Explain this yield scenario, the bottlenecks if any, and what to change to improve yield and throughput.',
    )
    setAssistantOpen(true)
  }

  const bottleneckReasons = getBottleneckReasons(yieldParams)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <SectionLabel>Production Simulator</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Yield Optimizer
      </SplitText>
      <p className="mt-2 text-muted">
        Predict yield from raw-material quality, moisture, and processing
        parameters for{' '}
        <span className="font-mono text-cyan">{selectedCrop.label}</span> — then
        simulate bottlenecks and throughput.
      </p>

      {!cvResult && !defectRateAutoFilled && (
        <RevealOnScroll immediate className="mt-6">
          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <p className="text-sm text-muted">
              Tip: run an inspection first to auto-link defect rate and material
              grade from CV.{' '}
              <Link
                to="/inspect"
                className="inline-flex items-center gap-1 text-cyan no-underline hover:underline"
              >
                <Scan className="h-3.5 w-3.5" aria-hidden />
                Go to Inspect
              </Link>
            </p>
          </Card>
        </RevealOnScroll>
      )}

      {defectRateAutoFilled && (
        <div className="mt-6">
          <PipelineBanner
            defectRate={yieldParams.defect_rate_pct}
            cvResult={cvResult}
            materialGrade={yieldParams.raw_material_grade}
          />
        </div>
      )}

      <div className="mt-6">
        <p className="section-label mb-3">Quick scenarios</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {YIELD_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applyScenario(s.id)}
              className={cn(
                'rounded-[var(--radius)] border px-3 py-3 text-left transition',
                activeScenario === s.id
                  ? 'border-cyan/50 bg-cyan/10'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-cyan/30',
              )}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
                {s.label}
              </p>
              <p className="mt-1 text-xs text-muted">{s.blurb}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] text-dim">
          Try Optimal vs Stressed — yield should jump from ~55% to ~92%, not stay
          at 83%.
        </p>
      </div>

      <RevealOnScroll immediate delay={0.05} className="mt-8">
        <Card className="flex flex-col items-center py-6">
          <YieldGauge value={prediction.yield_pct} />
          {loading && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">
              Recalculating…
            </p>
          )}
        </Card>
      </RevealOnScroll>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <YieldStatCard
          label="Yield %"
          value={prediction.yield_pct}
          suffix="%"
          delay={0}
        />
        <YieldStatCard
          label="Output kg"
          value={prediction.yield_kg}
          delay={0.05}
        />
        <YieldStatCard
          label="Efficiency"
          value={prediction.efficiency_score}
          delay={0.1}
        />
        <YieldStatCard
          label="Throughput kg/h"
          value={prediction.throughput_kg_per_hr}
          delay={0.15}
        />
      </div>

      {bottleneckReasons.length > 0 && (
        <div className="mt-6">
          <BottleneckAlert reasons={bottleneckReasons} />
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <p className="section-label">Scenario parameters</p>
          <p className="font-mono text-[10px] text-dim">
            High-impact: moisture · grade · defects
          </p>
        </div>
        <div className="space-y-4">
          {PARAM_KEYS.map((key) => (
            <ParamSlider
              key={key}
              paramKey={key}
              value={yieldParams[key]}
              onChange={(v) => handleParamChange(key, v)}
              highlighted={
                (key === 'defect_rate_pct' || key === 'raw_material_grade') &&
                defectRateAutoFilled
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button className="flex-1" onClick={handleOptimize}>
          <Sparkles className="h-4 w-4" aria-hidden />
          Optimize line
        </Button>
        <Button variant="outline" className="flex-1" onClick={explainScenario}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          Explain this scenario
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset defaults
        </Button>
      </div>

      <RevealOnScroll immediate delay={0.15} className="mt-6">
        <Card className="font-mono text-xs text-dim">
          <p className="flex items-center gap-2 uppercase tracking-widest text-muted">
            <Gauge className="h-3.5 w-3.5 text-cyan" aria-hidden />
            Yield engine (not retrained)
          </p>
          <p className="mt-2 leading-relaxed">
            Linear regression from{' '}
            <code className="text-cyan">agrosight_yield_model.pkl</code> — moisture,
            raw-material grade, and defect rate dominate. Batch weight mostly scales
            output kg; RPM/temp have small coefficients. Throughput = usable kg ÷
            processing hours (penalized under bottlenecks).
          </p>
        </Card>
      </RevealOnScroll>
    </div>
  )
}
