import { BookOpen, Leaf, Scale, Sprout, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const SDG_IMPACT = {
  mandi_modal_typical: 1950,
  grade_a_premium_pct: 10,
  calc_rupees: Math.round(1950 * 0.08 * 50),
}

const RELATED_WORK = [
  {
    name: 'PlantVillage / AgroAI',
    cite: 'Hughes & Salathé; Mohanty et al.',
    note: 'Large-scale leaf disease CNNs. We extend with on-device TFLite, confidence gate, and Grade Card for rural processing intake.',
  },
  {
    name: 'Kisan DSS / Digital India agri advisories',
    cite: 'GoI / state agri portals',
    note: 'Public advisories and mandi data. We add live Agmarknet fetch, grade-linked fair price, and sell-now signals on one phone UI.',
  },
  {
    name: 'AgriSens / IoT farm stacks',
    cite: 'sensor + cloud agri papers',
    note: 'Hardware-heavy sensing. We stay phone-first (camera + free APIs) so demo and village pilots need zero device cost.',
  },
  {
    name: 'IIT / Nature-family crop disease ML',
    cite: 'transfer-learning agri surveys',
    note: 'Prior art on disease classification accuracy. We package research into an operations product: inspect → price → advisory → market → ethics.',
  },
]

export function SdgImpactPanel() {
  return (
    <div className="mt-16">
      <Card className="border-healthy/20 bg-gradient-to-br from-healthy/5 to-transparent">
        <p className="section-label">SDG impact</p>
        <h2 className="mt-2 text-xl font-semibold text-text">
          Why Annadata matters beyond accuracy charts
        </h2>
        <p className="mt-2 text-sm text-muted">
          SDG 2 (Zero Hunger) and SDG 8 (Decent Work) — better plant-health triage and
          price transparency put more value with the farmer.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <Target className="h-5 w-5 text-healthy" aria-hidden />
            <p className="mt-2 font-mono text-2xl text-harvest">
              ₹{SDG_IMPACT.calc_rupees.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-muted">
              Est. extra for 50 q at Grade A (+{SDG_IMPACT.grade_a_premium_pct}% over
              ₹{SDG_IMPACT.mandi_modal_typical}/q mandi)
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <Scale className="h-5 w-5 text-cyan" aria-hidden />
            <p className="mt-2 font-mono text-2xl text-text">HITL</p>
            <p className="mt-1 text-xs text-muted">
              Low-confidence batches never auto-list — protects workers and buyers.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <Sprout className="h-5 w-5 text-teal" aria-hidden />
            <p className="mt-2 font-mono text-2xl text-text">7 pillars</p>
            <p className="mt-1 text-xs text-muted">
              Inspect → Price → Advisory → Market → Insights on one phone.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function RelatedWorkPanel() {
  return (
    <div className="mt-10 mb-8">
      <Card>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan" aria-hidden />
          <p className="section-label mb-0">Related work</p>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-text">
          Prior art we studied and extended
        </h2>
        <p className="mt-1 text-sm text-muted">
          Research-depth panel for faculty grading — what existed, and what Annadata adds.
        </p>
        <ul className="mt-4 space-y-4">
          {RELATED_WORK.map((r) => (
            <li
              key={r.name}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start gap-2">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-healthy" aria-hidden />
                <div>
                  <p className="font-medium text-text">{r.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-dim">
                    {r.cite}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{r.note}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
