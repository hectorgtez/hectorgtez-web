import { isTheme, systemThemeFrom } from './theme.ts'
import type { Theme } from './theme.ts'
import type { ThemeStorage } from './themeStorage.ts'

export function getSafeStorage(): ThemeStorage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function readAppliedTheme(root?: HTMLElement): Theme {
  const target =
    root ?? (typeof document === 'undefined' ? null : document.documentElement)
  const applied = target?.dataset.theme
  return isTheme(applied) ? applied : 'dark'
}

export function applyTheme(theme: Theme, root?: HTMLElement): void {
  const target =
    root ?? (typeof document === 'undefined' ? null : document.documentElement)
  if (target) target.dataset.theme = theme
}

export function getSystemMedia(): MediaQueryList | null {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return null
    }
    return window.matchMedia('(prefers-color-scheme: dark)')
  } catch {
    return null
  }
}

export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const media = getSystemMedia()
  if (!media || typeof media.addEventListener !== 'function') return () => {}

  const handleChange = () => {
    const theme = systemThemeFrom(media.matches)
    if (theme) onChange(theme)
  }

  media.addEventListener('change', handleChange)
  return () => media.removeEventListener('change', handleChange)
}
