import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  IndianRupee,
  MessageCircle,
  RotateCcw,
  Store,
  Volume2,
} from 'lucide-react'
import type { ClassificationResult } from '@/lib/inference'
import type { CropSku } from '@/lib/constants'
import {
  DEFECT_ACTIONS,
  DEFECT_CLASSES,
  DEFECT_LABELS,
  DEFECT_TO_RATE,
  HITL_LOW_CONFIDENCE_MSG,
  HITL_THRESHOLD,
  leafClassToMaterial,
  produceGradeToMaterial,
  type DefectClass,
} from '@/lib/constants'
import type { GradeCardData } from '@/lib/gradeCard'
import { spokenVerdict } from '@/lib/gradeCard'
import { speak } from '@/lib/speech'
import type { InspectMode } from '@/lib/inspectMode'
import { PRODUCE_LABELS, type ProduceClass } from '@/lib/produceInference'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ParticleBurst, TiltCard } from '@/components/fx'
import { ConfidenceBadge } from '@/components/inspect/ConfidenceBadge'
import { GradeCard } from '@/components/inspect/GradeCard'
import { StarRating } from '@/components/inspect/StarRating'
import { DefectRecommendation } from '@/components/inspect/DefectRecommendation'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/cn'

const DEFECT_COLORS: Record<DefectClass, string> = {
  HEALTHY: 'var(--healthy)',
  SURFACE_DEFECT: 'var(--warning)',
  BLIGHT_MOLD: 'var(--danger)',
}

const PRODUCE_COLORS: Record<ProduceClass, string> = {
  FRESH: 'var(--healthy)',
  BORDERLINE: 'var(--warning)',
  ROTTEN: 'var(--danger)',
}

interface InspectResultCardProps {
  result: ClassificationResult
  crop: CropSku
  gradeCard: GradeCardData
  previewUrl?: string
  onReset: () => void
  inspectMode?: InspectMode
}

export function InspectResultCard({
  result,
  crop,
  gradeCard,
  previewUrl,
  onReset,
  inspectMode = 'leaf',
}: InspectResultCardProps) {
  const navigate = useNavigate()
  const setCvResult = useStore((s) => s.setCvResult)
  const setYieldParams = useStore((s) => s.setYieldParams)
  const setDefectRateAutoFilled = useStore((s) => s.setDefectRateAutoFilled)
  const setAssistantOpen = useStore((s) => s.setAssistantOpen)
  const setAssistantPrompt = useStore((s) => s.setAssistantPrompt)
  const setGradeCard = useStore((s) => s.setGradeCard)
  const language = useStore((s) => s.language)
  const [burst, setBurst] = useState(false)
  const [spoken, setSpoken] = useState(false)

  const isProduce = inspectMode === 'produce' || gradeCard.sourceMode === 'produce'
  const lowConfidence = result.confidence < HITL_THRESHOLD
  const produceClass = gradeCard.defectClass as ProduceClass
  const color = isProduce
    ? (PRODUCE_COLORS[produceClass] ?? DEFECT_COLORS[result.class])
    : DEFECT_COLORS[result.class]
  const confidencePct = Math.round(result.confidence * 100)
  const verdictLabel = isProduce
    ? (PRODUCE_LABELS[produceClass] ?? gradeCard.defectLabel)
    : DEFECT_LABELS[result.class]

  useEffect(() => {
    const celebrate =
      (!isProduce && result.class === 'HEALTHY' && result.confidence >= HITL_THRESHOLD) ||
      (isProduce && produceClass === 'FRESH' && result.confidence >= HITL_THRESHOLD)
    if (celebrate) {
      setBurst(true)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
    }
  }, [isProduce, produceClass, result])

  useEffect(() => {
    if (spoken) return
    const t = setTimeout(() => {
      speak(spokenVerdict(gradeCard, language), language)
      setSpoken(true)
    }, 600)
    return () => clearTimeout(t)
  }, [gradeCard, language, spoken])

  const action = lowConfidence
    ? HITL_LOW_CONFIDENCE_MSG
    : isProduce
      ? gradeCard.grade === 'A'
        ? 'Fresh batch — list at Grade A premium (+10% over mandi modal).'
        : gradeCard.grade === 'B'
          ? 'Sort borderline pieces; list remainder at Grade B (mandi modal).'
          : 'Reject or divert spoiled stock — Grade C (−20% vs mandi). Do not sell as premium.'
      : DEFECT_ACTIONS[result.class]

  const goToAdvisory = () => {
    setCvResult(result)
    setYieldParams({
      defect_rate_pct: isProduce
        ? gradeCard.defectRatePct
        : DEFECT_TO_RATE[result.class],
      raw_material_grade: isProduce
        ? produceGradeToMaterial(gradeCard.grade)
        : leafClassToMaterial(result.class),
    })
    setDefectRateAutoFilled(true)
    navigate(isProduce ? '/prices' : '/yield')
  }

  const goToYield = () => {
    setCvResult(result)
    setYieldParams({
      defect_rate_pct: isProduce
        ? gradeCard.defectRatePct
        : DEFECT_TO_RATE[result.class],
      raw_material_grade: isProduce
        ? produceGradeToMaterial(gradeCard.grade)
        : leafClassToMaterial(result.class),
    })
    setDefectRateAutoFilled(true)
    navigate('/yield')
  }

  const goToPrices = () => {
    setCvResult(result)
    navigate('/prices')
  }

  const goToMarket = () => {
    setCvResult(result)
    setGradeCard(gradeCard)
    navigate('/market')
  }

  const askAssistant = (prompt?: string) => {
    setCvResult(result)
    if (prompt) setAssistantPrompt(prompt)
    setAssistantOpen(true)
  }

  const replaySpeech = () => {
    speak(spokenVerdict(gradeCard, language), language)
  }

  return (
    <motion.div
      className="mt-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <TiltCard>
        <Card className="relative overflow-hidden">
          <ParticleBurst trigger={burst} />

          {lowConfidence && (
            <div
              className="mb-4 rounded-xl border-2 border-warning/50 bg-warning/10 px-4 py-3"
              role="alert"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
                Human-in-the-loop gate
              </p>
              <p className="mt-1 text-sm text-warning">
                Confidence below {HITL_THRESHOLD * 100}% — a supervisor must review
                before this batch can be released or listed for sale.
              </p>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
                Inspecting SKU
              </p>
              <p className="font-semibold text-text">{crop.label}</p>
              <p className="font-mono text-xs text-cyan">{crop.sku}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
                Quality stars
              </p>
              <StarRating value={gradeCard.stars} className="mt-1 justify-end" />
            </div>
          </div>

          {previewUrl && (
            <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
              <img
                src={previewUrl}
                alt="Inspected sample"
                className="h-44 w-full object-cover"
              />
            </div>
          )}

          {result.mock ? (
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-warning">
              {isProduce
                ? 'Demo heuristic — drop Colab agrosight_produce.tflite for real grades'
                : 'Mock inference — add TFLite for real predictions'}
            </p>
          ) : (
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-healthy">
              {isProduce
                ? '● Produce Quality TFLite · binary P(Rotten) · on-device'
                : '● PlantVillage TFLite · on-device'}
            </p>
          )}

          <ConfidenceBadge confidence={result.confidence} className="mb-6" />

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {isProduce ? 'Produce grade verdict' : 'Leaf health verdict'}
          </p>
          <motion.p
            className="mt-1 text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {verdictLabel}
          </motion.p>
          <p className="mt-2 text-sm text-muted">
            {isProduce ? (
              <>
                Harvested-batch freshness — not leaf disease. Market grade{' '}
                <strong className="text-text">{gradeCard.grade}</strong> (A +10% / B
                modal / C −20%).
              </>
            ) : (
              <>
                Field plant-health diagnosis — not produce grading. Use treatment
                advice below; switch to Produce Quality after harvest for Grade A/B/C.
              </>
            )}
          </p>

          <button
            type="button"
            onClick={replaySpeech}
            className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-cyan hover:underline"
          >
            <Volume2 className="h-3.5 w-3.5" aria-hidden />
            Hear verdict again ({language === 'hi' ? 'हिं' : 'EN'})
          </button>

          <div className="mt-5 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Per-class probabilities
            </p>
            {isProduce
              ? (['FRESH', 'BORDERLINE', 'ROTTEN'] as ProduceClass[]).map((cls) => {
                  const mapped =
                    cls === 'FRESH'
                      ? result.probabilities.HEALTHY
                      : cls === 'BORDERLINE'
                        ? result.probabilities.SURFACE_DEFECT
                        : result.probabilities.BLIGHT_MOLD
                  return (
                    <div key={cls} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                        {PRODUCE_LABELS[cls].split(' / ')[0]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: PRODUCE_COLORS[cls] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(mapped ?? 0) * 100}%` }}
                          transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-sm font-medium text-text">
                        {Math.round((mapped ?? 0) * 100)}%
                      </span>
                    </div>
                  )
                })
              : DEFECT_CLASSES.map((cls) => (
                  <div key={cls} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {DEFECT_LABELS[cls]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: DEFECT_COLORS[cls] }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(result.probabilities[cls] ?? 0) * 100}%`,
                        }}
                        transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-sm font-medium text-text">
                      {Math.round((result.probabilities[cls] ?? 0) * 100)}%
                    </span>
                  </div>
                ))}
          </div>

            <div
              className={cn(
                'mt-6 rounded-xl border p-4 text-sm leading-relaxed',
                lowConfidence
                  ? 'border-warning/50 bg-warning/10 text-warning'
                  : 'border-[var(--border)] bg-[var(--surface)] text-muted',
              )}
            >
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-dim">
                Recommended action
              </p>
              {action}
            </div>

            {!isProduce && (
              <DefectRecommendation
                defectClass={result.class}
                language={language}
                onAskAssistant={(prompt) => askAssistant(prompt)}
              />
            )}

            <div className="mt-6">
              <GradeCard card={gradeCard} />
            </div>

          <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              <span className="text-dim">Inference</span>
              <p className="text-text">{result.inferenceMs} ms</p>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              <span className="text-dim">Top class score</span>
              <p className="text-text">{confidencePct}%</p>
            </div>
          </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => askAssistant()}
              >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Ask assistant
            </Button>
            <Button variant="outline" className="w-full" onClick={goToPrices}>
              <IndianRupee className="h-4 w-4" aria-hidden />
              Check price →
            </Button>
            <Button className="w-full sm:col-span-2" onClick={goToAdvisory}>
              {isProduce ? 'Fair price for this grade' : 'Yield simulator'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            {isProduce && (
              <Button
                variant="outline"
                className="w-full sm:col-span-2"
                onClick={goToYield}
              >
                Yield optimizer (quality → throughput)
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
            <Button
              className="w-full sm:col-span-2"
              variant={lowConfidence || !isProduce ? 'outline' : 'primary'}
              onClick={goToMarket}
              disabled={lowConfidence || !isProduce}
              title={
                lowConfidence
                  ? 'Supervisor review required before marketplace listing'
                  : !isProduce
                    ? 'Market Grade Card comes from Produce Quality mode after harvest'
                    : undefined
              }
            >
              <Store className="h-4 w-4" aria-hidden />
              {lowConfidence
                ? 'List in market (blocked — HITL)'
                : !isProduce
                  ? 'List in market (use Produce mode)'
                  : 'List in market →'}
            </Button>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="mt-4 flex w-full items-center justify-center gap-2 py-2 font-mono text-xs text-muted transition-colors hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Scan another batch
          </button>
        </Card>
      </TiltCard>
    </motion.div>
  )
}
