import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, RotateCcw, Scan } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import { predictYield, type YieldPrediction } from '@/lib/yieldEngine'
import { getBottleneckReason } from '@/lib/yieldHealth'
import { YIELD_PARAM_RANGES, type YieldParams } from '@/lib/constants'
import { RevealOnScroll, SplitText, YieldGauge } from '@/components/fx'
import { ParamSlider } from '@/components/yield/ParamSlider'
import { PipelineBanner } from '@/components/yield/PipelineBanner'
import { BottleneckAlert } from '@/components/yield/BottleneckAlert'
import { YieldStatCard } from '@/components/yield/YieldStatCard'

const PARAM_KEYS = Object.keys(YIELD_PARAM_RANGES) as (keyof YieldParams)[]

const DEFAULT_PREDICTION: YieldPrediction = {
  yield_pct: 78,
  yield_kg: 39,
  bottleneck: false,
  efficiency_score: 74,
  matched: {
    moisture_pct: 10,
    batch_weight_kg: 50,
    ambient_temp_celsius: 28,
    processing_duration_min: 90,
    machine_speed_rpm: 400,
    raw_material_grade: 3,
    defect_rate_pct: 5,
    yield_pct: 78,
    yield_kg: 39,
    bottleneck: false,
    efficiency_score: 74,
  },
}

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
  } = useStore()

  const [prediction, setPrediction] = useState<YieldPrediction>(DEFAULT_PREDICTION)
  const [loading, setLoading] = useState(false)

  const runPrediction = useCallback(async (params: YieldParams) => {
    setLoading(true)
    try {
      const p = await predictYield(params)
      setPrediction(p)
      setYieldPrediction(p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [setYieldPrediction])

  useEffect(() => {
    const t = setTimeout(() => runPrediction(yieldParams), 120)
    return () => clearTimeout(t)
  }, [yieldParams, runPrediction, setYieldPrediction])

  const handleParamChange = (key: keyof YieldParams, value: number) => {
    if (key === 'defect_rate_pct' && defectRateAutoFilled) {
      setDefectRateAutoFilled(false)
    }
    setYieldParams({ [key]: value })
  }

  const handleReset = () => {
    resetYieldParams()
    setDefectRateAutoFilled(false)
  }

  const explainScenario = () => {
    setAssistantPrompt('Explain this yield scenario and what I should change to improve output.')
    setAssistantOpen(true)
  }

  const bottleneckReason = getBottleneckReason(yieldParams)
  const showBottleneck = prediction.bottleneck && bottleneckReason

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <SectionLabel>Production Simulator</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Yield Optimizer
      </SplitText>
      <p className="mt-2 text-muted">
        Seven processing parameters → predicted yield for{' '}
        <span className="font-mono text-cyan">{selectedCrop.label}</span> batches.
      </p>

      {!cvResult && !defectRateAutoFilled && (
        <RevealOnScroll immediate className="mt-6">
          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <p className="text-sm text-muted">
              Tip: run an inspection first to auto-link defect rate from CV.{' '}
              <Link to="/inspect" className="inline-flex items-center gap-1 text-cyan no-underline hover:underline">
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
          />
        </div>
      )}

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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <YieldStatCard
          label="Yield %"
          value={prediction.yield_pct}
          suffix="%"
          delay={0}
        />
        <YieldStatCard
          label="Output kg"
          value={prediction.yield_kg}
          delay={0.1}
        />
        <YieldStatCard
          label="Efficiency score"
          value={prediction.efficiency_score}
          delay={0.2}
        />
      </div>

      {showBottleneck && (
        <div className="mt-6">
          <BottleneckAlert reason={bottleneckReason!} />
        </div>
      )}

      <div className="mt-10">
        <p className="section-label mb-4">Scenario parameters</p>
        <div className="space-y-4">
          {PARAM_KEYS.map((key) => (
            <ParamSlider
              key={key}
              paramKey={key}
              value={yieldParams[key]}
              onChange={(v) => handleParamChange(key, v)}
              highlighted={key === 'defect_rate_pct' && defectRateAutoFilled}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          <p className="uppercase tracking-widest text-muted">Lookup engine</p>
          <p className="mt-2 leading-relaxed">
            Linear regression from the AgroSight yield model — all 7 parameters
            update live, including defect rate from CV (
            <code className="text-cyan">agrosight_yield_model.pkl</code>
            ). Output kg = batch weight × yield %.
          </p>
        </Card>
      </RevealOnScroll>
    </div>
  )
}
