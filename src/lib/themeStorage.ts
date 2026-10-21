import { parseStoredTheme, serializeTheme, THEME_STORAGE_KEY } from './theme.ts'
import type { Theme } from './theme.ts'

export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readStoredTheme(
  storage: ThemeStorage | null | undefined,
): Theme | null {
  if (!storage) return null
  try {
    return parseStoredTheme(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeStoredTheme(
  storage: ThemeStorage | null | undefined,
  theme: Theme,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(THEME_STORAGE_KEY, serializeTheme(theme))
    return true
  } catch {
    return false
  }
}
