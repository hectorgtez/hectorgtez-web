# Tareas 004 — La marca en vuelo

Spec: `specs/004-marca-en-vuelo/spec.md`. Plan: `plan.md`.
Una tarea cada vez; no se avanza con tests en rojo ni con la consola sucia. Al cerrar cada tarea, marcarla `[x]`.
Los tests de la función pura se escriben **antes** de usarla. La verificación se hace en `npm run preview`.

- [x] **T1. Función pura del vuelo con tests (rojo → verde).** RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-14, RNF-6
- Archivos: `src/lib/brandFlight.ts` (nuevo), `src/lib/brandFlight.test.ts` (nuevo).
- Hecho cuando existen los tipos `Box`, `NameBox`, `BrandNameBox`, `BrandFlightMetrics`, `BrandFlightTransform` y `BrandFlightState`, las constantes `BRAND_FLIGHT_ENTER_END = 0.02` y `BRAND_FLIGHT_HANDOFF_FRACTION = 0.04`, y `computeBrandFlight(metrics, reducedMotion)`, sin `window`, `document` ni tiempo. La entrada es `name {top,height,left,width,fontSize}`, `brandName {centerY,...}`, `brandFontSize`, `scrollY` y `heroShift`; la fórmula usa `scale = brandFontSize/name.fontSize`, `targetTop = brandName.centerY − (name.height·scale)/2`, `D = name.top − targetTop`, `s = max(0, scrollY − heroShift)/D`, `q = clamp((s−0.02)/0.98,0,1)` y `y = max(name.top − scrollY + heroShift, targetTop)`. Los tests cubren, como mínimo:
  - `s = 0` con `heroShift = 0`: `copyOpacity 0`, `heroOpacity 1`, `brandOpacity 0`; copias en su origen y coincidencia pixel-perfect en X, Y, ancho y escala.
  - `scrollY = 1`: sin zona muerta (`progress > 0`, `copyOpacity > 0`).
  - `s = 0,01`: opacidad intermedia, suma 1 **en vuelo activo**, X/escala todavía en el origen y Y = `name.top − scrollY + heroShift` (la del h1).
  - `heroShift` negativo (por ejemplo `−120`): `s` y la Y del nombre usan `scrollY − heroShift`; la X y la escala no cambian; el logo interpola con `q` y no usa `heroShift`.
  - `s = 0,02`: `heroOpacity 0`, `copyOpacity 1`.
  - `s = 0,5`: solo copia (`1, 0, 0`).
  - `s = 1`: copia exacta en el destino con `D = name.top − targetTop`, centros y ancho dentro de 1 px.
  - `s = 1,02`: copia y marca en el destino, relevo de opacidades entre 1 y 1,04, suma 1 **en vuelo activo**.
  - `s = 1,04`: `copyOpacity 0`, `brandOpacity 1`, `docked true`.
  - `s ≥ 1,04`: congelado; `scrollY < 0`: como 0.
  - Malla de `s` en `[0, 1,04]` con `reducedMotion = false`: suma de opacidades 1 ± 1e−9 y valores en `[0, 1]`.
  - `D ≤ 0`, caja de ancho **o alto** ≤ 0 en las cuatro, `name.fontSize` o `brandFontSize` ≤ 0, o entrada no finita (incluido `heroShift`): composición sin vuelo.
  - `reducedMotion`: `s = 0` y `0,5` → `brandOpacity 0`; `s = 1,03` → `0`; `s = 1,04` y `2` → `1`, `docked true`, copias invisibles y `heroOpacity 1`; con `s ≥ 1,04` la suma es 2 y queda fuera del invariante del vuelo activo.
  - Caso combinado de 320/200 % con `reducedMotion = true`: la función devuelve modo reducido y el truncado (decidido fuera) no la degrada.
  - Encaje de una línea (499,2 a 64 px y 140,4 a 18 px) y fixture de dos líneas (288 × 100 a 40 px; escala 0,45; centros coincidentes; ancho distinto sin error).
  - La misma entrada da la misma salida en cualquier orden.
- `node --test src/lib/brandFlight.test.ts` pasa en verde y `npx tsc -b` no da errores nuevos.
- Tests: sí (`node --test src/lib/brandFlight.test.ts`).

- [x] **T2. Marca provisional e integración visual en hero y barra.** RF-1, RF-2, RF-10, RF-14, RNF-1, RNF-3, RNF-4, RNF-5
- Archivos: `src/components/ui/BrandLogo.tsx` (nuevo), `src/components/hero/Hero.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/ThemeSwitch.tsx`, `src/index.css`.
- Hecho cuando:
  - `BrandLogo` es un SVG en línea que dibuja un **marcador de posición, no el logo definitivo** —monograma «H» en cuadrado redondeado, cuadrado y de trazo uniforme—, `aria-hidden="true"`, `focusable="false"`, `currentColor` y `className`, sustituible cambiando solo ese archivo.
  - El hero muestra la marca de 4,5 rem encima del nombre, centrada y a **1 rem**; el `h1` envuelve su texto en un `span` medible con `data-brand="name"` y conserva `tabIndex={-1}`.
  - La barra muestra la marca de 2 rem a la izquierda del nombre, dentro del enlace, a **0,5 rem**, con `data-brand="brand-logo"` y el texto en un `span` con `min-w-0 truncate` y `data-brand="brand-name"`; el logo lleva `shrink-0`; el enlace recibe `data-brand="brand-link"`, deja de truncar (el `truncate` pasa al `span`) y se convierte en contenedor `flex min-w-0 items-center`.
  - Existen `data-brand="hero"`, `"logo"` y `"bar"`, y las clases de opacidad con valores por defecto `1` (composición sin vuelo por degradación).
  - Con los valores por defecto se ve la barra completa (logo + nombre) desde el inicio; forzando `--brand-flight-brand-opacity: 0` en DevTools, la barra queda vacía y el anillo de foco del enlace sigue visible.
  - La barra mide **64 px con el texto al 100 % en 320, 375, 768 y 1440 px**; a **320 px al 100 %** mide **64 px en una sola fila** (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), el conmutador de tema es compacto **44×44** solo icono, con nombre accesible, estado (`aria-checked`) y clic, los controles quedan a la derecha en **≈212–304 px** (menú 44 + separación 4 + conmutador 44) y la copia llega como máximo a **≈207,1 px**, con separación **≈4,9 px** (se exige ≥2). Con **texto al 200 % a 320 px** el hueco real, los píxeles ocultos y el alto de la barra se **miden** en el escenario (no se usan cifras fijas, porque el compacto cambia el reparto) y el nombre se trunca, caso que desactiva el vuelo en T5; en **640×400 con texto al 200 %** el nombre del hero ocupa **tres líneas**, la barra crece y el nombre de la barra **no** se trunca (281/281), y se documenta el alto real. La detección de truncado usa `scrollWidth > clientWidth + 1` y en 375, 768 y 1440 px no debe activarse (sin falsos positivos por redondeo). Desde **375 px** el conmutador recupera **72 px**. El hero crece por la marca (documentado) y el documento gana ese alto; no se afirma que el recorrido no cambie.
  - Un único `h1`; el enlace conserva `href="#inicio"`, modificadores y orden de foco; marca visible en ambos temas con tokens y sin peticiones de red; el SVG no es candidato a LCP.
- Tests: parcial (`npx tsc -b`) + Chrome DevTools MCP.

- [x] **T3. Capa de vuelo, hook de medida y transformaciones.** RF-3, RF-4, RF-5, RF-6, RF-8, RF-11, RF-12, RF-14, RNF-1, RNF-2
- Archivos: `src/components/brand/BrandFlight.tsx` (nuevo), `src/hooks/useBrandFlight.ts` (nuevo), `src/App.tsx`, `src/index.css`.
- Hecho cuando:
  - `BrandFlight` renderiza la capa con las copias (`data-brand="copy-logo"` y `"copy-name"`), `aria-hidden`, sin elementos enfocables y con la tipografía, `lang="es"`, `break-words hyphens-auto` y ancho por variable de la copia del nombre.
  - `App` monta la capa como hermana de la barra, fuera de `<main>`, y llama `useBrandFlight()` una vez.
  - El hook localiza los siete elementos y `.hero__content`, mide la sección del hero, su alto `H` y el bloque de texto, y mide las cuatro cajas y los dos tamaños de texto; reutiliza `computeHeroOffsets` para obtener `heroShift`, normaliza `name.top` y `logo.top` restándolo (documento sin parallax) y **en cada frame** lo recalcula con el scroll actual y lo pasa a `computeBrandFlight` antes de escribir; calcula `nameWidth = name.width`, las líneas (`name.height > 1,5 · name.fontSize`), `D = name.top − targetTop`, `targetTop = brandName.centerY − (name.height · escala)/2` y `medidaValida` con las mismas guardas que la función pura (entradas finitas, cajas positivas, `name.fontSize` y `brandFontSize` positivos y `D > 0`); detecta el truncado con `brandName.scrollWidth > brandName.clientWidth + 1`. No lee `--hero-text-shift` ni duplica la fórmula del parallax.
  - Escribe las **diez** variables en el elemento que las consume —incluidas `--brand-flight-name-width`, `--brand-flight-copy-opacity`, `--brand-flight-hero-opacity` y `--brand-flight-brand-opacity`— y `data-brand-lines="1"` o `"multi"`; el ancho y las líneas se escriben **en la medición y solo cuando cambian**, no en cada frame.
  - La suite cubre también el fixture de tres líneas (caja 288 × 300 px a 80 px, marca a 36 px, escala `36/80 = 0,45`; centros coincidentes; ancho distinto sin error); si T1 no lo dejó, se añade aquí sin reabrir T1.
  - Un `scroll` pasivo propio con un único `rAF`, `resize` y `ResizeObserver` sobre **hero y barra** (nunca sobre la copia); primera medición en `useLayoutEffect`; limpieza completa al desmontar.
  - Con la página a media altura, el primer frame ya tiene el estado correcto: el `heroShift` sale de `computeHeroOffsets` con las métricas cacheadas del hero, no de `--hero-text-shift`, y no depende del orden de efectos.
  - Desplazando 1 px el vuelo ya ha comenzado; las copias se colocan y escalan según la fórmula. En `s = 1` la copia coincide con el texto de la marca en centro y ancho dentro de 1 px, y el logo con su hueco.
  - Si falta un elemento, una caja no es válida o la marca está truncada **sin movimiento reducido**, **retira** las variables y los atributos (incluido `data-brand-state`, para que la marca recupere el puntero) y queda la composición sin vuelo por degradación; `degradado` evita repetir `limpiar()` en cada frame y `limpiar()` invalida la caché de ancho y líneas.
  - En cada frame solo se escriben transforms (vuelo activo), opacidades y `data-brand-state` cuando cambia; no hay lecturas de layout después de escribir.
  - La capa es fija, `z-index` 55, `pointer-events: none`, `opacity` por variable (defecto 0), `contain: layout style`; no añade paradas de tabulación ni peticiones.
- Tests: sí (`npx tsc -b`, `node --test`) + Chrome DevTools MCP.

- [x] **T4. Entrada, relevos, acoplado y puntero.** RF-7, RF-8, RF-13, RF-14, RNF-1, RNF-4
- Archivos: `src/hooks/useBrandFlight.ts`, `src/index.css`, `src/components/layout/Navbar.tsx` (solo si hace falta).
- Hecho cuando:
  - La copia entra en el primer 2 % con X y escala en el origen; entre el 2 % y el 100 % solo se ve la copia; de `s = 1` a `s = 1,04` la copia, parada en el destino, se funde y aparece la barra real.
  - La suma de opacidades del nombre es 1 **en el vuelo activo**, fuera de la degradación y del modo reducido; detenerse no cambia opacidades (sin transición temporal).
  - El hook escribe `data-brand-state="flying"` mientras `s < 1,04` y `"docked"` desde `s ≥ 1,04`, solo cuando cambia; la regla CSS usa `[data-brand="brand-link"]`.
  - Con `flying` la marca no responde al puntero; con `docked` sí; conserva destino, modificadores, nombre accesible y anillo de foco en ambos estados.
  - El color de la copia usa `--hero-text-color` con retardo de 100 ms; no se anula `transform` ni `opacity` en ese nodo.
  - Al cambiar de tema con el vuelo en curso no se mueve ni se reinicia nada y el contraste cumple RNF-4.
- Tests: sí (`node --test` sigue verde) + Chrome DevTools MCP.

- [x] **T5. Movimiento reducido, degradación por truncado y precedencia.** RF-9, RF-10, RF-14, RNF-1
- Archivos: `src/hooks/useBrandFlight.ts`, `src/index.css`.
- Hecho cuando:
  - El hook aplica el orden: medida inválida → degradación (también con `reducedMotion`); si la medida es válida y hay `reducedMotion`, modo reducido; si no, truncado → degradación; si no, vuelo. Con movimiento reducido, el truncado se ignora. La medida inválida no se exime con la preferencia: sin `D` no hay `s` y se degrada también con `reduce`; en el frame, `degradado` se comprueba antes que `reduced` para no reponer el estado sobre una degradación. El truncado es una condición de DOM (`[data-brand="brand-name"]` con `scrollWidth > clientWidth + 1`) decidida fuera de la función pura.
  - Con `prefers-reduced-motion: reduce` no hay copia ni transforms ni fundido: el hero muestra marca y nombre y se mueve con la página; la barra está vacía con `s < 1,04` y muestra marca y nombre de forma **instantánea** en `s ≥ 1,04`; al subir se ocultan igual de seco.
  - La preferencia se respeta activada o desactivada con la página abierta, sin destellos y conservando el progreso.
  - **Activar reduce con la marca truncada**: partiendo de la degradación por truncado, activar `prefers-reduced-motion` ejecuta la medición de §4.2 antes de escribir, `degradado` pasa a `false` con medida válida, la barra queda vacía arriba y aparece de golpe en `s ≥ 1,04`, con la marca truncada con elipsis y sin quedarse en la composición degradada.
  - En modo reducido el hook no escribe las variables de transformación ni el ancho; solo opacidades y estado.
  - **320/200 % + reduce**: gana el modo reducido; barra vacía arriba, aparición instantánea en `s ≥ 1,04`, marca real truncada con elipsis, sin copia, sin degradación y sin invadir el conmutador compacto (44×44, visible y operable).
  - **320/200 % sin reduce**: con `scrollWidth > clientWidth + 1` no hay vuelo; **se retiran** las variables, `data-brand-*` y `data-brand-state`, la barra queda completa desde el inicio, la copia invisible, la marca operativa desde el primer instante y el conmutador compacto visible, operativo y no invadido. El hueco real para el nombre, los píxeles ocultos y el alto de la barra se **miden** en el escenario; no se usan cifras fijas. A 320/100 % la barra mide 64 px en una sola fila (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), los controles quedan en ≈212–304 px y la copia en ≈207,1 px con ≈4,9 px de separación.
  - `limpiar()` no se repite en cada frame durante la degradación (`degradado`), y al corregir el truncado (más ancho o menos zoom) se reinicia la caché, se reescribe el ancho, las líneas y el estado, y el vuelo vuelve a funcionar sin recargar ni dejar variables residuales. Al entrar en degradación se **retira** `data-brand-state` (la marca recupera el puntero); al salir, la primera escritura lo repone comparando contra la ausencia del atributo.
  - En 375, 768 y 1440 px con el texto al 100 % la tolerancia `+1` evita falsos positivos y el vuelo permanece completo.
- Tests: sí (`node --test`) + Chrome DevTools MCP.

- [x] **T6. Panel del menú abierto y accesibilidad.** RF-3, RF-15, RNF-1, RNF-4
- Archivos: `src/index.css`, `src/components/brand/BrandFlight.tsx` (solo si hace falta).
- Hecho cuando:
  - Con `html:has(header [aria-expanded="true"]) .brand-flight` la capa no se pinta (`visibility: hidden`), sin tocar variables ni atributos. Se usa un ancestro común porque la capa es hermana, no descendiente, del `header`; `:has()` es requisito de navegador moderno (línea base 2023).
  - Sin soporte de `:has()`, el vuelo sigue funcionando y el único efecto es un posible solape del panel abierto a mitad de vuelo; no se añade `MutationObserver` ni atributo alternativo.
  - Con el vuelo al 50 % y la página desplazada, el panel se abre por encima y sin copias encima; al cerrarlo, la copia reaparece en el mismo progreso.
  - El panel conserva su comportamiento: se cierra al desplazarse, con Escape, al elegir enlace, al pulsar fuera y al pasar a 1024 px.
  - El orden de foco no cambia (saltar al contenido, marca, menú, conmutador compacto o de 72 px); la marca oculta sigue enfocable y con anillo visible; las copias no se anuncian ni se tabulan.
- Tests: no (Chrome DevTools MCP).

- [x] **T7. Geometría, contraste y layout.** RF-11, RNF-2, RNF-4
- Archivos: `src/index.css`, `src/components/hero/Hero.tsx` (solo si hace falta).
- Hecho cuando:
  - A 375, 768 y 1440 px el encaje de una línea queda dentro de 1 px en centro y ancho, y la marca en su hueco.
  - A 320/375/768/1440 px no hay scroll horizontal ni solapes con el puesto, el menú o el conmutador; a 320/100 % la barra mide 64 px en una sola fila (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), el conmutador es compacto de 44×44, los controles quedan en ≈212–304 px y la copia llega a ≈207,1 px con ≈4,9 px de separación; desde 375 px el conmutador recupera 72 px.
  - El hero crece por la marca; `textBlockHeight` y `free` se recalculan, el desplazamiento efectivo del puesto disminuye y se respeta el límite de 16 px de la 002 sin cambiar la fórmula.
  - El alto del documento y el recorrido no cambian por el vuelo (solo por la marca), y el CLS es < 0,01 en carga, scroll, tema y redimensionado.
  - El contraste 9×9 cumple en el tope, `0,25`, `0,5`, `0,75`, `1`, `1,04` y durante el fundido de tema; el anillo de foco de la marca se ve en ambos temas.
  - `npx tsc -b` sin errores nuevos.
- Tests: sí (`npx tsc -b`) + Chrome DevTools MCP.

- [x] **T8. Verificación de geometría, teclado y temas.** RF-1 a RF-8, RF-10 a RF-13; RNF-1, RNF-4, RNF-5
- Archivos: ninguno (verificación); se corrigen solo los archivos de T2/T3/T4 si aparece un fallo.
- Hecho cuando:
  - `node --test`, `npx tsc -b` y `npm run build` pasan.
  - Sobre `npm run preview` con Chrome DevTools MCP se revisan los criterios 1 a 7, 9 a 13, 18 y 19 en 320, 375, 768 y 1440 px: tope, vuelo completo y de vuelta, 2 %/50 %/100 %/102 %/104 %, recarga a media página, tema claro y oscuro, foco por teclado y emulación móvil.
  - En 375, 768 y 1440 px con el texto al 100 % se comprueba una línea, encaje exacto, barra de 4 rem, sin scroll horizontal y **sin degradación por falso positivo** de truncado (tolerancia `+1`); a 320 px al 100 % se comprueba el vuelo con dos líneas y fantasma admitido, la barra de **64 px en una sola fila** (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), el conmutador compacto de **44×44** solo icono con nombre accesible, estado y clic, los controles en ≈212–304 px y la copia en ≈207,1 px con separación ≈4,9 px (≥2).
  - A 320 px con texto al 200 % el alto de la barra, el logo, el hueco real para el nombre y los píxeles ocultos se **miden** con el conmutador compacto; no se usan cifras fijas. En **640×400 con texto al 200 %** el nombre del hero ocupa **tres líneas** y el de la barra **no** se trunca (281/281), así que el vuelo sigue activo con el fantasma admitido, mayor que con dos líneas. Se confirma que solo el nombre de la marca puede truncarse con elipsis y que el conmutador compacto sigue visible y operable. La decisión de degradación de esos casos —incluido el combinado de 320/200 % con `reduce`— se valida en T9.
  - Cifras de referencia: 1440 `D ≈ 443`, `s = 1` ≈ scroll 340 y `s = 1,04` ≈ 354; 375 `D ≈ 416`; reduce `s = 1,04` ≈ 461; scroll 236 es `s ≈ 0,69`; `s = 0,5` es scroll ≈ 170; encaje en `s = 1` con Δcentro y Δancho ≤ 1 px.
  - Se comprueba que la ocultación de la capa con el panel abierto usa el ancestro común `html:has(header [aria-expanded="true"]) .brand-flight` y no un selector descendiente del `header`; `:has()` queda declarado como requisito de navegador moderno (línea base 2023) y el comportamiento con el panel al 50 % se completa en T9.
  - El contraste 9×9 cumple en el tope, `0,25`, `0,5`, `0,75`, `1`, `1,04` y durante el fundido de tema; el anillo de foco se ve en ambos temas; el LCP sigue siendo el `<h1>`.
- Tests: sí (`node --test`, `npx tsc -b`, `npm run build`) + Chrome DevTools MCP.

- [x] **T9. Verificación de movimiento reducido, degradación, panel y rendimiento; `MEMORY.md`.** RF-9, RF-10, RF-14, RF-15; RNF-2, RNF-3, RNF-6
- Archivos: `MEMORY.md` (modificar al final); se corrigen solo los archivos de T3/T5/T6 si aparece un fallo.
- Hecho cuando:
  - **320/200 % + reduce**: gana el modo reducido; barra vacía arriba, aparición instantánea en `s ≥ 1,04` (≈461 en 1440), marca truncada con elipsis, sin copia, sin degradación y sin invadir el conmutador compacto (44×44, visible y operable).
  - **320/200 % sin reduce**: se aplica la composición sin vuelo por degradación; barra completa desde el inicio, marca operativa desde el primer instante, sin copia y con el conmutador compacto visible, operativo y no invadido; `scrollWidth > clientWidth + 1` se cumple, y el hueco real, los píxeles ocultos y el alto de la barra se **miden** con el conmutador compacto; no se usan cifras fijas.
  - **640×400 con texto al 200 %**: el nombre del hero ocupa **tres líneas** y el de la barra no se trunca (281/281); el vuelo sigue activo y el fantasma del relevo final es mayor que con dos líneas, aceptado y documentado (no es un fallo).
  - **320 px al 100 %**: la barra mide **64 px en una sola fila** (marca 180,41 + separación 8 + controles 92 = 280,41 ≤ 288), el conmutador compacto de 44×44 está visible y operable, los controles quedan en ≈212–304 px y la copia llega como máximo a ≈207,1 px con ≈4,9 px de separación (≥2); el vuelo sigue activo con dos líneas y el fantasma admitido. Desde 375 px el conmutador recupera 72 px.
  - **Activar reduce con la marca truncada**: desde la degradación por truncado, activar la preferencia con la página abierta y comprobar que se re-mide antes de escribir, `degradado` pasa a `false`, la barra queda vacía arriba y aparece de golpe en `s ≥ 1,04` con elipsis, sin quedarse en la composición degradada.
  - **Fallo de medida con reduce**: forzar `D ≤ 0` o una caja no válida con la preferencia activa y comprobar que se aplica la composición sin vuelo por degradación (la guarda de medida precede a la preferencia), no el modo reducido; la marca es operativa desde el inicio.
  - **Panel abierto al 50 %** con `html:has(header [aria-expanded="true"]) .brand-flight`: la capa no se pinta, el panel queda por encima y el estado se conserva al cerrar; se comprueba también el comportamiento sin `:has()` (el vuelo sigue y puede solaparse).
  - Movimiento reducido al cargar, activado y desactivado en caliente: barra vacía arriba, escalón en `s = 1,04` (≈461 en 1440) y ocultación al subir, sin destellos; scroll 236 es `s ≈ 0,69` y `s = 0,5` es scroll ≈ 170.
  - Rendimiento: sin tareas largas > 50 ms en 3 s de scroll en móvil con CPU 4×, p95 de frame ≤ 16,7 ms, CLS < 0,01; sin escrituras de ancho ni de líneas por frame; StrictMode sin `data-brand-*` ni variables residuales; sin avisos de `ResizeObserver`.
  - No hay errores ni advertencias, ni dependencias, peticiones o datos nuevos (solo la clave del tema); el árbol de accesibilidad es correcto en el tope y a media página; la suma de opacidades solo se exige 1 en vuelo activo.
  - `MEMORY.md` queda actualizado con el estado, las decisiones del vuelo (geometría con `heroShift` y `D = name.top − targetTop`, precedencia medida inválida → degradación; reducido gana al truncado) y los aprendizajes (máximo ~50 líneas).
- Tests: sí (`node --test`, `npx tsc -b`, `npm run build`) + Chrome DevTools MCP.

- [x] **T10. El puesto viaja con el nombre y se desvanece (RF-16).** RF-16, RF-4, RF-9, RF-14, RNF-4, RNF-6
- Archivos: `src/lib/brandFlight.ts`, `src/lib/brandFlight.test.ts`, `src/hooks/useBrandFlight.ts`, `src/components/brand/BrandFlight.tsx`, `src/components/hero/Hero.tsx` (solo `data-brand="role"`), `src/index.css`.
- Hecho cuando:
  - Tests escritos antes (rojo) y luego en verde: la copia del puesto está en su origen con `s = 0`, sigue a la trayectoria del nombre con la separación escalada, su opacidad es 0,5 en `s = 0,4`, 0 desde `s = 0,8`, y 0 con reducido, degradación y `scrollY < 0`; es no creciente desde `s = 0,02`.
  - `node --test`, `npx tsc -b` y `npm run build` pasan.
  - El hook escribe las variables de la copia del puesto en la capa y `clear()` las retira; la copia es `aria-hidden`, no enfocable, y el puesto real pasa a `heroOpacity`.
  - Con Chrome DevTools sobre `npm run preview` a 1440, 375 y 320 px: la copia se ve junto al nombre durante el vuelo, se desvanece hacia 0 en `s = 0,8`, no se ve sobre la barra; con reducido el puesto real queda en el hero con opacidad 1; consola limpia; CLS 0.
- Tests: sí (`node --test`, `npx tsc -b`, `npm run build`) + Chrome DevTools MCP.
