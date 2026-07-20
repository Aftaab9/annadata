/**
 * Vercel: POST /api/transcribe  (multipart or JSON base64)
 * Groq Whisper — Hindi STT fallback. Key: GROQ_API_KEY (server-only).
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

  const key = process.env.GROQ_API_KEY
  if (!key) {
    res.status(503).json({ error: 'GROQ_API_KEY not configured' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const b64 = body?.audioBase64
    const language = body?.language === 'hi' ? 'hi' : 'en'
    if (!b64) {
      res.status(400).json({ error: 'audioBase64 required' })
      return
    }

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

    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })
    if (!r.ok) {
      const t = await r.text()
      res.status(r.status).json({ error: t.slice(0, 300) })
      return
    }
    const data = await r.json()
    res.status(200).json({ text: data.text ?? '', provider: 'groq-whisper' })
  } catch (e) {
    console.error('[api/transcribe]', e)
    res.status(500).json({ error: 'transcribe failed' })
  }
}
