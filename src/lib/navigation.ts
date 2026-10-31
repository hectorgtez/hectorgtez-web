import { NAV_SECTIONS } from '../data/navigation.ts'

export type SectionPosition = {
  readonly id: string
  readonly top: number
}

export const SITE_AUTHOR = 'Héctor Gutiérrez'
export const SITE_ROLE = 'Ingeniero de Software'
export const BASE_DOCUMENT_TITLE = `${SITE_AUTHOR} | ${SITE_ROLE}`

/** Tolerancia de la línea de referencia, en píxeles (absorbe el redondeo subpíxel). */
const REFERENCE_TOLERANCE = 1
/** Tolerancia para considerar que se ha llegado al final del documento. */
const FINAL_TOLERANCE = 1

/**
 * Sección activa según la regla única de RF-6. Función pura: sin DOM, sin
 * estado global y sin tiempo implícito.
 */
export function selectActiveSection(
  scrollY: number,
  sections: readonly SectionPosition[],
  anchorOffset: number,
  documentHeight: number,
  viewportHeight: number,
): string | null {
  if (sections.length === 0) return null
  if (
    !Number.isFinite(scrollY) ||
    !Number.isFinite(anchorOffset) ||
    !Number.isFinite(documentHeight) ||
    !Number.isFinite(viewportHeight)
  ) {
    return null
  }

  // Sin recorrido el tope gana, incluso cuando una sección está a la vista.
  if (documentHeight <= viewportHeight) return null

  const y = Math.max(0, scrollY)

  if (y + viewportHeight >= documentHeight - FINAL_TOLERANCE) {
    return sections[sections.length - 1].id
  }

  const reference = y + anchorOffset + REFERENCE_TOLERANCE
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    if (sections[index].top <= reference) return sections[index].id
  }

  return null
}

export function buildDocumentTitle(activeLabel: string | null): string {
  return activeLabel === null
    ? BASE_DOCUMENT_TITLE
    : `${SITE_AUTHOR} | ${activeLabel}`
}

export function getSectionLabel(id: string | null): string | null {
  if (id === null) return null
  return NAV_SECTIONS.find((section) => section.id === id)?.label ?? null
}

export function getFooterYear(hoy: Date): number {
  return hoy.getFullYear()
}

export type PanelEvent =
  | 'toggle'
  | 'select'
  | 'escape'
  | 'outside'
  | 'pageScroll'
  | 'breakpoint'

export type PanelState = {
  readonly open: boolean
  readonly returnFocus: boolean
}

/** Los seis resultados admitidos de RNF-7, para ambos estados del panel. */
export function nextPanelState(open: boolean, event: PanelEvent): PanelState {
  switch (event) {
    case 'toggle':
      return { open: !open, returnFocus: false }
    case 'escape':
      return { open: false, returnFocus: true }
    case 'select':
    case 'outside':
    case 'pageScroll':
    case 'breakpoint':
      return { open: false, returnFocus: false }
    default: {
      const eventoNoAdmitido: never = event
      return eventoNoAdmitido
    }
  }
}
