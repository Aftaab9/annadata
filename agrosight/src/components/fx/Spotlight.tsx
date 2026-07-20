import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SpotlightProps {
  children: ReactNode
  className?: string
}

/** Radial gradient spotlight following pointer */
export function Spotlight({ children, className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const move = (x: number, y: number) => {
      const r = el.getBoundingClientRect()
      const px = ((x - r.left) / r.width) * 100
      const py = ((y - r.top) / r.height) * 100
      el.style.setProperty('--spot-x', `${px}%`)
      el.style.setProperty('--spot-y', `${py}%`)
    }

    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) move(t.clientX, t.clientY)
    }

    el.addEventListener('mousemove', onMouse)
    el.addEventListener('touchmove', onTouch, { passive: true })

    return () => {
      el.removeEventListener('mousemove', onMouse)
      el.removeEventListener('touchmove', onTouch)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn('spotlight-wrap', className)}
      style={
        {
          '--spot-x': '50%',
          '--spot-y': '40%',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
