import { useLayoutEffect } from 'react'
import { computeBrandFlight } from '../lib/brandFlight.ts'
import type { Box, BrandFlightState } from '../lib/brandFlight.ts'
import { computeHeroOffsets } from '../lib/heroParallax.ts'

/**
 * Las quince variables que alimentan el vuelo. Se retiran al degradar y al
 * desmontar para que queden los valores por defecto de la composición sin
 * vuelo.
 */
const FLIGHT_VARIABLES = [
  '--brand-flight-name-x',
  '--brand-flight-name-y',
  '--brand-flight-name-scale',
  '--brand-flight-logo-x',
  '--brand-flight-logo-y',
  '--brand-flight-logo-scale',
  '--brand-flight-name-width',
  '--brand-flight-copy-opacity',
  '--brand-flight-hero-opacity',
  '--brand-flight-brand-opacity',
  '--brand-flight-role-opacity',
  '--brand-flight-role-x',
  '--brand-flight-role-y',
  '--brand-flight-role-scale',
  '--brand-flight-role-width',
] as const

const LINES_ATTRIBUTE = 'data-brand-lines'
const STATE_ATTRIBUTE = 'data-brand-state'

type FlightLines = '1' | 'multi'
type FlightState = 'flying' | 'docked'

/**
 * Medida del documento sin el scroll: se toma una vez y se reutiliza. La
 * geometría del hero alimenta `computeHeroOffsets` en cada frame.
 */
type Measurement = {
  name: Box
  role: Box
  logo: Box
  brandName: Box
  brandLogo: Box
  nameFontSize: number
  brandFontSize: number
  heroTop: number
  heroHeight: number
  textBlockHeight: number
}

function rectOf(element: Element): Box {
  const rect = element.getBoundingClientRect()

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

function isValidBox(box: Box): boolean {
  return (
    Number.isFinite(box.left) &&
    Number.isFinite(box.top) &&
    Number.isFinite(box.width) &&
    Number.isFinite(box.height) &&
    box.width > 0 &&
    box.height > 0
  )
}

/**
 * Adaptador DOM del vuelo: mide, escucha y escribe variables CSS. Llama una
 * sola vez desde `App`; no devuelve nada y no usa estado de React.
 */
export function useBrandFlight(): void {
  useLayoutEffect(() => {
    const layer = document.querySelector<HTMLElement>('[data-brand="layer"]')
    if (!layer) return

    const hero = document.querySelector<HTMLElement>('[data-brand="hero"]')
    const heroContent = document.querySelector<HTMLElement>('[data-brand="hero-content"]')
    const heroName = document.querySelector<HTMLElement>('[data-brand="name"]')
    const heroLogo = document.querySelector<HTMLElement>('[data-brand="logo"]')
    const bar = document.querySelector<HTMLElement>('[data-brand="bar"]')
    const brandLink = document.querySelector<HTMLElement>('[data-brand="brand-link"]')
    const brandLogo = document.querySelector<HTMLElement>('[data-brand="brand-logo"]')
    const brandName = document.querySelector<HTMLElement>('[data-brand="brand-name"]')
    const roleText = document.querySelector<HTMLElement>('[data-brand="role"]')

    const stored: HTMLElement[] = []
    if (hero) stored.push(hero)
    if (bar) stored.push(bar)

    let measurement: Measurement | null = null
    let degraded = false
    let frame = 0
    let lastWidth: number | null = null
    let lastRoleWidth: number | null = null
    let lastLines: FlightLines | null = null

    /** Retira todo lo escrito: valores por defecto = composición sin vuelo. */
    const clear = () => {
      for (const property of FLIGHT_VARIABLES) {
        layer.style.removeProperty(property)
        for (const element of stored) element.style.removeProperty(property)
      }
      layer.removeAttribute(LINES_ATTRIBUTE)
      // Sin estado, la marca recupera el puntero desde el primer instante.
      bar?.removeAttribute(STATE_ATTRIBUTE)
      measurement = null
      lastWidth = null
      lastRoleWidth = null
      lastLines = null
    }

    if (
      !hero ||
      !heroContent ||
      !heroName ||
      !heroLogo ||
      !bar ||
      !brandLink ||
      !brandLogo ||
      !brandName ||
      !roleText
    ) {
      clear()
      return
    }

    // La preferencia se lee al montar y se mantiene al día: activarla o
    // desactivarla con la página abierta debe pasar de inmediato al modo que
    // corresponda, sin reiniciar el recorrido ni dejar un frame intermedio.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motionQuery.matches

    const write = (state: BrandFlightState) => {
      // Con movimiento reducido no hay copia: no se escriben transformaciones.
      if (!reduced) {
        layer.style.setProperty('--brand-flight-name-x', `${state.name.x}px`)
        layer.style.setProperty('--brand-flight-name-y', `${state.name.y}px`)
        layer.style.setProperty('--brand-flight-name-scale', String(state.name.scale))
        layer.style.setProperty('--brand-flight-logo-x', `${state.logo.x}px`)
        layer.style.setProperty('--brand-flight-logo-y', `${state.logo.y}px`)
        layer.style.setProperty('--brand-flight-logo-scale', String(state.logo.scale))
        layer.style.setProperty('--brand-flight-role-x', `${state.role.x}px`)
        layer.style.setProperty('--brand-flight-role-y', `${state.role.y}px`)
        layer.style.setProperty('--brand-flight-role-scale', String(state.role.scale))
      }

      layer.style.setProperty('--brand-flight-copy-opacity', String(state.copyOpacity))
      layer.style.setProperty('--brand-flight-role-opacity', String(state.roleOpacity))
      hero.style.setProperty('--brand-flight-hero-opacity', String(state.heroOpacity))
      bar.style.setProperty('--brand-flight-brand-opacity', String(state.brandOpacity))

      // Se compara con el atributo: `clear()` lo retira y la primera escritura
      // lo repone sin una caché aparte.
      const estado: FlightState = state.docked ? 'docked' : 'flying'
      if (bar.getAttribute(STATE_ATTRIBUTE) !== estado) {
        bar.setAttribute(STATE_ATTRIBUTE, estado)
      }
    }

    /**
     * Mide la geometría del hero y las cuatro cajas. Devuelve `false` si la
     * medida no sirve o si la marca está truncada sin movimiento reducido.
     */
    const measure = (): boolean => {
      const scrollY = window.scrollY
      const heroRect = hero.getBoundingClientRect()
      const heroTop = heroRect.top + scrollY
      const heroHeight = heroRect.height
      const textBlockHeight = heroContent.offsetHeight

      // El parallax se obtiene con la misma función pura que usa el hero; no se
      // lee `--hero-text-shift` ni se depende del orden de efectos.
      const heroShift = computeHeroOffsets(
        { scrollY, heroTop, H: heroHeight, textBlockHeight },
        reduced,
      ).text

      // Las cajas del hero se miden en coordenadas del documento y sin el
      // transform del parallax, que `getBoundingClientRect` ya incluye.
      const nameRect = rectOf(heroName)
      const logoRect = rectOf(heroLogo)
      const name: Box = {
        ...nameRect,
        top: nameRect.top + scrollY - heroShift,
      }
      const logo: Box = {
        ...logoRect,
        top: logoRect.top + scrollY - heroShift,
      }

      const roleRect = rectOf(roleText)
      const roleBox: Box = {
        ...roleRect,
        top: roleRect.top + scrollY - heroShift,
      }

      const brandNameBox = rectOf(brandName)
      const brandLogoBox = rectOf(brandLogo)
      const nameFontSize = Number.parseFloat(getComputedStyle(heroName).fontSize)
      const brandFontSize = Number.parseFloat(getComputedStyle(brandName).fontSize)

      // Misma D que la función pura: del borde superior del nombre sin parallax
      // al borde superior de la copia ya escalada y centrada en la marca.
      const scale = brandFontSize / nameFontSize
      const targetTop =
        brandNameBox.top + brandNameBox.height / 2 - (name.height * scale) / 2
      const distance = name.top - targetTop
      const truncated = brandName.scrollWidth > brandName.clientWidth + 1

      const valid =
        isValidBox(name) &&
        isValidBox(roleBox) &&
        isValidBox(logo) &&
        isValidBox(brandNameBox) &&
        isValidBox(brandLogoBox) &&
        Number.isFinite(nameFontSize) &&
        nameFontSize > 0 &&
        Number.isFinite(brandFontSize) &&
        brandFontSize > 0 &&
        Number.isFinite(distance) &&
        distance > 0

      // Precedencia: medida inválida → degradación (también con movimiento
      // reducido: sin `D` no hay `s`); medida válida + movimiento reducido →
      // modo reducido; solo en el vuelo activo el truncado degrada.
      if (!valid || (!reduced && truncated)) {
        if (!degraded) {
          clear()
          degraded = true
        }
        return false
      }

      degraded = false
      measurement = {
        name,
        role: roleBox,
        logo,
        brandName: brandNameBox,
        brandLogo: brandLogoBox,
        nameFontSize,
        brandFontSize,
        heroTop,
        heroHeight,
        textBlockHeight,
      }

      // Ancho y líneas se escriben aquí, solo cuando cambian, nunca por frame.
      if (!reduced) {
        if (name.width !== lastWidth) {
          layer.style.setProperty('--brand-flight-name-width', `${name.width}px`)
          lastWidth = name.width
        }

        if (roleBox.width !== lastRoleWidth) {
          layer.style.setProperty('--brand-flight-role-width', `${roleBox.width}px`)
          lastRoleWidth = roleBox.width
        }

        const lines: FlightLines = name.height > 1.5 * nameFontSize ? 'multi' : '1'
        if (lines !== lastLines) {
          layer.setAttribute(LINES_ATTRIBUTE, lines)
          lastLines = lines
        }
      }

      return true
    }

    const update = () => {
      if (degraded || !measurement) return

      const scrollY = window.scrollY
      // El `heroShift` del frame sale de la geometría cacheada del hero, no del
      // transform ya aplicado.
      const heroShift = computeHeroOffsets(
        {
          scrollY,
          heroTop: measurement.heroTop,
          H: measurement.heroHeight,
          textBlockHeight: measurement.textBlockHeight,
        },
        reduced,
      ).text

      write(
        computeBrandFlight(
          {
            scrollY,
            heroShift,
            name: measurement.name,
            role: measurement.role,
            logo: measurement.logo,
            brandName: measurement.brandName,
            brandLogo: measurement.brandLogo,
            nameFontSize: measurement.nameFontSize,
            brandFontSize: measurement.brandFontSize,
          },
          reduced,
        ),
      )
    }

    const tick = () => {
      frame = 0
      update()
    }

    const schedule = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(tick)
    }

    // La remedición aplica la medida y el estado en el mismo rendering update.
    const sync = () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      if (measure()) update()
    }

    // Se vuelve a medir antes de escribir: al activar la preferencia desde una
    // degradación por truncado, `degraded` pasa a `false` y la barra adopta el
    // modo reducido; al desactivarla, el truncado vuelve a degradar.
    const handleMotionChange = (event: MediaQueryListEvent) => {
      reduced = event.matches
      sync()
    }

    sync()

    motionQuery.addEventListener('change', handleMotionChange)

    // Se observan el hero, su bloque de texto y la barra: observar la capa
    // provocaría el aviso de `ResizeObserver` porque el hook escribe en ella.
    const observer = new ResizeObserver(sync)
    observer.observe(hero)
    observer.observe(heroContent)
    observer.observe(bar)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', sync)

    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', sync)
      motionQuery.removeEventListener('change', handleMotionChange)
      observer.disconnect()
      clear()
      degraded = false
    }
  }, [])
}
