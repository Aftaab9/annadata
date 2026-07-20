/** Soft field backdrop — CSS only. No WebGL (the old mesh looked broken). */
export function FieldBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
      <div className="aurora-field opacity-80">
        <div className="aurora-blob aurora-blob-a" />
        <div className="aurora-blob aurora-blob-b" />
        <div className="aurora-blob aurora-blob-c" />
      </div>
      {/* Soft horizon band — readable, calm */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] opacity-40"
        style={{
          background:
            'linear-gradient(to top, oklch(0.35 0.06 145 / 0.5), transparent)',
        }}
      />
      <div
        className="absolute -right-16 top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: 'oklch(0.7 0.12 175 / 0.35)' }}
      />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/40 via-transparent to-[var(--bg)]" />
    </div>
  )
}
