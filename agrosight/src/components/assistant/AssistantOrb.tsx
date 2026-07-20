import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Send, X, Circle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  checkOllamaHealth,
  getAssistantResponse,
  streamAssistantResponse,
} from '@/lib/assistant'
import { cn } from '@/lib/cn'
import { VoiceButton } from '@/components/voice/VoiceButton'
import type { InspectMode } from '@/lib/inspectMode'

function TypingDots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}

/** Floating AI assistant — Cerebras/Groq/Ollama chain + voice */
export function AssistantOrb() {
  const {
    assistantOpen,
    setAssistantOpen,
    assistantPrompt,
    setAssistantPrompt,
    cvResult,
    language,
    yieldParams,
    selectedCrop,
    yieldPrediction,
    priceModal,
    gradeCard,
    location,
  } = useStore()

  const inspectMode = (gradeCard?.sourceMode ?? 'leaf') as InspectMode

  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [providerOk, setProviderOk] = useState<boolean | null>(null)
  const [providerLabel, setProviderLabel] = useState('Checking…')
  const abortRef = useRef(false)

  const defaultPrompt = cvResult
    ? language === 'hi'
      ? inspectMode === 'produce'
        ? 'इस उपज ग्रेड को समझाएँ और उचित भाव बताएँ।'
        : 'इस पत्ती स्वास्थ्य परिणाम को समझाएँ और इलाज बताएँ।'
      : inspectMode === 'produce'
        ? 'Explain this produce grade and suggest a fair mandi-linked price.'
        : 'Explain this leaf health result and give treatment steps if diseased.'
    : language === 'hi'
      ? 'इस बैच की उपज कैसे सुधारूँ?'
      : 'How can I optimize yield for this batch?'

  const userPrompt = assistantPrompt ?? defaultPrompt

  const context = useMemo(
    () => ({
      cvResult: cvResult ?? undefined,
      yieldParams,
      yieldPrediction: yieldPrediction ?? undefined,
      selectedCrop: selectedCrop.label,
      priceModal,
      gradeCard,
      location,
      inspectMode,
    }),
    [
      cvResult,
      yieldParams,
      yieldPrediction,
      selectedCrop.label,
      priceModal,
      gradeCard,
      location,
      inspectMode,
    ],
  )

  useEffect(() => {
    if (!assistantOpen) return
    checkOllamaHealth().then((h) => {
      setProviderOk(h.ok)
      setProviderLabel(h.chainHint)
    })
  }, [assistantOpen])

  const runAssistant = useCallback(
    async (prompt: string) => {
      abortRef.current = false
      setLoading(true)
      setReply('')

      try {
        await streamAssistantResponse(
          [{ role: 'user', content: prompt }],
          (token) => {
            if (!abortRef.current) setReply((r) => r + token)
          },
          context,
          language,
          (meta) => {
            setProviderOk(meta.provider !== 'offline')
            setProviderLabel(`${meta.provider} · ${meta.model}`)
          },
        )
      } catch {
        const result = await getAssistantResponse(
          [{ role: 'user', content: prompt }],
          context,
          language,
        )
        if (!abortRef.current) {
          setReply(result.content)
          setProviderOk(result.provider !== 'offline')
          setProviderLabel(`${result.provider} · ${result.model}`)
        }
      } finally {
        if (!abortRef.current) setLoading(false)
      }
    },
    [context, language],
  )

  useEffect(() => {
    if (!assistantOpen) {
      abortRef.current = true
      setReply('')
      setLoading(false)
      return
    }

    setInput('')
    void runAssistant(userPrompt)
  }, [assistantOpen, userPrompt, runAssistant])

  const handleClose = () => {
    abortRef.current = true
    setAssistantOpen(false)
    setAssistantPrompt(null)
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setAssistantPrompt(text)
    setInput('')
  }

  return (
    <>
      {assistantOpen && (
        <div
          className="fixed bottom-28 right-4 z-50 w-[min(380px,calc(100vw-2rem))] animate-slide-up sm:bottom-24 sm:right-6 lg:bottom-24"
          role="dialog"
          aria-label="AI Assistant"
        >
          <div className="glass-strong overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-cyan">
                    Annadata Assistant
                  </p>
                  {loading && <TypingDots />}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[9px] uppercase tracking-widest text-dim">
                  <Circle
                    className={cn(
                      'h-2 w-2 shrink-0 fill-current',
                      providerOk === null
                        ? 'text-dim'
                        : providerOk
                          ? 'text-healthy'
                          : 'text-warning',
                    )}
                    aria-hidden
                  />
                  {providerLabel}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <VoiceButton
                  language={language}
                  speakText={!loading && reply ? reply : null}
                  onTranscript={(text) => {
                    setInput(text)
                    setAssistantPrompt(text)
                  }}
                />
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-1 text-muted hover:text-text"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto whitespace-pre-wrap p-4 text-sm leading-relaxed">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-dim">
                You
              </p>
              <p className="text-muted">{userPrompt}</p>

              <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-widest text-cyan">
                Assistant
              </p>
              {loading && !reply && (
                <p className="text-muted">
                  {language === 'hi' ? 'विश्लेषण हो रहा है…' : 'Analyzing…'}
                </p>
              )}
              {reply && <p className="text-text">{reply}</p>}
            </div>

            <div className="flex gap-2 border-t border-[var(--border)] p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  language === 'hi' ? 'कोई सवाल पूछें…' : 'Ask a follow-up…'
                }
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-text outline-none focus:border-cyan/40"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-indigo/20 px-3 text-cyan disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAssistantOpen(!assistantOpen)}
        className={cn(
          'assistant-orb fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#3dd6c3]/40 bg-[#3dd6c3] text-[#04241c] shadow-[0_0_30px_rgba(61,214,195,0.45)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6',
          assistantOpen && 'scale-110',
          loading && 'animate-pulse',
        )}
        aria-label={assistantOpen ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={assistantOpen}
      >
        <span className="text-xl font-bold" aria-hidden>
          ✦
        </span>
      </button>
    </>
  )
}
