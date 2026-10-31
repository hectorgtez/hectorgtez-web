import { useLayoutEffect, useState } from 'react'
import { MAIN_ID, NAV_SECTIONS } from '../data/navigation.ts'
import {
  buildDocumentTitle,
  getSectionLabel,
  selectActiveSection,
} from '../lib/navigation.ts'
import type { SectionPosition } from '../lib/navigation.ts'

/** Tamaño de la raíz si el navegador no da un valor utilizable. */
const FALLBACK_REM = 16

/**
 * Adaptador DOM del scrollspy: mide O (alto real de la barra + 1 rem), las
 * posiciones de las secciones y los altos del documento y la ventana; escucha
 * el desplazamiento con un único `rAF` y actualiza el estado y el título solo
 * cuando cambia el identificador activo. El cálculo vive en `selectActiveSection`.
 */
export function useActiveSection(): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>('header')
    const main = document.getElementById(MAIN_ID)

    let frame = 0
    let anchorOffset = 0
    let positions: SectionPosition[] = []
    let documentHeight = 0
    let viewportHeight = 0
    // El estado arranca en `null` (tope): comparar con ese valor evita un
    // render sin cambio en la primera medición. Si la carga ya está desplazada
    // (fragmento o restauración), el primer cálculo sí fija estado y título.
    let lastId: string | null = null

    const measureAnchorOffset = () => {
      const rem = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      anchorOffset =
        (header?.getBoundingClientRect().height ?? 0) +
        (Number.isFinite(rem) ? rem : FALLBACK_REM)
      document.documentElement.style.setProperty(
        '--anchor-offset',
        `${anchorOffset}px`,
      )
    }

    const measureSections = () => {
      positions = NAV_SECTIONS.flatMap(({ id }) => {
        const section = document.getElementById(id)
        if (!section) return []
        return [
          {
            id,
            top: section.getBoundingClientRect().top + window.scrollY,
          },
        ]
      })
      documentHeight = document.documentElement.scrollHeight
      viewportHeight = window.innerHeight
    }

    const update = () => {
      const id = selectActiveSection(
        window.scrollY,
        positions,
        anchorOffset,
        documentHeight,
        viewportHeight,
      )

      if (id === lastId) return

      lastId = id
      setActiveId(id)
      document.title = buildDocumentTitle(getSectionLabel(id))
    }

    const tick = () => {
      frame = 0
      update()
    }

    const schedule = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(tick)
    }

    // Medición y escritura en el mismo rendering update: carga, resize, zoom
    // de texto o cambio de tamaño del contenido.
    const sync = () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }

      measureAnchorOffset()
      measureSections()
      update()
    }

    const observer = new ResizeObserver(sync)
    if (header) observer.observe(header)
    if (main) observer.observe(main)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', sync)
    window.addEventListener('hashchange', schedule)
    window.addEventListener('popstate', schedule)
    window.addEventListener('pageshow', schedule)

    // Primera medición antes del primer pintado (carga con fragmento incluida).
    sync()

    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }

      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', sync)
      window.removeEventListener('hashchange', schedule)
      window.removeEventListener('popstate', schedule)
      window.removeEventListener('pageshow', schedule)
      observer.disconnect()
      document.documentElement.style.removeProperty('--anchor-offset')
    }
  }, [])

  return activeId
}
