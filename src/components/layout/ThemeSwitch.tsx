type ThemeSwitchProps = {
  isDark: boolean
  onToggle: () => void
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function ThemeSwitch({ isDark, onToggle }: ThemeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Modo oscuro"
      onClick={onToggle}
      className="group relative inline-flex h-11 w-[4.5rem] shrink-0 items-center rounded-full bg-action p-1 transition-colors duration-200 hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none"
    >
      <span
        className={`flex size-9 items-center justify-center rounded-full bg-page text-action transition-transform duration-200 motion-reduce:transition-none ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}
