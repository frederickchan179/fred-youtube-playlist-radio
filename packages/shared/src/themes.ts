export type ThemeId =
  | 'nocturne'
  | 'cassette'
  | 'voltage'
  | 'ember'
  | 'harbor'
  | 'oxide'
  | 'manuscript'
  | 'scholar'

/** Each theme owns a unique layout — never reuse across genres */
export type LayoutMode =
  | 'orbit'
  | 'stack'
  | 'grid'
  | 'lounge'
  | 'folio'
  | 'slab'
  | 'reader'
  | 'seminar'

/** Each theme owns a unique visualizer */
export type VisualizerMode =
  | 'waves'
  | 'bars'
  | 'rings'
  | 'ribbons'
  | 'pulse'
  | 'spikes'
  | 'softline'
  | 'meter'

export type ThemeDefinition = {
  id: ThemeId
  label: string
  genre: string
  tagline: string
  headline: string
  layout: LayoutMode
  visualizer: VisualizerMode
  fontDisplay: string
  fontBody: string
  fontMono: string
  cssVars: Record<string, string>
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  nocturne: {
    id: 'nocturne',
    label: 'Nocturne',
    genre: 'Ambient',
    tagline: 'Drifting pads & night air',
    headline: 'On air',
    layout: 'orbit',
    visualizer: 'waves',
    fontDisplay: '"Instrument Serif", "Times New Roman", serif',
    fontBody: '"Figtree", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#04060a',
      '--bg-1': '#0a1018',
      '--bg-2': '#121c28',
      '--ink': '#f2f5f8',
      '--muted': '#7d8b9c',
      '--accent': '#5eead4',
      '--accent-2': '#93c5fd',
      '--glow': 'rgba(94, 234, 212, 0.22)',
      '--panel': 'rgba(12, 20, 32, 0.78)',
      '--line': 'rgba(242, 245, 248, 0.14)',
      '--viz-a': '#5eead4',
      '--viz-b': '#93c5fd',
      '--radius': '999px',
      '--radius-box': '1.75rem',
      '--ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
      '--cover-radius': '50%',
      '--track-weight': '400',
      '--letter-brand': '0.42em',
    },
  },
  cassette: {
    id: 'cassette',
    label: 'Cassette',
    genre: 'Lo-fi',
    tagline: 'Tape hiss & study beats',
    headline: 'Evening set',
    layout: 'stack',
    visualizer: 'bars',
    fontDisplay: '"Bodoni Moda", "Didot", serif',
    fontBody: '"Karla", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#120e0c',
      '--bg-1': '#1c1612',
      '--bg-2': '#2a211b',
      '--ink': '#f7efe4',
      '--muted': '#a8927c',
      '--accent': '#f0b27a',
      '--accent-2': '#e8a0a0',
      '--glow': 'rgba(240, 178, 122, 0.2)',
      '--panel': 'rgba(36, 28, 22, 0.8)',
      '--line': 'rgba(247, 239, 228, 0.14)',
      '--viz-a': '#f0b27a',
      '--viz-b': '#e8a0a0',
      '--radius': '1.25rem',
      '--radius-box': '1.25rem',
      '--ease': 'cubic-bezier(0.33, 1, 0.68, 1)',
      '--cover-radius': '1.1rem',
      '--track-weight': '500',
      '--letter-brand': '0.28em',
    },
  },
  voltage: {
    id: 'voltage',
    label: 'Voltage',
    genre: 'Techno',
    tagline: 'Four-on-the-floor pulse',
    headline: 'SIGNAL',
    layout: 'grid',
    visualizer: 'rings',
    fontDisplay: '"Syne", system-ui, sans-serif',
    fontBody: '"Syne", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#020202',
      '--bg-1': '#080808',
      '--bg-2': '#111111',
      '--ink': '#fafafa',
      '--muted': '#737373',
      '--accent': '#b8ff3c',
      '--accent-2': '#ff4d6d',
      '--glow': 'rgba(184, 255, 60, 0.18)',
      '--panel': 'rgba(0, 0, 0, 0.72)',
      '--line': 'rgba(250, 250, 250, 0.12)',
      '--viz-a': '#b8ff3c',
      '--viz-b': '#ff4d6d',
      '--radius': '0px',
      '--radius-box': '0px',
      '--ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      '--cover-radius': '0px',
      '--track-weight': '700',
      '--letter-brand': '0.18em',
    },
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    genre: 'Jazz',
    tagline: 'Smoke, brass & after hours',
    headline: 'Late set',
    layout: 'lounge',
    visualizer: 'ribbons',
    fontDisplay: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Figtree", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#140608',
      '--bg-1': '#1f0b10',
      '--bg-2': '#2c1018',
      '--ink': '#ffe8e4',
      '--muted': '#c08b8a',
      '--accent': '#ff6b4a',
      '--accent-2': '#ffb454',
      '--glow': 'rgba(255, 107, 74, 0.22)',
      '--panel': 'rgba(32, 12, 16, 0.82)',
      '--line': 'rgba(255, 232, 228, 0.12)',
      '--viz-a': '#ff6b4a',
      '--viz-b': '#ffb454',
      '--radius': '1.5rem',
      '--radius-box': '1.5rem',
      '--ease': 'cubic-bezier(0.25, 1, 0.5, 1)',
      '--cover-radius': '0.75rem',
      '--track-weight': '600',
      '--letter-brand': '0.32em',
    },
  },
  harbor: {
    id: 'harbor',
    label: 'Harbor',
    genre: 'Indie',
    tagline: 'Fog, guitars & diary notes',
    headline: 'Harbor',
    layout: 'folio',
    visualizer: 'pulse',
    fontDisplay: '"Newsreader", Georgia, serif',
    fontBody: '"Figtree", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#061018',
      '--bg-1': '#0c1a24',
      '--bg-2': '#132833',
      '--ink': '#e7f2f4',
      '--muted': '#7f9aa3',
      '--accent': '#7dd3c7',
      '--accent-2': '#6eb5ff',
      '--glow': 'rgba(125, 211, 199, 0.2)',
      '--panel': 'rgba(10, 24, 34, 0.8)',
      '--line': 'rgba(231, 242, 244, 0.12)',
      '--viz-a': '#7dd3c7',
      '--viz-b': '#6eb5ff',
      '--radius': '999px',
      '--radius-box': '2rem',
      '--ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
      '--cover-radius': '1.25rem',
      '--track-weight': '500',
      '--letter-brand': '0.38em',
    },
  },
  oxide: {
    id: 'oxide',
    label: 'Oxide',
    genre: 'Industrial',
    tagline: 'Rust, noise & hard edges',
    headline: 'OXIDE',
    layout: 'slab',
    visualizer: 'spikes',
    fontDisplay: '"Archivo Black", system-ui, sans-serif',
    fontBody: '"Archivo", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#0c0b0a',
      '--bg-1': '#161311',
      '--bg-2': '#221c18',
      '--ink': '#f4efe8',
      '--muted': '#9a8b7c',
      '--accent': '#d97757',
      '--accent-2': '#c4c0b8',
      '--glow': 'rgba(217, 119, 87, 0.2)',
      '--panel': 'rgba(18, 15, 13, 0.88)',
      '--line': 'rgba(244, 239, 232, 0.14)',
      '--viz-a': '#d97757',
      '--viz-b': '#c4c0b8',
      '--radius': '2px',
      '--radius-box': '2px',
      '--ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      '--cover-radius': '2px',
      '--track-weight': '400',
      '--letter-brand': '0.2em',
    },
  },
  manuscript: {
    id: 'manuscript',
    label: 'Manuscript',
    genre: 'Audiobook',
    tagline: 'Chapters, voice & quiet pages',
    headline: 'Chapter',
    layout: 'reader',
    visualizer: 'softline',
    fontDisplay: '"Literata", Georgia, serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#12100e',
      '--bg-1': '#1b1814',
      '--bg-2': '#26211b',
      '--ink': '#f0e6d6',
      '--muted': '#9e9180',
      '--accent': '#c4a574',
      '--accent-2': '#8fa8a0',
      '--glow': 'rgba(196, 165, 116, 0.18)',
      '--panel': 'rgba(28, 24, 20, 0.86)',
      '--line': 'rgba(240, 230, 214, 0.12)',
      '--viz-a': '#c4a574',
      '--viz-b': '#8fa8a0',
      '--radius': '0.35rem',
      '--radius-box': '0.5rem',
      '--ease': 'cubic-bezier(0.25, 1, 0.5, 1)',
      '--cover-radius': '0.35rem',
      '--track-weight': '500',
      '--letter-brand': '0.34em',
    },
  },
  scholar: {
    id: 'scholar',
    label: 'Scholar',
    genre: 'Knowledge',
    tagline: 'Lectures, ideas & deep focus',
    headline: 'Focus',
    layout: 'seminar',
    visualizer: 'meter',
    fontDisplay: '"Source Serif 4", Georgia, serif',
    fontBody: '"IBM Plex Sans", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    cssVars: {
      '--bg-0': '#0b1014',
      '--bg-1': '#121920',
      '--bg-2': '#1a2430',
      '--ink': '#e8eef3',
      '--muted': '#8494a3',
      '--accent': '#6bb3a8',
      '--accent-2': '#e2c36b',
      '--glow': 'rgba(107, 179, 168, 0.18)',
      '--panel': 'rgba(16, 24, 32, 0.88)',
      '--line': 'rgba(232, 238, 243, 0.12)',
      '--viz-a': '#6bb3a8',
      '--viz-b': '#e2c36b',
      '--radius': '0.5rem',
      '--radius-box': '0.75rem',
      '--ease': 'cubic-bezier(0.2, 0.9, 0.2, 1)',
      '--cover-radius': '0.5rem',
      '--track-weight': '600',
      '--letter-brand': '0.26em',
    },
  },
}

export const THEME_LIST = Object.values(THEMES)

export const DEFAULT_THEME_ID: ThemeId = 'nocturne'

export const isThemeId = (value: string): value is ThemeId =>
  value in THEMES
