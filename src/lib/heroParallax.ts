export type HeroMetrics = {
  scrollY: number
  heroTop: number
  H: number
  textBlockHeight: number
}

export type HeroOffsets = {
  background: number
  text: number
}

/** Fracción del alto del hero que recorre el fondo en p = 1. */
export const HERO_BG_FACTOR = 0.13
/** Tope absoluto del desplazamiento del fondo, como fracción de H. */
export const HERO_BG_MAX_FACTOR = 0.15
/** Fracción del alto del hero que recorre el texto en p = 1 (2,5× el fondo). */
export const HERO_TEXT_FACTOR = 0.325
/** Distancia mínima, en píxeles, entre el bloque de texto y el borde superior. */
export const HERO_TEXT_SAFE_MARGIN = 16

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Progreso del recorrido: 0 al abrir la página y 1 cuando el borde inferior
 * del hero alcanza el borde superior de la ventana.
 */
export function heroProgress(
  scrollY: number,
  heroTop: number,
  H: number,
): number {
  const travel = heroTop + H
  if (travel <= 0) return 0
  return clamp(scrollY / travel, 0, 1)
}

/**
 * Máximo que puede subir el bloque de texto sin acercarse a menos de
 * HERO_TEXT_SAFE_MARGIN del borde superior del hero.
 */
export function textFreeSpace(H: number, textBlockHeight: number): number {
  if (H <= 0 || textBlockHeight <= 0 || textBlockHeight >= H) return 0
  return Math.max(0, (H - textBlockHeight) / 2 - HERO_TEXT_SAFE_MARGIN)
}

/**
 * Desplazamientos de parallax en píxeles: fondo positivo (hacia abajo) y
 * texto negativo (hacia arriba). Función pura, sin DOM ni estado.
 */
export function computeHeroOffsets(
  metrics: HeroMetrics,
  reducedMotion: boolean,
): HeroOffsets {
  const { scrollY, heroTop, H, textBlockHeight } = metrics

  if (
    reducedMotion ||
    H <= 0 ||
    !Number.isFinite(scrollY) ||
    !Number.isFinite(heroTop) ||
    !Number.isFinite(H) ||
    !Number.isFinite(textBlockHeight)
  ) {
    return { background: 0, text: 0 }
  }

  const p = heroProgress(scrollY, heroTop, H)
  const background = Math.min(HERO_BG_FACTOR * H * p, HERO_BG_MAX_FACTOR * H)
  const textShift = Math.min(
    HERO_TEXT_FACTOR * H * p,
    textFreeSpace(H, textBlockHeight),
  )

  return { background, text: textShift === 0 ? 0 : -textShift }
}
