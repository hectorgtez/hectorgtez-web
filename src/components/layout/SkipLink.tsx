import type { MouseEvent } from 'react'
import { MAIN_ID } from '../../data/navigation.ts'
import { isPlainClick } from '../../lib/focusHeading.ts'

/**
 * Primer elemento enfocable del documento. Oculto y fuera del flujo hasta
 * recibir foco; al activarlo, el foco pasa al contenido principal sin mover la
 * posición de scroll. Con modificadores se conserva el comportamiento nativo.
 */
export function SkipLink() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return

    event.preventDefault()
    document.getElementById(MAIN_ID)?.focus({ preventScroll: true })
  }

  return (
    <a href={`#${MAIN_ID}`} onClick={handleClick} className="skip-link focus-ring">
      Saltar al contenido
    </a>
  )
}
