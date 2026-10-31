import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  HERO_ID,
  MAIN_ID,
  NAV_SECTIONS,
} from '../data/navigation.ts'
import {
  BASE_DOCUMENT_TITLE,
  SITE_AUTHOR,
  SITE_ROLE,
  buildDocumentTitle,
  getFooterYear,
  getSectionLabel,
  nextPanelState,
  selectActiveSection,
} from './navigation.ts'
import type { PanelEvent, PanelState } from './navigation.ts'
import type { SectionPosition } from './navigation.ts'

// Fixture base de §4.1 del plan: O = 80, ventana = 800, documento = 4400.
const ANCHOR_OFFSET = 80
const VIEWPORT_HEIGHT = 800
const DOCUMENT_HEIGHT = 4400

const SECTIONS: readonly SectionPosition[] = [
  { id: 'sobre-mi', top: 900 },
  { id: 'proyectos', top: 1800 },
  { id: 'servicios', top: 2700 },
  { id: 'contacto', top: 3400 },
]

function active(
  scrollY: number,
  overrides: {
    sections?: readonly SectionPosition[]
    anchorOffset?: number
    documentHeight?: number
    viewportHeight?: number
  } = {},
): string | null {
  return selectActiveSection(
    scrollY,
    overrides.sections ?? SECTIONS,
    overrides.anchorOffset ?? ANCHOR_OFFSET,
    overrides.documentHeight ?? DOCUMENT_HEIGHT,
    overrides.viewportHeight ?? VIEWPORT_HEIGHT,
  )
}

describe('constantes de identidad y de documento', () => {
  test('coinciden con el plan', () => {
    assert.equal(SITE_AUTHOR, 'Héctor Gutiérrez')
    assert.equal(SITE_ROLE, 'Ingeniero de Software')
    assert.equal(BASE_DOCUMENT_TITLE, 'Héctor Gutiérrez | Ingeniero de Software')
  })
})

describe('NAV_SECTIONS', () => {
  test('son exactamente las cuatro secciones en el orden acordado', () => {
    assert.deepEqual(
      NAV_SECTIONS.map(({ id }) => id),
      ['sobre-mi', 'proyectos', 'servicios', 'contacto'],
    )
  })

  test('las etiquetas son las de los encabezados', () => {
    assert.deepEqual(
      NAV_SECTIONS.map(({ label }) => label),
      ['Sobre mí', 'Proyectos', 'Servicios', 'Contacto'],
    )
  })

  test('no hay identificadores duplicados', () => {
    const ids = NAV_SECTIONS.map(({ id }) => id)
    assert.equal(new Set(ids).size, ids.length)
  })

  test('HERO_ID y MAIN_ID son los identificadores acordados', () => {
    assert.equal(HERO_ID, 'inicio')
    assert.equal(MAIN_ID, 'contenido')
  })
})

describe('selectActiveSection: tabla de §4.1 del plan', () => {
  const casos: ReadonlyArray<{
    scrollY: number
    expected: string | null
    motivo: string
  }> = [
    { scrollY: 0, expected: null, motivo: 'tope' },
    { scrollY: 818, expected: null, motivo: '899 < 900' },
    { scrollY: 819, expected: 'sobre-mi', motivo: '900 ≤ 900 (tolerancia 1 px)' },
    { scrollY: 1719, expected: 'proyectos', motivo: 'límite exacto' },
    { scrollY: 3318, expected: 'servicios', motivo: '3399 < 3400' },
    { scrollY: 3319, expected: 'contacto', motivo: 'límite exacto' },
    { scrollY: 820, expected: 'sobre-mi', motivo: 'reposo tras ancla (top − O)' },
    { scrollY: 1720, expected: 'proyectos', motivo: 'reposo tras ancla' },
    { scrollY: 2620, expected: 'servicios', motivo: 'reposo tras ancla' },
    { scrollY: 3320, expected: 'contacto', motivo: 'reposo tras ancla' },
    { scrollY: 3599, expected: 'contacto', motivo: 'final del documento' },
    { scrollY: -50, expected: null, motivo: 'negativo = tope' },
  ]

  for (const { scrollY, expected, motivo } of casos) {
    test(`scrollY = ${scrollY} → ${String(expected)} (${motivo})`, () => {
      assert.equal(active(scrollY), expected)
    })
  }

  test('un documento sin recorrido (700) no tiene sección activa', () => {
    assert.equal(active(0, { documentHeight: 700 }), null)
    assert.equal(active(100, { documentHeight: 700 }), null)
  })

  test('una lista vacía devuelve null', () => {
    assert.equal(active(2000, { sections: [] }), null)
    assert.equal(active(0, { sections: [] }), null)
  })

  test('con dos top iguales gana la última de la lista', () => {
    const repeated: readonly SectionPosition[] = [
      { id: 'sobre-mi', top: 900 },
      { id: 'proyectos', top: 900 },
    ]
    assert.equal(active(900, { sections: repeated }), 'proyectos')
  })

  test('una sola sección por encima del tope', () => {
    assert.equal(active(0, { sections: [{ id: 'contacto', top: 0 }] }), 'contacto')
  })

  test('el negativo se satura en el tope y no adelanta secciones', () => {
    assert.equal(active(-500), null)
    assert.equal(active(-500, { sections: [{ id: 'sobre-mi', top: 0 }] }), 'sobre-mi')
  })
})

describe('selectActiveSection: fixture de final (3400/4000/800)', () => {
  const unaSola: readonly SectionPosition[] = [{ id: 'contacto', top: 3400 }]
  const opciones = { sections: unaSola, documentHeight: 4000 } as const

  test('con 3200 gana la regla de final', () => {
    // 3200 + 800 = 4000 ≥ 3999 → última sección; la regla normal acaba en
    // referencia 3281 y no llega a 3400.
    assert.equal(active(3200, opciones), 'contacto')
  })

  test('con 3198 no hay sección activa (3998 < 3999 y 3400 > 3279)', () => {
    assert.equal(active(3198, opciones), null)
  })
})

describe('selectActiveSection: guardas defensivas', () => {
  test('entradas no finitas devuelven null', () => {
    assert.equal(active(Number.NaN), null)
    assert.equal(active(Number.POSITIVE_INFINITY), null)
    assert.equal(active(100, { anchorOffset: Number.NaN }), null)
    assert.equal(active(100, { documentHeight: Number.POSITIVE_INFINITY }), null)
    assert.equal(active(100, { viewportHeight: Number.NaN }), null)
  })

  test('una sección con top no finito se ignora', () => {
    const rota: readonly SectionPosition[] = [
      { id: 'sobre-mi', top: 900 },
      { id: 'proyectos', top: Number.NaN },
    ]
    assert.equal(active(1800, { sections: rota }), 'sobre-mi')
  })

  test('la misma entrada da el mismo resultado en cualquier orden', () => {
    const primero = active(1800)
    active(0)
    active(-50, { sections: [] })
    assert.equal(active(1800), primero)
  })
})

describe('buildDocumentTitle', () => {
  test('sin sección activa devuelve el título base', () => {
    assert.equal(buildDocumentTitle(null), BASE_DOCUMENT_TITLE)
    assert.equal(
      buildDocumentTitle(null),
      'Héctor Gutiérrez | Ingeniero de Software',
    )
  })

  test('con etiqueta devuelve «Héctor Gutiérrez | {etiqueta}»', () => {
    assert.equal(buildDocumentTitle('Sobre mí'), 'Héctor Gutiérrez | Sobre mí')
    assert.equal(buildDocumentTitle('Proyectos'), 'Héctor Gutiérrez | Proyectos')
    assert.equal(buildDocumentTitle('Servicios'), 'Héctor Gutiérrez | Servicios')
    assert.equal(buildDocumentTitle('Contacto'), 'Héctor Gutiérrez | Contacto')
  })
})

describe('getSectionLabel', () => {
  test('cada identificador de NAV_SECTIONS devuelve su etiqueta', () => {
    for (const { id, label } of NAV_SECTIONS) {
      assert.equal(getSectionLabel(id), label, id)
    }
  })

  test('un identificador desconocido o null devuelve null', () => {
    assert.equal(getSectionLabel('inicio'), null)
    assert.equal(getSectionLabel('inexistente'), null)
    assert.equal(getSectionLabel(''), null)
    assert.equal(getSectionLabel(null), null)
  })
})

describe('getFooterYear', () => {
  test('devuelve el año de la fecha recibida', () => {
    assert.equal(getFooterYear(new Date(2026, 0, 1)), 2026)
    assert.equal(getFooterYear(new Date(2024, 11, 31)), 2024)
  })

  test('no usa el reloj implícito', () => {
    const pasada = new Date(2001, 5, 15)
    assert.equal(getFooterYear(pasada), 2001)
    assert.equal(getFooterYear(pasada), 2001)
  })
})

describe('nextPanelState', () => {
  const eventos: readonly PanelEvent[] = [
    'toggle',
    'select',
    'escape',
    'outside',
    'pageScroll',
    'breakpoint',
  ]

  const esperado: Record<PanelEvent, (open: boolean) => PanelState> = {
    toggle: (open) => ({ open: !open, returnFocus: false }),
    select: () => ({ open: false, returnFocus: false }),
    escape: () => ({ open: false, returnFocus: true }),
    outside: () => ({ open: false, returnFocus: false }),
    pageScroll: () => ({ open: false, returnFocus: false }),
    breakpoint: () => ({ open: false, returnFocus: false }),
  }

  for (const open of [false, true]) {
    test(`los seis eventos desde open = ${open}`, () => {
      for (const event of eventos) {
        assert.deepEqual(
          nextPanelState(open, event),
          esperado[event](open),
          `${event} con open = ${open}`,
        )
      }
    })
  }

  test('toggle invierte y el resto cierra', () => {
    assert.deepEqual(nextPanelState(false, 'toggle'), { open: true, returnFocus: false })
    assert.deepEqual(nextPanelState(true, 'toggle'), { open: false, returnFocus: false })
    for (const event of ['select', 'outside', 'pageScroll', 'breakpoint'] as const) {
      assert.equal(nextPanelState(true, event).open, false, event)
    }
  })

  test('Escape es el único que devuelve el foco', () => {
    for (const open of [false, true]) {
      for (const event of eventos) {
        assert.equal(
          nextPanelState(open, event).returnFocus,
          event === 'escape',
          `${event} con open = ${open}`,
        )
      }
    }
  })
})

describe('contrato de index.html (RF-8, RNF-6)', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/)
  const descriptionTag = html.match(/<meta[^>]*\bname="description"[^>]*>/)
  const descriptionMatch = descriptionTag
    ? descriptionTag[0].match(/\bcontent="([^"]*)"/)
    : null

  test('el documento servido lleva el título base exacto', () => {
    assert.ok(titleMatch, 'falta <title>')
    assert.equal(titleMatch[1].trim(), BASE_DOCUMENT_TITLE)
    assert.equal(titleMatch[1].trim(), 'Héctor Gutiérrez | Ingeniero de Software')
  })

  test('la descripción existe y mide entre 50 y 160 caracteres', () => {
    assert.ok(descriptionTag, 'falta <meta name="description">')
    assert.ok(descriptionMatch, 'la descripción no tiene atributo content')
    const description = descriptionMatch[1].trim()
    assert.ok(
      description.length >= 50,
      `descripción demasiado corta: ${description.length} caracteres`,
    )
    assert.ok(
      description.length <= 160,
      `descripción demasiado larga: ${description.length} caracteres`,
    )
  })

  test('no hay etiquetas sociales ni datos estructurados', () => {
    assert.ok(!html.includes('og:'), 'no debe haber Open Graph')
    assert.ok(!html.includes('twitter:'), 'no debe haber Twitter Cards')
    assert.ok(!html.includes('application/ld+json'), 'no debe haber datos estructurados')
  })
})
