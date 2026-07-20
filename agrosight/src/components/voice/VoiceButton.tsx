import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  getRecognitionLang,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  recordAndTranscribe,
  speak,
  stopSpeaking,
} from '@/lib/speech'
import type { Language } from '@/lib/constants'

interface VoiceButtonProps {
  language: Language
  onTranscript: (text: string) => void
  speakText?: string | null
  className?: string
}

export function VoiceButton({
  language,
  onTranscript,
  speakText,
  className,
}: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  const [voiceOut, setVoiceOut] = useState(true)
  const [busyWhisper, setBusyWhisper] = useState(false)
  const recRef = useRef<InstanceType<Window['webkitSpeechRecognition']> | null>(
    null,
  )

  const sttOk = isSpeechRecognitionSupported()
  const ttsOk = isSpeechSynthesisSupported()
  /** Hindi → prefer Whisper; English → browser STT first */
  const preferWhisper = language === 'hi' || !sttOk

  useEffect(() => {
    if (!speakText || !voiceOut || !ttsOk) return
    speak(speakText, language)
    return () => stopSpeaking()
  }, [speakText, voiceOut, language, ttsOk])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const startBrowserStt = useCallback(() => {
    if (!sttOk) return
    const SR =
      (window as Window & { SpeechRecognition?: typeof window.webkitSpeechRecognition })
        .SpeechRecognition ?? window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = getRecognitionLang(language)
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (ev: unknown) => {
      const event = ev as {
        results: { 0: { 0: { transcript: string } } }
      }
      const text = event.results[0]?.[0]?.transcript?.trim()
      if (text) onTranscript(text)
      setListening(false)
    }
    rec.onerror = () => {
      setListening(false)
      // Fall through to Whisper on browser STT failure
      void (async () => {
        try {
          setBusyWhisper(true)
          const text = await recordAndTranscribe(language, 4500)
          if (text) onTranscript(text)
        } catch (e) {
          console.warn('[Voice] Whisper fallback failed', e)
        } finally {
          setBusyWhisper(false)
        }
      })()
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [sttOk, language, onTranscript])

  const startWhisper = useCallback(async () => {
    setListening(true)
    setBusyWhisper(true)
    try {
      const text = await recordAndTranscribe(language, 4500)
      if (text) onTranscript(text)
    } catch (e) {
      console.warn('[Voice] Whisper failed', e)
    } finally {
      setBusyWhisper(false)
      setListening(false)
    }
  }, [language, onTranscript])

  const startListening = useCallback(() => {
    if (preferWhisper) void startWhisper()
    else startBrowserStt()
  }, [preferWhisper, startWhisper, startBrowserStt])

  useEffect(() => () => stopListening(), [stopListening])

  if (!sttOk && !ttsOk && !navigator.mediaDevices) return null

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {(sttOk || preferWhisper) && (
        <button
          type="button"
          disabled={busyWhisper}
          onClick={listening && !busyWhisper ? stopListening : startListening}
          className={cn(
            'rounded-lg p-2 transition',
            listening || busyWhisper
              ? 'bg-danger/20 text-danger'
              : 'text-muted hover:bg-[var(--surface-2)] hover:text-text',
          )}
          aria-label={
            busyWhisper
              ? 'Transcribing…'
              : listening
                ? 'Stop listening'
                : preferWhisper
                  ? 'Speak (Whisper Hindi)'
                  : 'Speak'
          }
          title={preferWhisper ? 'Groq Whisper STT' : 'Browser speech recognition'}
        >
          {listening || busyWhisper ? (
            <MicOff className="h-4 w-4" aria-hidden />
          ) : (
            <Mic className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
      {ttsOk && (
        <button
          type="button"
          onClick={() => {
            setVoiceOut((v) => !v)
            if (voiceOut) stopSpeaking()
          }}
          className="rounded-lg p-2 text-muted transition hover:bg-[var(--surface-2)] hover:text-text"
          aria-label={voiceOut ? 'Mute voice output' : 'Enable voice output'}
        >
          {voiceOut ? (
            <Volume2 className="h-4 w-4" aria-hidden />
          ) : (
            <VolumeX className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  )
}
