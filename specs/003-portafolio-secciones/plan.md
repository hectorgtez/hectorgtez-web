# Plan 003 — Secciones del portafolio y navegación por anclas

Spec: `specs/003-portafolio-secciones/spec.md` (Estado: aprobada).
Alcance: cuatro secciones bajo el hero, contenido provisional en un único punto, menú de secciones con panel móvil, anclas nativas con margen O, scrollspy con función pura, título dinámico, foco programático, pie y metadatos estáticos.

## 1. Principios de diseño

- **Lógica pura separada de la vista**: la sección activa, el título, el año y las transiciones del panel viven en `src/lib/navigation.ts`, sin DOM ni tiempo, y se prueban con `node --test`. El hook y los componentes solo miden, escuchan y pintan.
- **Un único origen de verdad por concepto**: los identificadores y etiquetas de sección en `src/data/navigation.ts`; el contenido provisional en `src/data/site.ts`; el margen de anclaje O en una sola custom property (`--anchor-offset`) que consumen el CSS y el hook.
- **Anclas reales, no desplazamiento por JS**: los enlaces son `<a href="#id">` y no se cancela el evento por defecto. El navegador aporta fragmento, modificadores, atrás/adelante y carga directa; el margen lo pone `scroll-padding-top`.
- **Cero renders por scroll**: el scrollspy lee una vez por frame en un `rAF` y actualiza estado **solo al cambiar** el identificador activo. La barra y el menú no se re-renderizan por frame.
- **Contenido separado de la presentación**: sustituir textos o cambiar el número de tarjetas no toca componentes ni navegación.
- **Sin dependencias nuevas, sin red, sin iconos remotos**: SVG inline decorativos y tokens de color existentes.

## 2. Archivos y responsabilidades

| Archivo | Estado | Responsabilidad | RF / RNF |
| --- | --- | --- | --- |
| `src/data/navigation.ts` | nuevo | Única fuente de verdad: `SectionId`, `NavSection { id, label }`, `NAV_SECTIONS` (`sobre-mi`, `proyectos`, `servicios`, `contacto` en orden), `HERO_ID = 'inicio'`, `MAIN_ID = 'contenido'`. Sin JSX ni DOM. | RF-1, RF-2, RF-10 (RNF-7) |
| `src/data/site.ts` | nuevo | Contenido provisional con comentarios `PROVISIONAL`: identidad (`SITE_IDENTITY`), biografía + nota, ≥3 proyectos, ≥3 servicios, contacto (4 enlaces exactos) y datos del pie. Tipos exportados (`Card`, `ContactLink`). | RF-11, RF-12, RNF-5 |
| `src/lib/navigation.ts` | nuevo | Constantes (`BASE_DOCUMENT_TITLE`) y funciones puras `selectActiveSection`, `buildDocumentTitle`, `getSectionLabel`, `getFooterYear`, `nextPanelState`. Sin `window`, `document` ni `Date` implícita. | RF-6, RF-7, RF-8, RF-12, RNF-7 |
| `src/lib/navigation.test.ts` | nuevo | Tabla exacta de RNF-7 (incluido el fixture de final `3400/4000/3200` y el reposo tras ancla en las cuatro secciones), contrato de `index.html` y forma de `NAV_SECTIONS`. | RNF-7, RNF-6, RF-1 |
| `src/lib/focusHeading.ts` | nuevo | Adaptador DOM mínimo `focusHeadingForHash(hash)`: resuelve el `h1`/`h2` del destino y lo enfoca con `preventScroll: true`. Compartido por marca y enlaces; no es lógica pura y no se testea con `node --test`. | RF-9 |
| `src/hooks/useActiveSection.ts` | nuevo | Mide O (alto de la barra + 1 rem) con `ResizeObserver` sobre la barra, mide `top` de cada sección y alto de documento/ventana, escucha `scroll` pasivo con `rAF`, aplica la función pura, actualiza estado **solo al cambiar** y escribe `document.title` y `--anchor-offset`. Limpia todo al desmontar. | RF-6, RF-8, RNF-2 |
| `src/components/layout/SkipLink.tsx` | nuevo | Primer enfocable, oculto salvo al foco, destino `#contenido`, foco programático en `main`. | RF-9, RNF-3 |
| `src/components/layout/NavMenu.tsx` | nuevo | Único conjunto de cuatro enlaces: en línea desde `lg`, panel por debajo (montaje condicional). Botón «Menú» 44×44 con `aria-expanded`/`aria-controls`, cierres por `nextPanelState`, `aria-current` e indicador no cromático. | RF-2, RF-5, RF-7, RF-9 |
| `src/components/layout/Navbar.tsx` | modificado | Marca como ancla real a `#inicio` (sin `preventDefault`), `headerRef`, `min-h-16`, montaje de `NavMenu`; recibe `activeId`. Nada más cambia. | RF-2, RF-5, RF-9, RNF-4 |
| `src/components/ui/Section.tsx` | nuevo | `<section id aria-labelledby>` con `h2` visible, `tabIndex={-1}` y contenedor `max-w-6xl`; separador con token. | RF-1, RF-9, RF-10 |
| `src/components/ui/ProjectCard.tsx` / `ServiceCard.tsx` | nuevos | Tarjeta con título, descripción y etiqueta «Ejemplo»; sin enlaces, clientes, métricas, fechas ni importes. | RF-11, RNF-1 |
| `src/components/sections/About.tsx` / `Projects.tsx` / `Services.tsx` / `Contact.tsx` | nuevos | Composición de cada sección desde `Section` y los datos; contacto con correo y teléfono visibles y los cuatro enlaces exactos. | RF-1, RF-11, RF-12 |
| `src/components/layout/Footer.tsx` | nuevo | Región `footer` con nombre, año (`getFooterYear` una vez al cargar) y enlaces de correo, LinkedIn y GitHub. | RF-12, RNF-5 |
| `src/components/hero/Hero.tsx` | modificado (mínimo) | Solo `id="inicio"` en la `<section>`. Ni clases, ni textos, ni hook. | RF-1, RF-2, RF-3 |
| `src/pages/Home.tsx` | nuevo | Hero + las cuatro secciones, en orden, sin bloques intermedios. | RF-1 |
| `src/App.tsx` | modificado | `SkipLink` + `Navbar` + `<main id="contenido" tabIndex={-1}>` + `Footer`; llama `useActiveSection` una sola vez y pasa `activeId`. | RF-1, RF-6, RF-8, RF-9, RF-10 |
| `src/index.css` | modificado | `scroll-padding-top`, `scroll-behavior` solo sin movimiento reducido, `.nav-panel` (alto y `overscroll-behavior`), indicador de enlace activo, estilos de tarjeta/etiqueta/nota y foco. Solo tokens. | RF-3, RF-4, RF-5, RF-7, RNF-1, RNF-3, RNF-4 |
| `index.html` | modificado | Título estático «Héctor Gutiérrez | Ingeniero de Software» y `meta name="description"` en español de 50–160 caracteres. Sin Open Graph. | RF-8, RNF-6 |
| `MEMORY.md` | modificado (al final) | Estado, decisiones y riesgos aprendidos. | — |

No se tocan `ThemeSwitch`, `useTheme`, `useHeroParallax`, `HeroBackground` ni `src/lib/heroParallax.ts`. En `Hero.tsx` el único cambio es el `id`.

## 3. Datos y contenido

### 3.1 `src/data/navigation.ts`

```ts
export type SectionId = 'sobre-mi' | 'proyectos' | 'servicios' | 'contacto'
export type NavSection = { readonly id: SectionId; readonly label: string }

export const HERO_ID = 'inicio'
export const MAIN_ID = 'contenido'

export const NAV_SECTIONS: readonly NavSection[] = [
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'contacto', label: 'Contacto' },
]
```

- Las etiquetas son **exactamente** el texto de los `h2`: el menú y los encabezados salen de la misma lista (RF-1, RF-2).
- `HERO_ID` y `MAIN_ID` se usan en la marca, el skip link y los anclajes; ningún componente escribe un `id` a mano.

### 3.2 `src/data/site.ts`

```ts
export type Card = { readonly title: string; readonly description: string }
export type ContactLink = {
  readonly label: string           // «Correo», «LinkedIn», «GitHub», «WhatsApp»
  readonly href: string
  readonly external: boolean       // abre en pestaña nueva (3 de los 4)
  readonly detail?: string         // teléfono visible junto a WhatsApp
}

// La identidad se compone con las constantes del título para no duplicar el nombre.
export const SITE_IDENTITY = { author: SITE_AUTHOR, role: SITE_ROLE } as const

// PROVISIONAL: sustituir este bloque por el contenido real. La presentación y la
// navegación no dependen de su forma ni del número de tarjetas.
export const ABOUT = { bio: '…', provisionalNote: 'Texto provisional pendiente de sustituir' }
export const PROJECTS: readonly Card[] = [ /* 3 elementos */ ]
export const SERVICES: readonly Card[] = [ /* 3 elementos */ ]
export const CONTACT = {
  intro: '…',
  email: 'hectorgtezta@gmail.com',      // visible y enlazado con mailto:
  phone: '(667) 231 9477',              // solo texto visible
  links: [ /* correo, LinkedIn, GitHub, WhatsApp con los href exactos */ ],
}
```

- `site.ts` importa `SITE_AUTHOR` y `SITE_ROLE` de `src/lib/navigation.ts`: el nombre y el puesto viven en un solo sitio y el pie no los repite.
- El correo se muestra como texto del enlace `mailto:`; el teléfono es texto junto al enlace de WhatsApp (`https://wa.me/526672319477`), no un enlace `tel:` (RF-12, «exactamente estos cuatro enlaces»).
- Los tres enlaces externos llevan el texto visible del medio («LinkedIn», «GitHub», «WhatsApp») y un sufijo solo para lectores (`<span className="sr-only"> (se abre en una pestaña nueva)</span>`), de modo que el nombre accesible lo indica sin alargar el texto visible.
- Prohibido inventar clientes, resultados, métricas, fechas o importes: las descripciones son genéricas y funcionales.

## 4. Funciones puras (`src/lib/navigation.ts`)

```ts
export type SectionPosition = { readonly id: string; readonly top: number }

export const SITE_AUTHOR = 'Héctor Gutiérrez'
export const SITE_ROLE = 'Ingeniero de Software'
export const BASE_DOCUMENT_TITLE = `${SITE_AUTHOR} | ${SITE_ROLE}`

export function getSectionLabel(id: string | null): string | null
export function selectActiveSection(
  scrollY: number,
  sections: readonly SectionPosition[],
  anchorOffset: number,
  documentHeight: number,
  viewportHeight: number,
): string | null
export function buildDocumentTitle(activeLabel: string | null): string
export function getFooterYear(hoy: Date): number
export type PanelEvent = 'toggle' | 'select' | 'escape' | 'outside' | 'pageScroll' | 'breakpoint'
export type PanelState = { readonly open: boolean; readonly returnFocus: boolean }
export function nextPanelState(open: boolean, event: PanelEvent): PanelState
```

`selectActiveSection` aplica las reglas en este orden exacto (RNF-7):

```text
si sections.length === 0                → null
si documentHeight ≤ viewportHeight      → null          // el tope gana, incluso al final
y = max(0, scrollY)                                     // scroll negativo = tope
si y + viewportHeight ≥ documentHeight − 1 → última sección de la lista
referencia = y + anchorOffset + 1                       // línea de referencia con 1 px
última sección con top ≤ referencia                     // o null si ninguna
```

- Entradas no finitas (`NaN`, `Infinity`) devuelven `null`: guarda defensiva, no cambia el contrato.
- La lista se recorre **de atrás hacia delante**: con dos `top` iguales gana la última de la lista.
- `buildDocumentTitle`: `null` → `BASE_DOCUMENT_TITLE`; cualquier otra cosa → `Héctor Gutiérrez | {etiqueta}`.
- `getFooterYear(hoy)` devuelve `hoy.getFullYear()`; nunca llama a `Date.now()` (sin tiempo implícito).
- `nextPanelState` devuelve **siempre** uno de los seis resultados de RNF-7:

| `event` | Resultado |
| --- | --- |
| `toggle` | `{ open: !open, returnFocus: false }` |
| `select` | `{ open: false, returnFocus: false }` |
| `escape` | `{ open: false, returnFocus: true }` |
| `outside` | `{ open: false, returnFocus: false }` |
| `pageScroll` | `{ open: false, returnFocus: false }` |
| `breakpoint` | `{ open: false, returnFocus: false }` |

El desplazamiento **interno del panel** no entra en la función: el adaptador clasifica el evento de scroll (destino dentro del panel) y no lo reenvía. Así el conjunto de entradas y resultados sigue siendo exactamente el de RNF-7.

### 4.1 Tabla de casos de `selectActiveSection`

Fixture base: `anchorOffset = 80`, `viewportHeight = 800`, `documentHeight = 4400`, secciones en 900, 1800, 2700 y 3400.

| Entrada `scrollY` | Esperado | Motivo |
| --- | --- | --- |
| `0` | `null` | tope |
| `818` | `null` | `899 < 900` |
| `819` | `sobre-mi` | `900 ≤ 900` (tolerancia 1 px) |
| `1719` | `proyectos` | límite exacto |
| `3318` | `servicios` | `3399 < 3400` |
| `3319` | `contacto` | límite exacto |
| `820` (top − O) | `sobre-mi` | reposo tras ancla |
| `1720` | `proyectos` | reposo tras ancla |
| `2620` | `servicios` | reposo tras ancla |
| `3320` | `contacto` | reposo tras ancla |
| `3599` | `contacto` | final del documento |
| `-50` | `null` | negativo = tope |
| `documentHeight = 700` | `null` | sin recorrido |
| lista vacía | `null` | sin secciones |
| dos secciones con `top = 900` | la última | desempate |

Fixture de final (la regla normal **no** puede darla): una sola sección en `3400`, `documentHeight = 4000`, `viewportHeight = 800`, `scrollY = 3200` → `contacto` (`3400 > 3281`). Además `scrollY = 3198` → `null` en el mismo fixture, para demostrar que el acierto viene solo de la regla de final. Con la regla de final, `3199` ya es final (`3199 + 800 = 3999 ≥ 3999`): el caso límite inferior es `3198`.

## 5. Algoritmos

### 5.1 Medición del margen de anclaje O

```text
readAnchorOffset(header):
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    return header.getBoundingClientRect().height + rem      // hoy 64 + 16 = 80

measureAnchorOffset():
    O = readAnchorOffset(header)
    document.documentElement.style.setProperty('--anchor-offset', `${O}px`)
```

- O se escribe en una **custom property del `<html>`** y el CSS la usa en `scroll-padding-top`. CSS y JS comparten el mismo número: si el alto de la barra o el tamaño de la raíz cambian (zoom de texto, `min-h-16` crecido), el margen y la línea de referencia se mueven juntos.
- Fallback antes del primer efecto: `--anchor-offset: 5rem` en `index.css` (4 rem + 1 rem), idéntico a 80 px con el texto al 100 %. El `useLayoutEffect` escribe el valor medido **antes del primer pintado**, así que una carga con fragmento ya usa O real.
- Se remide al montar, en `resize` y cuando el `ResizeObserver` de la barra detecta cambio de tamaño (`RF-6`, «sin caché desfasada»). El zoom de texto cambia el alto de la barra y el tamaño de la raíz: ambos se vuelven a leer en el mismo frame de medición.

### 5.2 Medición de las posiciones de sección

```text
measureSections():
    positions = NAV_SECTIONS
        .map(({ id }) => document.getElementById(id))
        .filter(Boolean)
        .map(el => ({ id: el.id, top: el.getBoundingClientRect().top + window.scrollY }))
    documentHeight = document.documentElement.scrollHeight
    viewportHeight = window.innerHeight
```

- Coordenadas de documento (`top + scrollY`), inmunes al desplazamiento actual.
- Se remiden en montaje, en `resize`, y cuando cambia el tamaño de `<main>` (crecimiento de contenido, zoom, cambio de número de tarjetas). No se remiden en cada frame de scroll: las posiciones no cambian al desplazarse.

### 5.3 Bucle de scroll con `rAF` y actualización solo por cambio

```text
schedule():
    if (frame !== 0) return
    frame = requestAnimationFrame(tick)

tick():
    frame = 0
    if (dirty) { measureAnchorOffset(); measureSections(); dirty = false }
    id = selectActiveSection(window.scrollY, positions, O, documentHeight, viewportHeight)
    if (id === lastId) return                     // ← cero renders si no cambia
    lastId = id
    setActiveId(id)                               // un render por cambio de sección
    document.title = buildDocumentTitle(getSectionLabel(id))
```

- **Un único escucha pasivo** de `scroll` para el scrollspy, que solo agenda; la posición se lee en el `tick` (valor final del frame). Varias notificaciones por frame producen un solo `tick`.
- `setActiveId` se llama **solo** cuando el identificador cambia: los renders de la barra/menú = cambios de sección + cierres de panel (RNF-2).
- `document.title` se actualiza en el mismo punto: solo al cambiar de sección (RF-8). El título estático del documento ya es el base, así que abrir en el tope no produce cambio de título.
- `lastId` arranca con un centinela (`undefined`) para que el primer cálculo fije estado y título una vez, antes del primer pintado (`useLayoutEffect`); con fragmento o scroll restaurado el título correcto aparece sin parpadeo.
- En `popstate` y `pageshow` (restauración desde bfcache) se invalida y se recalcula en el siguiente frame: atrás/adelante dejan el resaltado y el título coherentes con la posición restaurada.
- Limpieza: `cancelAnimationFrame`, `removeEventListener` de `scroll`/`resize`/`popstate`/`pageshow`, `disconnect()` del observador y `removeProperty('--anchor-offset')`. Necesario con StrictMode.

### 5.4 Foco al encabezado sin cancelar el desplazamiento

```ts
export function focusHeadingForHash(hash: string): void {
  const id = hash.replace(/^#/, '')
  const target = document.getElementById(id)
  const heading = target?.querySelector<HTMLElement>('h1, h2')
  heading?.focus({ preventScroll: true })
}
```

- El manejador del clic **no** llama a `preventDefault`: el navegador actualiza el fragmento y desplaza (suave o inmediato según la preferencia). Solo se enfoca el encabezado con `preventScroll: true`, de modo que el foco no provoca un segundo desplazamiento que cortaría la animación ni altera la posición final.
- El foco se aplica solo para clic primario sin modificadores (`button === 0` y sin `meta/ctrl/shift/alt`). Con modificadores no se toca nada: la pestaña original no se mueve (RF-2).
- Se ejecuta en el manejador antes de cerrar el panel, para que el desmontaje del enlace no devuelva el foco al `body`.
- Los `h1`/`h2` de destino llevan `tabIndex={-1}` y `focus:outline-none`: reciben foco por programa sin anillo; los controles conservan su `focus-visible:ring`.
- No hay traslado de foco en la carga inicial ni en atrás/adelante: solo en el clic.
- Después del foco, el siguiente `Tab` continúa desde el encabezado, es decir, dentro de la sección o en la siguiente.

### 5.5 Cierre del panel

```text
applyPanel(event):
    next = nextPanelState(open, event)
    setOpen(next.open)
    if (next.returnFocus) buttonRef.current?.focus({ preventScroll: true })
```

- **Escape** (`keydown` en documento mientras está abierto): `applyPanel('escape')` → cierra y devuelve el foco al botón sin mover la lectura.
- **Elegir enlace**: el `onClick` del enlace cierra (`select`) y enfoca el encabezado (§5.4).
- **Tocar fuera** (`pointerdown` en documento): se cierra si el destino no está dentro del panel ni del botón (`outside`); no se fuerza foco.
- **Scroll de página** (`scroll` pasivo en `window` mientras está abierto): se cierra (`pageScroll`). Los eventos de scroll de elementos no burbujean, así que el desplazamiento del contenido interno no llega al `window`; además, el manejador ignora cualquier evento cuyo destino esté dentro del panel. No se lee `scrollY` ni se llama a la función pura desde este escucha.
- **Botón**: alterna (`toggle`).
- **Paso a `lg`**: el `change` de `matchMedia('(min-width: 1024px)')` actualiza `isDesktop` y aplica `breakpoint`; si el foco estaba dentro del panel, se traslada al primer enlace en línea (`preventScroll: true`) para no dejarlo en un nodo desmontado.
- Los escuchas de `keydown`, `pointerdown` y `scroll` solo existen con el panel abierto y se retiran al cerrarlo; el de `matchMedia` vive mientras el menú está montado.

### 5.6 Un solo conjunto de enlaces (montaje condicional)

```text
if (isDesktop)  → <nav aria-label="Secciones"> con los 4 enlaces en línea
else            → botón «Menú» (+ panel solo si open), y dentro del panel
                  <nav aria-label="Secciones"> con los mismos 4 enlaces
```

- En el DOM existe **una sola** región «Secciones» y **un solo** juego de enlaces en todo momento: `NavMenu` devuelve una rama u otra según `matchMedia`, no las dos. No hay duplicados que ocultar, ni dos landmarks, ni enlaces enfocables fuera de la vista.
- Con el panel cerrado, sus enlaces no están montados: no son enfocables ni se anuncian (RF-5). `aria-controls="menu-panel"` apunta a un `id` que solo existe al abrir, lo que ARIA admite.
- La navegación no se rompe al cambiar de rama porque **las dos ramas consumen `NAV_SECTIONS`** y los enlaces son anclas reales: la misma `href`, el mismo `aria-current` derivado de `activeId` y el mismo manejador. Cambiar de anchura solo cambia el contenedor, no el destino ni el estado.
- No se anima la apertura: el panel aparece y desaparece sin transición (RNF-3).
- `isDesktop` se inicializa con `matchMedia` en el primer render (`useState(() => window.matchMedia(...).matches)`) para no pintar el botón en escritorio ni al revés.

### 5.7 Año del pie

```ts
const FOOTER_YEAR = getFooterYear(new Date())
```

Constante de módulo: se calcula **una vez al cargar** con el reloj local (RF-12) y no depende del tiempo en cada render.

## 6. CSS y tokens (`src/index.css`)

```css
@layer base {
  html {
    scroll-padding-top: var(--anchor-offset, 5rem);   /* O = alto de barra + 1rem */
  }
}

@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

.nav-panel {
  max-height: calc(100vh - 4rem);                     /* fallback sin dvh */
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

@supports (height: 100dvh) {
  .nav-panel { max-height: calc(100dvh - 4rem); }
}

.nav-link[aria-current] {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.35em;
}
```

- `scroll-padding-top` es la **única** compensación: no se usa `scroll-margin` por sección (§7, decisión).
- `scroll-behavior: smooth` solo bajo `prefers-reduced-motion: no-preference`: con movimiento reducido el salto es inmediato y la preferencia se respeta en caliente porque es una media query. El desplazamiento manual nunca se suaviza (la propiedad solo afecta a desplazamientos programáticos y por fragmento).
- La marca a `#inicio` no necesita caso especial: el tope del hero está a `alto de barra` (hoy 64) y `64 − 80 < 0`, así que el navegador satura en `scrollY = 0` y el `scroll-padding` no lo desplaza.
- Panel: `absolute inset-x-0 top-full` dentro del `<header>` (que ya es `position: sticky`, contenedor de posicionados) → se superpone sin cambiar el alto del documento. Fondo `bg-surface`, borde `border-line` y sombra sutil con token.
- Tarjetas: superficie `bg-surface`, borde `border-line`, `rounded-2xl`, `p-5`/`p-6`, sin truncado (`break-words`, sin `line-clamp`). Rejilla de una columna en móvil y 2–3 columnas desde `sm`/`lg`.
- Etiqueta «Ejemplo»: `text-action` sobre la superficie de la tarjeta, con borde `border-line`; nota provisional con `text-ink-muted`. Ambos ≥ 4,5:1 en los dos temas y solo con tokens.
- Indicador de activo: subrayado de 2 px siempre presente en el enlace con `aria-current` (reposo, hover y foco), independiente del color.
- Foco de controles: `focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface`; `h1`, `h2` y `main` usan `focus:outline-none` (solo reciben foco por programa).
- Sin hex en componentes: todo color sale de `page`, `surface`, `line`, `ink`, `ink-muted`, `action`, `action-hover`.

## 7. Componentes

### `NavMenu`

```tsx
export function NavMenu({ activeId }: { activeId: string | null })
```

- Enlace: `<a href={`#${id}`} aria-current={activeId === id ? 'location' : undefined} className="nav-link ...">`. El indicador no cromático lo pinta `.nav-link[aria-current]`.
- Botón: 44×44 mínimo (`size-11`), `aria-expanded`, `aria-controls="menu-panel"`, `<span className="sr-only">Menú</span>` e icono de tres barras `aria-hidden` (nombre accesible fijo, icono decorativo).
- Enlaces del panel con altura mínima de 44 px (`flex min-h-11 items-center`) y `onClick` de §5.4 + §5.5.
- En escritorio, enlaces en una fila con `text-sm`, `whitespace-nowrap`, `min-h-11`; el contenedor permite `flex-wrap` para el escenario de 1024 px con texto al 200 %.

### `Navbar`

- `<header ref={headerRef} className="sticky top-0 z-50 min-h-16 bg-surface shadow-[inset_0_-1px_0_var(--color-line)] …">`.
- Marca: `<a href="#inicio" onClick={…solo foco…}>`; desaparece `handleBrandClick` y el `scrollTo(0, 0)`. El clic con modificadores no se toca.
- Orden: marca (`min-w-0 truncate`) · `NavMenu` · `ThemeSwitch`. `min-h-16` en lugar de `h-16` para que, con texto al 200 % a 1024 px, los enlaces puedan repartirse sin recortarse ni ocultarse; a tamaño normal sigue midiendo exactamente 64 px (criterio 5).
- `headerRef` llega por prop (no `forwardRef`): el hook mide el alto real.

### `Section` y tarjetas

```tsx
export function Section({ id, title, children }: SectionProps) {
  const headingId = `${id}-titulo`
  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id={headingId} tabIndex={-1} className="text-2xl font-bold text-ink focus:outline-none sm:text-3xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}
```

- `aria-labelledby` convierte cada sección en región con nombre (RF-10); `tabIndex={-1}` habilita el foco programático sin añadir parada de tabulador.
- `ProjectCard`/`ServiceCard`: `<article>` con `h3`, descripción y chip «Ejemplo»; nada más.

### `About`, `Projects`, `Services`, `Contact`, `Footer`

- `About`: párrafo de biografía + nota `provisionalNote` visible, en `text-ink-muted`.
- `Projects`/`Services`: rejilla de tarjetas mapeando los datos; sin enlaces.
- `Contact`: texto breve, correo visible como enlace `mailto:`, teléfono visible, y los cuatro enlaces; externos con `target="_blank" rel="noopener noreferrer"` y sufijo `sr-only`.
- `Footer`: `<footer>` con `SITE_IDENTITY.author`, `FOOTER_YEAR` y los tres enlaces (correo, LinkedIn, GitHub). Sin WhatsApp ni navegación.

### `SkipLink`

```tsx
<a href={`#${MAIN_ID}`} onClick={…foco en main con preventScroll…}
   className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] …">
  Saltar al contenido
</a>
```

- Primer nodo enfocable del documento (`App` lo monta antes de `Navbar`), invisible y sin ocupar espacio hasta recibir foco; al enfocarse se ve completo, con `bg-surface`, `text-ink` y anillo.
- El clic no cancela el valor por defecto: actualiza el fragmento y el foco pasa a `main#contenido` (con `tabIndex={-1}`).

### `App` y `Home`

```tsx
export default function App() {
  const { isDark, toggleTheme } = useTheme()
  const headerRef = useRef<HTMLElement | null>(null)
  const activeId = useActiveSection(headerRef)

  return (
    <>
      <SkipLink />
      <Navbar headerRef={headerRef} isDark={isDark} activeId={activeId} onToggleTheme={toggleTheme} />
      <main id={MAIN_ID} tabIndex={-1} className="focus:outline-none">
        <Home />
      </main>
      <Footer />
    </>
  )
}
```

- `Home` monta `<Hero /> <About /> <Projects /> <Services /> <Contact />` en ese orden, sin envoltorios ni bloques intermedios.
- `<main>` no lleva `bg-page` (aprendizaje de `MEMORY.md`: rompe la transición de tema).

### `index.html`

- `<title>Héctor Gutiérrez | Ingeniero de Software</title>`.
- `<meta name="description" content="Portafolio de Héctor Gutiérrez, ingeniero de software: proyectos, servicios y formas de contacto profesional.">` (≈ 112 caracteres, dentro de 50–160).
- Sin `og:*`, sin `twitter:*`, sin datos estructurados, sin fuentes ni recursos nuevos.

## 8. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Por qué |
| --- | --- | --- |
| Función pura + hook adaptador para la sección activa | `IntersectionObserver` | La spec fija una regla aritmética única con tolerancia de 1 px, tope que gana sin recorrido y última sección al final; el observador no expresa esa prioridad, depende de umbrales y `rootMargin` y no es verificable con `node --test`. Prohibido además como segunda implementación. |
| `scroll-padding-top` global con O en una custom property | `scroll-margin-top` en cada sección | Un solo número para las cuatro secciones y para la línea de referencia; con `scroll-margin` habría cuatro valores que pueden desincronizarse y el margen no afectaría a `#inicio` del mismo modo. |
| Anclas nativas; el JS solo enfoca el encabezado | `scrollIntoView({ behavior })` en el clic | Cancelar el clic rompería Ctrl/Cmd/Mayús, botón central, atrás/adelante, la carga directa con fragmento y el título del historial. El desplazamiento nativo además respeta `prefers-reduced-motion` sin código. |
| Un único conjunto de enlaces con montaje condicional | Duplicar los enlaces (uno en línea y otro en el panel) y ocultar uno | Duplicaría la región «Secciones», el `aria-current` y las paradas de tabulador, y permitiría que un enlace oculto recibiera foco. La spec lo prohíbe explícitamente. |
| Montaje condicional del panel | `hidden` sobre un panel siempre montado | `hidden` puede ser anulado por utilidades `display:*` (queda visible o enfocable), deja los enlaces en el árbol y obliga a limpiar `aria-hidden`/`inert`; montar/desmontar es más simple y cumple «no enfocables ni anunciados» sin estados intermedios. |
| `--anchor-offset` en `<html>` escrito por el hook | `scroll-padding-top: 5rem` fijo en CSS | O debe salir del alto **medido** de la barra (zoom de texto, barra que crece) y ser el mismo número que usa la función pura; un 5 rem fijo se desfasa en cuanto la barra deja de medir 64 px. |
| Estado solo al cambiar de sección, con `rAF` | `setState` en cada evento de `scroll` | Un render por frame re-renderiza barra y menú decenas de veces por segundo: incumple RNF-2 y provoca jank. |
| Único escucha pasivo del scrollspy (el del hero se queda como está) | Un solo despachador de scroll compartido por hero y scrollspy | Unificarlo exigiría modificar `useHeroParallax`, y el criterio 16 de esta spec prohíbe cambios en el código del hero. Cada feature lee `scrollY` como máximo una vez por frame y el scrollspy tiene un solo escucha; el escucha temporal del panel no lee posición. |
| Enfocar el encabezado en el manejador del clic con `preventScroll` | Enfocar tras `scrollend` o con `setTimeout` | Esperar introduce carreras con el desplazamiento suave y con el cierre del panel; `preventScroll` evita el salto sin retrasar nada y sin cancelar el clic. |
| Cerrar el panel con `nextPanelState` | Condicionales sueltos por evento | Seis eventos × dos estados: la tabla pura hace imposibles los estados ambiguos y se prueba sin DOM. |
| `min-h-16` en la barra | `h-16` fijo | Con texto al 200 % a 1024 px los enlaces pueden necesitar dos líneas; `h-16` los recortaría o forzaría a ocultarlos, prohibido por RNF-4. A tamaño normal mide 64 px exactos. |
| `aria-current="location"` | `aria-current="page"` | El enlace apunta a un lugar del documento actual, no a otra página; es el token que describe la posición en la página. La marca visible es la misma y no depende del token. |
| Contenido de ejemplo en `src/data/site.ts` con tipos | Texto dentro de cada componente | RF-11 exige un único punto de definición, sustituible sin tocar presentación ni navegación y sin dejar restos. |
| Año en una constante de módulo | `new Date()` dentro del render | RF-12 pide calcularlo una vez al cargar; dentro del render se recalcularía en cada re-render. |

## 9. Riesgos y mitigación

| Riesgo | Mitigación |
| --- | --- |
| **Foco contra desplazamiento suave**: enfocar el encabezado puede disparar un segundo scroll que corte la animación o cambie la posición final. | `focus({ preventScroll: true })`, sin `preventDefault`; verificar en los cinco anchos que la distancia encabezado–ventana es O. |
| **`scroll-padding` y zoom**: un valor fijo deja el encabezado tapado al ampliar texto o al crecer la barra. | O medido (alto real de barra + 1 rem de la raíz) escrito en `--anchor-offset`; `ResizeObserver` sobre la barra y `resize`; se verifica a 320 px con 200 % y con zoom de página al 200 % (640×400). |
| **Panel y scroll interno**: el desplazamiento dentro del panel puede cerrarlo o encadenarse a la página. | `overscroll-behavior: contain` + manejador de `scroll` que ignora eventos con destino dentro del panel + montaje condicional (el contenido interno existe solo al abrir). Verificar con contenido interno más alto que el panel. |
| **Renders por scroll**: un `setState` por frame degrada el scroll y duplica renders. | Comparación con `lastId` antes de actualizar; `rAF` con coalescencia; se perfilea durante 3 s y se compara con los cambios de sección. |
| **Título y atrás/adelante**: el historial puede dejar títulos o resaltados obsoletos. | El título se deriva solo de la sección activa; no se manipula el historial; `popstate` y `pageshow` invalidan y recalculan; el título estático del documento es ya el base. |
| **Revalidación del hero y criterio 18**: al aparecer recorrido, el parallax se activa y podría verse un frame en composición base al recargar. | No se modifica el código del hero (solo `id`); se revalidan alto, ausencia de hueco, fórmulas, límites y tema; el criterio 18 se comprueba con scroll avanzado + recarga y screencast/filmstrip. |
| **Datos de contacto**: es una excepción aprobada a «sin datos personales». | Solo en Contacto (texto y `href`), en el pie (enlaces) y en los `href`; nunca en título, metadatos, datos estructurados, almacenamiento ni consola. Se busca el correo y el teléfono en el DOM fuera de esas zonas. |
| **CLS**: el panel, el título y las tarjetas podrían mover contenido. | Panel `absolute` (fuera del flujo), sin alturas reservadas ni transiciones de layout, tipografía del sistema; se mide `< 0,01` en carga, scroll, panel, tema, cambio de sección y resize. |
| **Barra que crece con texto al 200 %**: el hero y el margen de anclaje dependen de 4 rem. | `min-h-16` solo crece si el contenido no cabe; O se remide; el hero usa `min-height` y la página gana scroll en vez de recortar. Verificar 64 px a 100 % y sin scroll horizontal al 200 %. |
| **`aria-controls` hacia un panel desmontado**: referencia a un `id` inexistente con el panel cerrado. | Es válido en ARIA y no rompe el foco; el botón mantiene su nombre y `aria-expanded={false}`. Se comprueba en el árbol de accesibilidad. |
| **Foco perdido al pasar a `lg` con el panel abierto**: el nodo enfocado se desmonta. | Si el foco estaba en el panel, se traslada al primer enlace en línea con `preventScroll`; verificar el elemento activo tras el cambio de anchura. |
| **Hueco entre barra y hero**: cualquier `margin`/`gap` nuevo en `<main>` o en `Home` rompería el criterio 1 de la 002. | `Home` sin envoltorios, `<main>` sin clases de layout ni color; se remide el rectángulo del hero contra la barra. |

## 10. Estrategia de tests

### 10.1 Con `node --test` (sin DOM, sin dependencias)

```powershell
node --test src/lib/navigation.test.ts
npx tsc -b
```

| Bloque | Casos | RF / RNF |
| --- | --- | --- |
| `selectActiveSection` | Tabla completa de §4.1, incluidos `818/819`, `1719`, `3318/3319`, el reposo tras ancla en las cuatro secciones, `3599`, `-50`, lista vacía, documento de 700, `top` duplicado y el fixture de final `3400/4000/3200` (+ `3198` → `null`) | RF-6, RNF-7 |
| `buildDocumentTitle` | `null` → «Héctor Gutiérrez | Ingeniero de Software»; las cuatro etiquetas → «Héctor Gutiérrez | {etiqueta}» | RF-8, RNF-7 |
| `getSectionLabel` | Identificadores de `NAV_SECTIONS` devuelven su etiqueta; desconocido o `null` → `null` | RF-7, RNF-7 |
| `getFooterYear` | `new Date(2026, 0, 1)` → 2026; `new Date(2024, 11, 31)` → 2024; no usa `Date.now` | RF-12, RNF-7 |
| `nextPanelState` | Los seis eventos desde `open = false` y desde `open = true`; `escape` es el único con `returnFocus: true`; `toggle` invierte | RF-5, RNF-7 |
| `NAV_SECTIONS` | Cuatro elementos, en el orden e identificadores acordados, sin duplicados | RF-1, RF-2 |
| `index.html` | `<title>` exacto, `description` de 50–160 caracteres, sin `og:`/`twitter:` | RNF-6, RF-8 |

Los tests se escriben **antes** de la implementación de `src/lib/navigation.ts` (TDD): primero en rojo con los valores exactos, después en verde. El test de `index.html` reutiliza el estilo del contrato de `theme.test.ts` (`readFileSync(new URL('../../index.html', import.meta.url))`).

### 10.2 Con Chrome DevTools MCP (por criterio)

| Comprobación | Criterio |
| --- | --- |
| DOM y árbol de accesibilidad: cuatro secciones en orden, `h2` con texto exacto, ids, `#inicio`, pie después de Contacto, sin bloques intermedios | 1 |
| Una sola región «Secciones» y cuatro enlaces; marca `#inicio` deja `scrollY = 0`; clics normal, Ctrl/Cmd/Mayús y botón central; atrás/adelante sin recarga; sin `preventDefault` en las anclas | 2 |
| Distancia encabezado–ventana = O en 320/375/768/1024/1440, con carga directa de cada fragmento, atrás/adelante y el caso final de «Contacto» (también 640×400) | 3 |
| Desplazamiento animado por defecto; inmediato con `prefers-reduced-motion: reduce`; preferencia cambiada en caliente; rueda sin suavizado | 4 |
| En 1024/1440 con texto al 100 %: cuatro enlaces en línea, sin botón, barra de 64 px con su línea, conmutador operable, sin scroll horizontal | 5 |
| Botón 44×44 con nombre «Menú» y estado; panel absoluto, `max-height: calc(100dvh - 4rem)`, scroll interno con `overscroll-behavior: contain`; los seis cierres; sin trampa de foco; enlaces no enfocables cerrado | 6 |
| Scrollspy contra la regla calculada en pasos finos; un solo `aria-current`; indicador no cromático; tope, final y documento sin recorrido; sin oscilación; renders ≤ cambios de sección + cierres de panel (perfilado de 3 s) | 7 |
| Título en tope y en cada sección, estático en el documento servido, sin cambios dentro de una sección, con cada fragmento | 8 |
| «Saltar al contenido» primero con Tab, invisible sin ocupar espacio, visible al foco, foco a `main#contenido`; foco en el encabezado tras cada enlace sin anillo ni cambio de posición; siguiente Tab dentro de la sección | 9 |
| Árbol de accesibilidad en 320 y 1440: un `h1`, un `h2` por sección, regiones con nombre, una sola `main` sin barra ni menú, `footer` propio, orden de lectura = visual | 10 |
| Biografía + nota, ≥3 proyectos y ≥3 servicios con título, descripción y «Ejemplo»; sin clientes/métricas/fechas/importes; comentarios `PROVISIONAL` localizados; sustituir un bloque y cambiar el número de tarjetas sin romper layout ni orden (luego revertir) | 11 |
| Correo y «(667) 231 9477» visibles; los cuatro `href` exactos; `mailto:`; pestaña nueva sin `referrer` en los externos; pie con nombre, año y tres enlaces sin WhatsApp; sin formularios | 12 |
| 320/375/768/1024/1440 sin scroll horizontal, recortes ni solapamientos; tarjetas apiladas; 320 px al 200 %, 1024 px al 200 % y zoom 200 % sobre 1280×800 (640×400) | 13 |
| Contraste de RNF-1 en ambos temas (texto, enlaces, activo, «Ejemplo», nota, botón, anillo); componentes nuevos solo con tokens; CLS `< 0,01` en los seis escenarios | 14 |
| Documento servido (título y descripción), consola limpia en todos los flujos, sin dependencias ni peticiones de red, almacenamiento solo `hectorgtez-theme`, datos de contacto solo en Contacto/pie/`href`, cleanup de escuchas | 15 |
| Parallax activo y hero sin cambios (offsets, límites, alto, único `h1`, tema); recarga con scroll avanzado y restauración: sin frame en composición base; estado del criterio 18 actualizado en la spec 002 | 16 |

### 10.3 Build y preview

```powershell
node --test
npx tsc -b
npm run build
npm run preview
```

- La verificación funcional final se hace sobre `preview` (el fundido de tema y el CSS emitido solo son fiables ahí; aprendizaje de `MEMORY.md`).
- Sin dependencias nuevas: `package.json` no cambia. Sin peticiones de red adicionales: la pestaña de red solo muestra el propio bundle.
- El resultado del criterio 18 se anota en `specs/002-hero-parallax/spec.md`; no se cambia ningún requisito.

## 11. Trazabilidad RF → plan y tareas

| Requisito | Dónde se resuelve | Tareas |
| --- | --- | --- |
| RF-1 (secciones y orden) | `data/navigation.ts`, `Section`, `Home`, `Hero` (`id`) | T1, T3 |
| RF-2 (anclas y marca) | `NavMenu`, `Navbar`, §5.4, §5.6 | T5 |
| RF-3 (destino y O) | `--anchor-offset` §5.1, `scroll-padding-top` §6 | T4, T7 |
| RF-4 (suave / reducido) | media query de `scroll-behavior` §6 | T4 |
| RF-5 (panel móvil) | `NavMenu` §5.5/§5.6, `.nav-panel` §6 | T4, T5, T8 |
| RF-6 (sección activa) | `selectActiveSection` §4, `useActiveSection` §5.2/§5.3 | T1, T7 |
| RF-7 (resaltado) | `aria-current` + `.nav-link[aria-current]` §6 | T1, T4, T5 |
| RF-8 (título) | `buildDocumentTitle` §4, `useActiveSection` §5.3, `index.html` | T1, T7 |
| RF-9 (skip link y foco) | `SkipLink`, `focusHeadingForHash` §5.4, `tabIndex` | T3, T6 |
| RF-10 (semántica) | `Section` + `App` + `Footer` | T3 |
| RF-11 (contenido provisional) | `data/site.ts`, tarjetas §7 | T2, T3 |
| RF-12 (contacto y pie) | `data/site.ts`, `Contact`, `Footer`, `getFooterYear` | T1, T2, T3 |
| RNF-1 (contraste) | tokens §6 | T4, T10 |
| RNF-2 (rendimiento y estabilidad) | `useActiveSection` §5.3, panel absoluto §6 | T5, T7, T10 |
| RNF-3 (accesibilidad y movimiento) | foco §5.4, `focus-visible`, media query §6 | T4, T6, T8 |
| RNF-4 (responsive y ampliación) | §7 `min-h-16`, rejillas, `flex-wrap` | T3, T8 |
| RNF-5 (sin red/datos) | datos §3.2, sin dependencias | T2, T10 |
| RNF-6 (SEO) | `index.html`§7 | T7, T10 |
| RNF-7 (verificabilidad y compatibilidad) | `navigation.ts` §4, tests §10.1 | T1, T9, T10 |
