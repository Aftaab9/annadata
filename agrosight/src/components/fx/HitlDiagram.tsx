import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { AnimatedSVGPath } from './AnimatedSVGPath'

const NODES = [
  { id: 'camera', label: 'Capture', x: 60, y: 80 },
  { id: 'ai', label: 'AI Model', x: 200, y: 80 },
  { id: 'conf', label: 'Confidence', x: 340, y: 80 },
  { id: 'human', label: 'Human Review', x: 480, y: 40 },
  { id: 'decision', label: 'Decision', x: 480, y: 140 },
  { id: 'log', label: 'Decision Log', x: 620, y: 80 },
  { id: 'record', label: 'Worker Record', x: 760, y: 80 },
]

const PATHS = [
  'M 100 80 L 160 80',
  'M 240 80 L 300 80',
  'M 380 80 L 440 50',
  'M 380 80 L 440 140',
  'M 520 80 L 580 80',
  'M 660 80 L 720 80',
]

export function HitlDiagram() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const circles = svgRef.current.querySelectorAll('.hitl-node')

    if (prefersReducedMotion()) {
      gsap.set(circles, { scale: 1, opacity: 1 })
      return
    }

    gsap.fromTo(
      circles,
      { scale: 0.6, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        stagger: 0.12,
        duration: 0.45,
        ease: 'back.out(1.7)',
        delay: 0.15,
      },
    )
  }, [])

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-dim">
        HITL decision flow (scroll horizontally on phone)
      </p>
      <svg
        ref={svgRef}
        viewBox="0 0 820 200"
        className="min-w-[640px] w-full"
        role="img"
        aria-label="Human-in-the-loop decision flow diagram"
      >
        {PATHS.map((d, i) => (
          <AnimatedSVGPath key={i} d={d} color="var(--cyan)" duration={1.5} />
        ))}

        {NODES.map((n) => (
          <g key={n.id} className="hitl-node" style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
            <circle cx={n.x} cy={n.y} r="28" fill="var(--surface-2)" stroke="var(--border-2)" strokeWidth="1.5" />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              fill="var(--text)"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {n.label}
            </text>
          </g>
        ))}

        <text x="400" y="185" textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="JetBrains Mono">
          &lt;70% confidence → Human Inspector
        </text>
      </svg>
    </div>
  )
}
