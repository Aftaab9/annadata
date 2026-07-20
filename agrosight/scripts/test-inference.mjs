/**
 * Quick offline check: raw TFLite outputs for different input preps.
 * Run: node scripts/test-inference.mjs [image-path]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-cpu'
import * as tflite from '@tensorflow/tfjs-tflite'
import jpeg from 'jpeg-js'
import { PNG } from 'pngjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const modelPath = path.join(root, 'public', 'models', 'agrosight_plantvillage.tflite')
const wasmPath = path.join(root, 'public', 'tfjs-tflite')

function loadImage(file) {
  const buf = fs.readFileSync(file)
  if (file.toLowerCase().endsWith('.png')) {
    const png = PNG.sync.read(buf)
    return { data: png.data, width: png.width, height: png.height }
  }
  const j = jpeg.decode(buf, { useTArray: true })
  return { data: j.data, width: j.width, height: j.height }
}

function tensorFromImage(img, mode) {
  const { data, width, height } = img
  const pixels = tf.tensor3d(data, [height, width, 4]).slice([0, 0, 0], [-1, -1, 3])
  const resized = tf.image.resizeBilinear(pixels, [224, 224])
  pixels.dispose()

  if (mode === 'float255') return resized.expandDims(0).cast('float32')
  if (mode === 'float01') return resized.div(255).expandDims(0).cast('float32')
  if (mode === 'mobilenet') {
    return resized
      .cast('float32')
      .div(127.5)
      .sub(1)
      .expandDims(0)
  }
  throw new Error(mode)
}

async function run() {
  await tf.setBackend('cpu')
  await tf.ready()
  tflite.setWasmPath(wasmPath + path.sep)

  const modelBuf = fs.readFileSync(modelPath)
  const model = await tflite.loadTFLiteModel(modelBuf, { numThreads: 1 })

  const imgArg = process.argv[2]
  let img
  if (imgArg && fs.existsSync(imgArg)) {
    img = loadImage(imgArg)
    console.log('Image:', imgArg, img.width, 'x', img.height)
  } else {
    console.log('No image — using random RGB 224x224')
    const data = new Uint8Array(224 * 224 * 3)
    for (let i = 0; i < data.length; i++) data[i] = Math.floor(Math.random() * 256)
    img = { data, width: 224, height: 224 }
  }

  for (const mode of ['float255', 'float01', 'mobilenet']) {
    const input = tensorFromImage(img, mode)
    const out = model.predict(input)
    const t = Array.isArray(out) ? out[0] : out
    const raw = await t.data()
    const probs = Array.from(raw).slice(0, 3)
    const sum = probs.reduce((a, b) => a + b, 0)
  const norm = sum > 0 ? probs.map((p) => p / sum) : probs
    console.log(`\n[${mode}] raw:`, probs.map((p) => p.toFixed(4)).join(', '))
    console.log(`[${mode}] norm:`, norm.map((p) => (p * 100).toFixed(1) + '%').join(', '))
    console.log(`[${mode}] shape:`, t.shape)
    input.dispose()
    t.dispose()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
