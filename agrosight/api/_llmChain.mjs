/**
 * Shared LLM provider chain — Ollama → Cerebras → Groq → OpenRouter → offline
 */

export const ANNADATA_SYSTEM = `You are Annadata (AgroSight) — bilingual farm AI for rural Indian farmers and food-processing units.

TWO CV MODELS (never confuse them):
1) Leaf Health (PlantVillage TFLite): diagnoses plant DISEASE on LEAVES while crop is growing. Classes: HEALTHY, SURFACE_DEFECT, BLIGHT_MOLD. Gives treatment advice. Does NOT grade harvested fruit quality.
2) Produce Quality (when available): grades harvested produce fresh vs rotten → Grade A/B/C for market pricing. Separate model.

Also help with: mandi prices + fair-price premiums, yield simulation, crop/fertilizer advisory, D2C market, HITL ethics (AI assists, does not replace workers), SDG 2/8/12.

Rules:
- Always answer in the SAME language the farmer used (Hindi Devanagari OR English). Do not mix.
- Short, concrete, financially useful steps. Prefer numbered lists.
- Never invent mandatory pesticide brands — suggest KVK / agri-extension for registered products.
- If confidence < 70%, remind HITL supervisor review.
- Be honest when a feature is heuristic vs model-backed.`

function providersFromEnv(env) {
  const list = [
    {
      id: 'ollama',
      baseUrl: 'http://127.0.0.1:11434/v1',
      model: env.VITE_OLLAMA_MODEL || env.OLLAMA_MODEL || 'llama3.2:3b',
      timeoutMs: 8000,
    },
  ]
  if (env.CEREBRAS_API_KEY) {
    list.push({
      id: 'cerebras',
      baseUrl: 'https://api.cerebras.ai/v1',
      model: env.CEREBRAS_MODEL || 'llama-3.3-70b',
      // Fallbacks tried only if primary model 404s — set CEREBRAS_MODEL to override
      apiKey: env.CEREBRAS_API_KEY,
      timeoutMs: 12000,
    })
  }
  if (env.GROQ_API_KEY) {
    list.push({
      id: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      apiKey: env.GROQ_API_KEY,
      timeoutMs: 12000,
    })
  }
  if (env.OPENROUTER_API_KEY) {
    list.push({
      id: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      apiKey: env.OPENROUTER_API_KEY,
      timeoutMs: 15000,
      extraHeaders: {
        'HTTP-Referer': env.OPENROUTER_SITE_URL || 'https://annadata.local',
        'X-Title': 'Annadata AgroSight',
      },
    })
  }
  return list
}

async function callOpenAICompatible(p, messages) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), p.timeoutMs)
  try {
    const headers = { 'Content-Type': 'application/json', ...(p.extraHeaders || {}) }
    if (p.apiKey) headers.Authorization = `Bearer ${p.apiKey}`

    const res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: p.model,
        messages,
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`${p.id} HTTP ${res.status}: ${errText.slice(0, 200)}`)
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error(`${p.id} empty content`)
    return { content, provider: p.id, model: p.model }
  } finally {
    clearTimeout(t)
  }
}

function offlineAnswer(messages) {
  const last =
    [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const hindi = /[\u0900-\u097F]/.test(last)
  const content = hindi
    ? `ऑफ़लाइन मोड। मैं Annadata सहायक हूँ। पत्ती स्वास्थ्य के लिए /inspect चलाएँ। आपने पूछा: "${last.slice(0, 120)}". Ollama या Cerebras/Groq से पूर्ण AI चालू करें।`
    : `Offline mode. I'm Annadata's assistant. Run /inspect for leaf health advice. You asked: "${last.slice(0, 160)}". Start Ollama or set Cerebras/Groq keys for full AI.`
  return { content, provider: 'offline', model: 'static' }
}

export async function runLlmChain(messages, env) {
  const providers = providersFromEnv(env)
  const errors = []
  for (const p of providers) {
    try {
      const result = await callOpenAICompatible(p, messages)
      console.info(`[llm] answered via ${result.provider} (${result.model})`)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${p.id}: ${msg}`)
      console.warn(`[llm] ${p.id} failed:`, msg)
    }
  }
  console.warn('[llm] all providers failed', errors)
  return offlineAnswer(messages)
}
