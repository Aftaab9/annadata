import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { capDpr, prefersReducedMotion } from '@/lib/motion'

const fragmentShader = `
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;

vec3 palette(float t) {
  vec3 a = vec3(0.392, 0.396, 0.945);
  vec3 b = vec3(0.545, 0.361, 0.965);
  vec3 c = vec3(0.024, 0.714, 0.831);
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
  vec3 col = palette(n + u_time * 0.05) * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
`

const vertexShader = `
varying vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

function ShaderPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time!.value = state.clock.elapsedTime
      matRef.current.uniforms.u_resolution!.value.set(
        state.size.width,
        state.size.height,
      )
    }
  })

  return (
    <mesh scale={[2, 2, 1]}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(1, 1) },
        }}
      />
    </mesh>
  )
}

interface ShaderBackgroundProps {
  className?: string
}

export function ShaderBackground({ className }: ShaderBackgroundProps) {
  const [webgl, setWebgl] = useState(true)

  useEffect(() => {
    if (prefersReducedMotion()) setWebgl(false)
  }, [])

  if (!webgl) {
    return (
      <div
        className={className}
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.12), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.08), transparent 50%)',
        }}
        aria-hidden
      />
    )
  }

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={capDpr()}
        camera={{ position: [0, 0, 1] }}
        gl={{ antialias: false, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  )
}
