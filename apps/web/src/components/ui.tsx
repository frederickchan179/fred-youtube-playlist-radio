import type { CSSProperties, ReactNode } from 'react'
import type { Track } from '@radio/shared'

/** Shared surface — every theme uses this panel chrome */
export const Panel = ({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) => (
  <div
    className={className}
    style={{
      borderRadius: 'var(--radius-box)',
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      backdropFilter: 'blur(22px) saturate(1.2)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
      ...style,
    }}
  >
    {children}
  </div>
)

/** Mono eyebrow used for every section title across themes */
export const SectionLabel = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <p
    className={`text-[0.65rem] uppercase text-[var(--muted)] ${className}`}
    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
  >
    {children}
  </p>
)

/** Header / modal control chrome — theme selector & Import share this */
export const ControlChip = ({
  children,
  onClick,
  active = false,
  ariaExpanded,
  ariaHaspopup,
  ariaLabel,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  ariaExpanded?: boolean
  ariaHaspopup?: 'listbox' | 'dialog' | 'menu' | boolean
  ariaLabel?: string
  title?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    aria-haspopup={ariaHaspopup}
    className="inline-flex h-10 items-center gap-2 px-3.5 text-[0.68rem] uppercase transition-colors"
    style={{
      borderRadius: 'var(--radius)',
      border: '1px solid var(--line)',
      background: active
        ? 'color-mix(in oklab, var(--accent) 12%, var(--panel))'
        : 'color-mix(in oklab, var(--panel) 80%, transparent)',
      color: active ? 'var(--ink)' : 'var(--muted)',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.14em',
      backdropFilter: 'blur(14px)',
    }}
  >
    {children}
  </button>
)

export const CoverArt = ({
  cover,
  spinning,
  playing,
  sizeClass,
}: {
  cover: string | null
  spinning?: boolean
  playing: boolean
  sizeClass: string
}) => (
  <div
    className={`relative overflow-hidden ${sizeClass}`}
    style={{
      borderRadius: 'var(--cover-radius)',
      boxShadow: '0 25px 80px rgba(0,0,0,0.45), 0 0 0 1px var(--line)',
    }}
  >
    {cover ? (
      <img
        src={cover}
        alt=""
        className={`h-full w-full object-cover ${spinning ? 'cover-spinning' : ''}`}
        data-paused={spinning ? String(!playing) : undefined}
      />
    ) : (
      <div className="grid h-full w-full place-items-center bg-[var(--bg-2)] text-[var(--muted)]">
        <span
          className="text-xs uppercase"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.25em' }}
        >
          No art
        </span>
      </div>
    )}
    {spinning ? (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'var(--bg-0)',
          boxShadow: 'inset 0 0 0 1px var(--line)',
        }}
      />
    ) : null}
  </div>
)

type TrackListProps = {
  tracks: Track[]
  currentId: string | null
  onPlayTrack: (index: number) => void
  canEditTracks?: boolean
  onRemoveVideo?: (videoId: string) => Promise<void>
  className?: string
  variant?: 'rail' | 'setlist' | 'matrix' | 'table'
}

/** Unified track rows — themes only pick a variant, not reinvent markup */
export const TrackList = ({
  tracks,
  currentId,
  onPlayTrack,
  canEditTracks = false,
  onRemoveVideo,
  className = '',
  variant = 'rail',
}: TrackListProps) => {
  if (variant === 'matrix') {
    return (
      <div className={`grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {tracks.map((track, index) => {
          const active = track.videoId === currentId
          return (
            <button
              key={track.videoId}
              type="button"
              onClick={() => onPlayTrack(index)}
              className="bg-[var(--bg-0)] px-4 py-4 text-left transition-colors hover:bg-[var(--bg-1)]"
              style={{
                background: active
                  ? 'color-mix(in oklab, var(--accent) 12%, var(--bg-0))'
                  : undefined,
              }}
            >
              <span
                className="block text-[0.65rem] tabular-nums text-[var(--muted)]"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}
              >
                {String(index + 1).padStart(3, '0')}
              </span>
              <span
                className="mt-2 line-clamp-2 text-sm font-semibold uppercase leading-snug tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {track.title}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'setlist') {
    return (
      <div className={`rail-scroll ${className}`}>
        {tracks.map((track, index) => {
          const active = track.videoId === currentId
          return (
            <div
              key={track.videoId}
              className="group flex items-baseline gap-3 border-b border-[var(--line)]"
            >
              <button
                type="button"
                onClick={() => onPlayTrack(index)}
                className="flex min-w-0 flex-1 items-baseline gap-4 py-3 text-left"
                style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
              >
                <span
                  className="w-8 shrink-0 text-lg italic"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: active ? 'var(--accent)' : undefined,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className="line-clamp-1 text-base italic"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {track.title}
                </span>
              </button>
              {canEditTracks && onRemoveVideo ? (
                <RemoveButton
                  title={track.title}
                  onClick={() => void onRemoveVideo(track.videoId)}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }

  // default rail
  return (
    <div className={`rail-scroll flex flex-col ${className}`}>
      {tracks.map((track, index) => {
        const active = track.videoId === currentId
        return (
          <div
            key={track.videoId}
            className="group flex items-start gap-2 border-b py-2.5"
            style={{
              borderColor: 'color-mix(in oklab, var(--line) 70%, transparent)',
              color: active ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            <button
              type="button"
              onClick={() => onPlayTrack(index)}
              className="grid min-w-0 flex-1 grid-cols-[2rem_1fr] items-start gap-2 text-left"
            >
              <span
                className="pt-0.5 text-[0.65rem] tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: active ? 'var(--accent)' : undefined,
                }}
              >
                {active ? '▶' : String(index + 1).padStart(2, '0')}
              </span>
              <span
                className="line-clamp-2 text-sm leading-snug"
                style={{
                  fontFamily: active ? 'var(--font-display)' : 'var(--font-body)',
                  fontStyle: active ? 'italic' : undefined,
                }}
              >
                {track.title}
              </span>
            </button>
            {canEditTracks && onRemoveVideo ? (
              <RemoveButton
                title={track.title}
                onClick={() => void onRemoveVideo(track.videoId)}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

const RemoveButton = ({
  title,
  onClick,
}: {
  title: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 pt-0.5 text-[0.65rem] uppercase opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
    style={{
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.12em',
      color: 'var(--accent-2)',
    }}
    aria-label={`Remove ${title}`}
    title="Remove from Saved videos"
  >
    Remove
  </button>
)
