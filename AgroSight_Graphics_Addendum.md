# ============================================================
# AGROSIGHT — GRAPHICS & ANIMATION ADDENDUM
# Paste this immediately after the master prompt in Cursor.
# This specifies every advanced visual technique to implement.
# ============================================================

This addendum extends Section 12 (FX Component Library) with precise 
implementation specifications for every advanced graphics technique. 
Build each of these as a reusable component or hook in src/components/fx/
and src/hooks/. Apply them systematically as specified per screen.

---

## FX-1: SPLITTYPE TEXT REVEALS
**File:** `src/components/fx/SplitText.tsx`
**Library:** `@studio-freight/lenis` is already installed. Add `split-type` package.

Every major heading across the app animates in word-by-word (not letter-by-letter — 
letters are slow and distracting). Words drop in from y:40 with opacity 0→1, 
staggered 0.06s per word.

Implementation:
```tsx
import SplitType from 'split-type'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'

export function SplitText({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const split = new SplitType(ref.current, { types: 'words' })
    gsap.from(split.words, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: 0.06,
      delay,
      ease: 'power3.out',
      onComplete: () => split.revert()
    })
  }, [])
  return <h2 ref={ref} className={className}>{children}</h2>
}
```

Apply to: ALL section headings on Landing, Inspect result verdict, 
Insights KPI labels, Ethics thesis statement.
Respect prefers-reduced-motion: skip animation, just render text.

---

## FX-2: CSS CLIP-PATH WIPE REVEALS
**File:** `src/components/fx/RevealOnScroll.tsx`
**Technique:** clip-path inset(0 100% 0 0) → inset(0 0% 0 0), triggered 
by IntersectionObserver. Direction can be left, right, top, bottom.

```tsx
// CSS class toggled when element enters viewport:
// .reveal-clip { clip-path: inset(0 100% 0 0); transition: clip-path 0.9s cubic-bezier(0.77,0,0.18,1); }
// .reveal-clip.visible { clip-path: inset(0 0% 0 0); }

export function RevealOnScroll({ children, direction = 'left', delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), delay * 1000)
        obs.unobserve(e.target)
      }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal-clip reveal-${direction}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}
```

Apply to: every chart image on /insights, every principle card on /ethics,
the cost-benefit table rows, the stat cards on /yield.
Stagger delay: 0, 0.1, 0.2, 0.3 for sibling elements.

---

## FX-3: GSAP SCROLLTRIGGER — SCROLL-SCRUBBED ANIMATIONS
**File:** `src/hooks/useScrollTrigger.ts`
**Libraries:** `gsap` + `@gsap/react` (use `useGSAP` hook)

Three specific uses across the app:

### 3a — Pinned hero scroll (Landing)
While the user scrolls through the first "section" worth of scroll distance,
the hero is pinned and the 3D scene reacts (particles slow, heading fades).
After that scroll distance, unpin and let the page scroll normally.
```ts
gsap.to('.hero-heading', {
  opacity: 0,
  y: -30,
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: '+=400',
    scrub: 1,
    pin: true,
  }
})
```

### 3b — Horizontal chart scroll on /insights
On desktop, the model comparison charts scroll horizontally while the 
viewport stays fixed. User scrolls down but charts move sideways.
```ts
gsap.to('.chart-track', {
  x: '-60%',
  scrollTrigger: {
    trigger: '.chart-section',
    start: 'top top',
    end: '+=600',
    scrub: 1,
    pin: true,
  }
})
```

### 3c — Section entrance orchestration
Each major section: heading enters, then sub-elements stagger in as user 
scrolls into the section. Use batch for performance:
```ts
ScrollTrigger.batch('.section-item', {
  onEnter: els => gsap.from(els, {
    opacity: 0, y: 50,
    stagger: 0.08, duration: 0.7,
    ease: 'power3.out'
  }),
  start: 'top 85%'
})
```

---

## FX-4: SVG PATH DRAWING ANIMATION (stroke-dashoffset)
**File:** `src/components/fx/AnimatedSVGPath.tsx`
**Where:** The HITL flow diagram on /ethics draws itself as the user scrolls to it.

Implementation:
```tsx
export function AnimatedSVGPath({ d, color, duration = 2, scrollTrigger = true }) {
  const pathRef = useRef<SVGPathElement>(null)
  
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
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
          scrub: 0.5
        }
      })
    } else {
      gsap.to(path, { strokeDashoffset: 0, duration, ease: 'power2.inOut' })
    }
  }, [])
  
  return <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth="2" />
}
```

The HITL diagram on /ethics is a hand-crafted SVG showing the flow:
Camera → AI Model → Confidence Check → [<70% → Human Inspector] → Decision Log → Worker Record
Each connection path draws itself in sequence as the user scrolls down.
Node circles pop in with scale 0→1 after their connecting path finishes.

---

## FX-5: WEBGL GLSL FRAGMENT SHADER BACKGROUND
**File:** `src/components/fx/ShaderBackground.tsx`
**Where:** Landing hero background, and optionally /insights header.
**Library:** Three.js (already in stack) with a fullscreen shader plane.

This runs entirely on the GPU — zero CPU cost regardless of resolution.

```glsl
/* fragment shader — noise-based fluid color field */
uniform float u_time;
uniform vec2  u_resolution;
varying vec2  v_uv;

vec3 palette(float t) {
  /* indigo → violet → cyan color ramp */
  vec3 a = vec3(0.392, 0.396, 0.945);  /* --indigo */
  vec3 b = vec3(0.545, 0.361, 0.965);  /* --violet */
  vec3 c = vec3(0.024, 0.714, 0.831);  /* --cyan */
  float s = sin(t * 6.28318);
  return mix(mix(a, b, s * 0.5 + 0.5), c, sin(t * 3.14159) * 0.3 + 0.3);
}

float noise(vec2 p) {
  return sin(p.x * 3.1 + u_time * 0.4) * cos(p.y * 2.7 + u_time * 0.3) * 0.5
       + sin(p.x * 1.7 + u_time * 0.2) * sin(p.y * 4.1 + u_time * 0.5) * 0.25;
}

void main() {
  vec2 uv = v_uv;
  float n = noise(uv * 3.0);
  vec3 col = palette(n + u_time * 0.05) * 0.15; /* subtle — stays dark */
  gl_FragColor = vec4(col, 1.0);
}
```

Render this as a background plane behind the Three.js hero.
The color field shifts slowly over time, giving the background a living quality.
On mobile: reduce plane segment count, cap at 30fps (`setAnimationLoop` with 
frame throttle), fall back to a static CSS gradient if WebGL isn't available.

---

## FX-6: NOISE BLOB MORPHING
**File:** `src/components/fx/NoisyBlob.tsx`
**Where:** Landing hero accent (behind the headline), Ethics section accent.
**Tech:** Canvas 2D with simplex noise (use `simplex-noise` package).

```tsx
export function NoisyBlob({ color1 = '#6366f1', color2 = '#06b6d4', size = 300 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { createNoise2D } = await import('simplex-noise')
    const noise = createNoise2D()
    let t = 0, raf: number
    
    const draw = () => {
      t += 0.004
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2, cy = size / 2
      const baseR = size * 0.32, points = 80
      
      ctx.beginPath()
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        const n = noise(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9 + t)
        const r = baseR + n * size * 0.12
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      
      const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, baseR + 40)
      grad.addColorStop(0, color1 + 'cc')
      grad.addColorStop(0.6, color2 + '88')
      grad.addColorStop(1, color2 + '11')
      ctx.fillStyle = grad
      ctx.fill()
      
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  
  return <canvas ref={canvasRef} width={size} height={size} 
    style={{ position: 'absolute', opacity: 0.6, filter: 'blur(8px)' }} />
}
```

Place this behind headline text on landing, slightly offset — it creates 
a glowing organic shape that shifts behind the words. Not a foreground element.

---

## FX-7: GYROSCOPE TILT (mobile-first, production-grade)
**File:** `src/hooks/useGyroscopeTilt.ts`
**Where:** Applied to all TiltCard instances on mobile.

```ts
export function useGyroscopeTilt(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') return
    /* iOS 13+ requires permission */
    const request = (DeviceOrientationEvent as any).requestPermission
    const setup = () => {
      window.addEventListener('deviceorientation', (e) => {
        if (!ref.current) return
        const tiltX = Math.max(-20, Math.min(20, (e.gamma ?? 0) / 2))
        const tiltY = Math.max(-15, Math.min(15, (e.beta  ?? 0) / 3))
        ref.current.style.transform = 
          `perspective(800px) rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`
      }, { passive: true })
    }
    if (typeof request === 'function') {
      /* Show a button that requests permission — iOS requires user gesture */
      document.getElementById('gyro-permit')?.addEventListener('click', () => {
        request().then((state: string) => { if (state === 'granted') setup() })
      })
    } else {
      setup() /* Android — no permission needed */
    }
  }, [])
}
```

Integrate this inside TiltCard: detect `navigator.maxTouchPoints > 0`, 
use gyroscope on mobile, mousemove on desktop. One component, both behaviors.
Add a one-time permission request button on mobile for iOS — render it 
unobtrusively the first time the user opens the app.

---

## FX-8: CANVAS DEFECT RATE GAUGE
**File:** `src/components/fx/YieldGauge.tsx`
**Where:** /yield — the animated semicircle showing predicted yield %.

```tsx
export function YieldGauge({ value, max = 100 }: { value: number, max?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef({ current: 0 })
  
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H * 0.72
    const R = W * 0.38
    const target = value / max
    let raf: number
    
    const color = value >= 75 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
    
    const draw = () => {
      const t = animRef.current.current
      const diff = target - t
      animRef.current.current += diff * 0.06  /* exponential ease */
      const pct = animRef.current.current
      
      ctx.clearRect(0, 0, W, H)
      
      /* Track arc */
      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI, 0)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.stroke()
      
      /* Value arc */
      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * pct)
      ctx.strokeStyle = color
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.shadowBlur = 20
      ctx.shadowColor = color
      ctx.stroke()
      ctx.shadowBlur = 0
      
      /* Center text */
      ctx.fillStyle = '#ecedf5'
      ctx.font = `700 ${W * 0.14}px "Space Grotesk", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(Math.round(pct * max) + '%', cx, cy + 8)
      ctx.font = `400 ${W * 0.07}px "JetBrains Mono", monospace`
      ctx.fillStyle = 'rgba(236,237,245,0.5)'
      ctx.fillText('YIELD', cx, cy + W * 0.1)
      
      if (Math.abs(diff) > 0.001) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [value])
  
  return <canvas ref={canvasRef} width={280} height={180} />
}
```

---

## FX-9: PARTICLE BURST ON HEALTHY RESULT
**File:** `src/components/fx/ParticleBurst.tsx`
**Where:** /inspect — fires when HEALTHY classification appears.

```tsx
export function ParticleBurst({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const particles = Array.from({ length: 40 }, () => ({
      x: W / 2, y: H / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 12,
      r: Math.random() * 4 + 2,
      alpha: 1,
      color: `hsl(${140 + Math.random() * 30}, 70%, ${50 + Math.random() * 20}%)`
    }))
    
    let raf: number
    const animate = () => {
      ctx.clearRect(0, 0, W, H)
      let alive = false
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        p.vy += 0.3  /* gravity */
        p.alpha -= 0.025
        if (p.alpha > 0) {
          alive = true
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.globalAlpha = 1
      if (alive) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    
    /* Haptic on mobile */
    if (navigator.vibrate) navigator.vibrate([30, 10, 30])
    return () => cancelAnimationFrame(raf)
  }, [trigger])
  
  return (
    <canvas ref={canvasRef} width={320} height={320}
      style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:10 }} />
  )
}
```

---

## FX-10: MAGNETIC BUTTON (desktop) + RIPPLE (all devices)
**File:** `src/components/fx/MagneticButton.tsx`

On desktop: button physically leans toward cursor when hovered within 80px radius.
On mobile: materialripple on tap.

```tsx
export function MagneticButton({ children, className, onClick }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const isTouch = navigator.maxTouchPoints > 0
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isTouch || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const dist = Math.sqrt(dx*dx + dy*dy)
    if (dist < 100) {
      ref.current.style.transform = 
        `translate(${dx * 0.28}px, ${dy * 0.38}px) scale(1.04)`
    }
  }
  
  const handleMouseLeave = () => {
    if (ref.current)
      ref.current.style.transform = 'translate(0,0) scale(1)'
  }
  
  const addRipple = (e: React.PointerEvent) => {
    const btn = ref.current!
    const r = btn.getBoundingClientRect()
    const size = Math.max(r.width, r.height) * 2
    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${size}px; height:${size}px;
      left:${e.clientX - r.left - size/2}px;
      top:${e.clientY - r.top - size/2}px;
      background:rgba(255,255,255,0.18);
      transform:scale(0); animation:ripple 0.55s ease-out forwards;
    `
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  return (
    <button ref={ref} className={`magnetic-btn ${className}`}
      onPointerDown={addRipple}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ position:'relative', overflow:'hidden', transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
      {children}
    </button>
  )
}
```

Add to globals.css:
```css
@keyframes ripple { to { transform: scale(4); opacity: 0; } }
```

---

## APPLICATION OF ALL FX — WHERE EACH TECHNIQUE APPEARS

| Screen | Techniques active |
|--------|------------------|
| Landing `/` | ShaderBackground, NoisyBlob, Particles, SplitText, MagneticButton, Spotlight, ScrollTrigger pin, Counter |
| Inspect `/inspect` | ScanOverlay, ParticleBurst (healthy), RevealOnScroll (result card), RippleButton, TiltCard (result), Gyroscope |
| Yield `/yield` | YieldGauge, RevealOnScroll (stat cards), Counter, RippleButton, SplitText |
| Insights `/insights` | TiltCard (charts), Counter, LiveSignal, RevealOnScroll, ScrollTrigger horizontal, AuroraBg |
| Ethics `/ethics` | AnimatedSVGPath (HITL diagram), RevealOnScroll (all sections staggered), SplitText (thesis) |
| Global | Spotlight, Lenis smooth scroll (desktop only), AssistantOrb pulse animation |

---

## PERFORMANCE CHECKLIST FOR FX

- All canvas elements cap `devicePixelRatio` at 2: `Math.min(window.devicePixelRatio, 2)`
- Particles: `navigator.maxTouchPoints > 0 ? 40 : 90`
- ShaderBackground: `renderer.setPixelRatio(Math.min(dpr, 2))`, pause render when tab hidden (`document.visibilitychange`)
- NoisyBlob: on mobile reduce to 40 control points instead of 80
- GSAP ScrollTrigger: always call `ScrollTrigger.refresh()` after layout changes
- All animations wrapped in: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check
- Three.js scene: dispose geometries + materials on unmount, use `useEffect` cleanup

---

## INSTALL THESE ADDITIONAL PACKAGES

```bash
npm install split-type simplex-noise gsap @gsap/react lenis
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install framer-motion
```

These are IN ADDITION to the packages in the main prompt. All are needed for the FX components above.
