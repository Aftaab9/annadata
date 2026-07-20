import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

interface AnimatedSVGPathProps {
  d: string
  color?: string
  duration?: number
  scrollTrigger?: boolean
  strokeWidth?: number
}

export function AnimatedSVGPath({
  d,
  color = 'var(--cyan)',
  duration = 2,
  scrollTrigger = true,
  strokeWidth = 2,
}: AnimatedSVGPathProps) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    if (prefersReducedMotion()) {
      path.style.strokeDashoffset = '0'
      return
    }

    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

    if (scrollTrigger) {
      gsap.to(path, {
        strokeDashoffset: 0,
        duration,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: path,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 0.5,
        },
      })
    } else {
      gsap.to(path, { strokeDashoffset: 0, duration, ease: 'power2.inOut' })
    }
  }, [d, color, duration, scrollTrigger])

  return (
    <path
      ref={pathRef}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  )
}
