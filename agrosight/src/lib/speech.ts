import type { Language } from './constants'

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
    window.webkitSpeechRecognition
  )
}

export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window
}

export function getRecognitionLang(language: Language): string {
  return language === 'hi' ? 'hi-IN' : 'en-US'
}

export function getTtsLang(language: Language): string {
  return language === 'hi' ? 'hi-IN' : 'en-US'
}

/**
 * Strip characters TTS engines read aloud as "dash", "hyphen", "underscore", etc.
 * Especially bad for Hindi voices on Windows/Chrome.
 */
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, ' ') // unicode dashes
    .replace(/[-–—―_/|\\]+/g, ' ')
    .replace(/[•·▪▸►●○]/g, ' ')
    .replace(/[*#`~]+/g, ' ')
    .replace(/\.{2,}/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function pickVoice(language: Language): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  const want = language === 'hi' ? 'hi' : 'en'
  const preferred =
    voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith(want) &&
        /google|microsoft|natural|neural/i.test(v.name),
    ) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(want)) ??
    null
  return preferred
}

/** Speak text — sanitized so Hindi/English TTS does not say "dash dash" */
export function speak(text: string, language: Language = 'en'): void {
  if (!isSpeechSynthesisSupported()) return
  const clean = sanitizeForSpeech(text)
  if (!clean) return

  window.speechSynthesis.cancel()

  const utter = () => {
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = getTtsLang(language)
    utterance.rate = language === 'hi' ? 0.9 : 0.95
    const voice = pickVoice(language)
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  // Chrome loads voices asynchronously
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      utter()
    }
    // Fallback if event never fires
    setTimeout(utter, 250)
  } else {
    utter()
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}

/** Groq Whisper via /api/transcribe — better Hindi STT fallback */
export async function transcribeViaWhisper(
  blob: Blob,
  language: Language,
): Promise<string> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  const audioBase64 = btoa(binary)

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      language,
      mimeType: blob.type || 'audio/webm',
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(err || `Whisper HTTP ${res.status}`)
  }
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

/** Record mic ~4s then Whisper-transcribe (used when Hindi or browser STT weak) */
export async function recordAndTranscribe(
  language: Language,
  maxMs = 5000,
): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4'
  const rec = new MediaRecorder(stream, { mimeType: mime })
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }
  const done = new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }))
    rec.onerror = () => reject(new Error('MediaRecorder error'))
  })
  rec.start()
  await new Promise((r) => setTimeout(r, maxMs))
  if (rec.state !== 'inactive') rec.stop()
  stream.getTracks().forEach((t) => t.stop())
  const blob = await done
  return transcribeViaWhisper(blob, language)
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => {
      lang: string
      continuous: boolean
      interimResults: boolean
      start: () => void
      stop: () => void
      onresult: ((ev: unknown) => void) | null
      onerror: ((ev: unknown) => void) | null
      onend: (() => void) | null
    }
  }
}
