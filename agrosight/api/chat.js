import { runLlmChain, ANNADATA_SYSTEM } from './_llmChain.mjs'

/**
 * Vercel serverless: POST /api/chat
 * Body: { messages: [{role, content}], context?: string, language?: 'en'|'hi' }
 * Keys from process.env (never VITE_*)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const messages = body?.messages ?? []
    const language = body?.language === 'hi' ? 'hi' : 'en'
    const context = body?.context ? `\n\nLive session context:\n${body.context}` : ''
    const langNote =
      language === 'hi'
        ? ' Respond only in Hindi (Devanagari).'
        : ' Respond only in English.'

    const full = [
      { role: 'system', content: ANNADATA_SYSTEM + context + langNote },
      ...messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
    ]

    const result = await runLlmChain(full, process.env)
    res.status(200).json(result)
  } catch (e) {
    console.error('[api/chat]', e)
    res.status(500).json({
      content: 'Assistant error. Try again.',
      provider: 'offline',
      model: 'error',
    })
  }
}
