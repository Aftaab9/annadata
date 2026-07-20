import { useEffect, useState } from 'react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Counter } from '@/components/ui/Counter'
import { Card } from '@/components/ui/Card'
import { SessionAnalytics } from '@/components/insights/SessionAnalytics'
import {
  RelatedWorkPanel,
  SdgImpactPanel,
} from '@/components/insights/SdgRelatedWork'
import { LiveSignal, SplitText, TiltCard } from '@/components/fx'

type Metric = {
  id: string
  value?: number
  suffix?: string
  label: string
  how: string
  status: 'measured' | 'pending_colab'
}

type MetricsFile = {
  measured: Metric[]
  pending: Metric[]
}

const COMPARISON_CHARTS = [
  {
    src: '/assets/08_pv_model_comparison.png',
    title: 'Leaf Health — 5-model comparison',
    blurb:
      'PlantVillage EfficientNetB0 selected on composite accuracy + F1. Separate from Produce Quality.',
  },
  {
    src: '/assets/02_model_comparison.png',
    title: 'Beans pilot — 5-model comparison',
    blurb: 'Pipeline validation on Makerere beans before multi-SKU scale-up.',
  },
  {
    src: '/assets/11_produce_model_comparison.png',
    title: 'Produce Quality — model comparison',
    blurb:
      'After Colab: drop 11_produce_model_comparison.png here. Healthy vs Rotten CNN.',
  },
]

const OTHER_CHARTS = [
  {
    src: '/assets/09_pv_confusion_matrix.png',
    title: 'Leaf Health confusion matrix',
    blurb: 'HEALTHY / SURFACE_DEFECT / BLIGHT_MOLD — off-diagonals justify HITL.',
  },
  {
    src: '/assets/12_produce_confusion_matrix.png',
    title: 'Produce Quality confusion matrix',
    blurb: 'After Colab: FRESH / BORDERLINE / ROTTEN matrix for Grade A/B/C honesty.',
  },
  {
    src: '/assets/03_confusion_matrix.png',
    title: 'Beans confusion matrix',
    blurb: 'Pilot matrix — same 3-class disease framing as production TFLite.',
  },
  {
    src: '/assets/10_pv_sku_accuracy.png',
    title: 'Per-SKU leaf accuracy',
    blurb: 'Maize, soybean, pepper, tomato, potato, apple leaf groups.',
  },
  {
    src: '/assets/04_yield_model_comparison.png',
    title: 'Yield model comparison',
    blurb: 'Regressor candidates for processing yield % from 7 plant parameters.',
  },
  {
    src: '/assets/05_yield_predictions.png',
    title: 'Yield predictions',
    blurb: 'Actual vs predicted yield on hold-out processing scenarios.',
  },
  {
    src: '/assets/06_shap_importance.png',
    title: 'SHAP feature importance',
    blurb: 'Defect rate and moisture dominate yield — why Inspect auto-fills the simulator.',
  },
  {
    src: '/assets/01_samples.png',
    title: 'Training sample gallery',
    blurb: 'Lab leaf imagery — Ethics documents domain-shift risk to field photos.',
  },
]

function ChartCard({
  src,
  title,
  blurb,
}: {
  src: string
  title: string
  blurb: string
}) {
  const [failed, setFailed] = useState(false)

  return (
    <TiltCard>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {title}
          </p>
          <p className="mt-1 text-xs text-dim">{blurb}</p>
        </div>
        {failed ? (
          <div className="flex h-48 items-center justify-center bg-[var(--bg-2)] px-4 text-center text-sm text-warning">
            Chart not shipped yet — run Colab and drop PNG at {src}
          </div>
        ) : (
          <img
            src={src}
            alt={title}
            className="w-full bg-[var(--bg-2)] object-contain"
            loading="eager"
            onError={() => setFailed(true)}
          />
        )}
      </Card>
    </TiltCard>
  )
}

export default function Insights() {
  const [metrics, setMetrics] = useState<MetricsFile | null>(null)

  useEffect(() => {
    fetch('/data/model_metrics.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMetrics(j as MetricsFile | null))
      .catch(() => setMetrics(null))
  }, [])

  const measured = metrics?.measured ?? []
  const pending = metrics?.pending ?? []

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 pb-28">
      <SectionLabel>Research Evidence</SectionLabel>
      <SplitText as="h1" className="text-3xl font-bold tracking-tight text-text">
        Model Insights
      </SplitText>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Two CV stories: <strong className="text-text">Leaf Health</strong> (disease in
        field) and <strong className="text-text">Produce Quality</strong> (batch grade
        after harvest). Only Colab-measured hold-out metrics are shown as numbers —
        pending models stay labeled until you drop artifacts.
      </p>

      <SessionAnalytics />

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {measured.map((k) => (
          <Card key={k.id} className="text-center" title={k.how}>
            <p className="font-mono text-2xl font-semibold">
              <Counter
                value={k.value ?? 0}
                suffix={k.suffix ?? ''}
                decimals={
                  (k.suffix ?? '') === '%'
                    ? (k.value ?? 0) >= 10
                      ? 1
                      : 2
                    : 0
                }
              />
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              {k.label}
            </p>
            <p className="mt-2 text-[10px] leading-snug text-dim">{k.how}</p>
          </Card>
        ))}
        {pending.map((k) => (
          <Card
            key={k.id}
            className="border-dashed text-center opacity-80"
            title={k.how}
          >
            <p className="font-mono text-2xl font-semibold text-warning">—</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              {k.label}
            </p>
            <p className="mt-2 text-[10px] leading-snug text-warning">
              Pending Colab · {k.how}
            </p>
          </Card>
        ))}
      </div>

      <section className="mt-16">
        <p className="section-label mb-2">Model comparison</p>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          Leaf charts are live. Produce charts appear after you run notebook 01 and copy
          PNGs into public/assets/.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {COMPARISON_CHARTS.map((c) => (
            <ChartCard key={c.src} {...c} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="section-label mb-2">Matrices, SKUs & yield explainability</p>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          Confusion matrices justify the HITL gate. SHAP explains why defect rate from
          Inspect feeds the yield simulator.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {OTHER_CHARTS.map((c) => (
            <ChartCard key={c.src} {...c} />
          ))}
        </div>
      </section>

      <div className="mt-16">
        <LiveSignal />
      </div>

      <SdgImpactPanel />
      <RelatedWorkPanel />
    </div>
  )
}
