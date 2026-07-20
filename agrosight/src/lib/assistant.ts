import type { ClassificationResult } from './inference'
import type { Language, YieldParams } from './constants'
import type { YieldPrediction } from './yieldEngine'
import { getDefectAdvice } from './defectAdvice'
import type { GradeCardData } from './gradeCard'
import type { InspectMode } from './inspectMode'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantContext {
  cvResult?: ClassificationResult
  yieldParams?: YieldParams
  yieldPrediction?: YieldPrediction
  selectedCrop?: string
  priceModal?: number
  gradeCard?: GradeCardData | null
  location?: { state: string; district: string; commodity: string }
  inspectMode?: InspectMode
}

export type LlmProvider =
  | 'ollama'
  | 'cerebras'
  | 'groq'
  | 'openrouter'
  | 'offline'
  | 'error'

function buildContextBlock(
  context?: AssistantContext,
  language: Language = 'en',
): string {
  if (!context) return ''
  const parts: string[] = []
  if (context.inspectMode) {
    parts.push(
      `Inspect mode: ${context.inspectMode === 'leaf' ? 'Leaf Health (disease)' : 'Produce Quality (batch grade)'}`,
    )
  }
  if (context.selectedCrop) parts.push(`Crop SKU: ${context.selectedCrop}`)
  if (context.cvResult) {
    const advice = getDefectAdvice(context.cvResult.class, language)
    parts.push(
      `Last model output: ${context.cvResult.class} @ ${Math.round(context.cvResult.confidence * 100)}% (mock=${context.cvResult.mock})`,
    )
    if (context.inspectMode !== 'produce') {
      parts.push(`Field advice: ${advice.title}`)
      parts.push(`Steps: ${advice.steps.join(' | ')}`)
    }
  }
  if (context.gradeCard) {
    parts.push(
      `Grade Card: ${context.gradeCard.grade} stars=${context.gradeCard.stars} HITL=${context.gradeCard.hitlRequired}`,
    )
  }
  if (context.priceModal != null) {
    parts.push(`Mandi modal ₹/q: ${context.priceModal}`)
  }
  if (context.location) {
    parts.push(
      `Location: ${context.location.district}, ${context.location.state} · ${context.location.commodity}`,
    )
  }
  if (context.yieldPrediction) {
    parts.push(
      `Yield: ${context.yieldPrediction.yield_pct}% / ${context.yieldPrediction.yield_kg} kg`,
    )
  }
  return parts.join('\n')
}

export async function getAssistantResponse(
  messages: AssistantMessage[],
  context?: AssistantContext,
  language: Language = 'en',
): Promise<{ content: string; provider: LlmProvider; model: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        language,
        context: buildContextBlock(context, language),
      }),
      signal: AbortSignal.timeout(45000),
    })
    if (!res.ok) throw new Error(`api/chat HTTP ${res.status}`)
    const data = (await res.json()) as {
      content?: string
      provider?: LlmProvider
      model?: string
    }
    return {
      content: data.content ?? 'No response.',
      provider: data.provider ?? 'offline',
      model: data.model ?? 'unknown',
    }
  } catch (e) {
    console.warn('[assistant] /api/chat failed:', e)
    return {
      content: getOfflineFallback(messages, context, language),
      provider: 'offline',
      model: 'static',
    }
  }
}

function getOfflineFallback(
  messages: AssistantMessage[],
  context?: AssistantContext,
  language: Language = 'en',
): string {
  const last = messages[messages.length - 1]?.content ?? ''

  if (context?.cvResult && context.inspectMode !== 'produce') {
    const advice = getDefectAdvice(context.cvResult.class, language)
    const conf = Math.round(context.cvResult.confidence * 100)
    if (language === 'hi') {
      return `${advice.title} (${context.cvResult.class}, ${conf}% विश्वास)।\n\n${advice.summary}\n\nकदम:\n${advice.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    }
    return `${advice.title} (${context.cvResult.class}, ${conf}% confidence).\n\n${advice.summary}\n\nSteps:\n${advice.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
  }

  if (language === 'hi') {
    return `ऑफ़लाइन मोड। आपने पूछा: "${last}". Cerebras/Groq कुंजी या Ollama चालू करें।`
  }
  return `Offline mode. You asked: "${last}". Start Ollama or ensure Cerebras/Groq keys are in .env.local.`
}

/** Stream = full reply then typewriter (cloud providers often non-stream here) */
export async function streamAssistantResponse(
  messages: AssistantMessage[],
  onToken: (token: string) => void,
  context?: AssistantContext,
  language: Language = 'en',
  onMeta?: (meta: { provider: LlmProvider; model: string }) => void,
): Promise<void> {
  const result = await getAssistantResponse(messages, context, language)
  onMeta?.({ provider: result.provider, model: result.model })
  for (const char of result.content) {
    onToken(char)
    await new Promise((r) => setTimeout(r, 4))
  }
}

export async function checkOllamaHealth(): Promise<{
  ok: boolean
  model: string
  models: string[]
  chainHint: string
}> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
        language: 'en',
        context: 'healthcheck',
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      return {
        ok: false,
        model: 'offline',
        models: [],
        chainHint: 'API unavailable',
      }
    }
    const data = (await res.json()) as { provider?: string; model?: string }
    return {
      ok: data.provider !== 'offline',
      model: data.model ?? 'unknown',
      models: [data.provider ?? 'unknown'],
      chainHint: `${data.provider ?? '?'} · ${data.model ?? '?'}`,
    }
  } catch {
    return {
      ok: false,
      model: 'offline',
      models: [],
      chainHint: 'Offline fallback',
    }
  }
}

export function getOllamaModel(): string {
  return import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2:3b'
}
