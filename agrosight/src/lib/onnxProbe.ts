/**
 * Optional ONNX advisory path — activates when files exist in public/models/.
 * Does not require onnxruntime-web until you drop crop_rec.onnx / fertilizer.onnx.
 * Until then cropRecService / fertilizerService keep honest JSON lookups.
 */

export type OnnxReadyState = {
  cropRec: boolean
  fertilizer: boolean
}

let cached: OnnxReadyState | null = null

async function headOk(path: string): Promise<boolean> {
  try {
    const res = await fetch(path, { method: 'HEAD', cache: 'no-store' })
    if (res.ok) return true
    // Some hosts reject HEAD — try GET range
    const g = await fetch(path, { method: 'GET', cache: 'no-store' })
    return g.ok
  } catch {
    return false
  }
}

export async function probeOnnxArtifacts(): Promise<OnnxReadyState> {
  if (cached) return cached
  const [cropRec, fertilizer] = await Promise.all([
    headOk('/models/crop_rec.onnx'),
    headOk('/models/fertilizer.onnx'),
  ])
  cached = { cropRec, fertilizer }
  return cached
}

export function clearOnnxProbeCache() {
  cached = null
}
