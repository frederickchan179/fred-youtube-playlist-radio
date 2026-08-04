import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { THEME_LIST } from '@radio/shared'
import { useTheme } from '../hooks/use-theme'
import { ControlChip } from './ui'

/** Compact theme selector — one control, not a sprawling link row */
export const ThemeSwitcher = () => {
  const { themeId, setThemeId, theme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <ControlChip
        onClick={() => setOpen((value) => !value)}
        active={open}
        ariaExpanded={open}
        ariaHaspopup="listbox"
        ariaLabel={`Theme: ${theme.label}`}
      >
        <span className="max-w-[9rem] truncate text-[var(--ink)]">{theme.label}</span>
        <span className="hidden text-[var(--accent)] sm:inline">{theme.genre}</span>
        <Chevron open={open} />
      </ControlChip>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={listId}
            role="listbox"
            aria-label="Themes"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(100vw-2rem,18rem)] overflow-hidden p-1.5"
            style={{
              borderRadius: 'var(--radius-box)',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              backdropFilter: 'blur(24px) saturate(1.2)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            {THEME_LIST.map((item) => {
              const active = item.id === themeId
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setThemeId(item.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{
                    borderRadius: 'calc(var(--radius-box) - 4px)',
                    background: active
                      ? 'color-mix(in oklab, var(--accent) 14%, transparent)'
                      : 'transparent',
                    color: active ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  <span
                    className="text-[0.72rem] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.14em',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-[0.65rem]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: active ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {item.genre}
                  </span>
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    aria-hidden
    className="opacity-70 transition-transform"
    style={{ transform: open ? 'rotate(180deg)' : undefined }}
  >
    <path
      d="M2 3.5 5 6.5 8 3.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
