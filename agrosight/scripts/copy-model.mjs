import { copyFileSync, cpSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, 'public', 'models', 'agrosight_plantvillage.tflite')
const wasmSrc = join(root, 'node_modules', '@tensorflow', 'tfjs-tflite', 'wasm')
const wasmDest = join(root, 'public', 'tfjs-tflite')
const vendorDir = join(root, 'public', 'vendor')
const tfliteBundleSrc = join(
  root,
  'node_modules',
  '@tensorflow',
  'tfjs-tflite',
  'dist',
  'tf-tflite.min.js',
)
const tfliteBundleDest = join(vendorDir, 'tf-tflite.min.js')
const tfliteBundleWasmDest = join(wasmDest, 'tf-tflite.min.js')

const sources = [
  join(root, '..', 'models', 'agrosight_plantvillage.tflite'),
  join(root, '..', 'agrosight_plantvillage.tflite'),
  join(process.env.USERPROFILE || '', 'Downloads', 'agrosight_plantvillage.tflite'),
  join(root, '..', 'models', 'agrosight_model.tflite'),
  join(process.env.USERPROFILE || '', 'Downloads', 'agrosight_model.tflite'),
]

mkdirSync(dirname(dest), { recursive: true })
mkdirSync(vendorDir, { recursive: true })

if (existsSync(wasmSrc)) {
  mkdirSync(wasmDest, { recursive: true })
  cpSync(wasmSrc, wasmDest, { recursive: true })
  console.log('[copy-model] Synced TFLite WASM → public/tfjs-tflite/')
}

if (existsSync(tfliteBundleSrc)) {
  copyFileSync(tfliteBundleSrc, tfliteBundleDest)
  if (existsSync(wasmDest)) {
    copyFileSync(tfliteBundleSrc, tfliteBundleWasmDest)
  }
  const mb = (statSync(tfliteBundleDest).size / 1024 / 1024).toFixed(1)
  console.log(`[copy-model] Synced TFLite UMD → public/vendor/ + public/tfjs-tflite/ (${mb} MB)`)
}

const src = sources.find((p) => existsSync(p))

if (!src) {
  console.warn(
    '[copy-model] No TFLite found. Place agrosight_plantvillage.tflite in:\n' +
      '  - AIO-Final/models/\n' +
      '  - or agrosight/public/models/\n' +
      'App will use mock inference until then.',
  )
  process.exit(0)
}

const srcStat = statSync(src)
const destExists = existsSync(dest)
const destStat = destExists ? statSync(dest) : null
const needsCopy =
  !destExists ||
  srcStat.size !== destStat.size ||
  srcStat.mtimeMs > destStat.mtimeMs

if (needsCopy) {
  copyFileSync(src, dest)
  const mb = (statSync(dest).size / 1024 / 1024).toFixed(1)
  const label = src.includes('agrosight_model') ? ' (beans fallback)' : ''
  console.log(`[copy-model] Synced ${src} → ${dest} (${mb} MB)${label}`)
} else {
  const mb = (destStat.size / 1024 / 1024).toFixed(1)
  console.log(`[copy-model] Up to date: public/models/agrosight_plantvillage.tflite (${mb} MB)`)
}
