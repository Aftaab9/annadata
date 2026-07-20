import { useEffect, useRef, type ElementType, type ReactNode } from 'react'
import SplitType from 'split-type'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

interface SplitTextProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: ElementType
}

export function SplitText({
  children,
  className,
  delay = 0,
  as: Tag = 'h2',
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const split = new SplitType(el, { types: 'words' })
    const words = split.words
    if (!words?.length) return

    gsap.from(words, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: 0.06,
      delay,
      ease: 'power3.out',
      onComplete: () => split.revert(),
    })

    return () => {
      split.revert()
    }
  }, [delay, children])

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  )
}
