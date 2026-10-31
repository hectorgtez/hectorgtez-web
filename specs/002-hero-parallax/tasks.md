# Tareas 002 — Hero de presentación con parallax

Spec aprobada: `specs/002-hero-parallax/spec.md`. Plan: `plan.md`.
Una tarea cada vez; no se avanza con tests en rojo ni con la consola sucia. Al cerrar cada tarea, marcarla `[x]`.
Los tests de la función pura se escriben **antes** de usarla. El relleno para provocar scroll existe solo en DevTools y nunca se commitea.

- [x] **T1. Función pura del parallax con tests (rojo → verde).** RF-6, RF-7, RF-8, RNF-7
- Archivos: `src/lib/heroParallax.ts` (nuevo), `src/lib/heroParallax.test.ts` (nuevo).
- Hecho cuando: existen `HERO_BG_FACTOR = 0.13`, `HERO_BG_MAX_FACTOR = 0.15`, `HERO_TEXT_FACTOR = 0.325`, `HERO_TEXT_SAFE_MARGIN = 16` y `computeHeroOffsets(metrics, reducedMotion)` con `heroProgress` y `textFreeSpace`, sin ninguna referencia a `window`, `document` ni tiempo; `heroProgress` usa `clamp(scrollY / (heroTop + H), 0, 1)`; `textFreeSpace` devuelve 0 con `H ≤ 0`, bloque ≤ 0 o bloque ≥ H; `computeHeroOffsets` devuelve `{ 0, 0 }` con movimiento reducido, `H ≤ 0` o entradas no finitas; el test cubre todos los casos de la tabla de §8 del plan (incluidos `scrollY = 1` sin zona muerta, congelación en `scrollY ≥ heroTop + H`, recorte por el límite de seguridad, cotas `background ≤ 0,15·H` y `|text| ≤ 0,325·H`); `node --test src/lib/heroParallax.test.ts` pasa en verde y `npx tsc -b` no da errores nuevos.
- Tests: sí (`node --test src/lib/heroParallax.test.ts`).

- [x] **T2. Tokens, capas de fondo, velo y fundido en CSS.** RF-4, RF-5, RF-10, RF-11, RNF-1
- Archivos: `src/index.css` (modificar).
- Hecho cuando: `index.css` declara las variables de las capas (`--hero-dark-glow-a/b`, `--hero-dark-veil`, `--hero-light-glow-a/b`, `--hero-light-veil`) con hex de la paleta existente y ningún color nuevo; existen `.hero__bg`, `.hero__layer`, `.hero__layer--dark`, `.hero__layer--light` y `.hero__scrim`; la capa activa queda a `opacity: 1` y la otra a `0` según `html[data-theme]`, con `transition: opacity 200ms ease`; `.hero__text` usa `transition: color 0s 100ms`; `@media (prefers-reduced-motion: reduce)` anula ambas transiciones; alternando `data-theme` a mano en DevTools se ve un fundido de opacidad de ~200 ms entre capas, sin corte seco, y el color del texto salta a la mitad del fundido; no hay hex fuera de `index.css`.
- Tests: no (verificación visual en DevTools; no depende de T1).

- [x] **T3. Estructura del hero e integración en `App.tsx`.** RF-1, RF-2, RF-3, RF-4, RF-12, RNF-4, RNF-5
- Archivos: `src/components/hero/Hero.tsx` (nuevo), `src/components/hero/HeroBackground.tsx` (nuevo), `src/App.tsx` (modificar).
- Hecho cuando: `HeroBackground` monta `.hero__bg` con las dos capas y el velo, `aria-hidden="true"` y sin props; `Hero` es una `<section>` con `relative isolate flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden` y un bloque centrado `max-w-6xl px-4 py-16 text-center` con `<h1>` «Héctor Gutiérrez» (`text-[2.5rem] sm:text-[4rem]`, `font-bold`, `text-ink`) y `<p>` «Ingeniero de Software» (`text-base sm:text-xl`, `text-ink-muted`); `App.tsx` usa `Navbar` + `<main>` sin clases de layout ni color que contenga solo `<Hero />`, y el `<h1>` provisional «hectorgtez-web» desaparece del DOM visible; en 320/375/768/1440 px el hero queda pegado al borde inferior de la navbar, mide la ventana menos 4 rem y no hay scroll horizontal; hay un único `h1` y el árbol de accesibilidad anuncia nombre y después puesto; en ambos temas se ve el fondo con halos y el texto legible.
- Tests: no (Chrome DevTools MCP).

- [x] **T3b. Navbar de 64 px sin cambio visual (decisión G).** RF-1, RF-13, criterio 14
- Archivos: `src/components/layout/Navbar.tsx` (modificar solo el borde inferior).
- Hecho cuando: se sustituye `border-b border-line` por un borde pintado por dentro que no ocupa layout (`shadow-[inset_0_-1px_0_var(--color-line)]`) y la lista de propiedades transicionadas incluye `box-shadow` con `duration-200 motion-reduce:transition-none`, igual que ahora; el rectángulo de la navbar mide exactamente 64 px y el alto del documento coincide con el de la ventana, sin barra de scroll vertical, en 320, 768 y 1440 px y con zoom de página al 200 %; la línea inferior se ve en ambos temas con el mismo grosor aparente y el mismo color que antes, también durante el fundido de tema; no cambian textos, marca, `ThemeSwitch`, foco, hover, `sticky` ni la lógica de temas.
- Tests: sí (`node --test` en verde para confirmar que no se ha roto nada) + Chrome DevTools MCP.

- [x] **T4. Hook `useHeroParallax`: medición, rAF y variables CSS.** RF-6, RF-7, RF-8, RF-12b, RF-13, RF-14, RNF-2, RNF-7
- Archivos: `src/hooks/useHeroParallax.ts` (nuevo), `src/components/hero/Hero.tsx` (modificar), `src/index.css` (modificar).
- Hecho cuando: el hook expone `sectionRef` y `contentRef`; en `useLayoutEffect` mide `H` (`getBoundingClientRect().height`), `heroTop` (`rect.top + window.scrollY`) y `textBlockHeight` (`offsetHeight`), aplica `computeHeroOffsets` y escribe `--hero-bg-shift` y `--hero-text-shift` antes del primer pintado; el `scroll` es pasivo y solo agenda un `requestAnimationFrame` con coalescencia (varias llamadas por frame producen un solo `tick`); en el `tick` se lee `window.scrollY` y se escribe después de calcular, sin `setState` ni lecturas de layout después de escribir; `resize` y `ResizeObserver` marcan `dirty` y fuerzan una única remedición en el frame siguiente; con `scrollY = 0` ambas variables son `0px`; la limpieza cancela el frame pendiente, quita listeners y observadores y borra las variables (StrictMode no duplica el bucle); con un relleno temporal solo en DevTools, al desplazar 1 px las variables ya son distintas de 0 y los offsets coinciden con la fórmula.
- Tests: parcial — valida T1 con `node --test`; el hook se verifica en Chrome DevTools.

- [x] **T5. Aplicación del parallax, límite de seguridad y z-order.** RF-7, RF-8, RF-9, RF-12, RNF-2
- Archivos: `src/index.css` (modificar), `src/components/hero/Hero.tsx` (modificar si hace falta).
- Hecho cuando: `.hero__bg` aplica `translate3d(0, var(--hero-bg-shift), 0)` con `inset: -20% 0`, `will-change: transform` y queda recortado por el `overflow-hidden` de la sección sin generar scroll horizontal; `.hero__content` aplica `translate3d(0, var(--hero-text-shift), 0)` sin transición; a lo largo de todo el recorrido la caja del bloque de texto permanece dentro del hero con ≥16 px respecto a su borde superior, también a 320 px con texto al 200 % y con zoom de página al 200 %; el texto se pinta siempre por debajo de la navbar (`isolate` + `z-10` frente a `z-50`) y nunca por encima; al volver al tope las dos variables vuelven exactamente a `0px`; el alto del documento y el rango de scroll no cambian con el efecto activo o desactivado.
- Tests: no (Chrome DevTools MCP con relleno temporal).

- [x] **T6. Fundido de tema y movimiento reducido en el hero.** RF-10, RF-11, RNF-1
- Archivos: `src/index.css` (ajustar si la medición lo exige), `src/hooks/useHeroParallax.ts` (modificar).
- Hecho cuando: el hook escucha `matchMedia('(prefers-reduced-motion: reduce)')`; con la preferencia activa no registra el listener de scroll, escribe `0px` en ambas variables y reacciona a cambios en caliente escribiendo `0px` y cancelando el frame pendiente; sin la preferencia, el desplazamiento no se anima con transición; al cambiar de tema a mitad del recorrido las dos capas tienen el mismo `transform` en cada frame, el fundido dura ≈200 ms, el texto cambia de color de golpe a los ≈100 ms y no se reinicia el parallax; el contraste del texto medido a t = 100 ms en ambos sentidos del cambio no baja de 3:1 y al terminar cumple 4,5:1; con la preferencia activa el cambio de tema es instantáneo.
- Tests: no (Chrome DevTools MCP: grabación de la transición y muestreo de contraste).

- [x] **T7. Responsive, ampliación de texto y altura dinámica.** RF-1, RF-2, RF-12, RF-12b, RNF-6
- Archivos: `src/components/hero/Hero.tsx` (ajustar clases si hace falta), `src/hooks/useHeroParallax.ts` (ajustar si hace falta).
- Hecho cuando: en 320, 375, 768 y 1440 px el nombre y el puesto se leen enteros, sin truncado ni scroll horizontal, con el nombre a ≥40 px en móvil y ≥64 px desde 640 px y el puesto entre 16 px y la mitad del nombre; con zoom de texto al 200 % a 320 px y con zoom de página al 200 % (640×400) el hero crece si hace falta, el centrado se mantiene y el texto no sale del recuadro; al cambiar el alto del viewport con la página a mitad del recorrido (emulación de barras y giro), H y los offsets se recalculan en el mismo frame, no se reinician ni se congelan, el bloque acompaña al nuevo centro, no hay transición de altura y el CLS medido es < 0,01.
- Tests: no (Chrome DevTools MCP).

- [x] **T8. Contraste del texto sobre el fondo en ambos temas.** RF-5, RNF-1
- Archivos: `src/index.css` (ajustar opacidad del velo o los halos si la medición falla).
- Hecho cuando: con el muestreo de rejilla 9×9 sobre la caja de cada glifo (punto de mayor luminancia si el texto es claro, de menor si es oscuro) el nombre y el puesto alcanzan ≥4,5:1 en ambos temas en `p = 0` y `p = 0,25` (las posiciones en las que el bloque está en pantalla; a partir de `p = 0,5` el texto ya ha salido de la vista y no se mide); con el efecto congelado y los offsets extremos forzados temporalmente (fondo `+0,15·H`, texto en su límite) también se alcanza ≥4,5:1; ningún halo de color de interacción queda tras un glifo sin velo; el texto sigue usando solo los tokens de texto del tema.
- Tests: no (Chrome DevTools MCP y cálculo de ratios).

- [x] **T9. Rendimiento y estabilidad (CLS, frames, LCP).** RF-9, RNF-2, RNF-5
- Archivos: `src/hooks/useHeroParallax.ts` y `src/index.css` (ajustar solo si la medición lo exige).
- Hecho cuando: con emulación móvil y CPU limitada a 4×, 3 s de scroll continuo no registran tareas largas de más de 50 ms ni frames por encima de 16,7 ms en el percentil 95; el CLS es < 0,01 en carga, scroll, fundido de tema, cambio de tamaño y cambio de alto del viewport; no hay `setState` por frame en el perfilado; el `<h1>` es el elemento LCP y el hero no añade peticiones de red; no aparecen errores ni advertencias en consola.
- Tests: no (Chrome DevTools MCP, panel de rendimiento).

- [x] **T10. Verificación integral y `MEMORY.md`.** Todos los RF y RNF
- Archivos: `MEMORY.md` (modificar al final).
- Hecho cuando: `node --test src/lib/heroParallax.test.ts` pasa en verde y `npx tsc -b` termina sin errores; `npm run build` completa; con Chrome DevTools MCP sobre `npm run dev` y `npm run preview` se revisan los criterios 1–17 de la spec (hero, textos, un solo `h1`, fondo solo CSS, contraste, offsets y zona muerta, límite de seguridad y z-order, extremos, layout y rendimiento, fundido, movimiento reducido, 320/375/768/1440, zoom de texto y de página, página sin scroll, tests, consola y LCP); el criterio 18 se anota como **verificación diferida** con su método y no se da por aprobado; con la página sin scroll no existe contenido de relleno ni altura extra; el almacenamiento solo contiene `hectorgtez-theme`; no se ha añadido ninguna dependencia ni petición de red; `MEMORY.md` queda actualizado con el estado, las decisiones del hero y los riesgos aprendidos (máximo ~50 líneas).
- Tests: sí (`node --test`, `npx tsc -b`, `npm run build`) + Chrome DevTools MCP.
