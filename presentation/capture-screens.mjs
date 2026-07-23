import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'presentation', 'screens')
fs.mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5173'

function pick(...cands) {
  for (const c of cands) if (fs.existsSync(c)) return c
  return null
}

const leafImg = pick(
  path.join(ROOT, 'Mock-Images/plantvillage/tomato/blight_mold_1_Tomato___Early_blight.jpg'),
  path.join(ROOT, 'Mock-Images/plantvillage/apple/blight_mold_1_Apple___Black_rot.jpg'),
  path.join(ROOT, 'Mock-Images/plantvillage/potato/blight_mold_1_Potato___Early_blight.jpg'),
  path.join(ROOT, 'Mock-Images/plantvillage/maize/blight_mold_1_Corn_(maize)___Northern_Leaf_Blight.jpg'),
)
const fresh = pick(
  path.join(ROOT, 'agrosight/public/samples/produce/apple_fruit/apple_fresh.jpg'),
  path.join(ROOT, 'agrosight/public/samples/produce/fresh_apple.jpg'),
)
const rotten = pick(
  path.join(ROOT, 'agrosight/public/samples/produce/apple_fruit/rotten_apple.jpg'),
  path.join(ROOT, 'agrosight/public/samples/produce/verify_rotten_apple.jpg'),
)

console.log({ leafImg, fresh, rotten })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.setDefaultTimeout(90000)

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log('saved', name)
}

async function upload(filePath) {
  const input = page.locator('input[type=file]').first()
  await input.setInputFiles(filePath)
  await page.waitForTimeout(9000)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
await shot('01_landing')

await page.goto(`${BASE}/inspect`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.getByRole('button', { name: /Leaf Health/i }).click()
await page.waitForTimeout(2000)
await shot('02_inspect_leaf_ready')

if (leafImg) {
  await upload(leafImg)
  await page.waitForTimeout(2500)
  await shot('03_leaf_result')
}

// Reset / switch to produce
const resetBtn = page.getByRole('button', { name: /Start over|Scan another|New scan/i }).first()
if (await resetBtn.count()) {
  await resetBtn.click().catch(() => {})
  await page.waitForTimeout(1000)
}
await page.getByRole('button', { name: /Produce Quality/i }).click()
await page.waitForTimeout(2500)
await shot('04_inspect_produce_ready')

if (fresh) {
  await upload(fresh)
  await page.waitForTimeout(2500)
  await shot('05_produce_fresh_result')
}

if (await resetBtn.count()) {
  await resetBtn.click().catch(() => {})
  await page.waitForTimeout(1000)
} else {
  await page.goto(`${BASE}/inspect`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Produce Quality/i }).click()
  await page.waitForTimeout(1500)
}

if (rotten) {
  await upload(rotten)
  await page.waitForTimeout(2500)
  await shot('06_produce_spoiled_result')
  await page.evaluate(() => window.scrollBy(0, 480))
  await page.waitForTimeout(600)
  await shot('07_produce_next_actions')
}

await page.goto(`${BASE}/yield`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2800)
await shot('08_yield_simulator')
const opt = page.getByRole('button', { name: /Optimal/i }).first()
if (await opt.count()) {
  await opt.click()
  await page.waitForTimeout(1800)
  await shot('09_yield_optimal')
}

await page.goto(`${BASE}/prices`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
await shot('10_prices')

await page.goto(`${BASE}/market`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
await shot('11_market')

await page.goto(`${BASE}/advisory`, { waitUntil: 'networkidle' })
await page.waitForTimeout(4500)
await shot('12_advisory_crop')
await page.getByRole('button', { name: /^Fertilizer$/i }).click()
await page.waitForTimeout(4000)
await shot('13_advisory_fertilizer')

await page.goto(`${BASE}/insights`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2800)
await shot('14_insights_kpis')
await page.evaluate(() => window.scrollBy(0, 720))
await page.waitForTimeout(900)
await shot('15_insights_charts')

await page.goto(`${BASE}/ethics`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
await shot('16_ethics')

await browser.close()
console.log('DONE files:', fs.readdirSync(OUT))
