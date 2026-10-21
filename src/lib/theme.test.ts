import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  THEME_STORAGE_KEY,
  getNextTheme,
  isTheme,
  parseStoredTheme,
  resolveTheme,
  serializeTheme,
  systemThemeFrom,
} from './theme.ts'
import type { Theme } from './theme.ts'

const VALID_THEMES: Theme[] = ['light', 'dark']
const INVALID_VALUES: unknown[] = [
  '',
  'Dark',
  'system',
  '{"theme":"dark"}',
  'auto',
  null,
  undefined,
]

describe('THEME_STORAGE_KEY', () => {
  test('es la clave acordada', () => {
    assert.equal(THEME_STORAGE_KEY, 'hectorgtez-theme')
  })
})

describe('isTheme', () => {
  test('acepta exactamente light y dark', () => {
    assert.equal(isTheme('light'), true)
    assert.equal(isTheme('dark'), true)
  })

  test('rechaza cualquier otro valor', () => {
    for (const value of INVALID_VALUES) {
      assert.equal(isTheme(value), false, `isTheme(${String(value)})`)
    }
  })
})

describe('parseStoredTheme', () => {
  test('devuelve los temas válidos', () => {
    assert.equal(parseStoredTheme('light'), 'light')
    assert.equal(parseStoredTheme('dark'), 'dark')
  })

  test('devuelve null para valores inválidos o ausentes', () => {
    for (const value of INVALID_VALUES) {
      const raw = value as string | null | undefined
      assert.equal(parseStoredTheme(raw), null, `parseStoredTheme(${String(value)})`)
    }
  })
})

describe('systemThemeFrom', () => {
  test('true representa el tema oscuro', () => {
    assert.equal(systemThemeFrom(true), 'dark')
  })

  test('false representa el tema claro', () => {
    assert.equal(systemThemeFrom(false), 'light')
  })

  test('null y undefined no son determinables', () => {
    assert.equal(systemThemeFrom(null), null)
    assert.equal(systemThemeFrom(undefined), null)
  })
})

describe('resolveTheme', () => {
  test('la preferencia guardada manda sobre el sistema', () => {
    assert.equal(resolveTheme('light', 'dark'), 'light')
    assert.equal(resolveTheme('dark', 'light'), 'dark')
  })

  test('sin preferencia guardada se usa el sistema', () => {
    assert.equal(resolveTheme(null, 'light'), 'light')
    assert.equal(resolveTheme(null, 'dark'), 'dark')
  })

  test('sin guardada ni sistema se cae al tema oscuro', () => {
    assert.equal(resolveTheme(null, null), 'dark')
  })
})

describe('getNextTheme', () => {
  test('alterna entre claro y oscuro', () => {
    assert.equal(getNextTheme('light'), 'dark')
    assert.equal(getNextTheme('dark'), 'light')
  })

  test('ida y vuelta devuelve el tema original', () => {
    for (const theme of VALID_THEMES) {
      assert.equal(getNextTheme(getNextTheme(theme)), theme)
    }
  })
})

describe('serializeTheme', () => {
  test('guarda el identificador plano', () => {
    assert.equal(serializeTheme('light'), 'light')
    assert.equal(serializeTheme('dark'), 'dark')
  })

  test('su inverso es parseStoredTheme', () => {
    for (const theme of VALID_THEMES) {
      assert.equal(parseStoredTheme(serializeTheme(theme)), theme)
    }
  })
})

describe('contrato de index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  const inlineScriptMatch = html.match(/<script>([\s\S]*?)<\/script>/)
  const inlineScript = inlineScriptMatch ? inlineScriptMatch[1] : ''

  test('declara el idioma español', () => {
    assert.match(html, /<html[^>]*\blang="es"/)
  })

  test('aplica el tema antes del módulo de Vite', () => {
    assert.ok(inlineScriptMatch, 'falta el script clásico inline')
    const scriptIndex = html.indexOf(inlineScriptMatch[0])
    const moduleIndex = html.indexOf('type="module"')
    assert.ok(scriptIndex >= 0, 'el script inline debe existir')
    assert.ok(moduleIndex >= 0, 'el módulo de Vite debe existir')
    assert.ok(scriptIndex < moduleIndex, 'el script debe ir antes del módulo')
  })

  test('el script es síncrono y no un módulo', () => {
    assert.ok(inlineScriptMatch, 'falta el script clásico inline')
    const openingTag = inlineScriptMatch[0].slice(
      0,
      inlineScriptMatch[0].indexOf('>') + 1,
    )
    assert.doesNotMatch(openingTag, /\b(defer|async|type)\b/)
  })

  test('usa la clave de almacenamiento acordada', () => {
    assert.ok(inlineScript.includes(THEME_STORAGE_KEY))
  })

  test('valida los dos temas y escribe data-theme', () => {
    assert.ok(inlineScript.includes('document.documentElement.dataset.theme'))
    assert.ok(inlineScript.includes("'light'"))
    assert.ok(inlineScript.includes("'dark'"))
  })

  test('consulta la preferencia del sistema', () => {
    assert.ok(inlineScript.includes('(prefers-color-scheme: dark)'))
  })

  test('deja dark como reserva al aplicar el tema', () => {
    assert.match(inlineScript, /dataset\.theme\s*=[\s\S]*['"]dark['"]/)
  })
})
