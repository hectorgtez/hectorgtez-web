import type { MouseEvent } from 'react'
import { ThemeSwitch } from './ThemeSwitch.tsx'

type NavbarProps = {
  isDark: boolean
  onToggleTheme: () => void
}

export function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    window.scrollTo(0, 0)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface transition-colors duration-200 motion-reduce:transition-none">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href="/"
          onClick={handleBrandClick}
          className="min-w-0 truncate text-lg font-bold text-ink underline-offset-4 visited:text-ink hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:underline"
        >
          Héctor Gutiérrez
        </a>
        <div className="shrink-0">
          <ThemeSwitch isDark={isDark} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
