import { useCallback, useEffect, useRef, useState } from 'react'
import { NAV_SECTIONS } from '../../data/navigation.ts'
import { focusDestination, isPlainClick } from '../../lib/focusHeading.ts'
import { nextPanelState } from '../../lib/navigation.ts'
import type { PanelEvent } from '../../lib/navigation.ts'

type NavMenuProps = {
  readonly activeId: string | null
}

/** Punto de corte del menú: desde aquí los enlaces van en línea (lg). */
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const PANEL_ID = 'menu-panel'

const LINK_BASE_CLASS =
  'nav-link flex min-h-11 items-center whitespace-nowrap text-ink underline-offset-4 visited:text-ink hover:underline focus-ring'

const INLINE_LINK_CLASS = `${LINK_BASE_CLASS} px-2 text-sm`
const PANEL_LINK_CLASS = `${LINK_BASE_CLASS} rounded-md px-3 text-base`

const BUTTON_CLASS =
  'focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-ink-muted text-ink transition-colors duration-200 hover:bg-page motion-reduce:transition-none'

const PANEL_CLASS =
  'nav-panel absolute inset-x-0 top-full border-t border-line bg-surface shadow-[0_12px_24px_-12px_var(--color-line)]'

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

/**
 * Único conjunto de enlaces de sección. En escritorio van en línea; por debajo
 * de `lg` viven en un panel que solo se monta al abrirse, de modo que nunca
 * existen dos regiones ni enlaces ocultos enfocables.
 */
export function NavMenu({ activeId }: NavMenuProps) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true
    }
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  })
  const [open, setOpen] = useState(false)

  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const inlineNavRef = useRef<HTMLElement | null>(null)
  const restoreFocusRef = useRef(false)

  const applyPanel = useCallback(
    (event: PanelEvent) => {
      const next = nextPanelState(open, event)
      setOpen(next.open)
      if (next.returnFocus) {
        buttonRef.current?.focus({ preventScroll: true })
      }
    },
    [open],
  )

  // Paso a `lg`: cierra el panel y, si el foco estaba dentro, lo lleva al
  // primer enlace en línea para no dejarlo en un nodo desmontado.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const handleChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setIsDesktop(false)
        return
      }

      const focused = document.activeElement
      restoreFocusRef.current =
        panelRef.current !== null && focused !== null && panelRef.current.contains(focused)
      setIsDesktop(true)
      applyPanel('breakpoint')
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [applyPanel])

  useEffect(() => {
    if (!isDesktop || !restoreFocusRef.current) return
    restoreFocusRef.current = false
    inlineNavRef.current?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true })
  }, [isDesktop])

  // Escuchas del panel abierto: se retiran al cerrarlo.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') applyPanel('escape')
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (buttonRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      applyPanel('outside')
    }

    const handleScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && panelRef.current?.contains(target)) return
      applyPanel('pageScroll')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [open, applyPanel])

  const renderLinks = (variant: 'inline' | 'panel') =>
    NAV_SECTIONS.map((section) => (
      <a
        key={section.id}
        href={`#${section.id}`}
        aria-current={activeId === section.id ? 'true' : undefined}
        onClick={(event) => {
          // El encabezado de destino queda enfocado en el siguiente frame,
          // después de que el fragmento nativo y el cierre del panel terminen.
          if (isPlainClick(event)) focusDestination(section.id)
          if (variant === 'panel') applyPanel('select')
        }}
        className={variant === 'panel' ? PANEL_LINK_CLASS : INLINE_LINK_CLASS}
      >
        {section.label}
      </a>
    ))

  if (isDesktop) {
    return (
      <nav
        ref={inlineNavRef}
        aria-label="Secciones"
        className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1"
      >
        {renderLinks('inline')}
      </nav>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => applyPanel('toggle')}
        className={BUTTON_CLASS}
      >
        <span className="sr-only">Menú</span>
        <MenuIcon />
      </button>
      {/* Contenedor siempre montado para que `aria-controls` resuelva; los
          enlaces y la región «Secciones» solo existen con el panel abierto. */}
      <div id={PANEL_ID} ref={panelRef} className={open ? PANEL_CLASS : 'hidden'}>
        {open ? (
          <nav
            aria-label="Secciones"
            className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-2 sm:px-6"
          >
            {renderLinks('panel')}
          </nav>
        ) : null}
      </div>
    </div>
  )
}
