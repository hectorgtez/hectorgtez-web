# Plan 002 — Hero de presentación con parallax

Spec: `specs/002-hero-parallax/spec.md` (aprobada).
Alcance: hero a pantalla completa bajo la navbar, fondo decorativo solo CSS con dos capas de tema y velo, nombre y puesto con único `<h1>`, parallax de fondo y texto con límite de seguridad, altura dinámica y degradaciones.

## 1. Principios de diseño

- **Lógica pura separada de la vista**: el cálculo del desplazamiento es una función sin DOM ni estado (`src/lib/heroParallax.ts`), verificable con `node --test`. El hook solo mide, escucha y escribe.
- **Cero React por frame**: el parallax no usa `useState` en el scroll. Se lee una vez por frame y se escriben **variables CSS** en la sección; el navegador solo recompone `transform`.
- **Un solo origen de color**: los hex del hero viven en `src/index.css`. Los componentes usan tokens y clases semánticas; nunca hex ni gradientes inline.
- **El fondo no pisa el del documento**: las capas del hero son degradados translúcidos sobre el fondo de `html`, que ya transiciona 200 ms. Así no aparecen costuras ni transiciones desincronizadas (riesgo anotado en `MEMORY.md`).
- **Sin dependencias, sin pasos de build nuevos**: React 19 + Tailwind v4 + `node:test`, como la spec 001.

## 2. Archivos y responsabilidades

| Archivo | Estado | Responsabilidad | RF |
| --- | --- | --- | --- |
| `src/lib/heroParallax.ts` | nuevo | Constantes de diseño y **función pura** `computeHeroOffsets` (+ helpers `heroProgress` y `textFreeSpace`). Sin DOM, sin tiempo, sin estado. | RF-6, RF-7, RF-8, RNF-7 |
| `src/lib/heroParallax.test.ts` | nuevo | Tests de contrato con `node:test` (casos de RNF-7), incluidos los bordes numéricos. | RNF-7 |
| `src/hooks/useHeroParallax.ts` | nuevo | Adaptador de navegador: medición de H/heroTop/alto del bloque, `scroll` pasivo + `requestAnimationFrame`, `ResizeObserver`, `matchMedia` de movimiento reducido y escritura de las variables CSS. Sin lógica de negocio. | RF-6, RF-7, RF-8, RF-12b, RF-13, RF-14 |
| `src/components/hero/HeroBackground.tsx` | nuevo | Componente tonto: dos capas de tema y velo decorativo, sin props ni lógica. | RF-4, RF-5, RF-10 |
| `src/components/hero/Hero.tsx` | nuevo | `<section>` del hero, estructura semántica (`h1` + puesto), refs y consumo del hook. | RF-1, RF-2, RF-3, RF-12 |
| `src/index.css` | modificar | Variables de las capas (hex solo aquí), clases de capa/velo/fundido, transición de color del texto, `prefers-reduced-motion` y `will-change`. | RF-4, RF-5, RF-10, RF-11, RNF-1 |
| `src/App.tsx` | modificar | Monta `<Hero />` dentro de `<main>` sin estilos de layout; elimina el `h1` provisional y la caja centrada actual. | RF-3, RF-13, RNF-4 |
| `src/components/layout/Navbar.tsx` | modificar (mínimo) | Sustituir el borde inferior `border-b border-line` (1 px que ocupa layout y deja la navbar en 65 px) por un borde pintado por dentro, sin layout: `shadow-[inset_0_-1px_0_var(--color-line)]`. Mismo aspecto, textos y comportamiento; la navbar queda en 64 px exactos. | RF-1, RF-13, criterio 14 |
| `MEMORY.md` | modificar (al final) | Estado, decisiones y riesgos aprendidos. | — |

No se tocan `ThemeSwitch`, `useTheme` ni la lógica de tema. En `Navbar` solo se cambia el borde inferior de (G): mismo aspecto, mismos textos y mismo comportamiento. No se añaden rutas, secciones, imágenes ni dependencias.

### 2.1 Ajuste de la navbar (decisión G)

- Cambio exacto en `src/components/layout/Navbar.tsx`: `border-b border-line` → `shadow-[inset_0_-1px_0_var(--color-line)]`. El `h-16` del contenedor sigue siendo el alto útil y la navbar pasa de 65 px a 64 px, sin desplazar nada.
- La línea se sigue viendo sobre `bg-surface`, con el mismo color del token `--color-line`, y no ocupa layout en ningún tamaño ni con zoom.
- **Transición**: `transition-colors` no anima `box-shadow`. Para conservar el fundido de 200 ms del separador se amplía la lista de propiedades: `transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none` (misma duración y misma preferencia de movimiento que ahora).
- Alternativa descartada: pseudo-elemento absoluto de 1 px (`after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-line`). También es sin layout y hereda `transition-colors`, pero añade posicionamiento y una caja más que mantener; solo se usaría si el `box-shadow` no se pinta como se espera en algún navegador.
- Nada más cambia: textos, marca, `ThemeSwitch`, foco, hover, `sticky top-0 z-50` ni la lógica de temas.

## 3. Funciones puras

`src/lib/heroParallax.ts` (sin `window`, `document` ni `Date`):

```ts
export type HeroMetrics = {
  scrollY: number
  heroTop: number
  H: number
  textBlockHeight: number
}

export type HeroOffsets = { background: number; text: number }

export const HERO_BG_FACTOR = 0.13
export const HERO_BG_MAX_FACTOR = 0.15
export const HERO_TEXT_FACTOR = 0.325
export const HERO_TEXT_SAFE_MARGIN = 16

export function heroProgress(scrollY: number, heroTop: number, H: number): number
export function textFreeSpace(H: number, textBlockHeight: number): number
export function computeHeroOffsets(metrics: HeroMetrics, reducedMotion: boolean): HeroOffsets
```

- `heroProgress = clamp(scrollY / (heroTop + H), 0, 1)`. Si `heroTop + H ≤ 0` (layout imposible), devuelve 0: evita dividir por cero. Sin zona muerta: con `scrollY = 1` el resultado ya es > 0.
- `textFreeSpace = max(0, (H − block) / 2 − 16)`. Devuelve 0 si `H ≤ 0`, si `block ≤ 0` o si `block ≥ H`. Los 16 px son constante en píxeles (no escalan con el zoom de texto).
- `computeHeroOffsets`: si `reducedMotion` o `H ≤ 0`, `{ 0, 0 }`. En otro caso, `background = min(HERO_BG_FACTOR · H · p, HERO_BG_MAX_FACTOR · H)` (positivo, hacia abajo) y `text = −min(HERO_TEXT_FACTOR · H · p, textFreeSpace(H, block))` (negativo, hacia arriba).
- Entradas no finitas (`NaN`, `Infinity`) devuelven `{ 0, 0 }`: guarda defensiva, no cambia el contrato de la spec.
- Se eliminan `enum` y cualquier sintaxis no borrable (`erasableSyntaxOnly`), e imports de tipos con `import type` (`verbatimModuleSyntax`).

## 4. Algoritmo

### 4.1 Medición

Se mide en un único punto del frame y se cachea entre frames:

```text
measure():
    rect    = section.getBoundingClientRect()
    scrollY = window.scrollY
    H       = rect.height                 // alto de layout, sin transforms de hijos
    heroTop = rect.top + scrollY          // coordenadas de documento
    blockH  = content.offsetHeight        // layout, inmune al translate del propio bloque
```

- `H` sale del elemento, no de `100dvh`, así el hero que crece por zoom queda medido de verdad.
- `blockH` se mide en el mismo frame que `H`, **después** de cualquier reflujo (zoom, resize, fuente), como exige RF-12b.
- Se re-mide solo cuando algo invalida la caché: montaje, `resize`, `ResizeObserver` sobre la sección y sobre el bloque, y cambio de zoom. Nunca dentro del frame de escritura.

### 4.2 Bucle de scroll

```text
schedule():
    if (frame !== 0) return
    frame = requestAnimationFrame(tick)

tick():
    frame = 0
    if (dirty) { measure(); dirty = false }
    { background, text } = computeHeroOffsets({ scrollY: window.scrollY, heroTop, H, textBlockHeight }, false)
    section.style.setProperty('--hero-bg-shift', `${background}px`)
    section.style.setProperty('--hero-text-shift', `${text}px`)
```

- Listener `scroll` con `{ passive: true }` que solo llama a `schedule()`; varias llamadas en el mismo frame se agrupan en un `tick`.
- Se lee `window.scrollY` en el `tick` (posición final del frame), no en el evento.
- Orden del frame: leer (solo si `dirty`) → calcular → escribir. Nunca se lee después de escribir, para no forzar reflujo.
- Sin `setState`: cero renders por frame. `H` y `heroTop` se leen como mucho una vez por frame (RF-12b).

### 4.3 Montaje y primer render (RF-14)

`useLayoutEffect` (no `useEffect`): mide y aplica **antes del primer pintado**, de modo que el hero nunca aparece en composición base si la página se carga con scroll restaurado. En el tope, los offsets son 0 y la composición es idéntica a la base.

### 4.4 Movimiento reducido (RF-11, RNF-2, RNF-7)

- Al montar: `matchMedia('(prefers-reduced-motion: reduce)')`. Si coincide, se escriben `0px` en ambas variables y **no se registra el listener de scroll**; se deja un `change` sobre el `matchMedia` para reaccionar a cambios.
- Si la preferencia se activa con la página abierta: se cancelan el frame pendiente y los listeners, y se escriben `0px` (vuelta a base sin animación, porque el texto y las capas no tienen transición de `transform`).
- Nunca se anima el `transform` con transición: cada frame es un valor absoluto. Así el retorno a base es instantáneo y no hay inercia.

### 4.5 Limpieza

`useLayoutEffect` devuelve limpieza: `cancelAnimationFrame`, `removeEventListener` de `scroll`/`resize`/`change`, `disconnect()` de los observadores y borrado de las dos variables. Necesario con StrictMode, que monta y desmonta dos veces en desarrollo.

## 5. CSS: fondo, velo, fundido y transforms

`src/index.css` (todo el color del hero, un solo sitio):

```css
:root {
  /* Capas con colores fijos por tema: permiten el fundido cruzado. */
  --hero-dark-glow-a: #E5C378;   /* acento */
  --hero-dark-glow-b: #7A4578;   /* primario oscuro (decorativo) */
  --hero-dark-veil: rgba(14, 12, 16, 0.62);
  --hero-light-glow-a: #5E335C;  /* primario claro */
  --hero-light-glow-b: #B88E3B;  /* acento claro (decorativo) */
  --hero-light-veil: rgba(250, 249, 250, 0.66);
}
```

- **Dos capas completas** (`.hero__layer--dark` y `.hero__layer--light`), cada una con su base translúcida, dos focos radiales y su velo. La activa tiene `opacity: 1` y la otra `opacity: 0`, gobernadas por `html[data-theme="dark"|"light"]`. Solo se funde `opacity` durante 200 ms: no hay corte seco (RF-10).
- **Mismo desplazamiento en ambas capas**: las dos cuelgan del contenedor `.hero__bg`, que es el único que aplica `transform: translate3d(0, var(--hero-bg-shift), 0)`. Al compartir transform, el fundido nunca se ve desalineado (RF-10).
- **Sobredimensión** de `.hero__bg` (`inset: -20% 0`) para que el desplazamiento positivo no descubra el borde superior; la sección recorta con `overflow: hidden`.
- **Velo**: `linear-gradient` con `--hero-*-veil`, más denso detrás del bloque central, para que el contraste no dependa del halo (RF-5, RNF-1).
- **Texto**: `transform: translate3d(0, var(--hero-text-shift), 0)` en `.hero__content`; `color: var(--theme-ink)` / `--theme-ink-muted`.
- **Interruptor de tema del texto a 100 ms**: `.hero__text { transition: color 0s 100ms }`. El color salta de golpe en el punto medio del fundido, cuando el fondo compuesto es gris intermedio y ambos textos superan 3:1; animar el color 200 ms dejaría ambos en gris a la vez (≈1:1). Con `prefers-reduced-motion`, `transition: none`.
- **Movimiento reducido**: `@media (prefers-reduced-motion: reduce) { .hero__layer, .hero__text { transition: none } }`.
- **`will-change: transform`** solo en `.hero__bg` y `.hero__content`, y solo mientras el efecto está activo; se retira si aparece coste de memoria en móvil.
- `contain: paint` en la sección ayuda a aislar repintados, sin `contain: size` (rompería la medición de H).

## 6. Componentes

### `HeroBackground` (tonto)

```tsx
export function HeroBackground() {
  return (
    <div className="hero__bg" aria-hidden="true">
      <div className="hero__layer hero__layer--dark" />
      <div className="hero__layer hero__layer--light" />
      <div className="hero__scrim" />
    </div>
  )
}
```

- `aria-hidden` y `pointer-events: none`: decoración pura (RNF-4).
- Sin `style` inline y sin colores: todo en `index.css`.

### `Hero`

```tsx
export function Hero() {
  const { sectionRef, contentRef } = useHeroParallax()
  return (
    <section ref={sectionRef} className="hero relative isolate flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden">
      <HeroBackground />
      <div ref={contentRef} className="hero__content relative z-10 mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="hero__text text-[2.5rem] leading-tight font-bold text-ink sm:text-[4rem]">Héctor Gutiérrez</h1>
        <p className="hero__text mt-4 text-base text-ink-muted sm:text-xl">Ingeniero de Software</p>
      </div>
    </section>
  )
}
```

- Tamaños: 40 px → 64 px (cumple RF-2); puesto 16 → 20 px (≤ mitad del nombre).
- `isolate` crea un contexto de apilamiento propio por debajo de la navbar (`z-50`): el texto no puede pintarse por encima de ella (RF-7, decisión F). La oclusión al hacer scroll la produce la propia navbar.
- `min-h` (no `h`): el hero crece si el texto ampliado no cabe (RF-1).
- `overflow-hidden` recorta las capas sobredimensionadas, sin generar scroll horizontal (RF-9).
- Sin `bg-page` en la sección ni en `<main>`: el fondo base lo pinta `html` (riesgo anotado en `MEMORY.md`).
- `<main>` en `App.tsx` queda sin clases de layout ni de color: solo contiene el hero.

### `useHeroParallax`

```ts
export type UseHeroParallaxResult = {
  sectionRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
}
export function useHeroParallax(): UseHeroParallaxResult
```

Implementa §4. No conoce colores ni clases: solo escribe `--hero-bg-shift` y `--hero-text-shift`.

## 7. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Por qué |
| --- | --- | --- |
| `transform: translate3d` con variables CSS, calculado en un `tick` de `requestAnimationFrame` | CSS scroll-driven animations; `background-attachment: fixed`; `scroll` sin agrupar | `background-attachment: fixed` no funciona bien en móvil y repinta; las animaciones por scroll no permiten aplicar el límite de seguridad ni el congelado en `p = 1` con la fórmula de la spec; sin agrupar se hacen varias escrituras por frame (jank). |
| Función pura en `src/lib` + hook adaptador | Cálculo dentro del componente o del evento | Sin DOM no hay test posible (constitución: `node --test`); el hook queda sin lógica que probar. |
| Leer `scrollY` en el `tick` y medir solo si `dirty` | Medir `getBoundingClientRect` en cada frame | Evita reflujos forzados y cumple «H como máximo una vez por frame» (RF-12b, RNF-2). |
| Variables CSS escritas en la sección | Estado de React con estilos inline por capa | Un `setState` por frame re-renderiza el árbol; las variables llegan a las dos capas y al texto con una escritura. |
| Dos capas de tema con colores fijos en `index.css` y `opacity` cruzada | Una sola capa con `var(--theme-*)` | Una variable cambia al instante: con una sola capa el cambio sería un corte seco (RF-10). Con dos capas fijas el fundido es CSS puro, sin JS. |
| Color del texto a salto en el punto medio (`transition: color 0s 100ms`) | Animar el color 200 ms | A mitad de fundido el fondo compuesto es gris intermedio; si el texto también está a mitad, el contraste cae a ≈1:1. El salto en el punto medio mantiene ≥3:1 (RNF-1) y el texto no participa en la opacidad. |
| Capas translúcidas sobre el fondo de `html` | Fondo opaco propio del hero | Un fondo opaco tapa la transición de `html` y produce costuras a 0 ms frente a 200 ms (aprendizaje de la spec 001). |
| `min-h-[calc(100dvh-4rem)]` medido con `getBoundingClientRect` | Calcular H con `window.innerHeight` | `innerHeight` no refleja el hero que crece por zoom ni el recorte real; el rect sí (RF-1, RF-12b). |
| `isolate` + `z-10` dentro del hero, navbar `z-50` | Subir el texto con `z-index` alto | Un `z-index` mayor que la navbar pintaría el texto encima (prohibido por la decisión F). |
| Clases semánticas en `index.css` | Utilidades Tailwind con gradientes inline en JSX | Los gradientes exigen hex fuera de `index.css`, contra la regla de un único origen de color. |

## 8. Estrategia de tests

### Con `node --test` (sin DOM, sin dependencias)

```powershell
node --test src/lib/heroParallax.test.ts
npx tsc -b
```

| Caso | RF/RNF |
| --- | --- |
| `scrollY = 0` → `{ 0, 0 }`; `scrollY < 0` → `{ 0, 0 }` | RF-8, RNF-7 |
| `scrollY = 1` → `background > 0` y `text < 0` (sin zona muerta) | RF-6, RF-7 |
| Valores intermedios: `background ≈ 0,13·H·p`, `text ≈ −0,325·H·p`, y `background / |text| = 2,5` sin recorte | RF-6, RF-7 |
| `scrollY = heroTop + H` y `scrollY > heroTop + H` → mismo resultado (congelado, no reiniciado) | RF-8 |
| Simetría: la misma entrada da el mismo resultado en cualquier orden de llamadas | RF-8 |
| `H = 0` y `H < 0` → `{ 0, 0 }` | RNF-7 |
| `textBlockHeight = 0`, negativo o `≥ H` → `text = 0` | RF-7, RNF-7 |
| Bloque muy alto (espacio libre < diseño) → `text` recortado a `free` y `background` intacto | RF-7 |
| `reducedMotion = true` → `{ 0, 0 }` | RF-11 |
| Cotas: `background ≤ 0,15·H` y `|text| ≤ 0,325·H` en una malla de entradas | RF-6, RNF-7 |
| Entradas no finitas → `{ 0, 0 }` | RNF-7 (defensivo) |

`npx tsc -b` valida app y tests (los `.test.ts` entran por `include` en `tsconfig.app.json`).

### Con Chrome DevTools MCP (pintado, CSS y accesibilidad reales)

| Comprobación | Criterio |
| --- | --- |
| Hero bajo la navbar, alto = ventana − 4 rem, sin hueco; 320/375/768/1440 | 1 |
| Centrado, tamaños 40/64/16 px computados | 2 |
| Un solo `h1`, textos exactos, sin «hectorgtez-web» en el DOM visible, árbol de accesibilidad | 3 |
| Fondo solo CSS, sin peticiones de imagen, capas emparejadas, sin costuras | 4 |
| Contraste 9×9 en `p = 0` y `p = 0,25` (las dos posiciones con el bloque en pantalla) y con offsets extremos forzados; ambos temas; también a los 100 ms del fundido | 5, 10 |
| Offset en `scrollY = 1` (lectura de `transform` computado) y valores en 25/50/75/100 % | 6 |
| Caja del texto dentro del hero con ≥16 px, z-order bajo la navbar, 320 px y 200 % | 7 |
| Extremos congelados y reversibilidad | 8 |
| CLS, tareas largas y p95 de frame con CPU 4× | 9 |
| Fundido ≤200 ms, mismo offset en ambas capas, salto de color del texto a 100 ms | 10 |
| `prefers-reduced-motion`: sin offsets ni fundido, también activándolo en caliente | 11, 12 |
| Zoom de texto 200 % a 320 px y zoom de página 200 % (640×400) | 13 |
| Página sin scroll: navbar 64 px, documento = ventana, offsets 0, sin relleno ni altura extra | 1, 14 |
| Consola limpia, sin dependencias nuevas, almacenamiento solo con la clave del tema, LCP = `h1` | 16 |
| Cambio de H con scroll fijo (emulación de barras, giro) | 17 |
| Recarga con scroll restaurado (diferida hasta tener recorrido real) | 18 |

Para crear recorrido sin tocar el producto se usa un relleno temporal insertado **solo desde DevTools** y retirado al terminar; nunca se commitea contenido de relleno.

**Sobre las posiciones de contraste**: con el factor 2,5× el bloque de texto sale de la vista alrededor de `p = 0,5` en todos los anchos exigidos, así que el contraste solo se mide en `p = 0` y `p = 0,25` (posiciones legibles) y en el peor caso geométrico forzado, que cubre las combinaciones de fondo y texto de la segunda mitad del recorrido. Medir en `p = 0,5` sobre una captura de página completa daría un fondo real pero no una situación que el visitante pueda leer, y quedaría fuera de lo que exige la spec.

## 9. Trazabilidad RF → plan

| Requisito | Dónde se resuelve | Tarea |
| --- | --- | --- |
| RF-1 (posición y tamaño, hero crece) | `Hero.tsx` §6, `min-h` + medición, navbar de 64 px §2.1 | T3, T3b, T7 |
| RF-2 (centrado y tamaños) | `Hero.tsx` §6 | T3, T7 |
| RF-3 (textos y único h1) | `Hero.tsx`, `App.tsx` | T3 |
| RF-4 (fondo solo CSS) | `index.css` §5, `HeroBackground` | T2, T3 |
| RF-5 (velo de contraste) | `index.css` §5 | T2, T8 |
| RF-6 (parallax del fondo) | `heroParallax.ts` §3, hook §4 | T1, T4 |
| RF-7 (texto y límite de seguridad) | `heroParallax.ts` §3, `Hero.tsx` §6 | T1, T4, T5 |
| RF-8 (límites y congelación) | `heroProgress` §3, hook §4 | T1, T4 |
| RF-9 (sin impacto en layout) | `overflow-hidden`, transforms §5 | T2, T5 |
| RF-10 (fundido de tema) | capas §5, salto de color a 100 ms | T2, T6 |
| RF-11 (movimiento reducido) | hook §4.4, media query §5 | T4, T6 |
| RF-12 (responsive y zoom) | `Hero.tsx` §6, límite §3 | T3, T7 |
| RF-12b (altura dinámica) | §4.1, §4.2, ResizeObserver | T4, T7 |
| RF-13 (efecto latente) | fórmula §3 con `scrollY = 0`, navbar de 64 px §2.1 | T1, T3b, T10 |
| RF-14 (primer render y recarga) | `useLayoutEffect` §4.3 | T4, T10 |
| RNF-1 (contraste) | velo §5, color a 100 ms | T2, T8 |
| RNF-2 (CLS y rendimiento) | rAF §4.2, `transform` §5 | T4, T9 |
| RNF-3 (sin dependencias, red, almacenamiento) | todo el plan | T1–T10 |
| RNF-4 (accesibilidad) | `Hero.tsx` §6, `aria-hidden` | T3, T7 |
| RNF-5 (SEO y LCP) | `Hero.tsx` §6 | T3, T10 |
| RNF-6 (degradación) | `min-h` + `matchMedia` con guardas | T2, T7 |
| RNF-7 (función pura) | `heroParallax.ts` §3, tests §8 | T1 |

## 10. Riesgos conocidos

1. **Contraste a mitad del fundido**: el peor instante es t = 100 ms. Mitigación: salto de color del texto en ese punto y velo suficiente; se mide (criterio 10) y, si baja de 3:1, se sube la opacidad del velo sin cambiar el color.
2. **Relleno temporal**: imprescindible para verificar el efecto hoy. Vive solo en DevTools; si se commitea, se incumple RF-13.
3. **`transition: color 0s 100ms`**: si un navegador no lo aplica, el color cambia al inicio del fundido y el contraste puede caer por debajo de 3:1. En ese caso, alternativa: retirar también la transición de color del texto propio del sitio mientras dure el fundido, o reducir el fundido a 150 ms; se verifica en navegador.
4. **Reflujos forzados**: leer `getBoundingClientRect` en el `tick` tras escribir provoca jank. Se mide solo si `dirty` y nunca tras escribir variables.
5. **`will-change` permanente**: consume memoria de composición. Solo en dos capas; si el panel de rendimiento empeora en móvil, retirarlo.
6. **Barras móviles y `dvh`**: cada cambio de H mueve la base del bloque ΔH/2. Mitigación: sin transición de altura, recálculo en el mismo frame y CLS < 0,01 (criterio 17). Si el navegador no soporta `dvh`, cae a `vh` (RNF-6).
7. **Zoom 200 %**: el hero crece, `free` baja y el texto puede quedarse sin desplazamiento. Es el comportamiento exigido (el límite manda), no un fallo.
8. **StrictMode**: doble montaje. La limpieza del `useLayoutEffect` debe retirar listeners, observadores y variables, o el frame quedaría duplicado.
9. **Página sin scroll**: hoy no se puede percibir el efecto; la verificación usa el relleno temporal y el criterio 14 comprueba que no se haya añadido scroll artificial.
10. **Criterio 18 diferido**: la restauración de scroll depende del navegador y de que exista recorrido real; no bloquea esta spec.
11. **Borde de la navbar sin layout**: al pasar el borde a `box-shadow` interior, la línea podría perderse o engrosar visualmente sobre `bg-surface`, o no animarse con el cambio de tema si se deja solo `transition-colors`. Mitigación: usar el token `--color-line`, incluir `box-shadow` en las propiedades transicionadas (§2.1) y comprobar en ambos temas que la línea mide 1 px y que la navbar mide 64 px en 320, 768 y 1440 px y con zoom. Si el `box-shadow` no se pinta como se espera, se cae al pseudo-elemento absoluto, que también es sin layout.

## 11. Puntos cerrados antes de implementar

- Textos aprobados: «Héctor Gutiérrez» e «Ingeniero de Software», con tildes; el `<h1>` provisional se elimina.
- Constantes de diseño: 0,13·H del fondo (máximo 0,15·H), 0,325·H del texto (2,5×), margen de seguridad de 16 px.
- Orden del hero dentro de `App`: `Navbar` + `<main><Hero /></main>`, sin clases de layout ni color en `<main>`.
- Navbar de 64 px (decisión G): borde inferior pintado por dentro, sin layout; único cambio permitido en `Navbar` (§2.1).
- No quedan decisiones abiertas: la implementación puede empezar por T1.
