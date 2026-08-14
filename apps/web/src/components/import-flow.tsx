import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ImportForm } from './import-form'
import { ControlChip, SectionLabel } from './ui'

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
      <ControlChip
        onClick={() => setOpen(true)}
        ariaHaspopup="dialog"
        ariaExpanded={open}
        ariaLabel="Acquire from YouTube"
      >
        Acquire
      </ControlChip>

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
              className="plinth relative z-10 w-full max-w-lg p-6 md:p-7"
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
                  className="grid h-9 w-9 shrink-0 place-items-center text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  style={{
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--line)',
                  }}
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
      </AnimatePresence>
    </>
  )
}
