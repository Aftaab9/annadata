import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Leaf,
  Apple,
  IndianRupee,
  Store,
  Shield,
  Scan,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Counter } from '@/components/ui/Counter'
import { HERO_STATS } from '@/lib/constants'
import { useSectionBatch } from '@/hooks/useScrollTrigger'
import { FieldBackdrop } from '@/components/hero/FieldBackdrop'
import { PipelineFlow } from '@/components/hero/PipelineFlow'
import { RevealOnScroll, SplitText } from '@/components/fx'

/**
 * Landing — high contrast, mobile-first, no broken WebGL.
 * Hero budget: brand + one line + one sentence + CTAs only.
 */
export default function Landing() {
  const heroRef = useRef<HTMLElement>(null)
  useSectionBatch('.section-item')

  return (
    <div className="relative overflow-hidden">
      <FieldBackdrop />

      <section
        ref={heroRef}
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-7.5rem)] max-w-6xl flex-col justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100dvh-6rem)] sm:pb-16 sm:pt-10"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent sm:text-[11px]">
          SP Jain MAIB · Group 3
        </p>

        {/* Brand — never clip; scale down on narrow screens */}
        <h1 className="font-display mt-3 w-full max-w-full overflow-visible text-[clamp(2.75rem,11vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-text sm:mt-4">
          <span className="brand-text inline-block pr-1">Annadata</span>
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-dim sm:text-xs">
          AgroSight · farmer tools
        </p>

        <SplitText
          as="h2"
          className="mt-6 max-w-xl font-display text-[clamp(1.25rem,4vw,1.85rem)] font-semibold leading-snug text-text sm:mt-8"
          delay={0.1}
        >
          Grow healthy. Grade fair. Sell direct.
        </SplitText>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
          Leaf health in the field. Produce grade after harvest. Live mandi
          prices and a direct market — built for phones in the village.
        </p>

        {/* High-contrast CTAs — solid colors, no dark-on-dark */}
        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap">
          <Link to="/inspect" className="w-full no-underline sm:w-auto">
            <Button
              size="lg"
              className="w-full min-h-[52px] gap-2 !bg-[#3dd6c3] !text-[#04241c] shadow-[0_0_28px_rgba(61,214,195,0.35)] sm:w-auto sm:min-w-[200px]"
            >
              Open Inspect
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </Link>
          <Link to="/prices" className="w-full no-underline sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full min-h-[52px] border-[var(--border-2)] !bg-[var(--surface-2)] !text-text sm:w-auto sm:min-w-[200px]"
            >
              Live mandi prices
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-dim sm:hidden">
          Tip: use the bar at the bottom to jump between Inspect, Prices & Market.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-28 sm:pb-24">
        <p className="section-label mb-5">How it works</p>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12 md:grid-rows-2">
          <Link
            to="/inspect"
            className="bento-cell section-item group no-underline md:col-span-7 md:row-span-2"
          >
            <Card className="flex h-full min-h-[240px] flex-col justify-between !bg-[var(--surface-2)] p-5 sm:min-h-[280px] sm:p-8">
              <div>
                <div className="flex gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3dd6c3]/20 text-[#3dd6c3]">
                    <Leaf className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-healthy/20 text-healthy">
                    <Apple className="h-5 w-5" aria-hidden />
                  </span>
                </div>
                <h3 className="font-display mt-5 text-xl font-bold text-text sm:mt-6 sm:text-3xl">
                  Dual Inspect
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:mt-3 sm:text-[15px]">
                  <strong className="text-text">Leaf Health</strong> finds disease
                  while the plant grows.{' '}
                  <strong className="text-text">Produce Quality</strong> grades
                  harvested fruit A / B / C for a fair price.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#3dd6c3]">
                Start grading <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>

          <Link
            to="/prices"
            className="bento-cell section-item no-underline md:col-span-5"
          >
            <Card className="h-full !bg-[var(--surface-2)] p-5 sm:p-6">
              <IndianRupee className="h-6 w-6 text-harvest" aria-hidden />
              <h3 className="font-display mt-3 text-lg font-semibold text-text">
                Mandi + grade premium
              </h3>
              <p className="mt-2 text-sm text-muted">
                Live Agmarknet. Grade A +10% · B same · C −20%.
              </p>
            </Card>
          </Link>

          <Link
            to="/market"
            className="bento-cell section-item no-underline md:col-span-5"
          >
            <Card className="h-full !bg-[var(--surface-2)] p-5 sm:p-6">
              <Store className="h-6 w-6 text-[#3dd6c3]" aria-hidden />
              <h3 className="font-display mt-3 text-lg font-semibold text-text">
                Sell direct
              </h3>
              <p className="mt-2 text-sm text-muted">
                List with a Produce Grade Card. Low confidence needs a supervisor.
              </p>
            </Card>
          </Link>
        </div>

        <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
          <Link to="/ethics" className="bento-cell section-item no-underline">
            <Card className="flex items-start gap-3 !bg-[var(--surface-2)] p-4 sm:gap-4 sm:p-5">
              <Shield className="mt-0.5 h-6 w-6 shrink-0 text-healthy" aria-hidden />
              <div>
                <h3 className="font-semibold text-text">Safety gate</h3>
                <p className="mt-1 text-sm text-muted">
                  Under 70% confidence → human review before sale.
                </p>
              </div>
            </Card>
          </Link>
          <Link to="/insights" className="bento-cell section-item no-underline">
            <Card className="flex items-start gap-3 !bg-[var(--surface-2)] p-4 sm:gap-4 sm:p-5">
              <Scan className="mt-0.5 h-6 w-6 shrink-0 text-[#3dd6c3]" aria-hidden />
              <div>
                <h3 className="font-semibold text-text">Real research numbers</h3>
                <p className="mt-1 text-sm text-muted">
                  Only metrics measured in Colab — nothing invented.
                </p>
              </div>
            </Card>
          </Link>
        </div>

        <PipelineFlow />

        <div className="section-item mt-12 sm:mt-16">
          <p className="section-label mb-5">Shipped model evidence</p>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-3 sm:grid-cols-3 sm:gap-4">
            {HERO_STATS.map((stat, i) => (
              <RevealOnScroll key={stat.label} delay={i * 0.06}>
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-5 text-center">
                  <p className="font-mono text-3xl font-semibold text-text">
                    <Counter
                      value={stat.value}
                      prefix={'prefix' in stat ? stat.prefix : ''}
                      suffix={stat.suffix}
                      decimals={stat.suffix === '%' ? 1 : 0}
                    />
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {stat.label}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <p className="mt-12 pb-4 text-center font-mono text-[10px] uppercase tracking-widest text-dim">
          Annadata · AgroSight · SP Jain MAIB Group 3
        </p>
      </section>
    </div>
  )
}
