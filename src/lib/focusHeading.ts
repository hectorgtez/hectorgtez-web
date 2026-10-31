import { HERO_ID } from '../data/navigation.ts'

/** Campos del evento de puntero que deciden si el foco debe trasladarse. */
type ClickModifiers = {
  readonly button: number
  readonly ctrlKey: boolean
  readonly metaKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
}

/**
 * Clic primario sin modificadores: el único caso en el que se mueve el foco.
 * Con Ctrl/Cmd/Mayús/Alt se deja el comportamiento nativo intacto.
 */
export function isPlainClick(event: ClickModifiers): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey
}

/**
 * Enfoca el encabezado del destino sin mover la posición de scroll: la marca
 * (`heroId`) lleva al `h1` del hero y cada enlace de sección a su `h2`.
 * Devuelve si encontró el encabezado.
 *
 * El foco se aplica en el siguiente frame porque el navegador ejecuta el
 * fragmento nativo después del `onClick` y, al no ser enfocable la sección,
 * devuelve el foco al documento: enfocar de forma síncrona (o en un microtask,
 * que en la activación por teclado todavía es anterior) se perdería. El frame
 * llega antes de que la página se pinte desplazada, así que `preventScroll`
 * sigue evitando un salto adicional.
 */
export function focusDestination(id: string, heroId: string = HERO_ID): boolean {
  const target = document.getElementById(id)
  if (!target) return false

  const heading = target.querySelector<HTMLElement>(id === heroId ? 'h1' : 'h2')
  if (!heading) return false

  requestAnimationFrame(() => {
    heading.focus({ preventScroll: true })
  })
  return true
}
