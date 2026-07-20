import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Leaf, Globe } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/cn'
import {
  getInferenceMode,
  loadModel,
  subscribeInferenceState,
  type InferenceMode,
} from '@/lib/inference'

const NAV_LINKS = [
  { to: '/inspect', label: 'Inspect' },
  { to: '/prices', label: 'Prices' },
  { to: '/advisory', label: 'Advisory' },
  { to: '/market', label: 'Market' },
  { to: '/insights', label: 'Insights' },
  { to: '/ethics', label: 'Ethics' },
] as const

const MODE_BADGE: Record<InferenceMode, { label: string; className: string } | null> = {
  loading: { label: 'Loading CV…', className: 'text-muted' },
  tflite: { label: 'Live TFLite', className: 'text-healthy' },
  mock: { label: 'Mock CV', className: 'text-warning' },
}

export function TopNav() {
  const { language, setLanguage } = useStore()
  const [mode, setMode] = useState<InferenceMode>('loading')

  useEffect(() => {
    const sync = () => setMode(getInferenceMode())
    loadModel(true).then(sync)
    const unsub = subscribeInferenceState(sync)
    return () => {
      unsub()
    }
  }, [])

  const toggleLang = () => setLanguage(language === 'en' ? 'hi' : 'en')
  const badge = MODE_BADGE[mode]

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <nav
        className="glass-strong mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4"
        aria-label="Main navigation"
      >
        <NavLink
          to="/"
          className="flex min-w-0 items-center gap-2 text-text no-underline hover:opacity-90 sm:gap-2.5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[#3dd6c3] text-[#04241c] shadow-[0_0_20px_rgba(61,214,195,0.4)] sm:h-9 sm:w-9">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display truncate text-base font-bold tracking-tight">
              Annadata
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-dim">
              AgroSight
            </span>
          </span>
        </NavLink>

        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-2.5 py-2 text-xs font-medium no-underline transition-colors duration-[var(--dur-hover)] ease-out',
                  isActive
                    ? 'bg-[var(--surface-3)] text-text'
                    : 'text-muted hover:bg-[var(--surface)] hover:text-text',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={cn(
                'hidden font-mono text-[10px] uppercase tracking-widest xl:inline',
                badge.className,
              )}
            >
              {badge.label}
            </span>
          )}
          <button
            type="button"
            onClick={toggleLang}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-muted transition-colors duration-[var(--dur-hover)] hover:border-[var(--border-2)] hover:text-text"
            aria-label={`Switch language to ${language === 'en' ? 'Hindi' : 'English'}`}
          >
            <Globe className="h-4 w-4" aria-hidden />
            <span className="font-mono text-xs">
              {language === 'en' ? 'EN' : 'हिं'}
            </span>
          </button>
        </div>
      </nav>

      {/* Desktop-only secondary strip removed on small screens — MobileTabBar handles it */}
      <div className="mx-auto mt-2 hidden max-w-6xl gap-1 overflow-x-auto px-1 pb-1 md:flex lg:hidden">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-full px-3 py-2 text-xs font-medium no-underline transition-colors',
                isActive
                  ? 'bg-[var(--surface-3)] text-text'
                  : 'bg-[var(--surface-solid)] text-muted',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
