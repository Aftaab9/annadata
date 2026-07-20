import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 4173
const base = `http://127.0.0.1:${PORT}`
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
  cwd: root,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
})

function waitForServer(ms = 60000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + ms
    const check = () => {
      fetch(`${base}/`)
        .then((r) => (r.ok ? resolve() : setTimeout(check, 400)))
        .catch(() => {
          if (Date.now() > deadline) reject(new Error('Server timeout'))
          else setTimeout(check, 400)
        })
    }
    check()
  })
}

const logs = []
const errors = []

try {
  await waitForServer()
  const browser = await chromium.launch()
  const page = await browser.newPage()
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto(`${base}/inspect`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(15000)

  const badge = await page.locator('nav').textContent().catch(() => '')
  const body = await page.locator('body').textContent()

  console.log('--- NAV TEXT ---')
  console.log(badge?.slice(0, 500))
  console.log('--- CONSOLE (last 20) ---')
  console.log(logs.slice(-20).join('\n'))
  console.log('--- PAGE ERRORS ---')
  console.log(errors.join('\n') || '(none)')
  console.log('--- BODY SNIPPET ---')
  const hasLive = body?.includes('Live TFLite') || badge?.includes('Live TFLite')
  const hasMock = body?.includes('Mock') || badge?.includes('Mock')
  console.log('Live TFLite:', hasLive)
  console.log('Mock mode:', hasMock)

  await browser.close()
  process.exit(hasLive && !hasMock ? 0 : 1)
} catch (e) {
  console.error('TEST FAILED:', e)
  process.exit(2)
} finally {
  server.kill()
}
