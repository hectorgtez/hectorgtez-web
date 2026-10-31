import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HERO_BG_FACTOR,
  HERO_BG_MAX_FACTOR,
  HERO_TEXT_FACTOR,
  HERO_TEXT_SAFE_MARGIN,
  computeHeroOffsets,
  heroProgress,
  textFreeSpace,
} from './heroParallax.ts'
import type { HeroMetrics } from './heroParallax.ts'

const EPSILON = 1e-9

function closeTo(actual: number, expected: number, label: string): void {
  assert.ok(
    Math.abs(actual - expected) < EPSILON,
    `${label}: se esperaba ${expected} y se obtuvo ${actual}`,
  )
}

function metrics(
  overrides: Partial<HeroMetrics> = {},
): HeroMetrics {
  return {
    scrollY: 0,
    heroTop: 64,
    H: 800,
    textBlockHeight: 100,
    ...overrides,
  }
}

describe('constantes de diseño', () => {
  test('coinciden con el plan', () => {
    assert.equal(HERO_BG_FACTOR, 0.13)
    assert.equal(HERO_BG_MAX_FACTOR, 0.15)
    assert.equal(HERO_TEXT_FACTOR, 0.325)
    assert.equal(HERO_TEXT_SAFE_MARGIN, 16)
  })
})

describe('heroProgress', () => {
  test('en el tope es 0', () => {
    assert.equal(heroProgress(0, 64, 800), 0)
  })

  test('un scroll negativo se trata como 0', () => {
    assert.equal(heroProgress(-120, 64, 800), 0)
  })

  test('crece desde el primer píxel, sin zona muerta', () => {
    const p = heroProgress(1, 64, 800)
    assert.ok(p > 0, `p debería ser > 0 y es ${p}`)
    closeTo(p, 1 / 864, 'p con scrollY = 1')
  })

  test('sigue la fórmula clamp(scrollY / (heroTop + H), 0, 1)', () => {
    closeTo(heroProgress(200, 64, 800), 200 / 864, 'p intermedio')
    closeTo(heroProgress(432, 64, 800), 0.5, 'p a mitad del recorrido')
  })

  test('llega a 1 al final del recorrido y se congela más allá', () => {
    assert.equal(heroProgress(864, 64, 800), 1)
    assert.equal(heroProgress(2000, 64, 800), 1)
  })

  test('con recorrido no positivo devuelve 0 (evita dividir por cero)', () => {
    assert.equal(heroProgress(0, 0, 0), 0)
    assert.equal(heroProgress(50, 0, 0), 0)
    assert.equal(heroProgress(50, -100, 50), 0)
    assert.equal(heroProgress(50, 10, -20), 0)
  })
})

describe('textFreeSpace', () => {
  test('es (H - bloque) / 2 - 16 con margen de seguridad', () => {
    closeTo(textFreeSpace(800, 100), 334, 'bloque de 100 px')
    closeTo(textFreeSpace(600, 200), 184, 'bloque de 200 px')
  })

  test('nunca es negativo', () => {
    assert.equal(textFreeSpace(100, 68), 0)
    assert.equal(textFreeSpace(100, 80), 0)
  })

  test('con H no positivo devuelve 0', () => {
    assert.equal(textFreeSpace(0, 100), 0)
    assert.equal(textFreeSpace(-10, 100), 0)
  })

  test('con bloque no positivo devuelve 0', () => {
    assert.equal(textFreeSpace(800, 0), 0)
    assert.equal(textFreeSpace(800, -50), 0)
  })

  test('con bloque igual o mayor que H devuelve 0', () => {
    assert.equal(textFreeSpace(800, 800), 0)
    assert.equal(textFreeSpace(800, 900), 0)
  })
})

describe('computeHeroOffsets: casos límite de RNF-7', () => {
  test('scrollY = 0 devuelve { 0, 0 }', () => {
    assert.deepEqual(computeHeroOffsets(metrics({ scrollY: 0 }), false), {
      background: 0,
      text: 0,
    })
  })

  test('scrollY negativo devuelve { 0, 0 }', () => {
    for (const scrollY of [-1, -50, -1000]) {
      assert.deepEqual(
        computeHeroOffsets(metrics({ scrollY }), false),
        { background: 0, text: 0 },
        `scrollY = ${scrollY}`,
      )
    }
  })

  test('scrollY = 1 ya mueve ambas capas (sin zona muerta)', () => {
    const { background, text } = computeHeroOffsets(
      metrics({ scrollY: 1 }),
      false,
    )
    assert.ok(background > 0, `background debería ser > 0 y es ${background}`)
    assert.ok(text < 0, `text debería ser < 0 y es ${text}`)
  })

  test('valores intermedios siguen 0,13·H·p y −0,325·H·p con ratio 2,5', () => {
    const H = 800
    const heroTop = 64
    const textBlockHeight = 100

    for (const scrollY of [1, 100, 200, 432, 600]) {
      const p = scrollY / (heroTop + H)
      const offsets = computeHeroOffsets(
        { scrollY, heroTop, H, textBlockHeight },
        false,
      )
      const expectedBackground = HERO_BG_FACTOR * H * p
      const expectedText = -HERO_TEXT_FACTOR * H * p

      closeTo(offsets.background, expectedBackground, `background en ${scrollY}`)
      closeTo(offsets.text, expectedText, `text en ${scrollY}`)
      closeTo(
        Math.abs(offsets.text) / offsets.background,
        2.5,
        `el texto recorre 2,5× el fondo en ${scrollY}`,
      )
    }
  })

  test('en scrollY = heroTop + H se alcanza p = 1', () => {
    const { background, text } = computeHeroOffsets(
      metrics({ scrollY: 864 }),
      false,
    )
    closeTo(background, HERO_BG_FACTOR * 800, 'background al final')
    closeTo(text, -HERO_TEXT_FACTOR * 800, 'text al final')
  })

  test('más allá de heroTop + H se congela en el valor de p = 1', () => {
    const atEnd = computeHeroOffsets(metrics({ scrollY: 864 }), false)
    for (const scrollY of [865, 1000, 5000]) {
      const beyond = computeHeroOffsets(metrics({ scrollY }), false)
      assert.deepEqual(beyond, atEnd, `scrollY = ${scrollY}`)
    }
  })

  test('la misma entrada da el mismo resultado en cualquier orden', () => {
    const input = metrics({ scrollY: 300 })
    const first = computeHeroOffsets(input, false)
    computeHeroOffsets(metrics({ scrollY: 700 }), false)
    computeHeroOffsets(input, true)
    const second = computeHeroOffsets(input, false)
    assert.deepEqual(second, first)
  })

  test('H = 0 y H < 0 devuelven { 0, 0 }', () => {
    for (const H of [0, -1, -800]) {
      assert.deepEqual(
        computeHeroOffsets(metrics({ scrollY: 100, H }), false),
        { background: 0, text: 0 },
        `H = ${H}`,
      )
    }
  })

  test('bloque de texto no positivo o mayor que H deja text = 0', () => {
    for (const textBlockHeight of [0, -10, 800, 900]) {
      const { background, text } = computeHeroOffsets(
        metrics({ scrollY: 432, textBlockHeight }),
        false,
      )
      assert.equal(text, 0, `bloque = ${textBlockHeight}`)
      assert.ok(background > 0, `el fondo no se recorta con el texto`)
    }
  })

  test('bloque muy alto recorta el texto al espacio libre y deja intacto el fondo', () => {
    const H = 800
    const textBlockHeight = 700
    const free = textFreeSpace(H, textBlockHeight)
    const { background, text } = computeHeroOffsets(
      { scrollY: 864, heroTop: 64, H, textBlockHeight },
      false,
    )

    closeTo(free, 34, 'espacio libre')
    closeTo(text, -free, 'texto recortado al límite de seguridad')
    closeTo(background, HERO_BG_FACTOR * H, 'fondo sin recorte')
    assert.ok(Math.abs(text) < HERO_TEXT_FACTOR * H, 'el texto va por debajo del diseño')
  })

  test('movimiento reducido devuelve { 0, 0 } en todo el recorrido', () => {
    for (const scrollY of [0, 1, 432, 864, 2000]) {
      assert.deepEqual(
        computeHeroOffsets(metrics({ scrollY }), true),
        { background: 0, text: 0 },
        `scrollY = ${scrollY}`,
      )
    }
  })

  test('entradas no finitas devuelven { 0, 0 }', () => {
    const cases: Array<[string, Partial<HeroMetrics>]> = [
      ['scrollY NaN', { scrollY: Number.NaN }],
      ['scrollY Infinity', { scrollY: Number.POSITIVE_INFINITY }],
      ['heroTop NaN', { heroTop: Number.NaN, scrollY: 100 }],
      ['heroTop -Infinity', { heroTop: Number.NEGATIVE_INFINITY, scrollY: 100 }],
      ['H NaN', { H: Number.NaN }],
      ['H Infinity', { H: Number.POSITIVE_INFINITY }],
      ['bloque NaN', { textBlockHeight: Number.NaN }],
      ['bloque Infinity', { textBlockHeight: Number.POSITIVE_INFINITY }],
    ]

    for (const [label, overrides] of cases) {
      assert.deepEqual(
        computeHeroOffsets(metrics(overrides), false),
        { background: 0, text: 0 },
        label,
      )
    }
  })
})

describe('computeHeroOffsets: cotas y signos', () => {
  test('background ≤ 0,15·H y |text| ≤ 0,325·H en una malla de entradas', () => {
    const heroTops = [0, 64, -40]
    const heights = [1, 100, 320, 800, 1600]
    const blocks = [0, 1, 48, 200, 320, 800, 1600]
    const scrolls = [-200, 0, 1, 50, 200, 432, 864, 1600, 5000]

    for (const heroTop of heroTops) {
      for (const H of heights) {
        for (const textBlockHeight of blocks) {
          for (const scrollY of scrolls) {
            const { background, text } = computeHeroOffsets(
              { scrollY, heroTop, H, textBlockHeight },
              false,
            )
            const label = `scrollY=${scrollY} heroTop=${heroTop} H=${H} bloque=${textBlockHeight}`

            assert.ok(background >= 0, `background negativo: ${label}`)
            assert.ok(text <= 0, `text positivo: ${label}`)
            assert.ok(
              background <= HERO_BG_MAX_FACTOR * H + EPSILON,
              `background fuera de cota: ${label}`,
            )
            assert.ok(
              Math.abs(text) <= HERO_TEXT_FACTOR * H + EPSILON,
              `text fuera de cota: ${label}`,
            )
            assert.ok(
              Math.abs(text) <= textFreeSpace(H, textBlockHeight) + EPSILON,
              `text supera el espacio libre: ${label}`,
            )
          }
        }
      }
    }
  })
})
