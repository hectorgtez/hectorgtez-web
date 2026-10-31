export type Box = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export type BrandFlightMetrics = {
  readonly scrollY: number
  /**
   * Desplazamiento del parallax del bloque de texto del hero (≤ 0). Es 0 con
   * movimiento reducido o medida inválida; si falta se trata como 0.
   */
  readonly heroShift?: number
  /** Texto del nombre en el hero, en coordenadas del documento. */
  readonly name: Box
  /** Texto del puesto en el hero, en coordenadas del documento. */
  readonly role: Box
  /** Marca provisional del hero, en coordenadas del documento. */
  readonly logo: Box
  /** Texto de la marca en la barra, en coordenadas de la ventana. */
  readonly brandName: Box
  /** Hueco de la marca en la barra, en coordenadas de la ventana. */
  readonly brandLogo: Box
  readonly nameFontSize: number
  readonly brandFontSize: number
}

export type BrandFlightTransform = {
  /** Esquina superior izquierda de la copia ya escalada, en la ventana. */
  readonly x: number
  readonly y: number
  readonly scale: number
}

export type BrandFlightState = {
  /** s sin recorte superior. */
  readonly progress: number
  readonly name: BrandFlightTransform
  readonly logo: BrandFlightTransform
  readonly copyOpacity: number
  readonly heroOpacity: number
  readonly brandOpacity: number
  /** Copia decorativa del puesto: sigue al nombre durante el vuelo (RF-16). */
  readonly role: BrandFlightTransform
  /** Opacidad de la copia del puesto: se desvanece antes de la barra (RF-16). */
  readonly roleOpacity: number
  readonly docked: boolean
}

/** Fin del relevo de entrada, como fracción de s. */
export const BRAND_FLIGHT_ENTER_END = 0.02
/** Duración del relevo final, como fracción de s. */
export const BRAND_FLIGHT_HANDOFF_FRACTION = 0.04
/** Progreso en el que el puesto ya no se ve (RF-16). */
export const BRAND_FLIGHT_ROLE_FADE_END = 0.8

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function center(box: Box): { x: number; y: number } {
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

function isFiniteBox(box: Box): boolean {
  return (
    Number.isFinite(box.left) &&
    Number.isFinite(box.top) &&
    Number.isFinite(box.width) &&
    Number.isFinite(box.height)
  )
}

function isPositiveBox(box: Box): boolean {
  return box.width > 0 && box.height > 0
}

function hasValidMeasurement(metrics: BrandFlightMetrics): boolean {
  return (
    Number.isFinite(metrics.scrollY) &&
    Number.isFinite(metrics.heroShift ?? 0) &&
    isFiniteBox(metrics.name) &&
    isFiniteBox(metrics.role) &&
    isFiniteBox(metrics.logo) &&
    isFiniteBox(metrics.brandName) &&
    isFiniteBox(metrics.brandLogo) &&
    Number.isFinite(metrics.nameFontSize) &&
    Number.isFinite(metrics.brandFontSize) &&
    isPositiveBox(metrics.name) &&
    isPositiveBox(metrics.role) &&
    isPositiveBox(metrics.logo) &&
    isPositiveBox(metrics.brandName) &&
    isPositiveBox(metrics.brandLogo) &&
    metrics.nameFontSize > 0 &&
    metrics.brandFontSize > 0
  )
}

function originCopy(box: Box, scrollY: number): BrandFlightTransform {
  return { x: box.left, y: box.top - scrollY, scale: 1 }
}

/** Composición sin vuelo por degradación: originales y barra visibles. */
function noFlightState(metrics: BrandFlightMetrics): BrandFlightState {
  return {
    progress: 0,
    name: originCopy(metrics.name, metrics.scrollY),
    logo: originCopy(metrics.logo, metrics.scrollY),
    role: originCopy(metrics.role, metrics.scrollY),
    copyOpacity: 0,
    heroOpacity: 1,
    brandOpacity: 1,
    roleOpacity: 0,
    docked: false,
  }
}

/**
 * Estado del vuelo de la marca para una medida y un scroll dados.
 * Función pura y determinista: sin DOM, sin tiempo y sin estado.
 */
export function computeBrandFlight(
  metrics: BrandFlightMetrics,
  reducedMotion: boolean,
): BrandFlightState {
  if (!hasValidMeasurement(metrics)) return noFlightState(metrics)

  const scroll = Math.max(0, metrics.scrollY)
  const scale = metrics.brandFontSize / metrics.nameFontSize
  const targetTop =
    metrics.brandName.top +
    metrics.brandName.height / 2 -
    (metrics.name.height * scale) / 2
  const distance = metrics.name.top - targetTop

  if (!(distance > 0)) return noFlightState(metrics)

  // Con movimiento reducido el parallax se fuerza a 0 (RF-9).
  const heroShift = reducedMotion ? 0 : (metrics.heroShift ?? 0)
  const progress = Math.max(0, scroll - heroShift) / distance
  const docked = progress >= 1 + BRAND_FLIGHT_HANDOFF_FRACTION

  if (reducedMotion) {
    return {
      progress,
      name: originCopy(metrics.name, scroll),
      logo: originCopy(metrics.logo, scroll),
      role: originCopy(metrics.role, scroll),
      copyOpacity: 0,
      heroOpacity: 1,
      brandOpacity: docked ? 1 : 0,
      roleOpacity: 0,
      docked,
    }
  }

  const q = clamp(
    (progress - BRAND_FLIGHT_ENTER_END) / (1 - BRAND_FLIGHT_ENTER_END),
    0,
    1,
  )

  const nameCenter = center(metrics.name)
  const brandCenter = center(metrics.brandName)
  const nameScale = 1 + (scale - 1) * q
  const nameCenterX = lerp(nameCenter.x, brandCenter.x, q)
  const name: BrandFlightTransform = {
    x: nameCenterX - (metrics.name.width * nameScale) / 2,
    // La Y es la del h1 real, con su parallax, acotada en el destino.
    y: Math.max(metrics.name.top - scroll + heroShift, targetTop),
    scale: nameScale,
  }

  // La marca provisional interpola su propia caja y no incluye `heroShift`.
  const logoCenter = center(metrics.logo)
  const brandLogoCenter = center(metrics.brandLogo)
  const logoScale = 1 + (metrics.brandLogo.height / metrics.logo.height - 1) * q
  const logoCenterX = lerp(logoCenter.x, brandLogoCenter.x, q)
  const logoCenterY = lerp(logoCenter.y - scroll, brandLogoCenter.y, q)
  const logo: BrandFlightTransform = {
    x: logoCenterX - (metrics.logo.width * logoScale) / 2,
    y: logoCenterY - (metrics.logo.height * logoScale) / 2,
    scale: logoScale,
  }

  // La copia del puesto conserva su distancia al nombre, escalada con él: en
  // s = 0 coincide con el puesto real y después sigue la trayectoria del nombre.
  const roleCenter = center(metrics.role)
  const roleCenterX =
    name.x + (metrics.name.width * nameScale) / 2 +
    (roleCenter.x - nameCenter.x) * nameScale
  const roleCenterY =
    name.y + (metrics.name.height * nameScale) / 2 +
    (roleCenter.y - nameCenter.y) * nameScale
  const role: BrandFlightTransform = {
    x: roleCenterX - (metrics.role.width * nameScale) / 2,
    y: roleCenterY - (metrics.role.height * nameScale) / 2,
    scale: nameScale,
  }

  const entry = clamp(progress / BRAND_FLIGHT_ENTER_END, 0, 1)
  const handoff = clamp(
    (progress - 1) / BRAND_FLIGHT_HANDOFF_FRACTION,
    0,
    1,
  )

  return {
    progress,
    name,
    logo,
    role,
    copyOpacity: entry * (1 - handoff),
    heroOpacity: 1 - entry,
    brandOpacity: handoff,
    roleOpacity: entry * (1 - clamp(progress / BRAND_FLIGHT_ROLE_FADE_END, 0, 1)),
    docked,
  }
}
