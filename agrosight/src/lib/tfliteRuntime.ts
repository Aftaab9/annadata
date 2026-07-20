import * as tf from '@tensorflow/tfjs'

export interface TfliteGlobal {
  setWasmPath: (path: string) => void
  loadTFLiteModel: (
    model: string | ArrayBuffer,
    options?: { numThreads?: number },
  ) => Promise<{
    predict: (input: tf.Tensor) => tf.Tensor | tf.Tensor[]
  }>
}

declare global {
  interface Window {
    tf?: typeof tf
    tflite?: TfliteGlobal
  }
}

let runtimePromise: Promise<TfliteGlobal> | null = null

function publicBase(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

function tfliteScriptUrl(): string {
  return `${publicBase()}tfjs-tflite/tf-tflite.min.js`
}

function wasmBaseUrl(): string {
  return new URL(`${publicBase()}tfjs-tflite/`, window.location.origin).href
}

function injectScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[data-agrosight="${src}"]`)
  if (existing) {
    return existing.getAttribute('data-loaded') === '1'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve())
          existing.addEventListener('error', () => reject(new Error(`Script failed: ${src}`)))
        })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.agrosight = src
    script.onload = () => {
      script.setAttribute('data-loaded', '1')
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

/** Expose TF on window — required by tf-tflite UMD bundle */
export async function ensureTfGlobal(): Promise<void> {
  window.tf = tf
  await import('@tensorflow/tfjs-backend-cpu')
  await tf.setBackend('cpu')
  await tf.ready()
}

export function getTfliteRuntime(): Promise<TfliteGlobal> {
  if (runtimePromise) return runtimePromise

  runtimePromise = (async () => {
    await ensureTfGlobal()
    const scriptUrl = tfliteScriptUrl()
    await injectScript(scriptUrl)

    const api = window.tflite
    if (!api?.loadTFLiteModel || !api?.setWasmPath) {
      throw new Error('TFLite runtime missing after script load')
    }

    const wasmUrl = wasmBaseUrl()
    api.setWasmPath(wasmUrl)
    console.info('[AgroSight] TFLite runtime ready, WASM:', wasmUrl)
    return api
  })()

  return runtimePromise
}

export function resetTfliteRuntime(): void {
  runtimePromise = null
  delete window.tflite
  document.querySelectorAll(`script[data-agrosight="${tfliteScriptUrl()}"]`).forEach((el) => el.remove())
}
