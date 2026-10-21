import { useCallback, useEffect, useState } from 'react'
import { getNextTheme } from '../lib/theme.ts'
import type { Theme } from '../lib/theme.ts'
import { readStoredTheme, writeStoredTheme } from '../lib/themeStorage.ts'
import {
  applyTheme,
  getSafeStorage,
  readAppliedTheme,
  watchSystemTheme,
} from '../lib/themeRuntime.ts'

type UseThemeResult = {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(() => readAppliedTheme())
  const [hasManualChoice, setHasManualChoice] = useState<boolean>(
    () => readStoredTheme(getSafeStorage()) !== null,
  )

  const toggleTheme = useCallback(() => {
    const next = getNextTheme(theme)
    applyTheme(next)
    setTheme(next)
    setHasManualChoice(true)
    writeStoredTheme(getSafeStorage(), next)
  }, [theme])

  useEffect(() => {
    if (hasManualChoice) return

    return watchSystemTheme((nextTheme) => {
      applyTheme(nextTheme)
      setTheme(nextTheme)
    })
  }, [hasManualChoice])

  return { theme, isDark: theme === 'dark', toggleTheme }
}
