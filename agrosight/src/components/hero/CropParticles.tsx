import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { prefersReducedMotion } from '@/lib/motion'

const COUNT = 48 * 24
const W = 12
const D = 6

function lerpColor(t: number): THREE.Color {
  const c = new THREE.Color()
  if (t < 0.33) c.setHex(0x10b981)
  else if (t < 0.66) c.setHex(0xf59e0b)
  else c.setHex(0xef4444)
  return c
}

export function CropParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const scanPlaneRef = useRef<THREE.Mesh>(null)
  const scanX = useRef(0)
  const reduced = prefersReducedMotion()

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const positions = useMemo(() => {
    const arr: { x: number; z: number; phase: number }[] = []
    for (let i = 0; i < COUNT; i++) {
      const xi = i % 48
      const zi = Math.floor(i / 48)
      arr.push({
        x: (xi / 47 - 0.5) * W,
        z: (zi / 23 - 0.5) * D,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const t = reduced ? 0 : state.clock.elapsedTime
    scanX.current = ((t * 0.35) % 1) * W - W / 2
    if (scanPlaneRef.current) {
      scanPlaneRef.current.position.x = scanX.current
    }

    positions.forEach((p, i) => {
      const wave = Math.sin(t * 1.2 + p.phase) * 0.08
      const scanDist = Math.abs(p.x - scanX.current)
      const scanned = scanDist < 0.8
      const height = 0.15 + wave + (scanned ? 0.35 : 0)

      dummy.position.set(p.x, height * 0.5 - 0.2, p.z)
      dummy.scale.set(0.18, height, 0.18)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const heat = scanned
        ? 0.2 + ((p.x + W / 2) / W) * 0.8
        : 0.1 + Math.sin(t * 0.5 + p.phase) * 0.05
      mesh.setColorAt(i, lerpColor(heat))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

    mesh.rotation.y = reduced ? 0.15 : Math.sin(t * 0.12) * 0.2 + 0.15
  })

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 4]} intensity={1.2} color="#a78bfa" />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#38bdf8" />
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial vertexColors roughness={0.4} metalness={0.3} />
      </instancedMesh>
      {!reduced && (
        <mesh ref={scanPlaneRef} position={[0, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[D * 1.2, 2.5]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  )
}
