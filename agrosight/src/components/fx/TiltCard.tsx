import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { isTouchDevice } from '@/lib/motion'
import { useGyroscopeTilt } from '@/hooks/useGyroscopeTilt'

interface TiltCardProps {
  children: ReactNode
  className?: string
}

export function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const touch = isTouchDevice()

  useGyroscopeTilt(ref, touch)

  useEffect(() => {
    if (touch) return
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`
      el.style.setProperty('--glare-x', `${(x + 0.5) * 100}%`)
      el.style.setProperty('--glare-y', `${(y + 0.5) * 100}%`)
    }

    const onLeave = () => {
      el.style.transform = 'perspective(800px) rotateY(0) rotateX(0)'
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [touch])

  return (
    <div
      ref={ref}
      className={cn('tilt-card', className)}
      style={{ transition: 'transform 0.15s ease-out' }}
    >
      <div className="tilt-card-glare" aria-hidden />
      {children}
    </div>
  )
}
