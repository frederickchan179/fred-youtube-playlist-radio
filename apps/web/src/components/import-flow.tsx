type Props = {
  open?: boolean
  onOpen: () => void
}

export const ImportFlow = ({ open = false, onOpen }: Props) => (
  <div className="pressing-slot">
    <button
      type="button"
      className="pressing pressing-acquire"
      onClick={onOpen}
      aria-expanded={open}
      aria-label="Acquire a pressing from YouTube"
    >
      <span className="pressing-jacket">
        <span className="pressing-seal" aria-hidden />
        <span className="pressing-board" aria-hidden />
        <span className="pressing-sticker">
          <span className="pressing-title">Acquire</span>
          <span className="pressing-meta">
            {open ? 'Inside the sleeve' : 'Special order'}
          </span>
        </span>
      </span>
    </button>
  </div>
)
