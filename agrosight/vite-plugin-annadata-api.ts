import type { Plugin } from 'vite'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Load .env.local into process.env for the LLM middleware (server-side keys). */
function loadEnvLocal(root: string) {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const key = t.slice(0, i).trim()
    const val = t.slice(i + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

/**
 * Dev-only /api/chat + /api/transcribe so Cerebras/Groq keys never ship in the browser.
 *
 * IMPORTANT: import LLM chain via absolute file:// URL. A relative `../api/...`
 * path breaks when Vite evaluates config from `node_modules/.vite-temp/`, which
 * was resolving to `node_modules/api/_llmChain.mjs` (ERR_MODULE_NOT_FOUND).
 */
export function annadataApiPlugin(): Plugin {
  return {
    name: 'annadata-api',
    configureServer(server) {
      const root = server.config.root
      loadEnvLocal(root)
      const llmChainUrl = pathToFileURL(resolve(root, 'api/_llmChain.mjs')).href

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        if (
          req.method === 'OPTIONS' &&
          (url === '/api/chat' || url === '/api/transcribe')
        ) {
          res.statusCode = 204
          res.end()
          return
        }

        if (url === '/api/transcribe' && req.method === 'POST') {
          try {
            const chunks: Buffer[] = []
            for await (const c of req) chunks.push(c as Buffer)
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
            const key = process.env.GROQ_API_KEY
            if (!key) {
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'GROQ_API_KEY not configured' }))
              return
            }
            const b64 = body?.audioBase64
            if (!b64) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'audioBase64 required' }))
              return
            }
            const language = body?.language === 'hi' ? 'hi' : 'en'
            const bin = Buffer.from(b64, 'base64')
            const form = new FormData()
            form.append(
              'file',
              new Blob([bin], { type: body.mimeType || 'audio/webm' }),
              'speech.webm',
            )
            form.append('model', 'whisper-large-v3')
            form.append('language', language)
            form.append('response_format', 'json')

            const r = await fetch(
              'https://api.groq.com/openai/v1/audio/transcriptions',
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${key}` },
                body: form,
              },
            )
            const text = await r.text()
            res.statusCode = r.status
            res.setHeader('Content-Type', 'application/json')
            if (!r.ok) {
              res.end(JSON.stringify({ error: text.slice(0, 300) }))
              return
            }
            const data = JSON.parse(text)
            res.end(
              JSON.stringify({ text: data.text ?? '', provider: 'groq-whisper' }),
            )
          } catch (e) {
            console.error('[annadata-api/transcribe]', e)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'transcribe failed' }))
          }
          return
        }

        if (!url.startsWith('/api/chat')) {
          return next()
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          const mod = await import(/* @vite-ignore */ llmChainUrl)
          const { runLlmChain, ANNADATA_SYSTEM } = mod as {
            runLlmChain: (
              messages: { role: string; content: string }[],
              env: NodeJS.ProcessEnv,
            ) => Promise<{ content: string; provider: string; model: string }>
            ANNADATA_SYSTEM: string
          }

          const language = body.language === 'hi' ? 'hi' : 'en'
          const context = body.context
            ? `\n\nLive session context:\n${body.context}`
            : ''
          const langNote =
            language === 'hi'
              ? ' Respond only in Hindi (Devanagari).'
              : ' Respond only in English.'

          const messages = [
            {
              role: 'system',
              content: ANNADATA_SYSTEM + context + langNote,
            },
            ...(body.messages ?? []).filter(
              (m: { role: string }) =>
                m.role === 'user' || m.role === 'assistant',
            ),
          ]

          const result = await runLlmChain(messages, process.env)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (e) {
          console.error('[annadata-api]', e)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              content: 'Assistant error. Try again.',
              provider: 'offline',
              model: 'error',
            }),
          )
        }
      })
    },
  }
}
