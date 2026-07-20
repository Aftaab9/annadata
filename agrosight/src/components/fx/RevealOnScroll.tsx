import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { prefersReducedMotion } from '@/lib/motion'

type Direction = 'left' | 'right' | 'top' | 'bottom'

interface RevealOnScrollProps {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
  /** Show immediately (no clip-path wait) — use for dynamic result cards */
  immediate?: boolean
}

export function RevealOnScroll({
  children,
  direction = 'left',
  delay = 0,
  className,
  immediate = false,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reveal = () => {
      window.setTimeout(() => el.classList.add('visible'), delay * 1000)
    }

    if (immediate || prefersReducedMotion()) {
      reveal()
      return
    }

    let revealed = false
    const showOnce = () => {
      if (revealed) return
      revealed = true
      reveal()
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          showOnce()
          obs.unobserve(el)
        }
      },
      { threshold: 0.01, rootMargin: '80px 0px' },
    )

    obs.observe(el)

    // Direct route loads (/ethics) — content is already in view before IO fires
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const inView =
        rect.top < window.innerHeight + 80 && rect.bottom > -80
      if (inView) {
        showOnce()
        obs.unobserve(el)
      }
    })

    return () => obs.disconnect()
  }, [delay, immediate])

  return (
    <div
      ref={ref}
      className={cn(
        immediate ? 'reveal-immediate' : 'reveal-clip',
        !immediate && `reveal-${direction}`,
        className,
      )}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}
