# MEMORY.md — Héctor Gutiérrez Web
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- Specs 001 (barra + tema), 002 (hero con parallax), 003 (secciones y anclas) y 004 (marca en vuelo) implementadas; T1–T9 de la 004 cerradas. 133 tests, `tsc -b` y `vite build` en verde.
- 004 **implementada y validada**; cambio RF-16 (T10): el puesto viaja con el nombre (copia `copy-role` anclada al nombre, distancia escalada) y se desvanece a 0 en `s = 0,8`; el puesto real se funde en la copia con `--brand-flight-hero-opacity`. Verificado en 1440/375 y con reducido. 142 tests, `tsc -b` y build en verde.
- Decisión: la copia del puesto no se ancla al parallax propio sino al nombre (centros + distancia escalada); en reducido y degradación no hay copia y el puesto real queda visible. Validación en 375/320/1440 con DevTools: encaje, relevo, acoplado, reducido, truncado, panel, tema, foco, consola limpia, sin peticiones nuevas, CLS 0 (carga, scroll, tema), p95 de frame 6,3 ms con CPU 4× y sin tareas largas. Contraste del nombre ≥ 16:1 en ambos temas (muestreo de centro, no 9×9). StrictMode: cleanup del hook retira variables y atributos (revisado en código, no ejecutado en dev).
- Limitación de medida: el 320/200 % se simuló con `font-size: 200%` en la raíz, no con zoom de texto real.
- Cambios de la 004 **sin commit** (con los de 002/003): `MEMORY.md`, `index.html`, `App.tsx`, `Navbar.tsx`, `ThemeSwitch.tsx`, `index.css` y los archivos nuevos de brand/hero/sections/data/hooks/lib.
- 004: marca provisional (SVG en línea, sustituible solo en `BrandLogo.tsx`) que vuela del hero a la barra con una capa fija `z-55` hermana del `header`, copias decorativas y variables CSS; `s = max(0, scrollY − heroShift)/D` y la copia del nombre sigue al h1 con `heroShift`.
- 003: hero `#inicio` + `sobre-mi`, `proyectos`, `servicios`, `contacto`; menú único con panel <1024, scrollspy, título dinámico, skip link y pie. 001: barra y tema con `data-theme` y tokens.
- Contenido provisional en `src/data/site.ts` (etiqueta «Ejemplo», nota y comentarios `PROVISIONAL`).

## Decisiones (y por qué)
- Y de la copia = `max(nameTop − scrollY + heroShift, targetTop)`: comparte el parallax del h1 y no adelanta al puesto; el logo interpola su propia Y y no usa `heroShift`.
- Destino medido: `scale = brandFontSize/nameFontSize`, `targetTop = brandName.centerY − name.height·scale/2`, `D = name.top − targetTop` (1440: D 443,25, `s=1` scroll 341 y `s=1,04` 354; 375: D 416,25). Nunca cifras fijas.
- Precedencia: medida inválida → degradación (también con reduce) → reduce → truncado → vuelo. Sin `D` no hay `s`; reduce gana al truncado y la barra aparece de golpe en `s ≥ 1,04` (461 a 1440).
- 320/100: barra de 64 px en una fila (180,41 + 8 + 92 = 280,41 ≤ 288), conmutador compacto 44×44 (desde 375 recupera 72), controles en 212–304 y copia ≤207,1 con ≥2 px de separación; el vuelo sigue con dos líneas y fantasma admitido.
- 320/200: cifras medidas 168/176/105; sin reduce degrada y con reduce la marca se trunca con elipsis. 640×400/200: tres líneas, barra 281/281 (no trunca) y fantasma mayor, aceptado.
- Panel: `html:has(header [aria-expanded="true"]) .brand-flight` con `visibility:hidden`, sin tocar estado; `:has()` es requisito (línea base 2023). Sin él el vuelo sigue y solo puede solaparse.
- Relevos 2 % de entrada y 1→1,04 de salida; la suma de opacidades es 1 solo en vuelo activo. Un escucha pasivo propio + `rAF`, `ResizeObserver` solo en hero y barra, ancho y líneas se escriben solo al medir.
- Tema con `data-theme` en `<html>` y clave única `hectorgtez-theme`; anclas nativas sin `preventDefault` y O = alto de barra + 1 rem (80 px al 100 %).
- Migrado de OpenCode a Claude Code: `CLAUDE.md` importa `AGENTS.md` (una sola fuente); agentes y comandos en `.claude/`; skills en `.claude/skills/`; MCP en `.mcp.json`. El coordinador pasó a ser el comando `/sdd` porque un subagente no puede lanzar otros.
- La clave de Context7 se lee de `CONTEXT7_API_KEY` (variable de entorno); nunca va en archivos versionados.

## Aprendizajes y errores a evitar
- No derivar las cifras de 320/200 de 176/105/168 ni de las de 320/100: se miden en cada escenario (el compacto cambia el reparto).
- No olvidar la regla `:has` del panel: la capa es hermana del `header`, un selector descendiente no sirve.
- Medir el vuelo con `window.scrollTo({behavior:'instant'})`: `smooth` (001) da lecturas a medio recorrido y `s` falsos.
- No cachear O/H ni medir una sola vez: el zoom cambia la barra y la raíz. No truncar más texto que el nombre de la marca.
- En la copia no anular `transform`/`opacity` con transiciones: solo el color cambia, con 100 ms de retardo.
- Verificar en `preview`: el dev de Vite puede servir CSS obsoleto. La copia no se anuncia, no se tabula y no altera el layout; solo el hero crece por la marca.

## Próximos pasos
- Sustituir el contenido `PROVISIONAL` de `src/data/site.ts` por el real (incluidas las tarjetas).
- Propuesto para `AGENTS.md` (pendiente de aprobación): anclas nativas sin `preventDefault`, contenido solo en `src/data`, colores solo con tokens y sin truncar texto de secciones.
