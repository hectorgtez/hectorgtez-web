# Plan 001 — Navbar con conmutador de tema claro/oscuro

Spec: `specs/001-navbar-tema-claro-oscuro/spec.md` (aprobada).
Alcance: navbar sticky con marca + conmutador, tokens de paleta por tema, resolución y persistencia del tema, sin FOUC.

## 1. Principios de diseño

- **Una sola fuente de verdad para el color**: el tema se expresa como `data-theme="light|dark"` en `<html>` y la paleta vive en variables CSS. Los componentes no escriben hex ni pares de clases `bg-white dark:bg-...`.
- **Lógica pura separada de la DOM**: resolución, validación, serialización y transición de tema son funciones sin efectos; los adaptadores de navegador (`localStorage`, `matchMedia`, `document`) están en módulos aparte y no se importan desde los tests puros.
- **Componentes visuales tontos**: `Navbar` y `ThemeSwitch` reciben props y no leen almacenamiento ni medios.
- **Sin dependencias nuevas** (RNF-3) y sin paso de build nuevo: React 19 + Tailwind v4 (`@theme inline`) + script clásico en `index.html`. `@types/node` ya está en `devDependencies`, así que tipar los tests no instala nada.
- **Cambios pequeños**: se reescribe `App.tsx` (hoy es un placeholder), se añaden 6 módulos nuevos bajo `src/` más sus 2 archivos de test y se ajusta una línea de `tsconfig.app.json` para que los tests tipen; nada fuera del alcance de la spec.

## 2. Archivos y responsabilidades

| Archivo | Estado | Responsabilidad | RF |
| --- | --- | --- | --- |
| `index.html` | modificar | `lang="es"`; script síncrono *inline* en `<head>` que aplica el tema antes del primer pintado; mantiene `#root` y el módulo de Vite. | RF-5, RF-4a, RNF-6 |
| `src/index.css` | modificar | Tokens de paleta por tema (`:root` / `[data-theme]`), mapeo `@theme inline`, base `html`/`body` (fondo, color, `color-scheme`), transición de color ≤200 ms y anulación con `prefers-reduced-motion`. | RNF-1, RNF-2, RNF-7 |
| `src/lib/theme.ts` | nuevo | Tipos y **funciones puras**: validación, serialización, resolución inicial y siguiente tema. Sin DOM. | RF-4a, RNF-8 |
| `src/lib/themeStorage.ts` | nuevo | Lectura/escritura tolerante a fallos sobre un `Storage` inyectado. No toca `window` (importable en Node). | RF-4d, RNF-5 |
| `src/lib/themeRuntime.ts` | nuevo | Adaptadores de navegador: `localStorage` seguro, `matchMedia`, aplicar/leer el tema del documento, suscripción al sistema. | RF-4a, RF-4c, RF-4d, RF-5 |
| `src/hooks/useTheme.ts` | nuevo | Estado de React: tema aplicado, elección manual, listener del sistema y `toggleTheme` (aplicar + guardar). | RF-2, RF-4b, RF-4c, RF-4d |
| `src/components/layout/ThemeSwitch.tsx` | nuevo | Control visual píldora (`role="switch"`), icono sol/luna, foco visible, tamaño táctil. Solo props. | RF-3 |
| `src/components/layout/Navbar.tsx` | nuevo | `<header>` sticky con marca (enlace al inicio) y `ThemeSwitch`. Solo props. | RF-1, RF-1b |
| `src/App.tsx` | modificar | Usa `useTheme`, monta `Navbar` y aplica tokens al contenido actual (título). | RF-1, RF-2, RNF-6 |
| `src/lib/theme.test.ts` | nuevo | Tests de `theme.ts` + test de contrato del script de `index.html` (lee `../../index.html`, es decir, la raíz real). | RF-4a, RNF-8, RF-5 |
| `src/lib/themeStorage.test.ts` | nuevo | Tests de degradación del almacenamiento con dobles en memoria. | RF-4d, RNF-5 |
| `tsconfig.app.json` | modificar (una línea) | `"types": ["vite/client", "node"]` para que `tsc -b` tipe `node:test`, `node:assert` y `node:fs` de los tests colocados en `src/`. Sin dependencias nuevas (`@types/node` ya instalado). | RNF-3 (soporte de tests) |
| `MEMORY.md` | modificar (al final) | Estado, decisiones y riesgos aprendidos. | — |

`src/main.tsx` no cambia. No se crean páginas, rutas ni componentes de secciones (fuera de alcance).

## 3. Funciones puras

Convención: nada de estado global ni de variables de entorno; **todas las entradas son parámetros** (no hay dependencia de fecha, así que no aplica un parámetro «hoy»). Tipos con `type` (no `enum`) para cumplir `erasableSyntaxOnly` y permitir el *type stripping* de Node.

### `src/lib/theme.ts`

```ts
export type Theme = 'light' | 'dark'
export const THEME_STORAGE_KEY = 'hectorgtez-theme'

export function isTheme(value: unknown): value is Theme
export function parseStoredTheme(raw: string | null | undefined): Theme | null
export function serializeTheme(theme: Theme): string
export function systemThemeFrom(matchesDark: boolean | null | undefined): Theme | null
export function resolveTheme(stored: Theme | null, system: Theme | null): Theme
export function getNextTheme(theme: Theme): Theme
```

- `isTheme` / `parseStoredTheme`: aceptan solo `'light'` y `'dark'` exactos. Cualquier otra cosa (mayúsculas, JSON, `'system'`, valor de una versión futura, cadena vacía, `null`) → `null` (RNF-8).
- `serializeTheme`: devuelve el identificador plano (`'dark'`), que es lo único que se guarda (RNF-5). Su inverso es `parseStoredTheme`.
- `systemThemeFrom`: `true → 'dark'`, `false → 'light'`, `null/undefined → null` («no determinable»).
- `resolveTheme(stored, system)`: `stored ?? system ?? 'dark'` (RF-4a).
- `getNextTheme`: `'dark' → 'light'` y viceversa.

### `src/lib/themeStorage.ts`

```ts
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>
export function readStoredTheme(storage: ThemeStorage | null | undefined): Theme | null
export function writeStoredTheme(storage: ThemeStorage | null | undefined, theme: Theme): boolean
```

- `readStoredTheme`: `try { parseStoredTheme(storage.getItem(KEY)) } catch { null }`; también `null` si no hay storage.
- `writeStoredTheme`: `try { storage.setItem(KEY, serializeTheme(theme)); return true } catch { return false }`. Nunca lanza (RF-4d).

### `src/lib/themeRuntime.ts` (efectos, no testeado en Node)

```ts
export function getSafeStorage(): ThemeStorage | null            // try { window.localStorage } catch { null }
export function readAppliedTheme(root?: HTMLElement): Theme      // dataset.theme válido, si no 'dark'
export function applyTheme(theme: Theme, root?: HTMLElement): void
export function getSystemMedia(): MediaQueryList | null
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void
```

- `applyTheme` escribe solo `root.dataset.theme = theme`; el color lo resuelve el CSS (una escritura síncrona, coste despreciable).
- `readAppliedTheme` es el puente script → React: React no recalcula el tema, **lee el que ya está pintado** (RF-5, último párrafo).
- `watchSystemTheme` devuelve la función de limpieza y no hace nada si `matchMedia` no existe (sistema no determinable).

## 4. Algoritmo

### 4.1 Resolución en el pre-paint (script síncrono de `index.html`)

Se ejecuta en `<head>`, antes del módulo de React y antes de cualquier CSS inyectado por JS. Solo lectura de `localStorage` y consulta de `matchMedia` (RNF-4, RF-5).

```text
theme = null
try:
    raw = localStorage.getItem('hectorgtez-theme')
    if raw === 'light' or raw === 'dark': theme = raw
catch: ignorar
if theme === null:
    try:
        if typeof window.matchMedia === 'function':
            theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    catch: ignorar
document.documentElement.dataset.theme = theme ?? 'dark'
```

- No usa `async`, `defer`, `type="module"` ni red.
- El CSS define el tema oscuro también en `:root`, de modo que aun sin script (o si el script falla) el primer pintado es oscuro, nunca «sin tema».
- La lógica está duplicada a propósito respecto a `theme.ts` (no se puede importar un módulo antes del pintado sin volverlo asíncrono). Un test de contrato vigila la duplicación (ver §9).

### 4.2 Arranque de React (sin recalcular)

```text
theme          = readAppliedTheme()                    // data-theme ya pintado
hasManualChoice = readStoredTheme(getSafeStorage()) !== null
```

- No se vuelve a `resolveTheme`: el ícono y `aria-checked` del conmutador deben coincidir con lo ya pintado (RF-5).
- Caso límite aceptado: si el almacenamiento se puede leer en el script y falla justo al montar, `hasManualChoice` sería `false` con el tema guardado aplicado; solo afectaría al seguimiento del sistema en esa carga. No se añade estado extra al DOM para evitarlo.

### 4.3 Cambio de tema (toggle + persistencia)

```text
toggleTheme():
    next = getNextTheme(theme)
    applyTheme(next)                  // síncrono: el navegador pinta en el siguiente frame (RF-2)
    setTheme(next)
    setHasManualChoice(true)          // cuenta como elección manual aunque el guardado falle (RF-4d)
    writeStoredTheme(storage, next)   // el resultado se ignora: nunca hay error visible
```

- Sin `useEffect` para aplicar el tema: el `setAttribute` ocurre en el propio manejador, antes del siguiente pintado, y evita un frame con colores viejos.
- Pulsaciones rápidas: cada toggle parte del último estado de React y escribe el último valor; no hay estados intermedios inconsistentes.
- El efecto del listener depende de `hasManualChoice`; al pasar a `true`, se limpia el listener (RF-4c).

### 4.4 Listener de la preferencia del sistema

```text
useEffect([hasManualChoice]):
    if hasManualChoice: return
    remove = watchSystemTheme(next =>
        applyTheme(next)
        setTheme(next)
    )
    return remove
```

- `watchSystemTheme` usa `addEventListener('change')` sobre `matchMedia('(prefers-color-scheme: dark)')`; si no hay API, devuelve una limpieza vacía.
- StrictMode monta/desmonta el efecto dos veces: la limpieza elimina el listener y no se duplica (RF-4c).
- El guardado **no** se toca al seguir al sistema: solo se guarda una elección explícita (RNF-5).

## 5. Tokens de paleta con Tailwind v4

`src/index.css` (sustituye la única línea actual):

```css
@import "tailwindcss";

@theme inline {
  --color-page:         var(--theme-page);
  --color-surface:      var(--theme-surface);
  --color-line:         var(--theme-line);
  --color-ink:          var(--theme-ink);
  --color-ink-muted:    var(--theme-ink-muted);
  --color-action:       var(--theme-action);
  --color-action-hover: var(--theme-action-hover);
}

:root,
:root[data-theme="dark"] {
  color-scheme: dark;
  --theme-page: #0E0C10;
  --theme-surface: #17141B;
  --theme-line: #2B2533;
  --theme-ink: #F4F2F5;
  --theme-ink-muted: #A8A1B0;
  --theme-action: #E5C378;
  --theme-action-hover: #F2D899;
}

:root[data-theme="light"] {
  color-scheme: light;
  --theme-page: #FAF9FA;
  --theme-surface: #FFFFFF;
  --theme-line: #E6E1E8;
  --theme-ink: #1E1822;
  --theme-ink-muted: #655D6C;
  --theme-action: #5E335C;
  --theme-action-hover: #472645;
}
```

- `@theme inline` es obligatorio: hace que `bg-page` compile a `background-color: var(--theme-page)` en vez de congelar el valor en `:root`. Sin `inline`, el tema no cambiaría en caliente (se comprobó en la documentación de Tailwind v4).
- `--theme-action` / `--theme-action-hover` codifican el «color de interacción del tema»: acento en oscuro, primario en claro. Ningún componente decide hex por tema.
- Base (en `@layer base`): `html` recibe `background-color: var(--theme-page)`, `color: var(--theme-ink)` y `transition: background-color 200ms ease, color 200ms ease`; `body` hereda color y usa `bg-page` desde `App`. La transición de `html` no anima la carga inicial (no hay estado previo), solo los cambios.
- Movimiento reducido: `@media (prefers-reduced-motion: reduce) { html { transition: none } }` + `motion-reduce:transition-none` en los componentes (RNF-7).
- El fondo se aplica a `html` (no solo a `body`) para que el *overscroll* y la barra de scroll usen el color del tema y no haya franjas del tema anterior.
- `color-scheme` alinea scrollbars y controles nativos con el tema.

**Cómo se evita el FOUC**: el script del `<head>` corre de forma síncrona antes de que el navegador pinte el `<body>`; en producción el CSS es un `<link>` extraído por Vite, así que las variables `[data-theme]` ya están disponibles en el primer pintado. No hay trabajo asíncrono ni espera.

**Cómo lee React el tema**: `readAppliedTheme()` lee `document.documentElement.dataset.theme`. No hay `useEffect` de inicialización ni segundo cálculo; el switch nace con el icono y `aria-checked` coherentes.

## 6. Interfaz de componentes

### `Navbar`

```tsx
type NavbarProps = { isDark: boolean; onToggleTheme: () => void }
```

- `<header className="sticky top-0 z-50 border-b border-line bg-surface transition-colors duration-200 motion-reduce:transition-none">`.
  - `sticky` (no `fixed`): la barra permanece en el flujo, no tapa contenido y no necesita `padding-top` compensatorio → CLS 0 (RF-1b, RNF-2).
- Contenedor interior: `mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6`. Una sola fila, `min-w-0` en la marca para permitir truncado a 320 px.
- **Marca**: `<a href="/">` con texto `Héctor Gutiérrez` (texto aprobado por el usuario; ver §11), clases `truncate text-ink underline-offset-4 hover:underline focus-visible:underline active:underline visited:text-ink`.
  - Estados indicados con subrayado; el color no cambia entre reposo/hover/foco/visitado/activo, así que el contraste de RNF-1 se mantiene en todos (4.5:1 ya medido: `#F4F2F5`/`#17141B`, `#1E1822`/`#FFFFFF`).
  - Foco: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface` (anillo 2 px, separación 2 px, color texto principal; RF-1 y RNF-1).
  - `onClick`: si `event.button !== 0` o hay modificadores (`metaKey`/`ctrlKey`/`shiftKey`/`altKey`), se deja el comportamiento nativo; en clic normal `preventDefault()` + `window.scrollTo(0, 0)` → nunca recarga, y si ya está arriba es un no-op sin salto (RF-1). Scroll instantáneo: no introduce movimiento que RNF-7 deba desactivar.
- **Switch**: `<ThemeSwitch isDark={isDark} onToggle={onToggleTheme} />`, último en el DOM (orden de tabulación: marca → switch).
- Sin enlaces extra, CTA ni menú (RF-1).

### `ThemeSwitch`

```tsx
type ThemeSwitchProps = { isDark: boolean; onToggle: () => void }
```

```tsx
<button
  type="button"
  role="switch"
  aria-checked={isDark}
  aria-label="Modo oscuro"
  onClick={onToggle}
  className="group relative inline-flex h-11 w-[4.5rem] shrink-0 items-center rounded-full
             bg-action p-1 transition-colors duration-200
             hover:bg-action-hover focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2
             focus-visible:ring-offset-surface motion-reduce:transition-none"
>
  <span className={`flex size-9 items-center justify-center rounded-full bg-page text-action
                    transition-transform duration-200 motion-reduce:transition-none
                    ${isDark ? 'translate-x-7' : 'translate-x-0'}`}>
    {isDark ? <MoonIcon /> : <SunIcon />}
  </span>
</button>
```

- Nombre accesible **constante** «Modo oscuro» (RF-3a). Con el tema claro un lector anuncia «Modo oscuro, desactivado»; es intencional y coherente con el estado de la píldora.
- `aria-checked` = `isDark`; estado «activado» solo con el tema oscuro (RF-3b).
- Geometría: pista 72×44 px (`h-11 w-[4.5rem]`), relleno interior 4 px, tirador 36×36, recorrido 28 px (`translate-x-7`). El objetivo táctil es el propio botón: 72×44 ≥ 44×44 (RF-3f, supera el mínimo de 24×24).
- Posición estable: oscuro → tirador a la derecha; claro → izquierda (RF-3c).
- Iconos: SVG inline de 18×18, `fill="none"`, `stroke="currentColor"`, `strokeWidth={2}`, `aria-hidden="true"`, `focusable="false"`; sol y luna se distinguen por forma, no solo por color. Un solo icono visible, el del tema activo.
- Colores: pista `--theme-action` (hover `--theme-action-hover`), tirador `--theme-page`, icono `--theme-action`, exactamente el modelo de la spec (RF-2, RNF-1).
- Teclado: `<button type="button">` da Enter y Espacio de forma nativa (RF-3d). Sin `tabIndex` manual.
- Foco: `ring-2` + `ring-offset-2` con el color de texto principal → 2 px de anillo, 2 px de separación, 3:1 contra la superficie de la navbar en ambos temas (RF-3e, RNF-1). Es `box-shadow`, no altera el layout.
- Transición: 200 ms en `background-color` y `transform`; `motion-reduce:transition-none` (RNF-2, RNF-7).

### `useTheme`

```ts
function useTheme(): { theme: Theme; isDark: boolean; toggleTheme: () => void }
```

- `useState<Theme>(readAppliedTheme)`, `useState<boolean>(() => readStoredTheme(getSafeStorage()) !== null)`.
- `toggleTheme` según §4.3; efecto del sistema según §4.4.
- No expone `hasManualChoice` porque no hay UI de restablecer (fuera de alcance).

### `App`

- `<Navbar isDark={isDark} onToggleTheme={toggleTheme} />` + `<main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center bg-page px-4 text-ink">` con el `<h1>` actual (`hectorgtez-web`), sin cambiar el texto (RF-1, RF-2, caso límite «contenido actual»).
- Sin `overflow-hidden` en el header (recortaría el anillo de foco).

## 7. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Por qué |
| --- | --- | --- |
| `data-theme` en `<html>` + variables CSS mapeadas con `@theme inline` | Variante `dark:` con `@custom-variant` y pares `bg-white dark:bg-...` | Duplica cada clase, permite olvidar un par, dispersa la paleta y hace imposible garantizar RNF-1 por revisión. Con tokens, los hex viven en un único bloque y los tests de contraste se hacen sobre 7 variables. |
| Script **síncrono inline** en `<head>` | `useEffect` en React / `useLayoutEffect` / script `defer` / `type="module"` | Cualquier opción que dependa de React pinta antes el tema por defecto (oscuro) y produce FOUC con sistemas claros y con preferencia guardada clara (RF-5). Un módulo es diferido por definición. |
| El script solo escribe `data-theme`; React **lee** ese valor | React recalcula el tema al montar con `resolveTheme` | Garantiza que el primer render del switch coincida con lo pintado y evita una segunda fuente de verdad (RF-5). |
| Aplicar el tema en el manejador (`setAttribute` síncrono) | `useEffect` sobre `theme` | `useEffect` corre después del pintado y puede dejar un frame con el tema viejo (RF-2). |
| `sticky` para la barra | `fixed` + `padding-top` en el contenido | `fixed` saca la barra del flujo: exige compensar la altura a mano y arriesga ocultar contenido/CLS (RF-1b, RNF-2). `sticky` cumple «siempre arriba al hacer scroll» sin trucos. |
| Hook local consumido en `App` y props hacia abajo | `ThemeContext` + provider | Solo hay un consumidor (el switch). El contexto añade provider, tipos y re-renders sin beneficio (constitución: simplicidad). |
| `localStorage` encapsulado en `themeStorage.ts` con `try/catch` y valor de retorno booleano | Acceso directo a `localStorage` en el hook | Un `SecurityError` en modo privado rompería el toggle (RF-4d). El adaptador hace la degradación explícita y testeable sin DOM. |
| Iconos SVG inline propios | Instalar `lucide-react` / `react-icons` | Prohibido añadir dependencias (RNF-3). Dos SVG de 18 px no justifican una librería. |
| Foco con `box-shadow` (`ring`) | `outline` con `outline-offset` animado o borde extra | El anillo no reserva espacio (CLS 0), admite separación exacta de 2 px y no altera el tamaño del control. |
| Un único icono dentro del tirador | Dos iconos con opacidad / texto «Claro/Oscuro» | La spec exige un único icono del tema activo y prohíbe texto visible en el control (RF-3c). |
| Transición por `transition-colors` + 200 ms | Animación larga o `transition-all` | `transition-all` animaría layout y propiedades no deseadas (riesgo de CLS); RNF-2 limita a 200 ms. |
| Tests `.test.ts` junto al módulo con `"types": ["vite/client", "node"]` en `tsconfig.app.json` | `tsconfig.test.json` aparte (B) o tests `.mjs` en `tests/` (C) | Una línea frente a dos configuraciones/comandos (B) o perder el typecheck de los tests (C). `@types/node` ya está instalado: no hay dependencia ni paso de build nuevos (RNF-3). |
| Typecheck de tests dentro de `npx tsc -b` | Script `typecheck:test` separado | `include: ["src"]` ya los recoge; un test que no compila rompe el build en vez de pasar desapercibido. Sin pasos nuevos en `npm run build`. |

## 8. Estrategia de tests

Runner: `node --test` (Node 24; *type stripping* nativo de `.ts`, sin dependencias y sin jsdom). Tests con `node:test`, `node:assert/strict` y `node:fs`.

### Problema de TypeScript y opción elegida (A)

`tsconfig.app.json` usa `"include": ["src"]`, así que los `.test.ts` colocados en `src/` entran en `tsc -b`. Sin tipos de Node, importar `node:test` / `node:fs` rompería el typecheck: hoy la afirmación «`npx tsc -b` pasa sin errores nuevos» no se sostiene. Se elige la **opción A**: añadir `"node"` a `types` (una sola línea).

```json
"types": ["vite/client", "node"]
```

- **Ventaja**: una línea, los tests siguen junto al módulo y `npx tsc -b` (por tanto también `npm run build`) los tipa como cualquier otro archivo de `src/`.
- **Coste**: los globals de Node (`process`, `Buffer`, `setTimeout: NodeJS.Timeout`) quedan visibles en el código de app. Es solo tipado: no añade runtime, no instala nada (`@types/node@^24` ya está en `devDependencies`) y no altera el bundle. Se controla por revisión: ningún módulo de app usa globals de Node.
- **Descartadas**: B (`tsconfig.test.json` aparte + excluir tests) obliga a mantener dos configuraciones y dos comandos de typecheck; C (`tests/*.test.mjs`) pierde el typecheck de los propios tests y detecta menos errores de tipos. Ninguna mejora la verificación que exige la constitución.

### Comandos exactos (raíz del repo, PowerShell, Node 24)

```powershell
node --test src/lib/theme.test.ts src/lib/themeStorage.test.ts
npx tsc -b
npm run build
```

- Rutas explícitas: PowerShell no expande globs para ejecutables nativos, así que no se usa `src/lib/*.test.ts`.
- `node --test ...` funciona tal cual en Node 24, sin flags (type stripping activado por defecto). *Fallback* solo si se ejecuta Node 22.6–23.5: `node --experimental-strip-types --test src/lib/theme.test.ts src/lib/themeStorage.test.ts`.
- `npx tsc -b` valida app **y** tests, porque los tests entran por `include` en `tsconfig.app.json`.
- No se añade ningún paso a `npm run build`: ya ejecuta `tsc -b && vite build`, así que el typecheck de los tests va incluido.
- Imports entre test y módulo siempre con extensión `.ts` (`import { resolveTheme } from './theme.ts'`), habilitado por `allowImportingTsExtensions`, para que el type stripping de Node resuelva el archivo real. Los tipos se importan con `import type` (`verbatimModuleSyntax`).
- Los archivos de test viven junto al módulo (`.test.ts`) y no se empaquetan: Vite solo incluye lo que se importa desde la app.

### Cubierto por `node --test`

| Caso | RF/RNF |
| --- | --- |
| `isTheme` / `parseStoredTheme`: `'light'`, `'dark'`, `null`, `''`, `'Dark'`, `'system'`, `'{"theme":"dark"}'`, `'auto'` | RNF-8 |
| `resolveTheme`: guardada > sistema > oscuro (4 combinaciones) | RF-4a |
| `systemThemeFrom`: `true`/`false`/`null`/`undefined` | RF-4a |
| `getNextTheme`: ida y vuelta | RF-2, RF-3c |
| `serializeTheme` ↔ `parseStoredTheme` (ida y vuelta) | RNF-5 |
| `readStoredTheme` con storage que lanza en `getItem`, con `null`, con valor inválido | RF-4d |
| `writeStoredTheme` éxito → `true`, fallo → `false`, sin lanzar | RF-4d |
| Contrato de `index.html`: contiene `lang="es"`, `hectorgtez-theme`, `dataset.theme` / `data-theme`, `(prefers-color-scheme: dark)` y el literal `'dark'` de reserva | RF-5, RNF-6 (evita que el script diverja de `theme.ts`) |

El test de contrato lee el `index.html` **real de la raíz** con `node:fs`: `readFileSync(new URL('../../index.html', import.meta.url), 'utf8')` desde `src/lib/theme.test.ts`. No hay copia ni fixture, y no necesita DOM.

### Validado solo con Chrome DevTools MCP

Porque depende de pintado, CSS y accesibilidad real (no hay jsdom ni testing-library, y añadirlos está prohibido):

- FOUC: 5 recargas por escenario (guardado claro, guardado oscuro, solo sistema claro, solo sistema oscuro) con red limitada; primer píxel correcto.
- Paleta y contrastes medidos sobre colores computados (fondo, superficie, textos, pista, tirador, icono, hover, anillo de foco).
- Teclado: orden de tabulación, anillo visible, Espacio/Enter, sin trampa de foco.
- 320 px y 375 px, zoom de texto 200 %, sin scroll horizontal ni solapamientos.
- CLS 0 (panel Performance) en carga, scroll y cambio de tema.
- `prefers-reduced-motion` emulado: sin transición.
- Consola limpia, sin peticiones de red para el tema, `localStorage` con una sola clave.
- `role="switch"` / `aria-checked` / nombre accesible en el árbol de accesibilidad.

## 9. Trazabilidad RF → plan

| RF / RNF | Dónde se resuelve | Tarea |
| --- | --- | --- |
| RF-1 (navbar, marca, responsive) | `Navbar.tsx`, `App.tsx` §6 | T7, T8 |
| RF-1b (barra fija, sin ocultar contenido) | `Navbar.tsx` sticky §6, `App.tsx` | T7 |
| RF-2 (cambio de tema y colores) | `index.css` tokens §5, `useTheme` §4.3, `ThemeSwitch` §6 | T3, T5, T6 |
| RF-3 (switch accesible) | `ThemeSwitch.tsx` §6 | T6 |
| RF-4a (resolución inicial) | `theme.ts` §3, script §4.1, `useTheme` §4.2 | T1, T4, T5 |
| RF-4b (persistencia) | `useTheme` §4.3, `themeStorage.ts` | T2, T5 |
| RF-4c (seguimiento del sistema) | `themeRuntime.ts` + `useTheme` §4.4 | T5 |
| RF-4d (degradación del almacenamiento) | `themeStorage.ts` §3, `useTheme` §4.3 | T2, T5 |
| RF-5 (sin FOUC) | script §4.1 + `readAppliedTheme` §4.2 + CSS base §5 | T3, T4 |
| RNF-1 (contraste) | tokens §5, clases §6 (sin hex en componentes) | T3, T6, T8 |
| RNF-2 (≤200 ms, CLS 0) | `index.css`, clases `duration-200`, sticky | T3, T6, T7 |
| RNF-3 (sin dependencias ni red) | todo el plan; SVG inline | T1–T9 |
| RNF-4 (límite del primer pintado) | script §4.1 (solo lecturas síncronas) | T4 |
| RNF-5 (privacidad) | `THEME_STORAGE_KEY` único, `serializeTheme` | T2, T9 |
| RNF-6 (idioma) | `index.html` `lang="es"`, `aria-label="Modo oscuro"` | T4, T6 |
| RNF-7 (movimiento reducido) | media query base + `motion-reduce:*` | T3, T6, T8 |
| RNF-8 (compatibilidad futura) | `parseStoredTheme` | T1 |

## 10. Riesgos conocidos

1. **Script inline y CSP**: si en el futuro se añade una CSP estricta (`script-src 'self'`), el script inline se bloquea y vuelve el FOUC. Mitigación futura: moverlo a un `<script src="/theme-init.js">` clásico y bloqueante en `<head>` (sigue siendo síncrono). Hoy no hay CSP, así que no aplica.
2. **Duplicación script ↔ `theme.ts`**: el script no puede importar módulos. Se acota con el test de contrato (clave, atributo, media query, reserva); cualquier cambio de formato de almacenamiento exige tocar ambos y el test falla si falta uno.
3. **FOUC en desarrollo**: Vite inyecta el CSS como módulo JS en `dev`, así que antes de que cargue el módulo puede verse HTML sin estilos. No es un fallo del tema y no ocurre en producción (CSS extraído en `<link>`). La verificación de RF-5 se hace con `npm run build && npm run preview`.
4. **Tailwind v4 `@theme inline`**: si se usa `@theme` sin `inline`, los valores se congelan y el cambio de tema deja de funcionar. Está fijado en el plan y se comprueba a mano en T3 (alternar `data-theme` en DevTools).
5. **StrictMode**: los efectos se montan dos veces en desarrollo. La limpieza de `watchSystemTheme` evita listeners duplicados; el toggle es un manejador (no un efecto), así que no guarda dos veces.
6. **`matchMedia` sin `addEventListener`** en navegadores muy antiguos: se documenta `addEventListener('change')`; si no existe, `watchSystemTheme` degrada a no seguir al sistema (el tema inicial sigue siendo correcto). Sin dependencias ni polyfill.
7. **Hidratación**: no aplica, es CSR (`createRoot`), no hay HTML servido por React que pueda discrepar. El único «mismatch» posible es el ya resuelto leyendo `data-theme`.
8. **Medición de contraste durante la transición**: medir justo tras el clic puede devolver un color intermedio. Se mide cuando la transición (≤200 ms) ha terminado.
9. **Nombre accesible fijo «Modo oscuro»**: con el tema claro, el lector anuncia «Modo oscuro, desactivado». Es lo que pide RF-3a; no debe «corregirse» a una etiqueta dinámica.
10. **Marca a 320 px**: con zoom 200 % o nombres largos, el texto puede truncarse; el switch nunca se oculta (`shrink-0`). Cumple el caso límite de la spec, pero conviene revisarlo visualmente.
11. **Typings de Node en el proyecto de app (opción A)**: `"types": ["vite/client", "node"]` hace visibles `process`, `Buffer` o `NodeJS.Timeout` en `src/` sin que fallen el build. Mitigación: revisión de que ningún módulo de app los usa; los tests son los únicos que importan `node:*`. Si algún tipo de temporizador queda ambiguo frente a `lib.dom`, se anota explícitamente (`ReturnType<typeof setTimeout>`) en el punto de uso, sin tocar código existente.
12. **Tests dentro de `tsc -b`**: al entrar por `include`, los `.test.ts` deben cumplir `noUnusedLocals`, `noUnusedParameters` y `verbatimModuleSyntax` (tipos con `import type`). Beneficio: un test que no compila rompe `npm run build`; coste: el build tarda un poco más en tipar dos archivos. `npm run lint` no forma parte de las puertas de verificación de esta spec.

## 11. Puntos cerrados antes de implementar

- **Texto de la marca**: `Héctor Gutiérrez`, aprobado por el usuario. Es lo que implementa T7 en `Navbar.tsx`. El `<h1>` actual del contenido sigue siendo `hectorgtez-web` y no se toca (RF-1, caso límite «contenido actual»).
- **Scroll de la marca**: desplazamiento instantáneo a `top: 0` (sin animación) para no recargar ni saltar si ya se está arriba. Decidido en este plan; no requiere configuración adicional.

No quedan puntos abiertos: la implementación puede empezar por T1.
