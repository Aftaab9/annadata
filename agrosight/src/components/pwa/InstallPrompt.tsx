import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'agrosight-pwa-dismiss'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    if (standalone || sessionStorage.getItem(DISMISS_KEY)) return

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  if (isStandalone || !visible) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up md:left-auto md:right-6"
      role="region"
      aria-label="Install app"
    >
      <div className="glass-strong flex items-start gap-3 p-4 shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo/20">
          <Download className="h-5 w-5 text-cyan" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text">Install AgroSight</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Add to your home screen for the phone demo — camera inspect works offline
            after first load.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-indigo px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-muted hover:text-text"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
