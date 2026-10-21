import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readStoredTheme, writeStoredTheme } from './themeStorage.ts'
import type { ThemeStorage } from './themeStorage.ts'
import { THEME_STORAGE_KEY } from './theme.ts'

type RecordingStorage = ThemeStorage & {
  entries: Map<string, string>
  writes: Array<[string, string]>
}

function createStorage(initial?: string): RecordingStorage {
  const entries = new Map<string, string>()
  const writes: Array<[string, string]> = []
  if (initial !== undefined) entries.set(THEME_STORAGE_KEY, initial)

  return {
    entries,
    writes,
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    setItem(key: string, value: string) {
      writes.push([key, value])
      entries.set(key, value)
    },
  }
}

function createThrowingStorage(): ThemeStorage {
  return {
    getItem() {
      throw new Error('getItem bloqueado')
    },
    setItem() {
      throw new Error('setItem bloqueado')
    },
  }
}

describe('readStoredTheme', () => {
  test('lee los temas válidos guardados', () => {
    assert.equal(readStoredTheme(createStorage('light')), 'light')
    assert.equal(readStoredTheme(createStorage('dark')), 'dark')
  })

  test('devuelve null si no hay valor guardado', () => {
    assert.equal(readStoredTheme(createStorage()), null)
  })

  test('devuelve null si el valor guardado no es válido', () => {
    for (const raw of ['', 'Dark', 'system', '{"theme":"dark"}', 'auto']) {
      assert.equal(readStoredTheme(createStorage(raw)), null, `raw=${raw}`)
    }
  })

  test('devuelve null si getItem lanza', () => {
    assert.equal(readStoredTheme(createThrowingStorage()), null)
  })

  test('devuelve null si no hay storage', () => {
    assert.equal(readStoredTheme(null), null)
    assert.equal(readStoredTheme(undefined), null)
  })
})

describe('writeStoredTheme', () => {
  test('guarda el tema con la clave acordada y el valor plano', () => {
    const storage = createStorage()
    assert.equal(writeStoredTheme(storage, 'dark'), true)
    assert.deepEqual(storage.writes, [[THEME_STORAGE_KEY, 'dark']])

    assert.equal(writeStoredTheme(storage, 'light'), true)
    assert.deepEqual(storage.writes, [
      [THEME_STORAGE_KEY, 'dark'],
      [THEME_STORAGE_KEY, 'light'],
    ])
    assert.deepEqual([...storage.entries.keys()], [THEME_STORAGE_KEY])
  })

  test('el valor guardado vuelve a leerse como el mismo tema', () => {
    const storage = createStorage()
    writeStoredTheme(storage, 'light')
    assert.equal(readStoredTheme(storage), 'light')
  })

  test('devuelve false si setItem lanza y no propaga el error', () => {
    assert.equal(writeStoredTheme(createThrowingStorage(), 'dark'), false)
  })

  test('devuelve false si no hay storage', () => {
    assert.equal(writeStoredTheme(null, 'dark'), false)
    assert.equal(writeStoredTheme(undefined, 'dark'), false)
  })
})
