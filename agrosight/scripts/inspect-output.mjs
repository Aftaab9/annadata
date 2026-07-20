import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('http://localhost:5173/inspect', { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForTimeout(10000)

const result = await page.evaluate(async () => {
  const tf = window.tf
  const tflite = window.tflite
  const res = await fetch('/models/agrosight_plantvillage.tflite')
  const buf = await res.arrayBuffer()
  const model = await tflite.loadTFLiteModel(buf, { numThreads: 1 })

  const img = new Image()
  img.src = '/assets/07_pv_multi_sku_samples.png'
  await img.decode()

  const pixels = tf.browser
    .fromPixels(img)
    .resizeBilinear([224, 224])
    .expandDims(0)
    .cast('float32')

  const out = model.predict(pixels)
  const tensors = Array.isArray(out) ? out : [out]
  const details = []
  for (const t of tensors) {
    const data = await t.data()
    details.push({
      shape: t.shape,
      dtype: t.dtype,
      len: data.length,
      sample: Array.from(data).slice(0, 10),
      sum: Array.from(data).reduce((a, b) => a + b, 0),
      max: Math.max(...Array.from(data)),
    })
    t.dispose()
  }
  pixels.dispose()
  return details
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
