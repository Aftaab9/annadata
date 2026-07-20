import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'

/** Batch section-item entrance on scroll */
export function useSectionBatch(selector = '.section-item') {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const batch = ScrollTrigger.batch(selector, {
      onEnter: (els) => {
        gsap.from(els, {
          opacity: 0,
          y: 50,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power3.out',
        })
      },
      start: 'top 85%',
    })

    return () => {
      batch.forEach((t) => t.kill())
    }
  }, [selector])
}

/** Horizontal chart track scrub on desktop insights */
export function useHorizontalChartScroll(
  sectionRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      gsap.to(track, {
        x: '-60%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=600',
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      })
    })

    return () => mm.revert()
  }, [sectionRef, trackRef])
}
