import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ImportForm } from './import-form'
import { SectionLabel } from './ui'

type Props = {
  onImported: (playlistId: string) => void
}

export const ImportFlow = ({ onImported }: Props) => {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div className="pressing-slot">
        <button
          type="button"
          className="pressing pressing-acquire"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Acquire a pressing from YouTube"
        >
          <span className="pressing-jacket">
            <span className="pressing-acquire-mark" aria-hidden>
              +
            </span>
            <span className="pressing-board" aria-hidden />
            <span className="pressing-sticker">
              <span className="pressing-title">Acquire</span>
              <span className="pressing-meta">Empty sleeve</span>
            </span>
          </span>
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {open ? (
            <div className="fixed inset-0 z-[80] grid place-items-end p-4 sm:place-items-center">
              <motion.button
                type="button"
                className="absolute inset-0 bg-black/60"
                aria-label="Close import"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />

              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="panel relative z-10 w-full max-w-lg p-6 md:p-7"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <SectionLabel>
                      <span id={titleId}>Acquire</span>
                    </SectionLabel>
                    <h2 className="mt-2 text-2xl font-medium leading-tight tracking-[-0.02em] md:text-3xl">
                      Bring a pressing in
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
                      Paste a YouTube playlist or video URL into the local library.
                    </p>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    className="hw-btn min-w-0 px-0"
                    style={{ width: '2.25rem', minWidth: '2.25rem', padding: 0 }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <ImportForm
                  onImported={(playlistId) => {
                    onImported(playlistId)
                    setOpen(false)
                  }}
                />
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
