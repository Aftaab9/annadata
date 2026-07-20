import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { HITL_THRESHOLD } from '@/lib/constants'
import { HitlDiagram, NoisyBlob, RevealOnScroll, SplitText } from '@/components/fx'

const PRINCIPLES = [
  { title: 'Transparency', body: 'Every prediction shows confidence and per-class probabilities.' },
  { title: 'Sovereignty', body: 'Inference runs on-device. Worker data stays with the worker.' },
  { title: 'Skill elevation', body: 'AI handles repetitive scanning; workers validate quality.' },
]

const COST_ROWS = [
  { item: 'Monthly deployment', value: '₹2,500' },
  { item: 'Savings per batch (defect reduction)', value: '₹1,000' },
  { item: 'Payback', value: '3 batches' },
  { item: 'Defect rate improvement', value: '8% → 3%' },
]

export default function Ethics() {
  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 pb-28">
      <NoisyBlob size={280} className="right-0 top-0 opacity-40" />
      <SectionLabel>Human-in-the-Loop</SectionLabel>

      <SplitText
        as="h1"
        className="gradient-text relative z-10 text-3xl font-bold tracking-tight md:text-4xl"
      >
        Built to assist rural workers, not replace them.
      </SplitText>

      <RevealOnScroll immediate className="mt-10">
        <HitlDiagram />
      </RevealOnScroll>

      <RevealOnScroll immediate delay={0.05}>
        <Card className="mt-8">
          <h2 className="font-semibold text-text">HITL confidence gate</h2>
          <p className="mt-3 leading-relaxed text-muted">
            When AI confidence falls below{' '}
            <span className="font-mono text-cyan">{HITL_THRESHOLD * 100}%</span>,
            the system requires human supervisor review before any batch decision.
          </p>
        </Card>
      </RevealOnScroll>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map(({ title, body }, i) => (
          <RevealOnScroll key={title} immediate delay={i * 0.05}>
            <Card className="h-full">
              <h3 className="font-semibold text-cyan">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </Card>
          </RevealOnScroll>
        ))}
      </div>

      <RevealOnScroll immediate delay={0.1} className="mt-8">
        <Card>
          <h2 className="font-semibold text-text">Cost-benefit</h2>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {COST_ROWS.map((row) => (
              <div
                key={row.item}
                className="flex justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <span className="text-muted">{row.item}</span>
                <span className="font-mono text-text">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </RevealOnScroll>

      <RevealOnScroll immediate delay={0.12}>
        <Card className="mt-8 border-warning/20">
          <h2 className="font-semibold text-text">Bias acknowledgment</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <strong className="text-text">Leaf ≠ fruit.</strong> PlantVillage uses
            lab-captured leaf imagery for disease risk while the crop grows. Market
            Grade A/B/C comes only from the separate{' '}
            <strong className="text-text">Produce Quality</strong> model on harvested
            produce. Field photos still differ from lab data — the HITL gate (&lt;70%
            confidence) exists because the model will be uncertain on unfamiliar inputs.
          </p>
        </Card>
      </RevealOnScroll>

      <RevealOnScroll immediate delay={0.14} className="mt-8">
        <Card>
          <h2 className="font-semibold text-text">What AI does / What humans do</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
                AI
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
                <li>
                  <strong className="text-text">Leaf Health</strong> (PlantVillage) —
                  disease on leaves while growing
                </li>
                <li>
                  <strong className="text-text">Produce Quality</strong> — fresh vs
                  rotten → Grade A/B/C after harvest (separate model)
                </li>
                <li>Mandi price fetch + fair-price suggestion (A+10% / B / C−20%)</li>
                <li>Yield simulator + crop/fertilizer advisory (honest lookup until ONNX)</li>
                <li>Draft Grade Card + market listing fields</li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-harvest">
                Humans
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
                <li>Supervisor override when confidence &lt; 70%</li>
                <li>Final reject / accept on the line</li>
                <li>Negotiate price and publish listings</li>
                <li>Choose pesticides with agri-extension advice</li>
              </ul>
            </div>
          </div>
        </Card>
      </RevealOnScroll>

      <RevealOnScroll immediate delay={0.16} className="mt-8">
        <Card className="border-healthy/20">
          <h2 className="font-semibold text-text">SDG mapping</h2>
          <p className="mt-3 text-sm text-muted">
            <strong className="text-text">SDG 2</strong> Zero Hunger — reduce post-harvest
            loss via early blight detection and better grading.{' '}
            <strong className="text-text">SDG 8</strong> Decent Work — elevate rural
            workers with tools, not replace them.{' '}
            <strong className="text-text">SDG 12</strong> Responsible consumption —
            transparent Grade Cards for buyers.
          </p>
        </Card>
      </RevealOnScroll>

      <RevealOnScroll immediate delay={0.18} className="mt-8">
        <Card>
          <h2 className="font-semibold text-text">Team credits</h2>
          <p className="mt-2 text-sm text-muted">
            SP Jain School of Global Management — MAIB program, AI in Operations.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <span className="font-medium text-text">Group 3</span> — Annadata /
              AgroSight product build (inspect → price → advisory → market)
            </li>
            <li>
              <span className="font-medium text-text">Faculty</span> — Dr. Sandip Kumar
              Roy (course mentor)
            </li>
            <li>
              <span className="font-medium text-text">Open data & models</span> —
              PlantVillage, Agmarknet (data.gov.in), Open-Meteo, Kaggle crop/fertilizer
              schemas, Ollama (local LLM)
            </li>
          </ul>
        </Card>
      </RevealOnScroll>

      <p className="mt-12 text-center font-mono text-xs text-dim">
        SP Jain MAIB · Group 3 · AI in Operations · Annadata / AgroSight
      </p>
    </div>
  )
}
