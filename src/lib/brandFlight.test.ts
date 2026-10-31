import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BRAND_FLIGHT_ENTER_END,
  BRAND_FLIGHT_HANDOFF_FRACTION,
  BRAND_FLIGHT_ROLE_FADE_END,
  computeBrandFlight,
} from './brandFlight.ts'
import type {
  Box,
  BrandFlightMetrics,
  BrandFlightState,
  BrandFlightTransform,
} from './brandFlight.ts'

const EPSILON = 1e-9

/** A 1440 px: nombre de 64 px en una línea y marca de 18 px. */
const ONE_LINE: BrandFlightMetrics = {
  scrollY: 0,
  name: { left: 470.4, top: 320, width: 499.2, height: 80 },
  role: { left: 320, top: 400, width: 880, height: 28 },
  logo: { left: 684, top: 232, width: 72, height: 72 },
  brandName: { left: 100, top: 20, width: 140.4, height: 22.5 },
  brandLogo: { left: 60, top: 15.25, width: 32, height: 32 },
  nameFontSize: 64,
  brandFontSize: 18,
}

/** A 320 px con texto al 200 %: el nombre ocupa dos líneas. */
const TWO_LINES: BrandFlightMetrics = {
  scrollY: 0,
  name: { left: 16, top: 300, width: 288, height: 100 },
  role: { left: 16, top: 420, width: 288, height: 28 },
  logo: { left: 144, top: 212, width: 72, height: 72 },
  brandName: { left: 100, top: 20, width: 140.4, height: 22.5 },
  brandLogo: { left: 60, top: 15.25, width: 32, height: 32 },
  nameFontSize: 40,
  brandFontSize: 18,
}

/** A 320 px con el texto al 200 % (raíz a 32 px): el nombre ocupa tres líneas. */
const THREE_LINES: BrandFlightMetrics = {
  scrollY: 0,
  name: { left: 16, top: 400, width: 288, height: 300 },
  role: { left: 16, top: 720, width: 288, height: 28 },
  logo: { left: 88, top: 232, width: 144, height: 144 },
  brandName: { left: 100, top: 20, width: 281, height: 45 },
  brandLogo: { left: 36, top: 10.5, width: 64, height: 64 },
  nameFontSize: 80,
  brandFontSize: 36,
}

function boxCenter(box: Box): { x: number; y: number } {
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

function flightScale(metrics: BrandFlightMetrics): number {
  return metrics.brandFontSize / metrics.nameFontSize
}

/** Borde superior de la copia escalada centrada en el texto de la marca. */
function targetTop(metrics: BrandFlightMetrics): number {
  return (
    boxCenter(metrics.brandName).y -
    (metrics.name.height * flightScale(metrics)) / 2
  )
}

/** D = name.top − targetTop: la distancia que define el progreso. */
function distance(metrics: BrandFlightMetrics): number {
  return metrics.name.top - targetTop(metrics)
}

/** Medida desplazada hasta el progreso `s`, con su `heroShift` si lo hay. */
function atS(metrics: BrandFlightMetrics, s: number): BrandFlightMetrics {
  return {
    ...metrics,
    scrollY: (metrics.heroShift ?? 0) + s * distance(metrics),
  }
}

function withScroll(
  metrics: BrandFlightMetrics,
  scrollY: number,
): BrandFlightMetrics {
  return { ...metrics, scrollY }
}

function withBox(
  metrics: BrandFlightMetrics,
  key: 'name' | 'role' | 'logo' | 'brandName' | 'brandLogo',
  box: Box,
): BrandFlightMetrics {
  return { ...metrics, [key]: box }
}

function closeTo(
  actual: number,
  expected: number,
  label: string,
  tolerance = EPSILON,
): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: se esperaba ${expected} y se obtuvo ${actual}`,
  )
}

function assertOriginCopy(
  transform: BrandFlightTransform,
  box: Box,
  scrollY: number,
  label: string,
): void {
  closeTo(transform.x, box.left, `${label}: x en el origen`)
  closeTo(transform.y, box.top - scrollY, `${label}: y en el origen`)
  closeTo(transform.scale, 1, `${label}: escala en el origen`)
}

function assertNoFlight(
  state: BrandFlightState,
  metrics: BrandFlightMetrics,
  label: string,
): void {
  assert.equal(state.progress, 0, `${label}: progress`)
  assert.equal(state.copyOpacity, 0, `${label}: copia invisible`)
  assert.equal(state.heroOpacity, 1, `${label}: hero visible`)
  assert.equal(state.brandOpacity, 1, `${label}: barra visible`)
  assert.equal(state.docked, false, `${label}: no acoplado`)
  // Con una caja no finita la copia es invisible y su transformación no se usa.
  const geometryFinite =
    Number.isFinite(metrics.scrollY) &&
    [metrics.name, metrics.logo].every((box) =>
      [box.left, box.top, box.width, box.height].every(Number.isFinite),
    )
  if (geometryFinite) {
    assertOriginCopy(state.name, metrics.name, metrics.scrollY, `${label}: nombre`)
    assertOriginCopy(state.logo, metrics.logo, metrics.scrollY, `${label}: marca`)
  }
}

function copyCenter(
  transform: BrandFlightTransform,
  box: Box,
): { x: number; y: number } {
  return {
    x: transform.x + (box.width * transform.scale) / 2,
    y: transform.y + (box.height * transform.scale) / 2,
  }
}

describe('constantes del vuelo', () => {
  test('coinciden con el plan', () => {
    assert.equal(BRAND_FLIGHT_ENTER_END, 0.02)
    assert.equal(BRAND_FLIGHT_HANDOFF_FRACTION, 0.04)
  })
})

describe('estado en el tope', () => {
  test('sin copia, hero visible y barra vacía, con las copias en su origen', () => {
    const state = computeBrandFlight(ONE_LINE, false)

    assert.equal(state.progress, 0)
    assert.equal(state.copyOpacity, 0)
    assert.equal(state.heroOpacity, 1)
    assert.equal(state.brandOpacity, 0)
    assert.equal(state.docked, false)
    assertOriginCopy(state.name, ONE_LINE.name, 0, 'nombre')
    assertOriginCopy(state.logo, ONE_LINE.logo, 0, 'marca')
    // La copia coincide con el h1 en X, Y, ancho y escala.
    closeTo(state.name.x, ONE_LINE.name.left, 'X exacta con heroShift = 0')
    closeTo(state.name.y, ONE_LINE.name.top, 'Y exacta con heroShift = 0')
    closeTo(
      ONE_LINE.name.width * state.name.scale,
      ONE_LINE.name.width,
      'ancho escalado igual al original',
    )
    closeTo(state.name.scale, 1, 'escala 1')
  })
})

describe('relevo de entrada', () => {
  test('con scrollY = 1 no hay zona muerta', () => {
    const state = computeBrandFlight(withScroll(ONE_LINE, 1), false)

    assert.ok(state.progress > 0, `progress debería ser > 0 y es ${state.progress}`)
    assert.ok(
      state.copyOpacity > 0,
      `copyOpacity debería ser > 0 y es ${state.copyOpacity}`,
    )
    assert.ok(state.heroOpacity < 1, 'el original ya empieza a ocultarse')
  })

  test('el primer píxel mantiene la X y la escala en el origen', () => {
    const state = computeBrandFlight(withScroll(ONE_LINE, 1), false)

    assert.equal(state.name.x, ONE_LINE.name.left)
    assert.equal(state.name.scale, 1)
    assert.equal(state.logo.x, ONE_LINE.logo.left)
    assert.equal(state.logo.scale, 1)
    closeTo(state.name.y, ONE_LINE.name.top - 1, 'la Y sigue el scroll')
  })

  test('en s = 0,01 la copia está a media entrada y la trayectoria sigue quieta', () => {
    const metrics = atS(ONE_LINE, 0.01)
    const state = computeBrandFlight(metrics, false)

    closeTo(state.progress, 0.01, 'progress')
    closeTo(state.copyOpacity, 0.5, 'copyOpacity a mitad del relevo')
    closeTo(state.heroOpacity, 0.5, 'heroOpacity a mitad del relevo')
    assert.equal(state.brandOpacity, 0)
    closeTo(
      state.heroOpacity + state.copyOpacity + state.brandOpacity,
      1,
      'suma de opacidades en vuelo activo',
    )
    assert.equal(state.name.x, ONE_LINE.name.left)
    assert.equal(state.name.scale, 1)
    assert.equal(state.logo.x, ONE_LINE.logo.left)
    assert.equal(state.logo.scale, 1)
    closeTo(state.name.y, ONE_LINE.name.top - metrics.scrollY, 'Y con el scroll')
  })

  test('en s = 0,02 el original queda oculto y la copia completa', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 0.02), false)

    closeTo(state.progress, 0.02, 'progress')
    assert.equal(state.heroOpacity, 0)
    assert.equal(state.copyOpacity, 1)
    assert.equal(state.brandOpacity, 0)
    assert.equal(state.name.scale, 1)
    assert.equal(state.name.x, ONE_LINE.name.left)
  })

  test('justo después del 2 % la trayectoria ya avanza', () => {
    const metrics = atS(ONE_LINE, 0.02)
    const start = computeBrandFlight(metrics, false)
    const after = computeBrandFlight({ ...metrics, scrollY: metrics.scrollY + 1 }, false)

    assert.ok(after.name.scale < start.name.scale, 'la escala empieza a bajar')
    assert.ok(after.name.x < start.name.x, 'el nombre empieza a moverse a la izquierda')
  })

  test('a mitad del recorrido solo se ve la copia', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 0.5), false)
    const originCenter = boxCenter(ONE_LINE.name)
    const brandCenter = boxCenter(ONE_LINE.brandName)
    const center = copyCenter(state.name, ONE_LINE.name)

    assert.equal(state.copyOpacity, 1)
    assert.equal(state.heroOpacity, 0)
    assert.equal(state.brandOpacity, 0)
    assert.ok(center.x < originCenter.x, 'el centro avanza hacia la izquierda')
    assert.ok(center.x > brandCenter.x, 'el centro todavía no ha llegado')
    assert.ok(state.name.scale < 1, 'la escala ya ha bajado')
    assert.ok(
      state.name.scale > ONE_LINE.brandFontSize / ONE_LINE.nameFontSize,
      'la escala todavía no ha llegado al destino',
    )
  })
})

describe('llegada y relevo final', () => {
  test('en s = 1 la copia coincide con el destino dentro de 1 px', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 1), false)
    const targetCenter = boxCenter(ONE_LINE.brandName)
    const center = copyCenter(state.name, ONE_LINE.name)
    const scaledWidth = ONE_LINE.name.width * state.name.scale
    const scaledHeight = ONE_LINE.name.height * state.name.scale

    closeTo(state.progress, 1, 'progress')
    assert.equal(state.copyOpacity, 1)
    assert.equal(state.docked, false, 'todavía no está acoplado')
    closeTo(state.name.y, targetTop(ONE_LINE), 'borde superior en targetTop')
    closeTo(center.x, targetCenter.x, 'centro X del nombre', 1)
    closeTo(center.y, targetCenter.y, 'centro Y del nombre', 1)
    closeTo(scaledWidth, ONE_LINE.brandName.width, 'ancho escalado del nombre', 1)
    closeTo(scaledHeight, ONE_LINE.brandName.height, 'alto escalado del nombre', 1)
  })

  test('en s = 1 la marca provisional coincide con su hueco dentro de 1 px', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 1), false)
    const targetCenter = boxCenter(ONE_LINE.brandLogo)
    const center = copyCenter(state.logo, ONE_LINE.logo)

    closeTo(center.x, targetCenter.x, 'centro X de la marca', 1)
    closeTo(center.y, targetCenter.y, 'centro Y de la marca', 1)
    closeTo(
      ONE_LINE.logo.width * state.logo.scale,
      ONE_LINE.brandLogo.width,
      'ancho escalado de la marca',
      1,
    )
    closeTo(
      ONE_LINE.logo.height * state.logo.scale,
      ONE_LINE.brandLogo.height,
      'alto escalado de la marca',
      1,
    )
  })

  test('en s = 1,02 el relevo final va por la mitad y la copia sigue parada', () => {
    const atEnd = computeBrandFlight(atS(ONE_LINE, 1), false)
    const state = computeBrandFlight(atS(ONE_LINE, 1.02), false)

    closeTo(state.progress, 1.02, 'progress')
    assert.equal(state.heroOpacity, 0)
    closeTo(state.copyOpacity, 0.5, 'copyOpacity')
    closeTo(state.brandOpacity, 0.5, 'brandOpacity')
    closeTo(
      state.heroOpacity + state.copyOpacity + state.brandOpacity,
      1,
      'suma de opacidades en vuelo activo',
    )
    assert.equal(state.docked, false)
    closeTo(state.name.x, atEnd.name.x, 'X inmóvil en el destino')
    closeTo(state.name.y, atEnd.name.y, 'Y inmóvil en el destino')
    closeTo(state.name.scale, atEnd.name.scale, 'escala inmóvil en el destino')
    closeTo(state.logo.x, atEnd.logo.x, 'marca inmóvil en X')
    closeTo(state.logo.y, atEnd.logo.y, 'marca inmóvil en Y')
  })

  test('en s = 1,04 está acoplado, sin copia y con la barra visible', () => {
    const atEnd = computeBrandFlight(atS(ONE_LINE, 1), false)
    const state = computeBrandFlight(atS(ONE_LINE, 1.04), false)

    closeTo(state.progress, 1.04, 'progress')
    assert.equal(state.copyOpacity, 0)
    assert.equal(state.heroOpacity, 0)
    assert.equal(state.brandOpacity, 1)
    assert.equal(state.docked, true)
    closeTo(state.name.x, atEnd.name.x, 'X congelada')
    closeTo(state.name.y, atEnd.name.y, 'Y congelada')
    closeTo(state.name.scale, atEnd.name.scale, 'escala congelada')
  })

  test('la copia no se mueve del destino al seguir bajando', () => {
    const atOne = computeBrandFlight(atS(ONE_LINE, 1), false)
    const beyond = computeBrandFlight(atS(ONE_LINE, 1.5), false)

    assert.equal(beyond.progress, 1.5)
    closeTo(beyond.name.x, atOne.name.x, 'X parada')
    closeTo(beyond.name.y, atOne.name.y, 'Y parada')
    closeTo(beyond.logo.y, atOne.logo.y, 'marca parada')
  })

  test('desde s = 1,04 el estado queda congelado', () => {
    const docked = computeBrandFlight(atS(ONE_LINE, 1.04), false)
    const far = computeBrandFlight(atS(ONE_LINE, 3), false)

    assert.equal(far.docked, true)
    assert.equal(far.copyOpacity, docked.copyOpacity)
    assert.equal(far.heroOpacity, docked.heroOpacity)
    assert.equal(far.brandOpacity, docked.brandOpacity)
    closeTo(far.name.x, docked.name.x, 'X congelada')
    closeTo(far.name.y, docked.name.y, 'Y congelada')
    closeTo(far.name.scale, docked.name.scale, 'escala congelada')
    closeTo(far.logo.x, docked.logo.x, 'marca congelada en X')
    closeTo(far.logo.y, docked.logo.y, 'marca congelada en Y')
    assert.equal(far.progress, 3, 'progress no se recorta')
  })

  test('un scroll negativo se comporta como el tope', () => {
    assert.deepEqual(
      computeBrandFlight(withScroll(ONE_LINE, -120), false),
      computeBrandFlight(withScroll(ONE_LINE, 0), false),
    )
  })
})

describe('progreso sin recorte y Y fijada en el destino', () => {
  test('s no se recorta por arriba y la Y queda en targetTop desde s = 1', () => {
    for (const s of [1, 1.02, 1.04, 1.5, 3]) {
      const state = computeBrandFlight(atS(ONE_LINE, s), false)

      closeTo(state.progress, s, `progress en s = ${s}`)
      closeTo(state.name.y, targetTop(ONE_LINE), `borde superior en s = ${s}`)
    }
  })

  test('la Y se acota en targetTop aunque no se haya llegado por scroll', () => {
    // Con un scroll enorme el h1 ya habría pasado el destino: la copia se queda.
    const state = computeBrandFlight(withScroll(ONE_LINE, 10_000), false)

    assert.ok(state.progress > 1, 's crece sin recorte')
    closeTo(state.name.y, targetTop(ONE_LINE), 'borde superior acotado')
    closeTo(copyCenter(state.name, ONE_LINE.name).y, boxCenter(ONE_LINE.brandName).y, 'centro Y')
  })
})

describe('Y del h1 con parallax (heroShift)', () => {
  test('un heroShift negativo adelanta s y la Y sigue al h1', () => {
    const metrics = { ...ONE_LINE, scrollY: 0, heroShift: -50 }
    const state = computeBrandFlight(metrics, false)

    closeTo(state.progress, 50 / distance(ONE_LINE), 's = 50/D')
    closeTo(state.name.y, ONE_LINE.name.top - 50, 'Y = name.top + heroShift')
    closeTo(state.copyOpacity, 1, 'la entrada ya se completó con ese s')
    assert.equal(state.heroOpacity, 0, 'el original ya está oculto')
  })

  test('la opacidad de entrada corresponde al s con parallax, no a 0', () => {
    const metrics = { ...ONE_LINE, scrollY: 0, heroShift: -3 }
    const state = computeBrandFlight(metrics, false)

    closeTo(state.progress, 3 / distance(ONE_LINE), 's = 3/D')
    closeTo(state.copyOpacity, 0.5, 'entrada a la mitad')
    closeTo(state.heroOpacity, 0.5, 'original a la mitad')
    closeTo(state.name.y, ONE_LINE.name.top - 3, 'Y con el h1')
  })

  test('el logo interpola su posición sin incluir heroShift', () => {
    // Mismo `s` por dos caminos: 0 − (−50) y 50 − 0. Si el logo usara
    // heroShift, ambas posiciones coincidirían.
    const shifted = computeBrandFlight(
      { ...ONE_LINE, scrollY: 0, heroShift: -50 },
      false,
    )
    const sameS = computeBrandFlight(withScroll(ONE_LINE, 50), false)

    closeTo(shifted.progress, sameS.progress, 'mismo s')
    closeTo(shifted.name.y, sameS.name.y, 'misma Y del nombre')
    assert.ok(
      Math.abs(shifted.logo.y - sameS.logo.y) > 1,
      'el logo usa scrollY y no heroShift',
    )
  })

  test('con movimiento reducido heroShift se trata como 0', () => {
    const metrics = { ...ONE_LINE, scrollY: 0, heroShift: -50 }
    const state = computeBrandFlight(metrics, true)

    assert.equal(state.progress, 0, 's = scrollY / D')
    assert.equal(state.copyOpacity, 0)
    assert.equal(state.heroOpacity, 1)
    assert.equal(state.brandOpacity, 0)
    assertOriginCopy(state.name, ONE_LINE.name, 0, 'nombre sin parallax')
    assertOriginCopy(state.logo, ONE_LINE.logo, 0, 'marca sin parallax')
  })
})

describe('invariantes de la malla', () => {
  test('la suma de opacidades es 1 en todo el vuelo activo', () => {
    const values = [
      0, 0.001, 0.01, 0.02, 0.03, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1, 1.01,
      1.02, 1.03, 1.04,
    ]

    for (const s of values) {
      const state = computeBrandFlight(atS(ONE_LINE, s), false)
      const sum = state.heroOpacity + state.copyOpacity + state.brandOpacity

      closeTo(sum, 1, `suma de opacidades en s = ${s}`, 1e-9)
      for (const [label, value] of [
        ['heroOpacity', state.heroOpacity],
        ['copyOpacity', state.copyOpacity],
        ['brandOpacity', state.brandOpacity],
      ] as const) {
        assert.ok(value >= 0 && value <= 1, `${label} fuera de [0, 1] en s = ${s}`)
      }
      closeTo(state.progress, s, `progress en s = ${s}`)
    }
  })

  test('la Y del nombre es monótona y queda acotada por el centro del destino', () => {
    const targetY = boxCenter(ONE_LINE.brandName).y
    let previous = Number.POSITIVE_INFINITY

    for (let scrollY = 0; scrollY <= 2 * distance(ONE_LINE); scrollY += 5) {
      const state = computeBrandFlight(withScroll(ONE_LINE, scrollY), false)
      const centerY = copyCenter(state.name, ONE_LINE.name).y

      assert.ok(centerY <= previous + EPSILON, `la Y sube en scrollY = ${scrollY}`)
      assert.ok(
        centerY >= targetY - EPSILON,
        `la Y no baja del destino en scrollY = ${scrollY}`,
      )
      previous = centerY
    }

    const atEnd = computeBrandFlight(atS(ONE_LINE, 1), false)
    closeTo(copyCenter(atEnd.name, ONE_LINE.name).y, targetY, 'Y en el destino')
  })
})

describe('determinismo', () => {
  test('la misma entrada da la misma salida en cualquier orden', () => {
    const input = withScroll(ONE_LINE, 150)
    const first = computeBrandFlight(input, false)

    computeBrandFlight(withScroll(TWO_LINES, 80), false)
    computeBrandFlight(input, true)
    computeBrandFlight(withScroll(ONE_LINE, 900), false)

    assert.deepEqual(computeBrandFlight(input, false), first)
  })
})

describe('composición sin vuelo por degradación', () => {
  test('con D ≤ 0 no hay vuelo', () => {
    const zero = withBox(ONE_LINE, 'name', {
      ...ONE_LINE.name,
      top: targetTop(ONE_LINE),
    })
    const negative = withScroll(
      withBox(ONE_LINE, 'name', {
        ...ONE_LINE.name,
        top: -200,
      }),
      120,
    )

    closeTo(distance(zero), 0, 'D = 0')
    assert.ok(distance(negative) < 0, 'D < 0')
    assertNoFlight(computeBrandFlight(zero, false), zero, 'D = 0')
    assertNoFlight(computeBrandFlight(negative, false), negative, 'D < 0')
  })

  test('una caja de ancho o alto no positivo en las cuatro cajas degrada', () => {
    const boxes: Array<['name' | 'logo' | 'brandName' | 'brandLogo', Box]> = [
      ['name', { ...ONE_LINE.name, width: 0 }],
      ['name', { ...ONE_LINE.name, height: -10 }],
      ['logo', { ...ONE_LINE.logo, width: 0 }],
      ['logo', { ...ONE_LINE.logo, height: 0 }],
      ['brandName', { ...ONE_LINE.brandName, width: -1 }],
      ['brandName', { ...ONE_LINE.brandName, height: 0 }],
      ['brandLogo', { ...ONE_LINE.brandLogo, width: 0 }],
      ['brandLogo', { ...ONE_LINE.brandLogo, height: 0 }],
    ]

    for (const [key, box] of boxes) {
      const metrics = withScroll(withBox(ONE_LINE, key, box), 100)
      assertNoFlight(computeBrandFlight(metrics, false), metrics, `${key} no válida`)
    }
  })

  test('la guarda de medida se aplica antes que reducedMotion', () => {
    const invalid = withScroll(
      withBox(ONE_LINE, 'brandLogo', { ...ONE_LINE.brandLogo, height: 0 }),
      100,
    )

    assertNoFlight(
      computeBrandFlight(invalid, true),
      invalid,
      'caja no válida con movimiento reducido',
    )
  })

  test('tamaños de texto no positivos o no finitos degradan', () => {
    const cases: Array<[string, Partial<BrandFlightMetrics>]> = [
      ['nameFontSize 0', { nameFontSize: 0 }],
      ['nameFontSize negativo', { nameFontSize: -4 }],
      ['brandFontSize 0', { brandFontSize: 0 }],
      ['brandFontSize negativo', { brandFontSize: -1 }],
      ['nameFontSize NaN', { nameFontSize: Number.NaN }],
      ['brandFontSize Infinity', { brandFontSize: Number.POSITIVE_INFINITY }],
    ]

    for (const [label, overrides] of cases) {
      const metrics = { ...withScroll(ONE_LINE, 60), ...overrides }
      assertNoFlight(computeBrandFlight(metrics, false), metrics, label)
    }
  })

  test('cualquier entrada no finita degrada', () => {
    const cases: Array<[string, Partial<BrandFlightMetrics>]> = [
      ['scrollY NaN', { scrollY: Number.NaN }],
      ['scrollY -Infinity', { scrollY: Number.NEGATIVE_INFINITY }],
      ['name.left NaN', { name: { ...ONE_LINE.name, left: Number.NaN } }],
      ['name.top Infinity', { name: { ...ONE_LINE.name, top: Number.POSITIVE_INFINITY } }],
      ['name.width NaN', { name: { ...ONE_LINE.name, width: Number.NaN } }],
      ['logo.height Infinity', { logo: { ...ONE_LINE.logo, height: Number.POSITIVE_INFINITY } }],
      ['brandName.left NaN', { brandName: { ...ONE_LINE.brandName, left: Number.NaN } }],
      ['brandName.top -Infinity', { brandName: { ...ONE_LINE.brandName, top: Number.NEGATIVE_INFINITY } }],
      ['brandLogo.width NaN', { brandLogo: { ...ONE_LINE.brandLogo, width: Number.NaN } }],
      ['heroShift NaN', { heroShift: Number.NaN }],
      ['heroShift Infinity', { heroShift: Number.POSITIVE_INFINITY }],
    ]

    for (const [label, overrides] of cases) {
      const metrics = { ...ONE_LINE, ...overrides }
      assertNoFlight(computeBrandFlight(metrics, false), metrics, label)
    }
  })

  test('la degradación también gana con reducedMotion = true si D ≤ 0', () => {
    const metrics = withBox(ONE_LINE, 'name', { ...ONE_LINE.name, top: -200 })
    assertNoFlight(computeBrandFlight(metrics, true), metrics, 'D < 0 con reducido')
  })
})

describe('modo de movimiento reducido', () => {
  test('en s = 0 y s = 0,5 la barra está vacía y no hay copia', () => {
    for (const s of [0, 0.5]) {
      const metrics = atS(ONE_LINE, s)
      const state = computeBrandFlight(metrics, true)

      closeTo(state.progress, s, `progress en s = ${s}`)
      assert.equal(state.copyOpacity, 0, `copyOpacity en s = ${s}`)
      assert.equal(state.heroOpacity, 1, `heroOpacity en s = ${s}`)
      assert.equal(state.brandOpacity, 0, `brandOpacity en s = ${s}`)
      assert.equal(state.docked, false, `docked en s = ${s}`)
      assertOriginCopy(state.name, ONE_LINE.name, metrics.scrollY, `nombre en s = ${s}`)
      assertOriginCopy(state.logo, ONE_LINE.logo, metrics.scrollY, `marca en s = ${s}`)
    }
  })

  test('en s = 1,03 la barra sigue oculta', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 1.03), true)

    assert.equal(state.brandOpacity, 0)
    assert.equal(state.copyOpacity, 0)
    assert.equal(state.heroOpacity, 1)
    assert.equal(state.docked, false)
  })

  test('en s = 1,04 la barra aparece de golpe y la suma es 2', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 1.04), true)

    assert.equal(state.brandOpacity, 1)
    assert.equal(state.copyOpacity, 0)
    assert.equal(state.heroOpacity, 1)
    assert.equal(state.docked, true)
    closeTo(
      state.heroOpacity + state.copyOpacity + state.brandOpacity,
      2,
      'suma fuera del invariante del vuelo activo',
    )
  })

  test('más allá de 1,04 sigue acoplado y al volver a 1,02 se oculta', () => {
    const far = computeBrandFlight(atS(ONE_LINE, 2), true)
    const back = computeBrandFlight(atS(ONE_LINE, 1.02), true)

    assert.equal(far.brandOpacity, 1)
    assert.equal(far.docked, true)
    assert.equal(far.progress, 2)
    assert.equal(back.brandOpacity, 0)
    assert.equal(back.docked, false)
  })

  test('el caso de 320 px al 200 % con movimiento reducido no degrada', () => {
    const half = computeBrandFlight(atS(TWO_LINES, 0.5), true)
    const docked = computeBrandFlight(atS(TWO_LINES, 1.04), true)

    assert.ok(half.progress > 0, 'la función calcula s, no degrada')
    assert.equal(half.brandOpacity, 0)
    assert.equal(half.copyOpacity, 0)
    assert.equal(docked.brandOpacity, 1)
    assert.equal(docked.docked, true)
    assert.equal(docked.copyOpacity, 0)
  })
})

describe('puesto que viaja con el nombre (RF-16)', () => {
  test('la constante de fin del desvanecimiento vale 0,8', () => {
    assert.equal(BRAND_FLIGHT_ROLE_FADE_END, 0.8)
  })

  test('en s = 0 la copia del puesto está en el puesto real y es invisible', () => {
    const state = computeBrandFlight(atS(ONE_LINE, 0), false)
    closeTo(state.roleOpacity, 0, 'copia invisible en s=0')
    assertOriginCopy(state.role, ONE_LINE.role, 0, 'role en s=0')
  })

  test('en s = 0,4 la copia se ve a mitad y su distancia al nombre se escala', () => {
    const metrics = atS(ONE_LINE, 0.4)
    const state = computeBrandFlight(metrics, false)
    closeTo(state.roleOpacity, 0.5, 'role s=0,4')
    const scale = state.name.scale
    const roleCenterOffsetX = boxCenter(ONE_LINE.role).x - boxCenter(ONE_LINE.name).x
    const roleCenterOffsetY = boxCenter(ONE_LINE.role).y - boxCenter(ONE_LINE.name).y
    const nameCenterX = state.name.x + (ONE_LINE.name.width * scale) / 2
    const nameCenterY = state.name.y + (ONE_LINE.name.height * scale) / 2
    closeTo(
      state.role.x + (ONE_LINE.role.width * scale) / 2,
      nameCenterX + roleCenterOffsetX * scale,
      'centro X de la copia del puesto',
    )
    closeTo(
      state.role.y + (ONE_LINE.role.height * scale) / 2,
      nameCenterY + roleCenterOffsetY * scale,
      'centro Y de la copia del puesto',
    )
    closeTo(state.role.scale, scale, 'escala del puesto = escala del nombre')
  })

  test('desde s = 0,8 la copia vale 0 y se queda ahí', () => {
    closeTo(computeBrandFlight(atS(ONE_LINE, 0.8), false).roleOpacity, 0, 'role s=0,8')
    closeTo(computeBrandFlight(atS(ONE_LINE, 1), false).roleOpacity, 0, 'role s=1')
    closeTo(computeBrandFlight(atS(ONE_LINE, 1.04), false).roleOpacity, 0, 'role s=1,04')
    closeTo(computeBrandFlight(atS(ONE_LINE, 2), false).roleOpacity, 0, 'role s=2')
  })

  test('con scrollY negativo la copia es invisible', () => {
    closeTo(computeBrandFlight(withScroll(ONE_LINE, -50), false).roleOpacity, 0, 'role negativo')
  })

  test('sigue a s con heroShift negativo, no a scrollY', () => {
    const shifted = { ...ONE_LINE, heroShift: -120 }
    closeTo(computeBrandFlight(atS(shifted, 0.4), false).roleOpacity, 0.5, 'role con heroShift')
  })

  test('es no creciente desde s = 0,02 en toda la malla', () => {
    let previous = Infinity
    for (let i = 2; i <= 104; i++) {
      const value = computeBrandFlight(atS(ONE_LINE, i / 100), false).roleOpacity
      assert.ok(value <= previous + EPSILON, `role sube en s=${i / 100}`)
      assert.ok(value >= 0 && value <= 1, `role fuera de rango en s=${i / 100}`)
      previous = value
    }
  })

  test('con movimiento reducido no hay copia en ningún s', () => {
    for (const s of [0, 0.5, 0.8, 1.04, 2]) {
      closeTo(computeBrandFlight(atS(ONE_LINE, s), true).roleOpacity, 0, `role reducido s=${s}`)
    }
  })

  test('en composición sin vuelo por degradación no hay copia', () => {
    const broken = withBox(ONE_LINE, 'logo', { ...ONE_LINE.logo, width: 0 })
    closeTo(computeBrandFlight(atS(broken, 0.9), false).roleOpacity, 0, 'role degradado por caja')
    const noDistance = withBox(ONE_LINE, 'name', { ...ONE_LINE.name, top: -100000 })
    closeTo(computeBrandFlight(noDistance, false).roleOpacity, 0, 'role degradado por D ≤ 0')
  })
})

describe('fixture de tres líneas', () => {
  test('en s = 1 la escala es 0,45, los centros coinciden y el ancho no', () => {
    const state = computeBrandFlight(atS(THREE_LINES, 1), false)
    const targetCenter = boxCenter(THREE_LINES.brandName)
    const center = copyCenter(state.name, THREE_LINES.name)
    const scaledWidth = THREE_LINES.name.width * state.name.scale
    const scaledHeight = THREE_LINES.name.height * state.name.scale

    closeTo(state.name.scale, 36 / 80, 'escala 36/80')
    closeTo(scaledHeight, 135, 'alto de la copia con tres líneas')
    closeTo(center.x, targetCenter.x, 'centro X coincidente', 1)
    closeTo(center.y, targetCenter.y, 'centro Y coincidente', 1)
    assert.ok(
      Math.abs(scaledWidth - THREE_LINES.brandName.width) > 1,
      'el ancho no coincide: el fantasma es mayor que con dos líneas',
    )
    closeTo(
      state.logo.scale * THREE_LINES.logo.height,
      THREE_LINES.brandLogo.height,
      'marca encajada',
      1,
    )
  })
})

describe('fixture de dos líneas', () => {
  test('en s = 1 la escala es 0,45, los centros coinciden y el ancho no', () => {
    const state = computeBrandFlight(atS(TWO_LINES, 1), false)
    const targetCenter = boxCenter(TWO_LINES.brandName)
    const center = copyCenter(state.name, TWO_LINES.name)
    const scaledWidth = TWO_LINES.name.width * state.name.scale
    const scaledHeight = TWO_LINES.name.height * state.name.scale

    closeTo(state.name.scale, 18 / 40, 'escala 18/40')
    closeTo(scaledHeight, 45, 'alto de la copia')
    closeTo(center.x, targetCenter.x, 'centro X coincidente', 1)
    closeTo(center.y, targetCenter.y, 'centro Y coincidente', 1)
    assert.ok(
      Math.abs(scaledWidth - TWO_LINES.brandName.width) > 1,
      'el ancho no coincide: el fantasma breve está admitido',
    )
    closeTo(state.logo.scale * TWO_LINES.logo.width, TWO_LINES.brandLogo.width, 'marca encajada', 1)
  })
})
