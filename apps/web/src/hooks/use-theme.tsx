import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME_ID,
  THEMES,
  type ThemeDefinition,
  type ThemeId,
} from '@radio/shared'
import { readStoredTheme, storeTheme } from '../lib/api'

type ThemeContextValue = {
  themeId: ThemeId
  theme: ThemeDefinition
  setThemeId: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const applyCssVars = (theme: ThemeDefinition): void => {
  const root = document.documentElement
  root.dataset.theme = theme.id
  root.dataset.layout = theme.layout
  root.style.setProperty('--font-display', theme.fontDisplay)
  root.style.setProperty('--font-body', theme.fontBody)
  root.style.setProperty('--font-mono', theme.fontMono)
  for (const [key, value] of Object.entries(theme.cssVars)) {
    root.style.setProperty(key, value)
  }
}

const initialThemeId = (): ThemeId => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID
  return readStoredTheme() ?? DEFAULT_THEME_ID
}

// Apply once ASAP so first paint already has theme tokens
if (typeof document !== 'undefined') {
  applyCssVars(THEMES[initialThemeId()])
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(initialThemeId)
  const theme = THEMES[themeId]

  useLayoutEffect(() => {
    applyCssVars(theme)
    storeTheme(themeId)
  }, [theme, themeId])

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id)
  }, [])

  const value = useMemo(
    () => ({ themeId, theme, setThemeId }),
    [themeId, theme, setThemeId],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
