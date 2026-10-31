# Plan 004 — La marca en vuelo

Spec: `specs/004-marca-en-vuelo/spec.md` (Estado: borrador).
Alcance: marca provisional vectorial en el hero y en la barra, capa de vuelo decorativa a nivel de la aplicación, cálculo geométrico en una función pura con tests, adaptador DOM con un único escucha de scroll propio, relevos ligados al scroll, acoplado con puntero, modo de movimiento reducido y composición sin vuelo por degradación. Estados: **estado en el tope**, **vuelo**, **acoplado**, **composición sin vuelo por degradación** y **modo de movimiento reducido**.

## 1. Principios de diseño

- **Lógica pura separada de la vista**: toda la geometría, la escala y las opacidades viven en `src/lib/brandFlight.ts`, sin documento, sin tiempo y sin estado. Se prueba con `node --test`. El hook solo mide, escucha y escribe.
- **Cero React por frame**: el vuelo no usa estado por frame. Un único `scroll` pasivo **propio del vuelo** agenda un `requestAnimationFrame` y el frame escribe variables CSS en tres elementos concretos (la capa, el hero y la barra); el navegador solo recompone `transform` y `opacity`. El scrollspy conserva su propio escucha, su propio `rAF` y su propia lectura, como declara RNF-2 de la 003: un escucha pasivo por subsistema.
- **Una sola representación real**: el `<h1>` del hero y el enlace de marca de la barra siguen siendo la única semántica. Las copias son decorativas, no enfocables y no anunciadas.
- **El efecto no toca el layout**: la capa está fuera del flujo, las piezas visibles se ocultan con `opacity` (no con `display`, `visibility` ni cambiando el tamaño), y ninguna escritura altera alturas ni el recorrido de scroll.
- **Un único origen de color y de tamaño**: los colores, la marca provisional y sus tamaños viven en componentes y en `index.css` con tokens; ninguna cifra de píxeles de geometría está fijada en el código, salvo las dos constantes de los relevos.
- **Sin dependencias, sin red, sin almacenamiento**: React + Tailwind v4 + `node:test`, como las specs 001 a 003.

## 2. Archivos y responsabilidades

| Archivo | Estado | Responsabilidad | RF / RNF |
| --- | --- | --- | --- |
| `src/components/ui/BrandLogo.tsx` | nuevo | Marca provisional: marcador de posición con aspecto de logo —monograma «H» dentro de un cuadrado redondeado—, SVG en línea de trazo uniforme, `aria-hidden`, `focusable="false"`, `viewBox` propio y color por `currentColor`. Recibe `className` para el tamaño y el color de token. No es el logo definitivo: sustituirlo es cambiar solo este archivo. Sin peticiones, sin texto alternativo y sin props de contenido. | RF-1, RNF-1, RNF-3 |
| `src/lib/brandFlight.ts` | nuevo | Tipos, constantes de los relevos y **función pura** `computeBrandFlight`. Sin `window`, `document` ni tiempo. | RF-4 a RF-9, RNF-6 |
| `src/lib/brandFlight.test.ts` | nuevo | Tests del contrato de RNF-6, incluidos el encaje exacto y el caso de más de una línea (dos y tres). | RNF-6 |
| `src/hooks/useBrandFlight.ts` | nuevo | Adaptador DOM: mide la sección del hero, su alto `H`, `.hero__content` y las cuatro cajas con los dos tamaños de texto; reutiliza `computeHeroOffsets` para obtener `heroShift` en cada frame y lo pasa a `computeBrandFlight` antes de escribir; detecta el truncado y el número de líneas, escucha `scroll` pasivo con `rAF`, `resize` y `ResizeObserver`, lee `prefers-reduced-motion`, escribe las diez variables y el estado de acoplado y limpia al desmontar. Sin lógica de negocio. | RF-3 a RF-15, RNF-2 |
| `src/components/brand/BrandFlight.tsx` | nuevo | Capa decorativa con las dos copias (marca y nombre), `aria-hidden`, sin props ni lógica. | RF-3, RF-5, RF-6, RF-7 |
| `src/components/hero/Hero.tsx` | modificado | Añade la marca provisional encima del nombre y envuelve el texto del `h1` en un `span` medible. Atributos `data-brand-*` para las cajas. Nada más cambia. | RF-1, RF-2, RF-5, RF-6, RF-11 |
| `src/components/layout/Navbar.tsx` | modificado | Añade la marca provisional dentro del enlace de marca, envuelve el texto en un `span` medible y expone `data-brand-*` y el contenedor visual que se oculta con el vuelo. A 320 px deja la barra en 64 px en una sola fila y los controles a la derecha en ≈212–304 px. Destino, textos, modificadores y orden de foco no cambian. | RF-1, RF-2, RF-8, RF-10, RF-14 |
| `src/components/layout/ThemeSwitch.tsx` | modificado | A 320 px (hasta 374 px) se renderiza compacto, 44×44 y solo icono, con nombre accesible, estado y clic; desde 375 px recupera 72 px. No cambia el tema ni añade estado. | RF-10, RNF-1 |
| `src/App.tsx` | modificado | Monta `<BrandFlight />` como hermano de la barra, fuera de `<main>`, y llama `useBrandFlight()` una vez. | RF-3, RF-12 |
| `src/index.css` | modificado | Clases `.brand-flight`, `.brand-flight__name`, `.brand-flight__logo`, `.hero__logo`, `.hero__name-text`, `.brand__inner`, opacidades por variable con valor por defecto, `pointer-events` por estado de acoplado, ancho y partición de la copia, color retrasado con `--hero-text-color`, ocultación de la capa con el panel abierto y bloque de movimiento reducido. Solo tokens. | RF-1, RF-3, RF-7, RF-8, RF-13, RF-14, RF-15 |
| `MEMORY.md` | modificado (al final) | Estado, decisiones y aprendizajes. | — |

No se tocan `HeroBackground`, `useHeroParallax`, `NavMenu`, `useTheme`, `useActiveSection`, `src/lib/navigation.ts`, las secciones, el pie, los metadatos ni el favicon. De `src/lib/heroParallax.ts` solo se importa `computeHeroOffsets`; el archivo no se modifica y su fórmula no se duplica. La marca provisional se sustituye cambiando solo `BrandLogo.tsx`: ni el hook ni el CSS dependen de su dibujo.

## 3. Función pura (`src/lib/brandFlight.ts`)

```ts
export type Box = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export type NameBox = Box & {
  readonly fontSize: number    // tamaño de texto del nombre, en px
}

export type BrandNameBox = Box & {
  readonly centerY: number     // centro vertical del texto de la marca, en la ventana
}

export type BrandFlightMetrics = {
  readonly scrollY: number
  readonly heroShift: number         // parallax del bloque de texto: ≤ 0; 0 con reduce o medida inválida
  readonly name: NameBox             // texto del nombre en el documento, sin parallax
  readonly logo: Box                 // marca provisional del hero, en el documento
  readonly brandName: BrandNameBox   // texto de la marca en la barra, en la ventana
  readonly brandLogo: Box            // hueco de la marca en la barra, en la ventana
  readonly brandFontSize: number
}

export type BrandFlightTransform = {
  readonly x: number          // esquina superior izquierda de la copia ya escalada, ventana
  readonly y: number
  readonly scale: number
}

export type BrandFlightState = {
  readonly progress: number
  readonly name: BrandFlightTransform
  readonly logo: BrandFlightTransform
  readonly copyOpacity: number
  readonly heroOpacity: number
  readonly brandOpacity: number
  readonly docked: boolean
}

export const BRAND_FLIGHT_ENTER_END = 0.02
export const BRAND_FLIGHT_HANDOFF_FRACTION = 0.04

export function computeBrandFlight(
  metrics: BrandFlightMetrics,
  reducedMotion: boolean,
): BrandFlightState
```

`progress` es `s` sin recortar; el resto de la interfaz no cambia. El hook y los tests consumen `progress` para medir el avance y no necesitan el valor de `q`.

### 3.1 Pseudocódigo

```text
computeBrandFlight(metrics, reducedMotion):
    si alguna entrada no es finita,
       o name.width ≤ 0 o name.height ≤ 0 o name.fontSize ≤ 0,
       o brandName.width ≤ 0 o brandName.height ≤ 0,
       o logo.width ≤ 0 o logo.height ≤ 0,
       o brandLogo.width ≤ 0 o brandLogo.height ≤ 0,
       o brandFontSize ≤ 0:
        devolver composicionSinVuelo(metrics)

    escala = brandFontSize / name.fontSize
    targetTop = brandName.centerY − (name.height · escala) / 2
    D = name.top − targetTop
    si D ≤ 0: devolver composicionSinVuelo(metrics)

    s = max(0, scrollY − heroShift) / D                            // sin recorte superior

    si reducedMotion:
        docked = s ≥ 1 + BRAND_FLIGHT_HANDOFF_FRACTION
        // Sin copia, sin transforms útiles y sin fundido: la barra cambia de golpe.
        devolver { progress: s, name: copiaEnOrigen(name, scrollY, heroShift),
                   logo: copiaEnOrigen(logo, scrollY, 0),
                   copyOpacity: 0, heroOpacity: 1,
                   brandOpacity: docked ? 1 : 0, docked }

    q = clamp((s − BRAND_FLIGHT_ENTER_END) / (1 − BRAND_FLIGHT_ENTER_END), 0, 1)

    // Nombre: la Y sigue al h1 con su parallax, acotada en targetTop; X y escala con q.
    escalaNombre = 1 + (escala − 1) · q
    centroNombreX = name.left + name.width / 2
    centroMarcaX  = brandName.left + brandName.width / 2
    name = {
        x: lerp(centroNombreX, centroMarcaX, q) − name.width · escalaNombre / 2,
        y: max(name.top − scrollY + heroShift, targetTop),
        scale: escalaNombre,
    }

    // Marca provisional: posición y tamaño con el mismo q; su Y no incluye heroShift.
    escalaLogo = 1 + (brandLogo.height / logo.height − 1) · q
    centroLogoX = logo.left + logo.width / 2
    centroLogoMarcaX = brandLogo.left + brandLogo.width / 2
    centroLogoY = logo.top + logo.height / 2
    centroLogoMarcaY = brandLogo.top + brandLogo.height / 2
    logo = {
        x: lerp(centroLogoX, centroLogoMarcaX, q) − logo.width · escalaLogo / 2,
        y: lerp(centroLogoY − scrollY, centroLogoMarcaY, q) − logo.height · escalaLogo / 2,
        scale: escalaLogo,
    }

    entrada = clamp(s / BRAND_FLIGHT_ENTER_END, 0, 1)
    relevo  = clamp((s − 1) / BRAND_FLIGHT_HANDOFF_FRACTION, 0, 1)

    copyOpacity  = entrada · (1 − relevo)
    heroOpacity  = 1 − entrada
    brandOpacity = relevo
    docked = s ≥ 1 + BRAND_FLIGHT_HANDOFF_FRACTION

    devolver { progress: s, name, logo, copyOpacity, heroOpacity, brandOpacity, docked }

copiaEnOrigen(box, scrollY, shift):
    devolver { x: box.left, y: box.top − scrollY + shift, scale: 1 }

composicionSinVuelo(metrics):
    devolver { progress: 0,
               name: copiaEnOrigen(metrics.name, metrics.scrollY, metrics.heroShift),
               logo: copiaEnOrigen(metrics.logo, metrics.scrollY, 0),
               copyOpacity: 0, heroOpacity: 1, brandOpacity: 1, docked: false }
```

El truncado de la marca no entra en la función pura: lo detecta el hook en el DOM (`[data-brand="brand-name"]` con `scrollWidth > clientWidth + 1`) y, **solo en el vuelo activo**, fuerza la composición sin vuelo por degradación. Si `prefers-reduced-motion: reduce` está activo, el modo reducido gana y el truncado no altera la función ni provoca degradación. Las guardas de medida de §3.1 sí se aplican antes que `reducedMotion`: sin cajas válidas y `D ≤ 0` no hay `s` que calcular y la composición sin vuelo se devuelve en ambos modos.

### 3.2 Propiedades que se derivan del cálculo

- **Suma de opacidades**: `heroOpacity + copyOpacity + brandOpacity = 1` **en el vuelo activo** (`reducedMotion = false` y medidas válidas), porque `entrada` llega a 1 en `s = 0,02` y `relevo` solo empieza en `s = 1`. Fuera de ese caso la suma no es 1 por diseño: en degradación es 2 (`hero 1 + barra 1`, copia 0) y en movimiento reducido con `s ≥ 1,04` también es 2 (`hero 1 + barra 1`, copia 0). Es la garantía de RF-7 y se prueba con una malla de `s` en el vuelo activo.
- **Sin zona muerta**: con `scrollY = 1`, `s > 0` y `copyOpacity > 0` en el vuelo activo; el primer frame ya hace aparecer la copia. En el modo de movimiento reducido no hay copia por diseño: el primer píxel solo mueve el hero con la página.
- **Entrada pixel-perfect**: con `q = 0` hasta `s = 0,02`, la copia se funde sobre el original sin mover su X ni su escala, y su Y es `name.top − scrollY + heroShift`, la misma del h1 con su parallax; en `s = 0` coincide con el original en X, Y, ancho y escala dentro de 1 px. Ya no hay desalineación de entrada por el parallax.
- **Llegada exacta y parada**: `q = 1` en `s = 1` y se mantiene en 1 para todo `s ≥ 1`; la Y está acotada por `targetTop`, así que la copia queda inmóvil en el destino desde `s = 1`. Con una línea, `escalaNombre` en `s = 1` es `brandFontSize / name.fontSize` y el ancho escalado es `name.width · brandFontSize / name.fontSize`, que a 1440 px es `499,2 · 18/64 = 140,4`, el ancho medido de la marca. Los centros coinciden por construcción.
- **Relevo final sin fantasma (una línea)**: entre `s = 1` y `s = 1,04` la copia y la marca real ya están superpuestas en el mismo destino, y solo se cruzan sus opacidades. Fundir antes, con la copia todavía en movimiento, dejaba a 1440 px unos 37 px de desplazamiento horizontal y un 20 % de escala de diferencia.
- **Relevo final con fantasma breve (más de una línea)**: el fixture de dos líneas es una caja de 288 × 100 px a 40 px de texto; la escala es `18/40 = 0,45`, así que la copia mide ≈45 px de alto y la marca ≈22 px. Las dos están centradas en el mismo punto, pero la copia sobresale ≈11 px por arriba y por abajo; durante el 4 % de `D` —≈13 px de scroll a 320 px— se ve un fantasma breve. Con tres líneas (fixture 288 × 300 px a 80 px, marca a 36 px, escala `36/80 = 0,45`) la copia es más alta y el fantasma mayor. Está aceptado por RF-10 y se documenta en el criterio 6; no se corrige truncando ni cambiando a un corte seco.
- **Modo de movimiento reducido**: la función devuelve `copyOpacity 0`, `heroOpacity 1` y `brandOpacity 0` hasta `s = 1,04`, y `brandOpacity 1` y `docked true` desde ahí, en escalón y sin valores intermedios. Es determinista y se prueba sin navegador; el navegador no interpola nada porque no hay transición declarada en la opacidad del contenido de la barra.
- **Guardas**: cualquier caja de ancho **o alto** no positivo en `name`, `brandName`, `logo` o `brandLogo`, cualquier tamaño de texto no positivo, cualquier entrada no finita o `D ≤ 0` devuelven la composición sin vuelo (`progress 0`, copia invisible, hero visible, barra visible y operativa). La lista coincide con RF-14 y con RNF-6.
- **D entre `nameTop` y `targetTop`**: `D = name.top − targetTop`, con `targetTop = brandName.centerY − (name.height · escala)/2`. Es la distancia vertical entre el borde superior del nombre sin parallax y el borde superior de la copia ya escalada y centrada en el texto de la marca. No se mide entre centros ni entre bordes inferiores; las cifras de referencia son `D ≈ 443` a 1440 y `D ≈ 416` a 375.
- **Y del h1 con su parallax**: la Y de la copia no se interpola: es `max(name.top − scrollY + heroShift, targetTop)`. Así comparte el desplazamiento del h1 —por eso no lo adelanta— y, al llegar, se queda fija. El logo, en cambio, interpola su propia Y con `q` y **no** añade `heroShift`.
- **`heroShift`**: es el desplazamiento del parallax del bloque de texto del hero, ≤ 0, el mismo que mueve el h1 y el puesto; vale 0 con movimiento reducido o medida inválida. Se obtiene reutilizando `computeHeroOffsets`, no con una fórmula propia. `s = max(0, scrollY − heroShift) / D` no se recorta por arriba.
- **Logo y copia en el tramo final**: el logo va por encima y a la izquierda, no cruza el texto y en el destino queda a la izquierda. Se admite un solape de esquina entre las cajas de hasta 8×8 px en `s ≈ 0,92–0,97`, nunca sobre el texto; la intersección de cajas se exige vacía en `s = 0,5`, `s = 1` y `s = 1,04`.
- **320 px al 200 %**: el hueco real del nombre, los píxeles ocultos y el alto real de la barra se miden en el escenario; no se usan cifras fijas, porque el conmutador compacto de 320 px cambia el reparto. La truncación, la degradación y el modo reducido no cambian.
- **Determinismo**: mismas entradas, mismas salidas; sin acumuladores, sin tiempo y sin orden de llamadas.
- **Congelación**: para `s ≥ 1,04` las tres opacidades y las dos transformaciones valen lo mismo que en `s = 1,04`. La reversibilidad es exacta porque no hay estado.

### 3.3 Convenciones de código

- `import type` en las importaciones de tipos y sin `enum` (`verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Los `.test.ts` entran por `include` en `tsconfig.app.json`, como en las specs anteriores.
- Sin `clamp` ni `lerp` importados: dos funciones locales privadas, no exportadas.
- Los valores devueltos son números en píxeles y opacidades en 0–1; el hook es el único que añade unidades.

### 3.4 Puesto que viaja con el nombre (RF-16)

- Constante: `BRAND_FLIGHT_ROLE_FADE_END = 0.8` (fracción de `s` en la que la copia del puesto llega a opacidad 0).
- Entrada nueva `role: Box` (caja del puesto en el documento, sin parallax, como `name`). Se mide con `[data-brand="role"]` y se normaliza igual que el nombre.
- Salida nueva `role: BrandFlightTransform` y `roleOpacity: number` (la de la **copia**).
- Vuelo activo, copia del puesto anclada al nombre: `scale = nameScale`, `x = name.x + (role.left − name.left) · nameScale`, `y = name.y + (role.top − name.top) · nameScale`. Así en `s = 0` coincide con el puesto real y después sigue la trayectoria del nombre con su separación escalada.
- `roleOpacity = entrada · (1 − clamp(progress / BRAND_FLIGHT_ROLE_FADE_END, 0, 1))`, con `entrada` la misma del relevo del nombre. Lineal en `s`, 0 desde `s = 0,8`, y la misma función al subir.
- Opacidad del puesto **real**: `heroOpacity` (la misma que el nombre real). Así el puesto real se funde en la copia en el primer 2 % y no se duplica.
- Composición sin vuelo y modo reducido: `roleOpacity = 0` (no hay copia) y el puesto real con `heroOpacity = 1`; la posición de la copia es la de origen y no se escribe en el DOM.
- Cubre RF-16, RNF-6 (salidas) y RNF-4 (contraste del puesto en `s = 0`).
- Tests (rojo primero): `s = 0` → opacidad copia 0, copia en el origen del puesto; `s = 0,4` → opacidad 0,5 y la distancia al nombre escalada; `s = 0,8` → 0; `s ≥ 0,8` → 0; `scrollY < 0` → 0; `heroShift` negativo sigue a `s`; degradación y reducido → 0; no creciente desde `s = 0,02` en la malla.

## 4. Adaptador DOM (`src/hooks/useBrandFlight.ts`)

```ts
export function useBrandFlight(): void
```

Se llama una sola vez desde `App` y no devuelve nada: trabaja por atributos `data-brand-*` y variables CSS.

### 4.1 Elementos que necesita

| Selector | Elemento | Uso |
| --- | --- | --- |
| `[data-brand="layer"]` | raíz de `BrandFlight` | copia visible, transformaciones y opacidad de la copia |
| `[data-brand="name"]` | `span` del texto dentro del `h1` | caja origen y tamaño de texto del nombre |
| `[data-brand="logo"]` | marca provisional del hero | caja origen de la marca |
| `[data-brand="brand-name"]` | `span` del texto dentro del enlace de marca | caja destino y tamaño de texto de la barra |
| `[data-brand="brand-logo"]` | marca provisional de la barra | hueco destino |
| `[data-brand="hero"]` | sección del hero | medición de `heroTop` y `H`; también se mide `.hero__content` para reutilizar `computeHeroOffsets` |
| `.hero__content` (dentro del hero) | bloque de texto del hero | altura `textBlockHeight` para calcular `heroShift` |
| `[data-brand="bar"]` | `header` | estado de acoplado y opacidad de la marca |

Si falta alguno, el hook **no escribe y retira lo escrito**; la composición sin vuelo por degradación (valores por defecto del CSS) se mantiene o se recupera: es la degradación de RF-14.

### 4.2 Medición

```text
measure():
    scrollY = window.scrollY
    heroRect = hero.getBoundingClientRect()
    heroTop = heroRect.top + scrollY
    H = heroRect.height
    heroContent = hero.querySelector('.hero__content')
    textBlockHeight = heroContent.getBoundingClientRect().height
    offsets = computeHeroOffsets({ scrollY, heroTop, H, textBlockHeight }, reduced)
    heroShift = offsets.text                                     // ≤ 0; 0 con reduce o medida inválida

    nameEl = [data-brand="name"]
    logoEl = [data-brand="logo"]
    nameRect = rect(nameEl)                                      // ventana, incluye el parallax
    logoRect = rect(logoEl)
    name = { ...nameRect,
             top: nameRect.top + scrollY − heroShift,            // documento sin parallax
             fontSize: parseFloat(getComputedStyle(nameEl).fontSize) }
    logo = { ...logoRect,
             top: logoRect.top + scrollY − heroShift }           // documento sin parallax
    brandNameEl = [data-brand="brand-name"]
    brandNameRect = rect(brandNameEl)                            // ventana
    brandName = { ...brandNameRect,
                  centerY: brandNameRect.top + brandNameRect.height / 2 }
    brandLogo = rect([data-brand="brand-logo"])
    brandFontSize = parseFloat(getComputedStyle(brandNameEl).fontSize)

    escala = brandFontSize / name.fontSize
    targetTop = brandName.centerY − name.height · escala / 2
    D = name.top − targetTop
    marcaTruncada = brandNameEl.scrollWidth > brandNameEl.clientWidth + 1
    lineas = name.height > 1.5 · name.fontSize ? 'multi' : 1

    medidaValida = todas las entradas finitas
                   y name.width > 0 y name.height > 0 y name.fontSize > 0
                   y brandName.width > 0 y brandName.height > 0
                   y logo.width > 0 y logo.height > 0
                   y brandLogo.width > 0 y brandLogo.height > 0
                   y brandFontSize > 0
                   y D > 0

    // `reduced` solo exime del truncado. Sin medida válida no hay `s` que
    // calcular y se degrada también con movimiento reducido (RF-14, RNF-6).
    if !medidaValida o (!reduced y marcaTruncada):
        if !degradado:
            limpiar()                                      // retira variables, data-brand-state y data-brand-lines
            degradado = true
        return

    degradado = false
    measurement = { name, logo, brandName, brandLogo, brandFontSize,
                    heroTop, H, textBlockHeight }
    if !reduced:
        if name.width ≠ ultimoAncho:
            layer.style.setProperty('--brand-flight-name-width', name.width + 'px')
            ultimoAncho = name.width
        if lineas ≠ ultimasLineas:
            layer.dataset.brandLines = String(lineas)
            ultimasLineas = lineas
```

- **Normalización del origen con `computeHeroOffsets`**: `getBoundingClientRect` incluye el `transform` que el parallax aplica a `.hero__content`. La caja origen del nombre y la del logo se normalizan a coordenadas del documento **sin** ese desplazamiento: se calcula `heroShift` con `computeHeroOffsets` a partir de la sección, su alto `H` y el alto del bloque `.hero__content`, y se resta a `top` (rect + `scrollY` − `heroShift`). No se lee `--hero-text-shift` ni se depende del orden de efectos: el hook del vuelo obtiene el mismo desplazamiento con la misma función pura. La normalización se hace al medir; el `heroShift` de cada frame se recalcula con el scroll actual antes de llamar a `computeBrandFlight`.
- **Sin cifras fijas**: `D`, los centros, las escalas y los tamaños salen de las cajas medidas; el zoom de texto, el alto de la barra y el ancho del viewport se reflejan solos al volver a medir.
- **`medidaValida`**: replica las mismas guardas que la función pura —entradas finitas, anchos y altos positivos de las cuatro cajas, `name.fontSize` y `brandFontSize` positivos y `D > 0`— para que la decisión de degradar en el hook no contradiga el contrato de RNF-6. `D = name.top − targetTop`, con `targetTop = brandName.centerY − (name.height · escala)/2` y `escala = brandFontSize / name.fontSize`, como en §3.1.
- **Un solo ancho**: `--brand-flight-name-width` es `name.width`, el ancho real de la caja de texto medida (499,2 px a 1440), **no** el ancho de contenido del `h1`. La copia usa ese mismo ancho y centra el texto; así la partición de líneas coincide con la del original. Se escribe **en la medición y solo cuando cambia**, no en cada frame.
- **Número de líneas**: con `leading-tight` (1,25) una línea mide ≈1,25 × `font-size` y más de una supera 1,5 × (dos ≈2,5 ×, tres ≈3,75 ×); el umbral `name.height > 1,5 · name.fontSize` distingue una línea de varias sin leer `line-height`. El hook escribe `data-brand-lines="1"` o `"multi"` en la capa **en la medición y solo cuando cambia**: con `1`, la copia usa `white-space: nowrap` y el ancho medido (así no parte por un redondeo de fracción de píxel); con `multi`, usa `white-space: normal` y `width: calc(var(--brand-flight-name-width) + 1px)` para que el salto natural caiga en el mismo punto que en el original, sea con dos o con tres líneas.
- **Truncado de la marca**: `brandName.scrollWidth > brandName.clientWidth + 1` con el texto en `overflow: hidden` y `text-overflow: ellipsis`; la tolerancia de 1 px evita falsos positivos por redondeo y se comprueba que 375, 768 y 1440 px no se degradan. Si es verdadero **y no hay movimiento reducido**, el hook **retira las diez variables y los atributos** (no solo deja de escribir), de modo que la barra vuelve a los valores por defecto de la composición sin vuelo por degradación; con `reduced`, el truncado no degrada. Se comprueba tras cada remedición, porque el zoom de texto puede provocarlo, y también al montar.
- **Caché de degradación**: `degradado` evita ejecutar `limpiar()` en cada frame mientras la marca siga truncada o la medida siga inválida; solo actúa al entrar en degradación. `limpiar()` retira las variables y los atributos e invalida `ultimoAncho` y `ultimasLineas`; la medición reinicia `degradado` al volver a una medida válida (y, sin `reduced`, sin truncado), de modo que al corregirse el truncado se reescriben el ancho, las líneas y `data-brand-state` sin recargar.
- La medición se hace **antes** de escribir en el mismo frame, nunca después.

### 4.3 Bucle y escritura

```text
schedule(): if frame ≠ 0 return; frame = requestAnimationFrame(tick)

tick():
    frame = 0
    if degradado:
        return                                       // limpiar() ya se hizo en la medición
    if !measurement:
        return
    scrollY = window.scrollY
    offsets = computeHeroOffsets({ scrollY,
                                   heroTop: measurement.heroTop,
                                   H: measurement.H,
                                   textBlockHeight: measurement.textBlockHeight }, reduced)
    state = computeBrandFlight({ ...measurement, scrollY, heroShift: offsets.text }, reduced)
    escribir(state)

escribir(state):
    if !reduced:
        layer.style.setProperty('--brand-flight-name-x', state.name.x + 'px')
        layer.style.setProperty('--brand-flight-name-y', state.name.y + 'px')
        layer.style.setProperty('--brand-flight-name-scale', String(state.name.scale))
        layer.style.setProperty('--brand-flight-logo-x', state.logo.x + 'px')
        layer.style.setProperty('--brand-flight-logo-y', state.logo.y + 'px')
        layer.style.setProperty('--brand-flight-logo-scale', String(state.logo.scale))
    layer.style.setProperty('--brand-flight-copy-opacity', String(state.copyOpacity))
    hero.style.setProperty('--brand-flight-hero-opacity', String(state.heroOpacity))
    bar.style.setProperty('--brand-flight-brand-opacity', String(state.brandOpacity))
    estado = state.docked ? 'docked' : 'flying'
    // Se compara contra el atributo, no contra una caché: tras limpiar() el
    // atributo no existe y la primera escritura lo repone sin caso especial.
    if bar.dataset.brandState ≠ estado:
        bar.dataset.brandState = estado

limpiar():
    borrar las diez variables, 'data-brand-state' y 'data-brand-lines'
    ultimoAncho = null
    ultimasLineas = null
    // Al retirar data-brand-state la marca recupera pointer-events; al salir
    // de la degradación la próxima escritura compara contra null y lo repone.
    // `degradado` lo gobierna la medición, no se toca aquí.
```

- Son **quince** variables (RF-16 añade `--brand-flight-role-opacity`, `-x`, `-y`, `-scale` y `-width` para la copia del puesto, escritas en la capa): `--brand-flight-name-x`, `-y`, `-scale`, `--brand-flight-logo-x`, `-y`, `-scale`, `--brand-flight-name-width`, `--brand-flight-copy-opacity`, `--brand-flight-hero-opacity` y `--brand-flight-brand-opacity`. `limpiar()` las borra todas, junto con `data-brand-state` y `data-brand-lines`, y se usa al desmontar y al entrar en degradación.
- **Orden de precedencia en el hook**: medida inválida → degradación (también con `reducedMotion`); si la medida es válida y hay `reducedMotion`, modo reducido; si no, truncado → degradación; si no, vuelo. El truncado solo puede degradar el vuelo activo; con movimiento reducido se ignora y se aplica el modo reducido (RF-9). La medida inválida no se exime con la preferencia: sin `D` no hay `s` y se degrada en ambos modos (RF-14, RNF-6).
- **Orden en el frame**: `degradado` se comprueba **antes** que `reduced`. Una medida inválida con la preferencia activa ya retiró las variables y los atributos en la medición; si el frame reducido escribiera después, repondría `data-brand-state` y dejaría la marca sin puntero. Con `reduced` y medida válida, el frame escribe el modo reducido.
- La degradación **no es solo «no escribir»**: si el truncado o una medida inválida aparecen con el vuelo ya en marcha (zoom de texto, redimensionado), hay que retirar lo escrito; si no, quedarían las opacidades y transformaciones del último frame válido y la barra seguiría oculta. `limpiar()` devuelve los valores por defecto del CSS y **retira `data-brand-state`**: la marca responde al puntero desde el primer instante, sin esperar a un frame de vuelo.
- **Sin escrituras por frame de ancho ni de líneas**: `--brand-flight-name-width` y `data-brand-lines` se escriben en la medición, solo cuando cambian las cajas. En cada frame se escriben únicamente las seis transformaciones (solo en vuelo activo), las tres opacidades y, cuando cambia, `data-brand-state`. Así se mantiene RNF-2: ninguna lectura de layout después de escribir y ninguna invalidación de estilo innecesaria.
- En el modo de movimiento reducido no se escriben las seis variables de transformación ni el ancho: no hay copia. Solo se escriben las tres opacidades (hero 1, copia 0, barra 0 o 1) y el estado de acoplado; el cambio de la barra es instantáneo porque su opacidad no tiene transición.
- `degradado` evita que `limpiar()` se ejecute en cada frame mientras la marca siga truncada o la medida siga inválida: solo se llama al entrar en degradación. La medición lo reinicia cuando la medida vuelve a ser válida (y, sin `reduced`, la marca vuelve a caber) y `limpiar()` invalida `ultimoAncho` y `ultimasLineas`, para que la salida de la degradación reescriba todo lo necesario.
- `estado` se calcula comparando con `bar.dataset.brandState`; al retirar el atributo en `limpiar()`, la primera escritura vuelve a ponerlo sin necesidad de una caché aparte. Al entrar en degradación la marca recupera el puntero de inmediato (sin `pointer-events: none`); al salir, la primera escritura repone `flying` o `docked` según corresponda, de modo que no queda una marca no clicable cuando debería serlo.
- Las variables se escriben en el elemento que las consume —no en `<html>`— para no invalidar el estilo de todo el documento en cada frame.
- `scroll` con `{ passive: true }` solo agenda; el `tick` lee `window.scrollY` (posición final del frame), recalcula `heroShift` con `computeHeroOffsets` usando las métricas del hero cacheadas en la medición, llama a `computeBrandFlight` y escribe después de calcular. No hay lecturas de layout en el frame.
- Sin `setState`, sin lecturas de layout después de escribir y sin `setTimeout` ni transiciones.

### 4.4 Remedición

`resize`, `ResizeObserver` sobre la **sección del hero** y sobre la **barra**, y una primera medición en `useLayoutEffect` (antes del primer pintado, para RF-12). **No se observa la copia ni la capa**: el hook escribe en ellas su ancho y su `data-brand-lines`, y observarlas provocaría el aviso «ResizeObserver loop completed with undelivered notifications». La remedición se aplica en el mismo *rendering update*: se cancela el frame pendiente, se mide y se vuelve a escribir, como en `useHeroParallax`. Motivos de invalidación: cambio de tamaño de la ventana, cambio de alto de la barra por zoom de texto o por el nuevo logo, cambio del bloque del hero (la marca provisional, el puesto o el encabezado), aparición o desaparición de la barra de scroll y por tanto de `scrollY`, y cambio del ancho disponible que pueda truncar la marca.

### 4.5 Movimiento reducido

- **Precedencia**: el hook comprueba `reduced` **antes** que el truncado. Si está activo, se aplica el modo reducido aunque `marcaTruncada` sea verdadero; la marca real se trunca con elipsis por CSS y no se invade el conmutador. El truncado solo puede forzar la degradación cuando `reduced` es falso. Orden completo: medida inválida → degradación (también con `reducedMotion`); medida válida + `reducedMotion` → modo reducido; si no, truncado → degradación del vuelo activo; si no, vuelo. La **medida inválida** no la exime la preferencia: sin cajas válidas y `D ≤ 0` no hay `s`, así que se aplica la composición sin vuelo por degradación en ambos modos (RF-14, RNF-6).
- Al montar: `matchMedia('(prefers-reduced-motion: reduce)')`. Si coincide, se marca `reduced` y **se mantiene el bucle de scroll**, porque el paso de la barra depende de `s ≥ 1,04`; el cálculo devuelve el modo reducido y no se escriben las seis variables de transformación ni el ancho. El hero queda visible con sus opacidades por defecto y la barra oculta mientras `s < 1,04`, con su contenido sin transición.
- Al activarse con la página abierta: se cancela el frame pendiente, se marca `reduced` y se **ejecuta la medición de §4.2 antes de escribir**, para que `degradado` pase a `false` si la medida es válida; después se escribe el estado reducido correspondiente al scroll actual. La copia desaparece de golpe, la barra pasa a oculta o visible según `s` y no hay animación, porque ninguna de las dos opacidades tiene transición.
- Al desactivarse: se marca `reduced = false`, se mide de nuevo y se escribe el estado del scroll actual, sin reiniciar el recorrido.
- El estado de acoplado se sigue escribiendo: antes de `s = 1,04` la barra está en `flying` (sin puntero, enfocable) y desde ahí en `docked` (operativa).

### 4.6 Limpieza

`useLayoutEffect` devuelve limpieza: `cancelAnimationFrame`, `removeEventListener` de `scroll` y `resize`, `ResizeObserver.disconnect()`, `matchMedia` `change`, borrado de las **diez** variables (`name-x`, `name-y`, `name-scale`, `logo-x`, `logo-y`, `logo-scale`, `name-width`, `copy-opacity`, `hero-opacity`, `brand-opacity`) y de los atributos `data-brand-state` y `data-brand-lines`; además reinicia `degradado`, `ultimoAncho` y `ultimasLineas`. Necesario con StrictMode, que monta y desmonta dos veces en desarrollo.

## 5. Interfaz en el DOM y CSS

### 5.1 Atributos

| Atributo | Valor | Dónde | Efecto |
| --- | --- | --- | --- |
| `data-brand` | `layer`, `copy-name`, `copy-logo`, `name`, `logo`, `brand-name`, `brand-logo`, `brand-link`, `hero`, `bar` | capa y elementos citados en §4.1 | punto de anclaje del hook y de las reglas CSS; sin estilos propios |
| `data-brand-state` | `flying` o `docked` | `header` | gobierna `pointer-events` de la marca |
| `data-brand-lines` | `1` o `multi` | capa `.brand-flight` | `nowrap` con una línea; ancho + 1 px y salto natural con más de una |

### 5.2 Variables y valores por defecto

| Variable | Defecto | Consumidor |
| --- | --- | --- |
| `--brand-flight-copy-opacity` | `0` | `.brand-flight` |
| `--brand-flight-hero-opacity` | `1` | nombre y marca del hero |
| `--brand-flight-brand-opacity` | `1` | contenido del enlace de marca |
| `--brand-flight-name-x`, `-y`, `-scale` | `0`, `0`, `1` | `.brand-flight__name` |
| `--brand-flight-logo-x`, `-y`, `-scale` | `0`, `0`, `1` | `.brand-flight__logo` |
| `--brand-flight-name-width` | `0px` | ancho de `.brand-flight__name` |
| `--brand-flight-role-opacity` | `0` | copia del puesto (`.brand-flight__role`, RF-16) |
| `--brand-flight-role-x`, `-y` | `0`, `0` | copia del puesto (`.brand-flight__role`) |
| `--brand-flight-role-scale` | `1` | copia del puesto (`.brand-flight__role`) |
| `--brand-flight-role-width` | `0px` | ancho medido del puesto (`.brand-flight__role`) |

Con los valores por defecto —sin JavaScript, con el hook sin medidas, con la marca truncada **sin movimiento reducido** o con un fallo— se ve la **composición sin vuelo por degradación**: copia invisible, originales del hero visibles y barra con marca y nombre visibles y clicables desde el inicio. Es la degradación exigida por RF-14 y no necesita ningún código de rescate. En el **estado en el tope** el hook escribe `--brand-flight-brand-opacity: 0`; en el **modo de movimiento reducido** escribe `0` hasta `s = 1,04` y `1` desde ahí, sin transición. Con movimiento reducido y la marca truncada se aplica el modo reducido, no esta composición.

### 5.3 Reglas

```css
.brand-flight {
  position: fixed;
  inset: 0;
  z-index: 55;                 /* por encima de la barra (50) y por debajo del skip link (60) */
  pointer-events: none;
  opacity: var(--brand-flight-copy-opacity, 0);
  contain: layout style;
}

/* El panel del menú manda: mientras está abierto, la capa no se pinta.
   La capa es hermana del header, no descendiente: se usa un ancestro común.
   El estado (variables y atributos) no se toca y reaparece al cerrarlo.
   Requiere :has() (línea base 2023); sin soporte, el vuelo sigue y el
   panel abierto a mitad de vuelo podría solaparse con la copia. */
html:has(header [aria-expanded="true"]) .brand-flight {
  visibility: hidden;
}

.brand-flight__name,
.brand-flight__logo {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.brand-flight__name {
  width: var(--brand-flight-name-width, 0px);  /* ancho real del texto medido, no el del h1 */
  text-align: center;
  white-space: nowrap;                          /* una línea: no parte por redondeo */
  --hero-text-color: var(--theme-ink);
  color: var(--hero-text-color);
  transition: --hero-text-color 0s 100ms;       /* solo el color; transform y opacity no se tocan */
  transform: translate3d(var(--brand-flight-name-x, 0px), var(--brand-flight-name-y, 0px), 0)
             scale(var(--brand-flight-name-scale, 1));
}

.brand-flight[data-brand-lines="multi"] .brand-flight__name {
  width: calc(var(--brand-flight-name-width, 0px) + 1px);
  white-space: normal;                          /* más de una línea: mismo salto natural que el h1 */
}

.brand-flight__logo {
  transform: translate3d(var(--brand-flight-logo-x, 0px), var(--brand-flight-logo-y, 0px), 0)
             scale(var(--brand-flight-logo-scale, 1));
}

.hero__name-text { opacity: var(--brand-flight-hero-opacity, 1); }
.hero__logo { opacity: var(--brand-flight-hero-opacity, 1); }
.brand__inner { opacity: var(--brand-flight-brand-opacity, 1); }

header[data-brand-state="flying"] [data-brand="brand-link"] { pointer-events: none; }
```

- La opacidad se aplica al **contenido** del enlace (`.brand__inner`), no al enlace: así el anillo de foco sigue visible cuando la marca está oculta (RF-8, RNF-1).
- `.hero__name-text` y `.hero__logo` son envoltorios; el `h1` y el texto del puesto no reciben la opacidad. El puesto conserva su color y su parallax intactos.
- **Selector del panel**: la capa es hermana de `<header>`, no descendiente, así que `header:has(...) ~ .brand-flight` no es la forma correcta de expresar la dependencia; se usa el ancestro común `html:has(header [aria-expanded="true"]) .brand-flight`. Requiere `:has()` (línea base 2023). Si el navegador no lo soporta, el vuelo sigue funcionando y el único efecto es que el panel abierto a mitad de vuelo podría quedar tapado por la copia; no se añade `MutationObserver` ni un atributo alternativo.
- **Selector real**: el enlace de la barra no tiene clase `brand-link` en el código actual; recibe `data-brand="brand-link"` en el `Navbar`. Todas las reglas usan ese atributo, comprobado contra `Navbar.tsx`.
- **Color**: la copia reutiliza `--hero-text-color` (registrada en `@property`, `inherits: false`) con la misma transición de color de 0 s y 100 ms de retardo que el `h1`. No se declara `transition: none` en ese nodo: anularía el color. El `transform` y la `opacity` no tienen transición declarada, así que nunca se animan; no hace falta desactivarlas.
- El nombre de la copia usa la misma tipografía que el `h1` (`text-[2.5rem] sm:text-[4rem] leading-tight font-bold break-words hyphens-auto`), el mismo `lang="es"` y el ancho medido, de modo que en `s = 0` coincide exactamente y las líneas se reparten igual.
- La marca de la copia usa la misma caja de 4,5 rem y el mismo dibujo que la del hero.
- Ningún color hexadecimal nuevo: la marca usa `text-action` y la copia `text-ink`, con los tokens existentes.

## 6. Componentes

### `BrandLogo`

```tsx
type BrandLogoProps = { readonly className?: string }

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" />
      <path d="M17 15v18M31 15v18M17 24h14" />
    </svg>
  )
}
```

- Monograma «H» —dos verticales y un travesaño centrado— dentro de un cuadrado redondeado de 48×48 con radio 12 y trazo de 3: es un **marcador de posición con aspecto de logo**, no el logo definitivo. Se sustituye cambiando solo este archivo; ni el vuelo ni el CSS dependen de su dibujo.
- El rectángulo va en `1.5` para que el trazo de 3 no se recorte en el borde del `viewBox`.
- Tamaño y color se ponen desde fuera: `size-[4.5rem] text-action` en el hero y `size-8 shrink-0 text-action` en la barra. El `size-8` son 2 rem y no dependen del `aspect ratio` del `viewBox`.

### `BrandFlight`

```tsx
export function BrandFlight() {
  return (
    <div className="brand-flight" data-brand="layer" aria-hidden="true">
      <span className="brand-flight__logo" data-brand="copy-logo">
        <BrandLogo className="size-[4.5rem] text-action" />
      </span>
      <span
        className="brand-flight__name block text-center text-[2.5rem] leading-tight font-bold break-words hyphens-auto sm:text-[4rem]"
        data-brand="copy-name"
        lang="es"
      >
        {SITE_AUTHOR}
      </span>
    </div>
  )
}
```

- `SITE_AUTHOR` de `src/lib/navigation.ts` (ya existe y es el mismo texto del `h1`); la copia no crea una segunda fuente de verdad.
- Sin `pointer-events` propio: la capa ya lo neutraliza. Sin `tabIndex`, sin `role`, sin texto alternativo.
- El `span` del nombre lleva `lang="es"`, `block whitespace-normal text-center break-words hyphens-auto`, la tipografía del `h1` (`text-[2.5rem] sm:text-[4rem] leading-tight font-bold`) y el ancho de `--brand-flight-name-width`; `data-brand-lines` decide `nowrap` (una línea) o salto natural (más de una). El `span` de la marca es un contenedor de tamaño fijo.

### `Hero`

Se añade, sin tocar textos ni estilos existentes del `h1` más que el envoltorio:

```tsx
<div className="hero__logo" data-brand="logo">
  <BrandLogo className="size-[4.5rem] text-action" />
</div>
<h1 tabIndex={-1} className="hero__text …">
  <span className="hero__name-text" data-brand="name">Héctor Gutiérrez</span>
</h1>
```

- `data-brand="hero"` en la `<section>` y `data-brand="logo"` en el contenedor de la marca. La separación de **1 rem** y el `mx-auto` los aporta el contenedor del hero.
- El `span` interior es el que se mide: la caja del `h1` es de bloque y ocupa todo el ancho del contenedor, por lo que no sirve como caja de texto. Conserva `break-words hyphens-auto` del `h1` y hereda `lang="es"` del documento; la copia los replica.
- El `h1` conserva `tabIndex={-1}` y el texto sigue siendo real y seleccionable en el tope.
- La marca añade 4,5 rem + 1 rem al bloque: `textBlockHeight` crece, `free` baja y el desplazamiento efectivo del puesto disminuye. Es un cambio estático y aceptado; la fórmula y el límite de 16 px de la 002 no cambian.

### `Navbar`

```tsx
<a
  href={`#${HERO_ID}`}
  onClick={…}                          /* sin cambios */
  data-brand="brand-link"
  className={BRAND_CLASS_LINK}         /* sin truncate: el truncado pasa al span de texto */
>
  <span className="brand__inner flex min-w-0 items-center gap-2">
    <span className="shrink-0" data-brand="brand-logo">
      <BrandLogo className="size-8 text-action" />
    </span>
    <span className="min-w-0 truncate" data-brand="brand-name">Héctor Gutiérrez</span>
  </span>
</a>
```

- `data-brand="bar"` en el `<header>` y `data-brand="brand-link"` en el `<a>`.
- `BRAND_CLASS_LINK` es `BRAND_CLASS` sin `truncate` y con `flex min-w-0 items-center`: el enlace deja de ser el que trunca y pasa a ser el contenedor flex; el truncado vive en el `span` del texto.
- El enlace mantiene `href`, `onClick`, foco y nombre accesible; solo cambia su contenido visual y que el truncado se aplica al texto, no al enlace, para que la marca nunca se comprima. El `span` de texto lleva `min-w-0` y el logo `shrink-0`.
- La fila de la barra mantiene `flex-wrap` como red de seguridad, pero a 320 px al 100 % **no envuelve**: la marca (180,41) + separación 8 + controles 92 suman 280,41 px dentro de los 288 disponibles, así que la barra mide **64 px en una sola fila**. Los controles quedan a la derecha en **≈212–304 px** (menú 44 + separación 4 + conmutador 44 = 92). La copia de la marca llega como máximo a **≈207,1 px**, con una separación de **≈4,9 px** (se exige ≥2) respecto a los controles. A 375 px y superiores se mantiene la fila única de 64 px y el conmutador recupera 72 px.
- A 320 px con texto al 200 % la marca no cabe ni en su fila, el `span` se trunca (`scrollWidth > clientWidth + 1`) y, **sin movimiento reducido**, se aplica la composición sin vuelo por degradación; **con movimiento reducido** gana el modo reducido y la marca se muestra truncada con elipsis. El hueco real, los píxeles ocultos y el alto de la barra se miden en el escenario; no se usan cifras fijas, porque el conmutador compacto cambia el reparto.
- La fila de controles usa `gap-1` (4 px) a 320 px y `sm:gap-3` (12 px) desde 640 px; el menú conserva su objetivo de 44×44.
- No se añaden colores fuera de la paleta ni transiciones temporales: el conmutador conserva `transition-colors`/`transition-transform` solo para el tema y `motion-reduce:transition-none`; el vuelo no usa transiciones.
- `visited:text-ink`, `underline-offset-4`, `hover:underline` y `focus-ring` se mantienen en el enlace para no alterar su aspecto en reposo, hover y foco.

### `ThemeSwitch`

- A 320 px (hasta 374 px) el mismo `ThemeSwitch` se renderiza **compacto**: solo icono, **44×44**, sin el pulgar deslizante de 36 px. Mantiene `role="switch"`, `aria-checked={isDark}`, su nombre accesible (`aria-label`) y el `onClick` actual; el objetivo táctil sigue siendo todo el botón.
- Desde 375 px recupera el ancho de **72 px** (`w-[4.5rem]`) y el pulgar con `translate-x`; no se crea un segundo control ni se duplica estado.
- El modo compacto no introduce colores fuera de la paleta ni una transición nueva: conserva las clases de color y `motion-reduce:transition-none`.

### `App`

```tsx
const activeId = useActiveSection()
useBrandFlight()

return (
  <>
    <SkipLink />
    <Navbar … />
    <BrandFlight />
    <main …>…</main>
    <Footer />
  </>
)
```

- La capa va después de la barra en el DOM y por encima por `z-index`; fuera de `<main>` para no alterar el orden de lectura del contenido.

## 7. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Por qué |
| --- | --- | --- |
| **Capa externa** decorativa con copias, montada en `App`, por encima de la barra | Mover la marca real de la barra con `position: fixed` desde el hero hasta su sitio | Mover la marca real rompería su caja de layout (la barra cambiaría de tamaño), obligaría a reinsertarla, complicaría el foco y la haría perder su sitio en el flujo; el enlace dejaría de ser el mismo nodo durante el vuelo. Con copias, el `<h1>` y el enlace reales no se tocan y la capa no puede romper la semántica. |
| **Separaciones fijas** de 1 rem (hero) y 0,5 rem (barra) entre logo y nombre | Separación proporcional al tamaño del texto o distinta por breakpoint | Las dos separaciones son decisión cerrada del usuario; fijarlas evita que el encaje dependa del ancho y mantiene la marca pegada a su nombre en ambos extremos. |
| **Movimiento reducido en escalón** (barra vacía hasta `s = 1,04`, aparición instantánea) | Barra completa desde el inicio, como una degradación | Con la barra completa desde el inicio el nombre aparece duplicado en la primera pantalla, que es justo lo que el vuelo evita. El escalón conserva la limpieza del tope sin animación, y al no haber transición de opacidad no hay fundido. |
| **Truncado de la marca = sin vuelo, solo en vuelo activo** (composición sin vuelo por degradación) | Forzar una línea, reducir la marca o dejar que el vuelo apunte a una caja truncada | La prioridad es no invadir el conmutador. Si el destino está truncado, la copia no puede encajar sin recortar texto ni deformar la escala; la degradación deja la barra completa y operativa y no oculta el conmutador. Se detecta con `scrollWidth > clientWidth + 1` para no degradar por redondeo. **Con movimiento reducido no se aplica**: gana el modo reducido y la marca se trunca con elipsis. |
| **Precedencia medida inválida → `reduced` → truncado → vuelo** | Comprobar el truncado antes de `reduced`, o eximir la medida inválida con la preferencia | Sin cajas válidas y `D ≤ 0` no hay `s`: la degradación se aplica en ambos modos. Con medida válida y movimiento reducido no hay copia que encajar; degradar por truncado mostraría la barra completa arriba, justo lo que el usuario quiso evitar. El modo reducido gana y solo el vuelo activo se degrada por truncado. |
| **Conmutador compacto a 320 px** (44×44, solo icono) y **fila única de 64 px** | Mantener el conmutador de 72 px o forzar el apilado con `basis-full` | Con 72 px los controles no caben sin invadir la copia. Forzar el apilado lleva la copia a 215,13 px e invade los controles 3,1 px, incumpliendo la separación ≥2 px. La fila única (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288) deja la copia en 207,1 px y 4,9 px de separación; el compacto conserva nombre accesible, estado y clic, y desde 375 px se recupera el de 72 px. |
| **Capa oculta con el panel del menú abierto** | Bajar la capa a `z-index: 51` | El panel vive dentro del `header` (`z-50`); bajar la capa a 51 seguiría tapándolo en cuanto el panel se abra con la página desplazada. Ocultar la capa mientras el panel está abierto resuelve el solape sin tocar el z-order ni el estado del vuelo. El selector usa `html:has(header [aria-expanded="true"]) .brand-flight` porque la capa es hermana del header; requiere `:has()` (línea base 2023) y, sin soporte, el vuelo sigue con un posible solape. |
| **Un solo ancho medido** (`name.width`) para la copia | Ancho de contenido del `h1` o `max-content` | El `h1` es de bloque y ocupa todo el contenedor; su ancho no es el del texto. Usar `name.width` (499,2 px a 1440) hace que la copia parta las líneas igual que el original; con una línea se añade `nowrap` y con dos, 1 px de holgura. |
| **No observar la copia** con `ResizeObserver` | Observar la capa o el `span` de la copia para detectar cambios | El hook escribe el ancho y `data-brand-lines` en la capa; observarla dispararía el aviso «ResizeObserver loop completed with undelivered notifications». Se observan solo el hero y la barra. |
| **JS + `requestAnimationFrame`** con variables CSS | `animation-timeline: scroll()` / `view()` de CSS | Las animaciones por scroll no permiten acoplar la Y al scroll real, congelar la copia en el destino sin recortar `s`, cruzar la opacidad entre tres representaciones ni cambiar al modo de movimiento reducido sin duplicar reglas; además el soporte es desigual y no es verificable con `node --test`. El cálculo puro da los mismos valores en ambos sentidos y se prueba sin navegador. |
| **Fundidos ligados al scroll** (opacidad calculada con `s`) | Transiciones temporales de opacidad o `transition` en el `transform` | Una transición temporal se desincroniza del scroll rápido, deja estados intermedios al detenerse, produce parpadeo al invertir y no es reversible con exactitud. Con la opacidad derivada de `s`, detenerse congela el estado, subir lo recorre al revés y no hay inercia. |
| **Relevo final con la copia parada en el destino** (`s = 1` → `s = 1,04`) | Fundir la copia antes de que llegue, mientras todavía viaja | Si el fundido empieza con la copia en movimiento, durante el cruce se ven dos piezas desalineadas: a 1440 px faltan decenas de píxeles de desplazamiento horizontal y un 20 % de escala, y el fantasma es visible. Con la trayectoria gobernada por `q` la copia llega exacta en `s = 1` y el relevo solo cruza opacidades sobre la misma posición. |
| **D entre `nameTop` y `targetTop`** y tope vertical en `targetTop` | D entre centros, o D entre bordes superiores sin escalar | `targetTop = brandName.centerY − (name.height · escala)/2` es el borde superior de la copia ya escalada y centrada en la marca; con `D = name.top − targetTop`, la Y del h1 se acota directamente en el destino y el centro coincide en `s = 1`. Entre centros obliga a interpolar un centro y no encaja con la Y de borde superior; entre bordes sin escalar deja el centro 2,75 px alto a 1440 px y adelanta el final 26 px. |
| **Escala por tamaño de texto** (`brandFontSize / name.fontSize`) y **por altura** para la marca | Escala por cociente de anchos medidos | El cociente de anchos falla si el nombre ocupa más de una línea: la caja es más alta y el ancho de la línea más larga no representa el tamaño tipográfico, así que daría una escala incorrecta y una copia deformada. Los tamaños de texto y las alturas de la marca son estables en todos los casos. |
| **Y del nombre = borde superior del h1 con `heroShift`** (`name.top − scrollY + heroShift`, acotada en `targetTop`) y **X/escala lineales con `q`** | Interpolar la Y con `s`, o usar la Y natural sin `heroShift` | Compartir el `heroShift` del h1 hace que la copia no lo adelante ni flote y que la entrada sea pixel-perfect; al llegar se fija en `targetTop`. Interpolar la Y con `s` desacopla la copia de la página; la Y natural sin `heroShift` deja un salto de unos 2 px en la entrada. La X y la escala usan `q`, que descuenta el 2 % de entrada y llega a 1 exactamente en `s = 1`. |
| **Ocultar con `opacity`** sobre envoltorios | `display: none`, `visibility: hidden` o quitar el nodo | Cualquier opción que saque la caja del layout cambia el alto del hero y el reparto de líneas, y con `visibility`/`display` el `<h1>` dejaría de estar disponible para lectores de pantalla y para el foco. `opacity` conserva caja, texto, foco y anuncio. |
| Fade del **contenido** del enlace, no del enlace | Ocultar el enlace completo con `opacity` | Si se oculta el enlace, también se oculta su anillo de foco y el visitante de teclado tabula a un control invisible sin ninguna pista. Ocultando solo el contenido, el anillo sigue visible y el enlace conserva su caja, su destino y su orden. |
| Un **hook en `App`** que consulta los elementos por `data-brand-*` | Contexto de React con refs registradas por `Hero` y `Navbar` | El contexto obliga a cambiar la firma de los componentes y a coordinar el orden de montaje; los elementos son únicos en el documento y `useActiveSection` ya consulta `header` y `main` de la misma forma. Los `data-brand-*` dejan explícito qué se mide. |
| Variables CSS escritas **en el elemento que las consume** | Escribirlas en `<html>` o pasar estilos por props | En `<html>` cada escritura invalida el estilo de todo el documento; por props habría renders por frame. La capa, el hero y la barra son los tres únicos consumidores. |
| **Remedir** con `resize` y `ResizeObserver`, normalizando el origen con `computeHeroOffsets` | Leer `--hero-text-shift`, o medir en cada frame con `getBoundingClientRect` | Medir en cada frame fuerza reflujo y desobedece RNF-2. Leer `--hero-text-shift` depende del orden de efectos; reutilizar `computeHeroOffsets` con la sección, `H` y `.hero__content` da el mismo `heroShift` sin duplicar la fórmula y sin acoplarse al otro hook. Cachear sin corregir el parallax desplaza el origen cuando se mide con la página ya desplazada. |
| **Estado de acoplado por atributo** en la barra | `pointer-events` calculado con una variable CSS numérica | `pointer-events` no acepta una interpolación numérica; el atributo cambia dos veces por recorrido y no cuesta nada. |
| **Composición sin vuelo por valores por defecto** del CSS | Código de rescate en JavaScript | Los valores por defecto (`copia 0`, `hero 1`, `marca 1`) ya son la composición sin vuelo por degradación: sin JS, sin medidas, con la marca truncada **en vuelo activo** o tras un fallo, no hay nada que reparar y no se puede quedar una marca invisible. Con movimiento reducido no se aplica: gana el modo reducido. El estado en el tope no usa esos valores: el hook escribe `marca 0` al arrancar. |

## 8. Estrategia de tests

### 8.1 Con `node --test` (sin DOM, sin dependencias)

```powershell
node --test src/lib/brandFlight.test.ts
npx tsc -b
```

| Caso | RF / RNF |
| --- | --- |
| Constantes `BRAND_FLIGHT_ENTER_END = 0.02` y `BRAND_FLIGHT_HANDOFF_FRACTION = 0.04` | RF-7 |
| `s = 0` y `heroShift = 0`: `copyOpacity 0`, `heroOpacity 1`, `brandOpacity 0`; nombre y marca sobre su caja origen, pixel-perfect | RF-2, RF-5, RF-6, RF-7 |
| `scrollY = 1`: `progress > 0` y `copyOpacity > 0` (sin zona muerta) | RF-4, RF-7 |
| `s = 0,01` (1 %): opacidad de la copia intermedia, suma 1 **en vuelo activo**, X/escala todavía en el origen y Y del nombre = `name.top − scrollY + heroShift` (la del h1) | RF-5, RF-7 |
| `s = 0,02` (2 %): `heroOpacity 0`, `copyOpacity 1`, trayectoria empieza a avanzar | RF-7 |
| `s = 0,5` (50 %): solo copia (`1, 0, 0`) | RF-7 |
| `s = 1` (100 %): copia exactamente en el destino —centros y ancho dentro de 1 px— y `copyOpacity 1` | RF-5, RF-6 |
| `s = 1,02` (102 %): mitad del relevo final, copia y marca en el mismo destino, suma 1 **en vuelo activo** | RF-7 |
| `s = 1,04` (104 %): `copyOpacity 0`, `brandOpacity 1`, `docked true`, centros y ancho coincidentes | RF-5, RF-6, RF-7, RF-8 |
| Malla de `s` en `[0, 1,04]` con `reducedMotion = false`: suma de opacidades 1 ± 1e−9 y opacidades en `[0, 1]` | RF-7 |
| `scrollY = D + heroShift` y `scrollY > D + heroShift`: la copia no se mueve del destino (parada, no reiniciada) | RF-4, RF-5 |
| `scrollY ≥ 1,04 · D + heroShift`: mismo resultado que en `1,04 · D + heroShift` (congelado) | RF-4, RF-8 |
| `scrollY < 0`: mismo resultado que 0 (con `heroShift = 0`) | RF-4 |
| `heroShift = −120`: `s` y la Y del nombre usan `scrollY − heroShift`; la X/escala no cambian; el logo no lo usa | RF-4, RF-5, RF-6 |
| Simetría: la misma entrada da el mismo resultado en cualquier orden | RF-4 |
| `D ≤ 0` (borde superior del nombre en o por debajo de `targetTop`): composición sin vuelo | RF-4, RF-14 |
| Caja con ancho o alto ≤ 0 en `name`, `brandName`, `logo` o `brandLogo`, también con `reducedMotion = true`: composición sin vuelo (la guarda de medida va antes que la preferencia) | RF-14, RNF-6 |
| `name.fontSize` o `brandFontSize` ≤ 0, o entradas no finitas (incluido `heroShift`): composición sin vuelo | RF-14, RNF-6 |
| `reducedMotion = true` en `s = 0` y `0,5`: `copyOpacity 0`, `heroOpacity 1`, `brandOpacity 0`, `docked false` | RF-9 |
| `reducedMotion = true` en `s = 1,03`: `brandOpacity 0` (todavía oculta) | RF-9 |
| `reducedMotion = true` en `s = 1,04`, `2` y al volver a `1,02`: escalón a `brandOpacity 1`/`0`, `docked` correcto | RF-9 |
| `reducedMotion = true` con `s ≥ 1,04`: suma de opacidades 2 (`hero 1 + barra 1`), fuera del alcance del invariante de vuelo activo | RF-7, RF-9 |
| `reducedMotion = true` en el caso combinado de 320/200 %: la función devuelve modo reducido (no degradación); el truncado se decide fuera y no la altera | RF-9, RF-14, RNF-6 |
| Encaje con una línea (nombre 499,2 px a 64 px, marca 140,4 px a 18 px): ancho escalado y centros a menos de 1 px en `s = 1` | RF-5 |
| Copia inmóvil de `s = 1` a `s = 1,04`: mismos centros y mismo ancho en los dos extremos | RF-5, RF-7 |
| Dos líneas (caja 288 × 100 px, texto 40 px; marca 140,4 px a 18 px): escala `18/40 = 0,45`, copia de ≈45 px de alto frente a ≈22 px de la marca y centros coincidentes; el ancho no coincide y no hay error | RF-10 |
| Tres líneas (caja 288 × 300 px, texto 80 px; marca a 36 px): escala `36/80 = 0,45`, copia de ≈135 px de alto frente a ≈45 px de la marca y centros coincidentes; el ancho no coincide, no hay error y el fantasma es mayor que con dos líneas | RF-10 |
| Marca provisional: en `s = 1` el centro y el tamaño coinciden con el hueco de la barra | RF-6 |
| Y del nombre acotada por `targetTop` y sin saltos: `max(name.top − scrollY + heroShift, targetTop)` | RF-5 |

Las cifras de los dos casos de encaje son las medidas reales del acuerdo (a 1440 px y a 320 px) y sirven como fixture; no se usan como valores de producción. El truncado de la marca y el número de líneas se detectan en el DOM y se verifican en §8.2, no en la función pura. El truncado usa `scrollWidth > clientWidth + 1` y **solo degrada si `reducedMotion` es falso**; la suma de opacidades 1 se prueba únicamente en vuelo activo, porque en degradación y en reducido con `s ≥ 1,04` la suma legítima es 2. La medida inválida se prueba también con `reducedMotion = true` y devuelve la composición sin vuelo: la guarda de medida precede a la preferencia.

### 8.2 Con Chrome DevTools MCP

| Comprobación | Criterio |
| --- | --- |
| Marca provisional en hero y barra, 4,5 rem y 2 rem, ambos temas, sin peticiones de red | 1 |
| Tope: hero con marca y nombre, barra sin marca, un solo `h1` | 2 |
| Progreso en `s = 0`, 1 px, `0,02`, `0,5`, `1`, `1,02` y `1,04`, y en `s = 1,04` + 200 px, en bajada y subida; a 1440, `s = 1` ≈ scroll 340 y `s = 1,04` ≈ 354; a 375, `D ≈ 416`; con reduce, `s = 1,04` ≈ 461 | 3 |
| Rectángulos de la copia y del texto de la marca en esos puntos; coincidencia ≤ 1 px en `s = 0`, `s = 1` y `s = 1,02`, y copia inmóvil en el relevo final | 4 |
| Rectángulos de la marca provisional en los extremos | 5 |
| Opacidades en la malla **en vuelo activo** y su suma 1; en reducido con `s ≥ 1,04` y en degradación, suma 2; sin cambio con el scroll detenido; inversión sin parpadeo | 6 |
| Puntero y foco de la marca en `flying` y `docked`; modificadores y orden de tabulación | 7 |
| `prefers-reduced-motion` al cargar, activado y desactivado en caliente; barra vacía arriba, escalón en `s = 1,04` y ocultación al subir; **320/200 % + reduce**: gana reducido, barra vacía arriba, aparición instantánea, marca truncada con elipsis y sin invadir el conmutador | 8 |
| 320/375/768/1440 al 100 %: sin scroll horizontal, 375/768/1440 con una línea, encaje exacto y **sin degradación por falso positivo** (tolerancia `+1`); 320 al 100 %: vuelo con dos líneas y fantasma admitido, barra de **64 px en una sola fila** (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), controles a la derecha en ≈212–304 px, conmutador compacto **44×44** solo icono con nombre accesible, estado y clic, copia ≤ **≈207,1 px** y separación **≈4,9 px** (≥2); 375+: conmutador de **72 px** y barra de 64 px; 320 al 200 % sin reduce: degradación sin vuelo; 320 al 200 % con reduce: modo reducido; 640×400 al 200 %: tres líneas, nombre de barra sin truncar (281/281) y vuelo con fantasma admitido, o degradación si hubiera truncado; líneas de la copia y del original y altura real de la barra | 9 |
| Altos, recorrido y parallax del puesto y del fondo con el `free` actual; CLS | 10 |
| Recarga a media página con restauración activa | 11 |
| Cambio de tema en `s = 0`, `0,5` y `1,04`; anillo de foco sin contenido | 12 |
| Contraste 9×9 en el tope, en `0,25`, `0,5`, `0,75`, `1` y `1,04`; durante el fundido de tema | 13 |
| `node --test`, `npx tsc -b`, `npm run build` | 14 |
| Forzar falta de medida, `D ≤ 0` y caja no válida: barra completa desde el inicio, sin copia, marca operativa; con truncado y movimiento reducido no se degrada, pero con medida inválida y `reduce` sí se degrada | 15 |
| Panel abierto al 50 % del vuelo con `html:has(header [aria-expanded="true"]) .brand-flight`: capa no pintada, panel por encima, estado conservado al cerrar; sin `:has()`, el vuelo sigue con posible solape | 16 |
| 320 px con texto al 200 % sin reduce: marca truncada (`scrollWidth > clientWidth + 1`), sin vuelo, barra completa y conmutador compacto visible, operativo y no invadido; con reduce, no se degrada (criterio 8) | 17 |
| Consola, dependencias, red, almacenamiento, árbol de accesibilidad, StrictMode sin residuos y avisos de `ResizeObserver` | 18 |
| Cifras de referencia: 1440 `D ≈ 443`, `s = 1` ≈ scroll 340 y `s = 1,04` ≈ 354; 375 `D ≈ 416`; reduce `s = 1,04` ≈ 461; scroll 236 es `s ≈ 0,69`; `s = 0,5` es scroll ≈ 170; encaje en `s = 1` con Δcentro y Δancho ≤ 1 px; 320/375/768/1440 sin scroll horizontal ni solapes con el puesto, el menú o el conmutador | 19 |
| Reutilización de `computeHeroOffsets`: con la página a media altura, el origen se normaliza con el `heroShift` de la función y no se desplaza; no se lee `--hero-text-shift` | 3, 4, 11 |

Se verifica en `npm run preview`, como pide `MEMORY.md`; el servidor de desarrollo puede servir CSS obsoleto.

## 9. Trazabilidad RF → plan

| Requisito | Dónde se resuelve | Tarea |
| --- | --- | --- |
| RF-1 (marca provisional) | `BrandLogo.tsx` §6, tamaños y separaciones en §5.3 y §6 | T2 |
| RF-2 (estado en el tope y jerarquía) | `Hero.tsx` y `Navbar.tsx` §6, opacidades por defecto §5.2 | T2 |
| RF-3 (capa de vuelo sin efectos) | `BrandFlight.tsx` §6, `App.tsx` §6, `.brand-flight` §5.3, regla del panel §5.3 | T3, T6 |
| RF-4 (progreso y D) | `computeBrandFlight` §3, hook §4.3 | T1, T3 |
| RF-5 (trayectoria del nombre) | §3.1, escala, `targetTop` y Y del h1 §3.2 | T1, T3 |
| RF-6 (trayectoria de la marca) | §3.1 | T1, T3 |
| RF-7 (relevos) | §3.1, constantes, opacidades §5.3 | T1, T4 |
| RF-8 (acoplado y puntero) | `docked` §3.1, atributo `data-brand-state` §4.3 y §5.3 | T1, T3, T4 |
| RF-9 (movimiento reducido) | §3.1, hook §4.5, `index.css` | T1, T5, T9 |
| RF-10 (responsive, ampliación y truncado) | `--brand-flight-name-width` §4.2, §5.3, `data-brand-lines` §4.2, `Navbar` y `ThemeSwitch` §6 | T2, T3, T5 |
| RF-11 (layout y parallax) | capa fuera del flujo §5.3, `opacity` §7, nota del `free` §6 | T7 |
| RF-12 (primer render) | `useLayoutEffect` §4.4, `App` §6 | T3 |
| RF-13 (tema durante el vuelo) | color retrasado §5.3, tokens | T2, T4 |
| RF-14 (composición sin vuelo por degradación) | §3.1, defectos §5.2, guardas §4.2 y §6 | T1, T2, T5, T9 |
| RF-15 (panel del menú abierto) | regla `:has` §5.3, verificación §8.2 | T6, T9 |
| RNF-1 (accesibilidad) | `aria-hidden` §6, foco del enlace §5.3 y §7 | T2, T3, T6 |
| RNF-2 (rendimiento) | bucle §4.3, variables por elemento §4.3, observadores §4.4 | T3, T9 |
| RNF-3 (sin dependencias, red ni almacenamiento) | todo el plan | T1 a T9 |
| RNF-4 (contraste) | tokens §5.3, verificación §8.2 | T7, T8 |
| RNF-5 (SEO y carga) | `<h1>` LCP y SVG en línea §6, verificación §8.2 | T2, T8 |
| RNF-6 (función pura) | §3 y tests §8.1 | T1, T9 |

## 10. Riesgos conocidos

1. **Entrada no pixel-perfect si se omite `heroShift`**: la copia debe usar `name.top − scrollY + heroShift`; con la Y natural se desalinea unos 2 px a 1440 px en la franja 0–2 %. Mitigación: la fórmula vive solo en `computeBrandFlight` y los tests de `s = 0` y `s = 0,01` comprueban la coincidencia; no se acorta el tramo.
2. **Normalización del parallax al remedir**: si se mide con la página desplazada sin restar el `heroShift` que devuelve `computeHeroOffsets`, el origen queda desplazado y el encaje falla. La corrección está en §4.2 y se verifica remediendo a media página; no se lee `--hero-text-shift`.
3. **Más de una línea**: en 320 px y con texto ampliado el encaje no puede ser exacto. Con dos líneas la copia mide ≈45 px de alto frente a ≈22 px de la marca (fixture 288 × 100 a 40 px, escala 0,45) y el relevo final deja un fantasma breve de ≈13 px de scroll (4 % de `D`); con tres líneas (fixture 288 × 300 a 80 px, escala 0,45) la copia es más alta y el fantasma mayor. Está aceptado y documentado; no se corrige truncando, reduciendo el texto ni cambiando a un corte seco.
4. **Marca invisible y foco**: en el tope el enlace de marca está oculto pero enfocable. Se acepta, con anillo visible; es la consecuencia directa de vaciar la barra, decidida por el usuario.
5. **Solape con el panel del menú**: la premisa «el panel solo se abre en reposo» es falsa; puede abrirse con la página desplazada y la capa (55) taparía un panel que vive en el header (50). Mitigación: la capa no se pinta mientras `[aria-expanded="true"]` esté presente, con `html:has(header [aria-expanded="true"]) .brand-flight` en §5.3. La capa es hermana del header, por eso no sirve un selector descendiente. `:has()` tiene línea base 2023; sin soporte, el vuelo sigue y solo puede solaparse el panel abierto a mitad de vuelo. Bajar la capa a 51 no lo resuelve y no se hace.
6. **Coste de `will-change`**: dos elementos con `will-change: transform` mientras el efecto está activo. Si el perfilado en móvil empeora, se retira; el `transform` sigue siendo compositado.
7. **StrictMode**: doble montaje; la limpieza debe borrar las diez variables y los atributos `data-brand-state` y `data-brand-lines`, e invalidar `degradado`, `ultimoAncho` y `ultimasLineas`, o el segundo montaje heredaría un estado obsoleto.
8. **Zoom de texto y truncado**: la barra puede cambiar de alto y el nombre de la barra truncarse. A 320 px con texto al 200 % el hueco real, los píxeles ocultos y el alto de la barra se **miden**; no se usan cifras fijas, porque el conmutador compacto cambia el reparto. Mitigación: se detecta con `scrollWidth > clientWidth + 1` y **solo se desactiva el vuelo si no hay movimiento reducido**; con `reduce` gana el modo reducido y la marca se trunca con elipsis. La tolerancia evita falsos positivos en 375, 768 y 1440 px. A 320 px al 100 % la barra mide 64 px en una sola fila (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), el conmutador es compacto de 44×44 y la copia llega a 207,1 px con 4,9 px de separación; a 320/200 % el alto se mide y se documenta.
9. **Precedencia mal implementada**: comprobar el truncado antes de `reduced` degradaría la barra en el caso combinado y mostraría la barra completa arriba, contra la decisión del usuario; eximir la medida inválida con `reduced` dejaría una barra sin geometría. Mitigación: orden medida inválida → `reduced` → truncado → vuelo, y el caso 320/200 % + reduce se verifica en T9; la función pura no recibe el truncado.
10. **Divergencia del parallax**: si el hook duplica la fórmula de `computeHeroOffsets` o lee `--hero-text-shift`, el `heroShift` del vuelo puede diferir del que mueve el h1 y la entrada deja de ser exacta. Mitigación: se importa `computeHeroOffsets`, se recalcula por frame con las métricas cacheadas y se pasa antes de escribir; no se depende del orden de efectos.

## 11. Puntos cerrados antes de implementar

- La marca provisional es un **marcador de posición, no el logo definitivo**: un monograma «H» dentro de un cuadrado redondeado, vectorial en línea, 4,5 rem en el hero y 2 rem en la barra, con **1 rem** y **0,5 rem** de separación respectivamente, decorativo y sustituible cambiando solo `BrandLogo.tsx`.
- La capa de vuelo va en `App`, por encima de la barra, sin puntero, sin foco y sin anuncio; no se pinta con el panel del menú abierto.
- `D = name.top − targetTop`, con `targetTop = brandName.centerY − (name.height · escala)/2`; la Y del nombre sigue al h1 con `heroShift` (`name.top − scrollY + heroShift`, acotada en `targetTop`); X y escala se interpolan con `q = clamp((s − 0,02) / 0,98, 0, 1)`, que llega a 1 en `s = 1`. El logo interpola con `q` y no usa `heroShift`.
- Relevos: entrada en el primer 2 %; relevo final de `s = 1` a `s = 1,04` con la copia parada en el destino; la suma de opacidades del nombre es 1 **en el vuelo activo**, fuera de la degradación y del modo reducido. Con más de una línea se admite el fantasma breve de ≈13 px, que crece con el número de líneas.
- Acoplado en `s ≥ 1,04`: la marca real recupera el puntero; antes no lo tiene, pero sigue siendo enfocable.
- Estados: **estado en el tope**, **vuelo**, **acoplado**, **composición sin vuelo por degradación** y **modo de movimiento reducido**. El movimiento reducido no es la degradación: barra vacía hasta `s = 1,04` y aparición instantánea.
- Precedencia: medida inválida → degradación (también con `reducedMotion`); medida válida + `reducedMotion` → modo reducido; si no, truncado → degradación del vuelo activo; si no, vuelo. La medida inválida degrada también con movimiento reducido, porque sin `D > 0` no hay `s`.
- Si la marca de la barra se trunca **sin movimiento reducido**, no hay vuelo: se aplica la composición sin vuelo por degradación y la barra queda completa desde el inicio. **Con movimiento reducido** gana el modo reducido y la marca se trunca con elipsis sin invadir el conmutador.
- A 320 px al 100 % la barra mide 64 px en una sola fila (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), el conmutador es compacto de 44×44 (solo icono, con nombre accesible, estado y clic), los controles quedan a la derecha en ≈212–304 px y la copia llega a ≈207,1 px con separación ≈4,9 px (≥2); desde 375 px el conmutador recupera 72 px.
- Se derogan de la 002 la decisión B, la F, la G en su exclusividad, RF-2, RF-3, RF-5 para el nombre, RF-7, RF-8, RNF-1 en las posiciones del nombre, la línea de animaciones del «Fuera de alcance», las líneas 174 y 179 sobre la navbar y el criterio 5 para el nombre. **RNF-5 no se deroga**: el LCP sigue siendo el `<h1>`. De la 003 se derogan las líneas 174 y 176 del «Fuera de alcance» y se interpreta su RNF-2 como un escucha pasivo por subsistema.
- Sin dudas pendientes: la implementación puede empezar por T1.


