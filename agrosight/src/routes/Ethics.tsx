import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  Landmark,
  Scale,
  Shield,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Counter } from '@/components/ui/Counter'
import { HITL_THRESHOLD } from '@/lib/constants'
import { HitlDiagram, RevealOnScroll, SplitText } from '@/components/fx'
import { cn } from '@/lib/cn'

const PRINCIPLES = [
  {
    title: 'Transparency',
    body: 'Every prediction shows confidence and per-class probabilities — no silent automation.',
    icon: Eye,
  },
  {
    title: 'Sovereignty',
    body: 'Inference runs on-device. Worker photos and decisions stay with the worker.',
    icon: Smartphone,
  },
  {
    title: 'Skill elevation',
    body: 'AI handles repetitive scanning; people move to validation, negotiation, and sales.',
    icon: Sparkles,
  },
]

const COST_ROWS = [
  { item: 'Monthly deployment', value: '₹2,500', note: 'phone + hosting' },
  { item: 'Savings per cleaned batch', value: '₹1,000', note: 'fewer rejects' },
  { item: 'Payback', value: '3 batches', note: 'not years' },
  { item: 'Defect rate on line', value: '8% → 3%', note: 'target improvement' },
]

const SKILL_LADDER = [
  {
    title: 'Before',
    tone: 'muted' as const,
    points: [
      '100% manual sorting — slow, inconsistent',
      'Price set by middlemen with opaque grades',
      'Skill = speed of hand-picking only',
    ],
  },
  {
    title: 'With Annadata',
    tone: 'accent' as const,
    points: [
      'AI drafts grade; supervisor owns exceptions',
      'Fair price = mandi modal ± Grade A/B/C',
      'Skill = review, advisory, marketplace listing',
    ],
  },
]

/** Explicit brief: automation → employment & skill displacement */
const ROLE_SHIFTS = [
  {
    from: 'Line sorter (100% visual)',
    to: 'Exception validator',
    note: 'Reviews only low-confidence / Grade C flags',
  },
  {
    from: 'Price taker at mandi',
    to: 'Grade-card negotiator',
    note: 'Defends A/B premium with inspection proof',
  },
  {
    from: 'Shift supervisor (gut feel)',
    to: 'Yield scenario owner',
    note: 'Uses moisture/grade/RPM sim to clear bottlenecks',
  },
]

const DISPLACEMENT = [
  {
    risk: 'Cameras cut pure hand-sorting hours',
    response: 'HITL keeps humans on reject/accept; AI never auto-ships',
  },
  {
    risk: 'Younger workers learn phones; elders feel displaced',
    response: 'Bilingual voice verdicts + simple Grade Card; supervisor role stays',
  },
  {
    risk: 'SME cuts headcount to “pay for AI”',
    response: '₹2,500/mo payback from less waste — business case is loss cut, not payroll cut',
  },
]

const SDGS = [
  {
    code: '02',
    title: 'Zero Hunger',
    body: 'Cut post-harvest loss with early leaf disease and produce grading.',
  },
  {
    code: '08',
    title: 'Decent Work',
    body: 'Elevate rural roles — tools for workers, not a headcount cut.',
  },
  {
    code: '12',
    title: 'Responsible consumption',
    body: 'Transparent Grade Cards so buyers trust what they purchase.',
  },
]

export default function Ethics() {
  const gatePct = HITL_THRESHOLD * 100
  // Illustrative math from the master brief: 8%→3% on 50kg @ ₹400/kg
  const wasteBefore = Math.round(50 * 0.08 * 400)
  const wasteAfter = Math.round(50 * 0.03 * 400)
  const saved = wasteBefore - wasteAfter

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 pb-28">
      {/* Photo thesis band */}
      <div className="relative mb-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <img
          src="/photos/women-farmers.jpg"
          alt="Rural women farmers"
          className="h-48 w-full object-cover sm:h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <SectionLabel>Human-in-the-Loop</SectionLabel>
          <SplitText
            as="h1"
            className="font-display mt-2 max-w-xl text-3xl font-bold tracking-tight text-text sm:text-4xl"
          >
            Built to assist rural workers, not replace them.
          </SplitText>
        </div>
      </div>

      <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
        Automation in food processing can displace sorting jobs — that risk is
        real. Annadata keeps people on the decision path: AI drafts, humans
        confirm, and low confidence always stops the line.
      </p>

      <RevealOnScroll immediate className="mt-8">
        <HitlDiagram />
      </RevealOnScroll>

      <RevealOnScroll immediate delay={0.05} className="mt-8">
        <div className="rounded-[var(--radius-lg)] border border-warning/25 bg-warning/5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-6 w-6 shrink-0 text-warning" aria-hidden />
            <div>
              <h2 className="font-display text-lg font-semibold text-text">
                HITL confidence gate
              </h2>
              <p className="mt-2 leading-relaxed text-muted">
                When AI confidence falls below{' '}
                <span className="font-mono text-warning">{gatePct}%</span>,
                marketplace listing and reject/accept stay blocked until a
                supervisor inspects the batch. Drag the slider above to see the
                path switch live — the same gate used on Inspect.
              </p>
              <Link
                to="/inspect"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-cyan no-underline hover:underline"
              >
                Try it on Inspect <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {PRINCIPLES.map(({ title, body, icon: Icon }, i) => (
          <RevealOnScroll key={title} immediate delay={i * 0.05}>
            <div className="h-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <Icon className="h-5 w-5 text-cyan" aria-hidden />
              <h3 className="mt-3 font-semibold text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Employment before / after — uses photos */}
      <RevealOnScroll immediate delay={0.08} className="mt-10">
        <p className="section-label mb-3">Rural employment</p>
        <h2 className="font-display text-xl font-bold text-text sm:text-2xl">
          Skill displacement → skill elevation
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          The honest fear: cameras replace sorters. Our design answer: fewer
          wasted batches, same people — now validating exceptions and selling
          with a Grade Card.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {SKILL_LADDER.map((col) => (
            <div
              key={col.title}
              className={cn(
                'overflow-hidden rounded-[var(--radius)] border',
                col.tone === 'accent'
                  ? 'border-cyan/35 bg-cyan/5'
                  : 'border-[var(--border)] bg-[var(--surface)]',
              )}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={
                    col.tone === 'accent'
                      ? '/photos/Vegetable-Shopping.jpg'
                      : '/photos/Farming.jpg'
                  }
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/90 to-transparent" />
                <p className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-cyan">
                  {col.title}
                </p>
              </div>
              <ul className="space-y-2 p-4 text-sm text-muted">
                {col.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan/70" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-[var(--radius)] border border-[var(--border)]">
          <p className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            Role shifts — skill displacement answered with elevation
          </p>
          <div className="divide-y divide-[var(--border)]">
            {ROLE_SHIFTS.map((r) => (
              <div
                key={r.from}
                className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3"
              >
                <p className="text-muted">{r.from}</p>
                <ArrowRight className="hidden h-4 w-4 text-cyan sm:block" aria-hidden />
                <div>
                  <p className="font-medium text-text">{r.to}</p>
                  <p className="text-xs text-dim">{r.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
            Displacement risk → our product response
          </p>
          {DISPLACEMENT.map((d) => (
            <div
              key={d.risk}
              className="grid gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2"
            >
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-warning">
                  Risk
                </p>
                <p className="mt-1 text-sm text-muted">{d.risk}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-healthy">
                  Annadata response
                </p>
                <p className="mt-1 text-sm text-text">{d.response}</p>
              </div>
            </div>
          ))}
        </div>
      </RevealOnScroll>

      {/* Cost-benefit with visual math */}
      <RevealOnScroll immediate delay={0.1} className="mt-10">
        <p className="section-label mb-3">Cost-benefit</p>
        <h2 className="font-display text-xl font-bold text-text">
          Payback in three batches
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Card className="text-center !bg-[var(--surface)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Waste @ 8% · 50kg
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-danger">
              ₹<Counter value={wasteBefore} />
            </p>
          </Card>
          <Card className="text-center !bg-[var(--surface)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Waste @ 3% · 50kg
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-healthy">
              ₹<Counter value={wasteAfter} />
            </p>
          </Card>
          <Card className="text-center border-cyan/30 !bg-cyan/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
              Saved / batch
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-text">
              ₹<Counter value={saved} />
            </p>
            <p className="mt-1 text-[11px] text-muted">at ₹400/kg illustrative</p>
          </Card>
        </div>
        <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4">
          {COST_ROWS.map((row) => (
            <div
              key={row.item}
              className="flex items-center justify-between gap-3 py-3 text-sm first:pt-3 last:pb-3"
            >
              <div>
                <p className="text-muted">{row.item}</p>
                <p className="font-mono text-[10px] text-dim">{row.note}</p>
              </div>
              <span className="font-mono font-medium text-text">{row.value}</span>
            </div>
          ))}
        </div>
      </RevealOnScroll>

      {/* AI vs Humans */}
      <RevealOnScroll immediate delay={0.12} className="mt-10">
        <p className="section-label mb-3">Role split</p>
        <h2 className="font-display text-xl font-bold text-text">
          What AI does / What humans do
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-cyan">
              <Scale className="h-3.5 w-3.5" aria-hidden /> AI
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <strong className="text-text">Leaf Health</strong> — disease while
                the plant grows
              </li>
              <li>
                <strong className="text-text">Produce Quality</strong> — Grade A/B/C
                after harvest
              </li>
              <li>Mandi modal + fair-price suggestion</li>
              <li>Yield optimizer + crop/fertilizer advisory</li>
              <li>Draft Grade Card fields</li>
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-harvest/30 bg-harvest/5 p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-harvest">
              <Users className="h-3.5 w-3.5" aria-hidden /> Humans
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Supervisor override when confidence &lt; {gatePct}%</li>
              <li>Final reject / accept on the line</li>
              <li>Negotiate price and publish listings</li>
              <li>Agri-extension advice on pesticides</li>
              <li>Own the relationship with the buyer</li>
            </ul>
          </div>
        </div>
      </RevealOnScroll>

      {/* Bias — leaf ≠ fruit with samples */}
      <RevealOnScroll immediate delay={0.14} className="mt-10">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-warning/20 bg-[var(--surface)]">
          <div className="grid sm:grid-cols-2">
            <div className="relative h-40 sm:h-auto">
              <img
                src="/samples/produce/apple_fruit/apple_fresh.jpg"
                alt="Harvested apple — produce grading"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    '/photos/Vegetable-Shopping.jpg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/80 to-transparent sm:bg-gradient-to-r" />
              <p className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-healthy">
                Produce · Grade A/B/C
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-text">
                Bias acknowledgment
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <strong className="text-text">Leaf ≠ fruit.</strong> PlantVillage
                is lab leaf imagery for disease risk while growing. Market grades
                come only from the separate Produce Quality model. Field photos
                still differ from lab data — the {gatePct}% HITL gate exists
                because the model will be uncertain on unfamiliar inputs.
              </p>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* SDGs */}
      <RevealOnScroll immediate delay={0.16} className="mt-10">
        <p className="section-label mb-3">SDG mapping</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SDGS.map((s) => (
            <div
              key={s.code}
              className="rounded-[var(--radius)] border border-healthy/25 bg-healthy/5 p-4"
            >
              <p className="font-mono text-2xl font-semibold text-healthy">
                {s.code}
              </p>
              <h3 className="mt-1 font-semibold text-text">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </RevealOnScroll>

      {/* Credits */}
      <RevealOnScroll immediate delay={0.18} className="mt-10">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 text-cyan" aria-hidden />
            <div>
              <h2 className="font-semibold text-text">Team credits</h2>
              <p className="mt-2 text-sm text-muted">
                SP Jain School of Global Management — MAIB · AI in Operations.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>
                  <span className="font-medium text-text">Group 3</span> — Annadata
                  / AgroSight (inspect → price → yield → market)
                </li>
                <li>
                  <span className="font-medium text-text">Faculty</span> — Dr.
                  Sandip Kumar Roy
                </li>
                <li>
                  <span className="font-medium text-text">Open stack</span> —
                  PlantVillage, Agmarknet, Open-Meteo, Kaggle crop/fertilizer,
                  Ollama
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <p className="mt-12 text-center font-mono text-xs text-dim">
        SP Jain MAIB · Group 3 · AI in Operations · Annadata / AgroSight
      </p>
    </div>
  )
}
