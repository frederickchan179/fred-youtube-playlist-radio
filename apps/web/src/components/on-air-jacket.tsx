import { ON_AIR_PLAYLIST_ID, ON_AIR_PLAYLIST_TITLE } from '@radio/shared'

type Props = {
  active: boolean
  sleeveOpen: boolean
  cutCount: number
  onSelect: (playlistId: string, jacket: HTMLElement) => void
}

export const OnAirJacket = ({
  active,
  sleeveOpen,
  cutCount,
  onSelect,
}: Props) => {
  const cuts = cutCount === 1 ? '1 cut' : `${cutCount} cuts`
  const meta = active
    ? sleeveOpen
      ? 'Inside the sleeve'
      : 'Open sleeve'
    : cutCount === 0
      ? 'The station'
      : cuts

  return (
    <div className="pressing-slot">
      <button
        type="button"
        className="pressing pressing-special pressing-on-air"
        data-active={active ? 'true' : 'false'}
        data-on-platter={active ? 'true' : 'false'}
        aria-pressed={active}
        aria-expanded={active && sleeveOpen}
        aria-label={`${ON_AIR_PLAYLIST_TITLE}, ${meta}`}
        onClick={(event) => onSelect(ON_AIR_PLAYLIST_ID, event.currentTarget)}
      >
        <span className="pressing-vinyl" aria-hidden />
        <span className="pressing-jacket">
          <span className="pressing-seal" aria-hidden />
          <span className="pressing-board" aria-hidden />
          <span className="pressing-spine-title">{ON_AIR_PLAYLIST_TITLE}</span>
          <span className="pressing-sticker">
            <span className="pressing-title">{ON_AIR_PLAYLIST_TITLE}</span>
            <span className="pressing-meta">{meta}</span>
          </span>
        </span>
      </button>
    </div>
  )
}
