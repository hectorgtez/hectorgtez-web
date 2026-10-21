export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'hectorgtez-theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function parseStoredTheme(raw: string | null | undefined): Theme | null {
  return isTheme(raw) ? raw : null
}

export function serializeTheme(theme: Theme): string {
  return theme
}

export function systemThemeFrom(
  matchesDark: boolean | null | undefined,
): Theme | null {
  if (matchesDark === true) return 'dark'
  if (matchesDark === false) return 'light'
  return null
}

export function resolveTheme(
  stored: Theme | null,
  system: Theme | null,
): Theme {
  return stored ?? system ?? 'dark'
}

export function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}
