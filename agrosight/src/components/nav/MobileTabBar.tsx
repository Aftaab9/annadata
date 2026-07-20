import { NavLink } from 'react-router-dom'
import {
  Home,
  Scan,
  IndianRupee,
  Sprout,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/inspect', label: 'Inspect', icon: Scan, end: false },
  { to: '/prices', label: 'Prices', icon: IndianRupee, end: false },
  { to: '/advisory', label: 'Advice', icon: Sprout, end: false },
  { to: '/market', label: 'Market', icon: Store, end: false },
] as const

/** Large tap targets for farmers on phone */
export function MobileTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--bg)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold no-underline transition-colors',
                  isActive ? 'text-[#3dd6c3]' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('h-6 w-6', isActive && 'stroke-[2.5]')}
                    aria-hidden
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
