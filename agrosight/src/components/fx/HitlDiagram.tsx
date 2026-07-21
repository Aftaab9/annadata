import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Brain,
  ShieldCheck,
  UserRoundCheck,
  ScrollText,
  Award,
  ArrowDown,
  ArrowRight,
} from 'lucide-react'
import { HITL_THRESHOLD } from '@/lib/constants'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

const STEPS = [
  {
    id: 'capture',
    label: 'Capture',
    detail: 'Phone / line camera',
    icon: Camera,
  },
  {
    id: 'ai',
    label: 'On-device AI',
    detail: 'Classify + confidence',
    icon: Brain,
  },
  {
    id: 'gate',
    label: 'HITL gate',
    detail: `<${HITL_THRESHOLD * 100}% → review`,
    icon: ShieldCheck,
  },
  {
    id: 'human',
    label: 'Supervisor',
    detail: 'Confirm or override',
    icon: UserRoundCheck,
  },
  {
    id: 'log',
    label: 'Decision log',
    detail: 'Batch record kept',
    icon: ScrollText,
  },
  {
    id: 'skill',
    label: 'Skill record',
    detail: 'Worker grows with tools',
    icon: Award,
  },
] as const

export function HitlDiagram() {
  const [confidence, setConfidence] = useState(82)
  const [activeStep, setActiveStep] = useState(0)
  const reduced = prefersReducedMotion()
  const needsHuman = confidence < HITL_THRESHOLD * 100

  const pathLabel = useMemo(
    () =>
      needsHuman
        ? 'Low confidence — human owns the call'
        : 'High confidence — AI drafts, human still confirms',
    [needsHuman],
  )

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length)
    }, 1600)
    return () => window.clearInterval(id)
  }, [reduced])

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-2)]">
      <div className="relative border-b border-[var(--border)] px-4 py-4 sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[var(--glow-cyan)] blur-3xl" />
          <div className="absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-[var(--glow-harvest)] blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cyan">
              Interactive HITL flow
            </p>
            <h3 className="font-display mt-1 text-lg font-semibold text-text sm:text-xl">
              Drag confidence — watch the gate open
            </h3>
          </div>
          <div
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest',
              needsHuman
                ? 'border-warning/40 bg-warning/10 text-warning'
                : 'border-healthy/40 bg-healthy/10 text-healthy',
            )}
          >
            {needsHuman ? 'Human path' : 'Assist path'}
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-end justify-between gap-2">
            <label
              htmlFor="hitl-confidence"
              className="font-mono text-[10px] uppercase tracking-widest text-muted"
            >
              Simulated AI confidence
            </label>
            <span
              className={cn(
                'font-mono text-2xl font-semibold tabular-nums',
                needsHuman ? 'text-warning' : 'text-healthy',
              )}
            >
              {confidence}%
            </span>
          </div>
          <input
            id="hitl-confidence"
            type="range"
            min={40}
            max={99}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="yield-slider w-full"
            style={
              {
                '--thumb-color': needsHuman ? 'var(--warning)' : 'var(--healthy)',
                '--track-percent': `${((confidence - 40) / (99 - 40)) * 100}%`,
              } as CSSProperties
            }
            aria-valuemin={40}
            aria-valuemax={99}
            aria-valuenow={confidence}
          />
          <div className="relative mt-2 h-6">
            <div
              className="absolute top-0 h-full w-px bg-warning/80"
              style={{ left: `${((HITL_THRESHOLD * 100 - 40) / (99 - 40)) * 100}%` }}
            />
            <p
              className="absolute top-0 -translate-x-1/2 font-mono text-[9px] uppercase tracking-wider text-warning"
              style={{ left: `${((HITL_THRESHOLD * 100 - 40) / (99 - 40)) * 100}%` }}
            >
              {HITL_THRESHOLD * 100}% gate
            </p>
          </div>
        </div>
      </div>

      {/* Flow steps */}
      <div className="px-3 py-5 sm:px-5">
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isGate = step.id === 'gate'
            const isHuman = step.id === 'human'
            const lit =
              activeStep === i ||
              (isGate && needsHuman) ||
              (isHuman && needsHuman)
            const dimmed = isHuman && !needsHuman

            return (
              <li key={step.id} className="relative">
                <motion.button
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    'relative flex h-full w-full items-center gap-3 rounded-[var(--radius)] border px-3 py-3 text-left transition xl:flex-col xl:items-start',
                    lit
                      ? 'border-cyan/45 bg-cyan/10'
                      : 'border-[var(--border)] bg-[var(--surface)]',
                    dimmed && 'opacity-45',
                    isGate && needsHuman && 'border-warning/50 bg-warning/10',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                      isGate && needsHuman
                        ? 'border-warning/40 bg-warning/15 text-warning'
                        : lit
                          ? 'border-cyan/40 bg-cyan/15 text-cyan'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-muted',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-dim">
                      0{i + 1}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-text">
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {step.detail}
                    </span>
                  </span>
                  {isGate && (
                    <span
                      className={cn(
                        'absolute right-2 top-2 h-2 w-2 rounded-full',
                        needsHuman ? 'bg-warning animate-pulse' : 'bg-healthy',
                      )}
                    />
                  )}
                </motion.button>
                {i < STEPS.length - 1 && (
                  <span className="absolute -bottom-2 left-1/2 z-10 hidden -translate-x-1/2 text-dim sm:block xl:hidden">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <p className="mt-3 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-dim xl:hidden">
          <ArrowDown className="h-3 w-3" aria-hidden /> Flow top → bottom
        </p>
        <p className="mt-3 hidden items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-dim xl:flex">
          Capture <ArrowRight className="h-3 w-3" /> AI <ArrowRight className="h-3 w-3" />{' '}
          Gate <ArrowRight className="h-3 w-3" /> Human <ArrowRight className="h-3 w-3" />{' '}
          Log <ArrowRight className="h-3 w-3" /> Skill
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathLabel}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'mt-4 rounded-[var(--radius)] border px-4 py-3',
              needsHuman
                ? 'border-warning/30 bg-warning/5'
                : 'border-healthy/30 bg-healthy/5',
            )}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Active path
            </p>
            <p className="mt-1 text-sm text-text">{pathLabel}</p>
            <p className="mt-1 text-xs text-muted">
              {needsHuman
                ? 'Marketplace listing and reject/accept stay blocked until a supervisor reviews.'
                : 'AI drafts the Grade Card; the worker still confirms before sale.'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Human side photo strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 overflow-hidden rounded-[var(--radius)]">
          <img
            src="/photos/women-farmers.jpg"
            alt="Women farmers"
            className="aspect-[4/3] h-full w-full object-cover"
            loading="lazy"
          />
          <img
            src="/photos/male-farmers.jpg"
            alt="Farmers on the line"
            className="aspect-[4/3] h-full w-full object-cover"
            loading="lazy"
          />
          <img
            src="/photos/vegetable-mandi.jpg"
            alt="Mandi trade"
            className="aspect-[4/3] h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-dim">
          People stay in the loop — field → line → mandi
        </p>
      </div>
    </div>
  )
}
