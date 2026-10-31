# Spec 003 — Secciones del portafolio y navegación por anclas

Estado: aprobada

## Contexto y objetivo

Hoy el sitio muestra una barra con la marca y el conmutador de tema, y debajo una única pantalla de presentación. No hay contenido que explique el trabajo, no existen secciones ni enlaces de navegación, y como la página mide exactamente una pantalla, el parallax del hero queda latente (spec 002, RF-13) y la verificación del criterio 18 de esa especificación sigue pendiente.

Se quiere que el visitante pueda recorrer el portafolio por secciones —quién es el autor, qué proyectos ha hecho, qué servicios ofrece y cómo contactarle— y que el menú de la barra le lleve a cada una sin recargar la página. El menú debe mostrar en qué sección está, el desplazamiento debe ser suave pero respetuoso con quien pide reducir el movimiento, y la sección de destino nunca debe quedar tapada por la barra.

El objetivo es cuádruple: (1) dar contenido mínimo suficiente para decidir si contactar, con textos de ejemplo claramente marcados y sustituibles; (2) ofrecer orientación permanente mediante el resaltado del menú y el título de la pestaña; (3) navegar con anclas reales, direcciones compartibles, atrás/adelante, teclado y lector de pantalla; (4) no romper nada de lo existente, activando además el parallax del hero y permitiendo cerrar la verificación diferida de la spec 002.

**Decisiones cerradas por el usuario (no se reabren):**

- Cuatro secciones, en este orden y con estos identificadores: **Sobre mí** (`sobre-mi`), **Proyectos** (`proyectos`), **Servicios** (`servicios`) y **Contacto** (`contacto`). El hero recibe el identificador `inicio`.
- **Contenido provisional con marca visible discreta**: etiqueta «Ejemplo» en cada tarjeta de proyecto y de servicio, y nota «Texto provisional pendiente de sustituir» bajo la biografía; además, comentarios `PROVISIONAL` en el punto único donde se define el contenido. Sin clientes, métricas, fechas ni datos personales inventados.
- **Menú móvil** con estado propio: botón con nombre estable «Menú», `aria-expanded` y `aria-controls`; se cierra con Escape (devolviendo el foco al botón), al elegir una sección, al tocar fuera del panel, al desplazar la página y al pasar a escritorio. Sin trampa de foco.
- **Un único conjunto de cuatro enlaces** en el documento, dentro de una sola región de navegación con nombre «Secciones». En escritorio se ven en línea; en móvil, el mismo conjunto vive en un panel bajo la barra. No se duplican enlaces ni regiones.
- **Panel** anclado bajo la barra, posicionado en absoluto (no desplaza el layout) y con altura máxima `calc(100dvh - 4rem)` y desplazamiento interno propio; botón de al menos 44×44 px.
- **Foco**: anillo visible en los controles interactivos; el foco programático en `h1`, `h2` y `main` no dibuja anillo.
- **Scrollspy** con lectura pasiva del desplazamiento, como máximo una por frame, y cálculo en una función pura verificable con `node --test` (RNF-7). Sin observación de intersección.
- **Marca de la barra** convertida en ancla real a `#inicio`, eliminando el comportamiento actual que cancela el clic; se respetan los clics con modificadores. Es el único cambio autorizado en la barra además de añadir el menú.
- **Título del documento**: «Héctor Gutiérrez | Ingeniero de Software» en el tope; «Héctor Gutiérrez | {sección activa}» con una sección activa. El documento servido lleva ese mismo título estático y una descripción en español. Sin Open Graph.
- **Contacto**: `hectorgtezta@gmail.com` (`mailto:`), `https://linkedin.com/in/hectorgtez/`, `https://github.com/hectorgtez` y WhatsApp `https://wa.me/526672319477`, mostrando «(667) 231 9477». Los enlaces externos abren en pestaña nueva sin referencia de origen.
- **«Saltar al contenido»** como primer elemento enfocable, visible al recibir foco, con destino al contenido principal, que recibe el foco por programa.
- **Pie mínimo**: nombre, año actual y enlaces de correo, LinkedIn y GitHub; WhatsApp solo en Contacto.
- **Carga con fragmento y restauración de scroll**: se acepta el comportamiento nativo, que puede animarse. No se exige una colocación instantánea ni se añade código para forzar la posición.
- **Anclas**: el destino queda con su borde superior justo bajo la barra, con un margen de anclaje **O = alto medido de la barra + 1 rem** (hoy 64 + 16 = 80 px), medido en píxeles y escalando con el texto. El hero está en el origen del documento y no lleva margen de anclaje adicional: el `scroll-padding-top` no desplaza el tope y la marca deja la página en `scrollY = 0`. Si la última sección junto con el pie supera la altura de la ventana, al llegar al final del documento el encabezado de «Contacto» puede quedar por encima del borde superior: es el comportamiento esperado y no un fallo.
- **Estabilidad**: un único umbral de CLS, `< 0,01`, en carga, scroll, tema, cambio de tamaño y cambio de alto; el «CLS 0» del criterio 2 de la spec 001 queda relajado a ese umbral.
- **Sin JavaScript** el sitio no se considera navegable, como en las specs 001 y 002; no se añade contenido alternativo duplicado.
- **Sin truncado** para el contenido de las secciones; la marca de la barra puede seguir truncándose en pantallas estrechas.
- Sin dependencias nuevas, backend, imágenes, fuentes ni peticiones de recursos. Textos en español, colores solo con tokens y un único `h1`.

**Relación con las specs anteriores:** esta spec deroga de la spec 002 solo la parte de sus criterios 1 y 14 que exige que el documento no tenga recorrido de scroll, y las partes de su «Fuera de alcance» que prohibían secciones, navegación y cambios de título o metadatos. El resto de la spec 002 sigue vigente —alto del hero, ausencia de hueco con la barra, parallax y límites— y debe revalidarse. De la spec 001 se mantiene todo, salvo la parte de su RF-1 que limitaba la barra a marca y conmutador, y el criterio de CLS 0, relajado al umbral único de esta spec.

## Usuarios

- **Visitante que llega por primera vez** (cliente potencial o reclutador): quiere saber en segundos qué hace el autor, qué ha construido y cómo contactarle.
- **Visitante que llega por un enlace compartido**: quiere ir directo a «Proyectos» o a «Contacto» y volver atrás sin perder el sitio.
- **Visitante en el móvil**: navega con el pulgar en una pantalla estrecha, a veces con el texto ampliado, y necesita un menú que no descoloque la página.
- **Visitante que usa lector de pantalla o solo teclado**: necesita saltarse la navegación, conocer las secciones, saber cuál está activa y moverse sin trampas.
- **Visitante con sensibilidad al movimiento**: ha pedido reducir animaciones y no debe recibir desplazamientos ni transiciones animadas.
- **Visitante recurrente**: ya eligió un tema y espera que las secciones nuevas lo respeten.
- **El autor del sitio**: necesita localizar y sustituir todo el contenido de ejemplo sin tocar la presentación.

## Historias de usuario

- HU-1. Como visitante, quiero ver secciones sobre el autor, sus proyectos, sus servicios y su contacto para decidir si me interesa su trabajo.
- HU-2. Como visitante, quiero que el menú me lleve a cada sección sin recargar la página para llegar a lo que busco en un clic.
- HU-3. Como visitante que comparte o recibe un enlace, quiero que la dirección apunte a una sección concreta y que atrás y adelante funcionen.
- HU-4. Como visitante que se desplaza, quiero saber en qué sección estoy y que la barra no me tape el encabezado de destino.
- HU-5. Como visitante en el móvil, quiero un menú compacto que se cierre solo al elegir una sección, al tocar fuera o al desplazarme.
- HU-6. Como visitante que usa lector de pantalla, quiero saltar al contenido, encabezados coherentes y saber cuál es la sección activa.
- HU-7. Como visitante con sensibilidad al movimiento, quiero que el salto a una sección sea inmediato si he pedido reducir animaciones.
- HU-8. Como autor, quiero que todo el contenido de ejemplo esté marcado y en un único lugar para sustituirlo sin dejar restos.
- HU-9. Como visitante, quiero ver en la pestaña el nombre del autor y la sección en la que estoy.

## Definiciones

- **Hero (tope)**: primer bloque de contenido, definido en la spec 002. Ocupa la ventana menos la barra y lleva el identificador `inicio`. Es el tope del documento.
- **Sección**: cada uno de los cuatro bloques bajo el hero, con un identificador estable, un encabezado de nivel 2 visible y contenido propio.
- **Ancla real**: enlace cuyo destino es un fragmento del propio documento, gestionado por el navegador; conserva modificadores, atrás/adelante y carga directa con fragmento.
- **Margen de anclaje (O)**: constante única del documento, igual al alto medido de la barra más 1 rem. Se define como alto de la barra + 1 rem y se usa en píxeles (hoy 64 + 16 = 80 px), de modo que escala con el texto. Es el mismo valor para el `scroll-padding-top` del ancla y para la línea de referencia de la sección activa.
- **Línea de referencia**: `scrollY + O`; una sección se considera alcanzada cuando su borde superior, en coordenadas del documento, es menor o igual que esa línea más 1 px de tolerancia (`top ≤ scrollY + O + 1`).
- **Sección activa**: sección alcanzada según la regla única de RF-6. Como máximo hay una; en el tope y cuando el documento no tiene recorrido no hay ninguna.
- **Menú de secciones**: única región de navegación con nombre «Secciones» que contiene el único conjunto de cuatro enlaces. En escritorio se muestra en línea; en móvil, dentro del panel.
- **Panel**: contenedor del menú en pantallas estrechas, anclado a la barra, superpuesto al contenido y con desplazamiento interno propio.
- **Contenido provisional**: texto de ejemplo que el autor sustituirá. Se reconoce por la etiqueta «Ejemplo» en las tarjetas, por la nota bajo la biografía y por los comentarios `PROVISIONAL` del punto único de definición.
- **Pie de página**: último bloque del documento; nombre, año y los tres enlaces de contacto indicados. Sin formularios, suscripción ni navegación de secciones.
- **Saltar al contenido**: primer enlace enfocable, oculto hasta recibir foco, que lleva el foco al contenido principal.

## Requisitos funcionales

- **RF-1 (secciones y orden)**: CUANDO el visitante abre el sitio, EL SISTEMA muestra, inmediatamente debajo del hero y sin bloques intermedios, las secciones «Sobre mí», «Proyectos», «Servicios» y «Contacto», en ese orden. Cada una tiene un encabezado de nivel 2 con ese texto exacto y un identificador estable `sobre-mi`, `proyectos`, `servicios` y `contacto`. El hero tiene el identificador `inicio`; el pie de página va después de «Contacto». No existe ninguna otra sección ni contenido suelto entre ellas, y el orden del documento coincide con el del menú y con el de lectura.

- **RF-2 (navegación por anclas)**: EL SISTEMA ofrece el menú de secciones dentro de una única región de navegación con nombre accesible «Secciones», con exactamente cuatro enlaces que apuntan a esos identificadores, sin cancelar el comportamiento nativo: al activarlos se actualiza el fragmento de la dirección sin recargar la página; los clics con Ctrl, Cmd, Mayús o botón central abren la sección en una pestaña nueva; atrás y adelante restauran las posiciones. La marca de la barra es un ancla real a `inicio` que respeta los modificadores y deja el tope, el título base y ningún enlace activo. Si el fragmento de la dirección ya coincide con la sección activada, no se exige ningún re-desplazamiento: el navegador decide. Los enlaces no se duplican en el documento ni existen dos regiones de navegación.

- **RF-3 (destino y compensación)**: CUANDO el visitante activa un enlace de sección, EL SISTEMA deja que el navegador desplace el documento hasta el fragmento con un margen de anclaje O igual al alto medido de la barra más 1 rem, de modo que el encabezado de destino queda justo debajo de la barra y no oculto por ella. Ese mismo O se usa tanto para el `scroll-padding-top` como para la línea de referencia de RF-6. SI el final del documento no permite colocar el encabezado de la última sección a la distancia O —porque la última sección y el pie superan la altura de la ventana—, ENTONCES el desplazamiento se detiene al final y el encabezado de «Contacto» puede quedar por encima del borde superior de la ventana: es el comportamiento esperado y no un fallo, y el pie sigue visible. Al activar la marca, el destino es el origen del documento, que no lleva margen de anclaje adicional ni queda desplazado por el `scroll-padding-top`, y la página queda en el tope. CUANDO el sitio se carga con un fragmento en la dirección, EL SISTEMA acepta la colocación nativa del navegador, que puede producirse durante la carga y animarse; no se añade código para forzar la posición ni se exige que el primer frame con contenido esté ya en el destino. Lo exigible al terminar la carga es que la sección indicada esté a la vista y que su encabezado no quede oculto bajo la barra.

- **RF-4 (desplazamiento suave y movimiento reducido)**: SI el visitante no ha pedido reducir animaciones, ENTONCES la navegación por anclas se desplaza de forma suave, sin que el SISTEMA anime el desplazamiento por su cuenta. SI el visitante ha pedido reducir animaciones, ENTONCES el salto al destino es inmediato. La preferencia se respeta también si cambia con la página abierta. El desplazamiento manual del visitante nunca se suaviza ni se anima.

- **RF-5 (menú móvil y panel)**: MIENTRAS el ancho de la ventana es menor de 1024 px (`lg`), EL SISTEMA oculta el conjunto de enlaces en línea y muestra un botón de al menos 44×44 px con el nombre accesible fijo «Menú», que expone si el panel está expandido o contraído y qué elemento controla; su icono es decorativo. Al activarlo, el panel se superpone al contenido bajo la barra, con superficie y separación del tema activo, altura máxima `calc(100dvh - 4rem)` y desplazamiento interno propio, sin alterar el alto del documento ni desplazar el contenido; su zona de desplazamiento usa `overscroll-behavior: contain`, de modo que desplazar el contenido interno no cierra el panel ni encadena el desplazamiento a la página. Con el panel cerrado, sus enlaces no son enfocables ni se anuncian. El panel se cierra al pulsar Escape —devolviendo el foco al botón—, al elegir cualquiera de los enlaces, al tocar o pulsar fuera de él, al desplazarse la página —no al desplazar el contenido del propio panel—, al cerrarlo de nuevo con el botón y al pasar a 1024 px (`lg`) o más. No hay trampa de foco: el tabulador puede entrar y salir del panel. El botón no cambia de nombre con el estado. Desde 1024 px (`lg`) los enlaces se muestran en línea; SI con el texto ampliado no caben sin scroll horizontal, ENTONCES EL SISTEMA los reparte en varias líneas o trunca la marca, sin provocar scroll horizontal de página y sin ocultar ningún enlace.

- **RF-6 (sección activa)**: MIENTRAS el visitante se desplaza, EL SISTEMA determina la sección activa con esta regla única: es la última sección cuyo borde superior, medido en coordenadas del documento, es menor o igual que `scrollY + O + 1` (la línea de referencia con 1 px de tolerancia). Si ninguna la ha alcanzado, no hay sección activa. SI el documento no tiene recorrido —su alto no supera el de la ventana—, ENTONCES no hay sección activa aunque alguna esté a la vista: el tope gana, y esta regla prevalece sobre la de final. SI el documento tiene recorrido y está al final de él (`scrollY + ventana ≥ alto del documento − 1`), ENTONCES la última sección es la activa. Un desplazamiento negativo se trata como tope. La sección activa no cambia con el desplazamiento detenido, no oscila entre dos secciones y no depende de la dirección. O se obtiene midiendo el alto real de la barra y se recalcula al redimensionar la ventana y al cambiar el tamaño de la barra —con observación de tamaño (`ResizeObserver`) sobre la propia barra, porque el zoom de texto puede cambiar su alto—, sin caché desfasada; la sección activa se recalcula al desplazarse, al redimensionar y cuando cambian las posiciones medidas de las secciones.

- **RF-7 (resaltado del enlace activo)**: CUANDO existe una sección activa, EL SISTEMA marca como actual exactamente el enlace correspondiente para las tecnologías de asistencia (`aria-current`) y lo distingue además con un indicador que no depende solo del color —subrayado, barra o grosor—, presente también en reposo, hover y foco. CUANDO no existe sección activa, ningún enlace está marcado ni muestra el indicador. El resto de enlaces no lleva ninguna marca. Como solo existe un conjunto de enlaces, la marca es la misma en línea y en el panel.

- **RF-8 (título del documento)**: CUANDO existe una sección activa, EL SISTEMA establece el título del documento como «Héctor Gutiérrez | {texto del encabezado de la sección activa}». CUANDO no existe sección activa, el título es «Héctor Gutiérrez | Ingeniero de Software». El título se actualiza solo al cambiar de sección activa y siempre es uno de esos cinco valores exactos. El documento servido contiene ya el título base, de modo que no se observa un cambio de título al abrir en el tope. Con un fragmento en la dirección, el título corresponde a la sección visible una vez terminada la carga.

- **RF-9 (saltar al contenido y foco al navegar)**: EL SISTEMA ofrece «Saltar al contenido» como primer elemento enfocable del documento, con destino al contenido principal (`main#contenido`), que puede recibir el foco por programa; mientras no recibe foco no ocupa espacio ni se anuncia visualmente, y al recibirlo se ve completo, con contraste suficiente, sin alterar el layout. Al activarlo, el foco pasa al contenido principal. CUANDO el visitante activa un enlace de sección o la marca, EL SISTEMA traslada el foco al encabezado de destino —o al encabezado del hero para la marca— sin alterar la posición final del desplazamiento, sin provocar un salto adicional y sin dibujar anillo de foco. Ese traslado no ocurre en la carga inicial ni al usar atrás/adelante. Después, el siguiente tabulador continúa dentro de esa sección o del bloque siguiente. Los controles interactivos conservan su anillo de foco visible.

- **RF-10 (estructura semántica)**: EL SISTEMA mantiene un único encabezado de nivel 1 —el nombre del hero— y un encabezado de nivel 2 por sección, sin saltos de nivel ni encabezados vacíos. Cada sección es una región asociada a su encabezado. Existe una única región principal, que contiene el hero y las secciones y nada más; la barra y el menú quedan fuera y el pie es una región propia al final. El orden de lectura coincide con el visual en todas las anchuras.

- **RF-11 (contenido de las tres primeras secciones y marca provisional)**: EL SISTEMA muestra en «Sobre mí» una biografía breve acompañada de la nota «Texto provisional pendiente de sustituir»; en «Proyectos», al menos tres proyectos de ejemplo; y en «Servicios», al menos tres servicios de ejemplo. Cada tarjeta de proyecto y de servicio muestra su título, una descripción breve y la etiqueta visible «Ejemplo». Ninguna tarjeta incluye nombres de clientes, resultados, métricas, fechas ni importes, ni contiene enlaces en esta spec. El contenido de las tres secciones no se trunca con puntos suspensivos: si no cabe, se reparte en varias líneas. Todo el contenido provisional se define en un único punto, separado de la presentación y marcado con comentarios `PROVISIONAL`; sustituirlo —incluido cambiar el número de tarjetas— no exige modificar la presentación ni la navegación, no deja restos y no rompe el orden ni el layout.

- **RF-12 (contacto, pie y enlaces externos)**: EL SISTEMA muestra en «Contacto» un texto breve, el correo y el teléfono como texto visible y exactamente estos cuatro enlaces: el correo `hectorgtezta@gmail.com` enlazado con `mailto:`; LinkedIn a `https://linkedin.com/in/hectorgtez/`; GitHub a `https://github.com/hectorgtez`; y WhatsApp a `https://wa.me/526672319477`, con el teléfono «(667) 231 9477» visible junto al enlace. Los nombres visibles identifican el medio —«Correo», «LinkedIn», «GitHub», «WhatsApp»— y los nombres accesibles de los tres enlaces externos indican que abren una pestaña nueva. Los enlaces externos abren en pestaña nueva sin entregar la referencia de origen. No se muestran formularios, campos de entrada ni otros datos personales. El pie muestra «Héctor Gutiérrez», el año actual y los enlaces de correo, LinkedIn y GitHub —sin WhatsApp—, y no contiene navegación de secciones ni suscripción. El año se calcula una vez al cargar con el reloj local del visitante.

## Requisitos no funcionales

- **RNF-1 (contraste)**: en ambos temas se cumplen los pares de la tabla, medidos sobre el color renderizado una vez terminada cualquier transición. Un par nuevo que implique texto o un elemento funcional se declara y se mide antes de darse por válido.

| Par obligatorio | Mínimo |
| --- | --- |
| Texto principal y secundario sobre fondo de página o superficie de tarjeta | 4.5:1 |
| Enlaces del menú, de contenido y del pie en reposo, hover, foco, visitado y activo | 4.5:1 |
| Enlace de la sección activa sobre la barra o el panel | 4.5:1 |
| Indicador de la sección activa contra su fondo | 3:1, además de no ser la única pista |
| Etiqueta «Ejemplo» y nota provisional sobre la superficie correspondiente | 4.5:1 |
| Botón del menú: icono y delimitación del control | 3:1 |
| Anillo de foco de los controles interactivos | 3:1, grosor ≥2 px y separación ≥2 px |
| Bordes de tarjetas y separadores | Sin requisito (decorativos) |

  Los colores declarados decorativos en la spec 001 —acento claro `#B88E3B` y primario oscuro `#7A4578`— no se usan como texto, icono funcional, indicador de estado ni foco. En claro se usa `#5E335C` con hover `#472645`; en oscuro, `#E5C378` con hover `#F2D899`.

- **RNF-2 (rendimiento y estabilidad)**: el CLS medido es `< 0,01` en carga, scroll, apertura y cierre del panel, cambio de tema, cambio de sección y redimensionado; el «CLS 0» del criterio 2 de la spec 001 queda relajado a este umbral único. Durante el scroll no se produce ninguna actualización de estado por frame: el número de renders de la barra y del menú no supera los cambios de sección activa más una actualización por cierre del panel. La posición de desplazamiento se lee como máximo una vez por frame, desde un único escucha pasivo, y el cálculo se delega en la función pura de RNF-7. En 3 s de scroll continuo con CPU limitada a 4× no hay tareas largas de más de 50 ms y el percentil 95 de frame es ≤ 16,7 ms. El alto de la barra se remide con observación de tamaño sobre la propia barra y en cada cambio de tamaño de la ventana, y los escuchas y observadores que se registren al montar se retiran al desmontar.

- **RNF-3 (accesibilidad y movimiento)**: el documento declara el idioma español y todos los textos y etiquetas accesibles están en español. Todo el contenido es operable solo con teclado, en orden lógico, sin trampas. El anillo de foco visible (≥2 px, 3:1, separado ≥2 px) se exige a los controles interactivos; `h1`, `h2` y `main`, que solo reciben foco por programa, no lo dibujan. El botón del menú y los enlaces del panel tienen un objetivo táctil de al menos 44 px de alto. Ninguna información depende solo del color. SI el sistema pide reducir animaciones, ENTONCES la navegación es inmediata, el panel aparece y desaparece sin animación y no se reproduce ninguna transición nueva; la preferencia se respeta si se activa con la página abierta.

- **RNF-4 (responsive y ampliación)**: desde 320 px de ancho y en cualquier ancho mayor, las secciones se ven completas, sin scroll horizontal de página, sin recortes ni solapamientos, y el contenido se reparte en varias líneas en lugar de truncarse; solo la marca de la barra puede truncarse. Las tarjetas se apilan en una columna en pantallas estrechas. El menú se decide por el ancho de la ventana: por debajo de 1024 px (`lg`) se usa el panel y desde 1024 px (`lg`), los enlaces en línea. Con el texto al 200 % a 1024 px no se exige que los cuatro enlaces quepan en una fila: se admite repartirlos o truncar la marca, sin scroll horizontal de página y sin ocultar ningún enlace. Los escenarios exigidos son: 320 px con texto al 200 %, 1024 px con texto al 200 % y zoom de página al 200 % sobre 1280×800 —ventana efectiva de 640×400 px—; en todos no hay scroll horizontal, todos los enlaces son alcanzables y el encabezado de destino no queda tapado.

- **RNF-5 (sin dependencias, red, almacenamiento ni exposición de datos)**: la funcionalidad usa capacidades nativas y el stack existente, sin dependencias, librerías ni pasos de build nuevos. No hay peticiones de red para mostrar, navegar o resolver la sección activa: ni fuentes, ni imágenes, ni iconos remotos, ni servicios de terceros. No se guarda ningún dato nuevo; la única clave sigue siendo la del tema. Los datos de contacto aparecen solo en la sección Contacto y en el pie —el correo y el teléfono como texto visible en Contacto, y los enlaces de contacto en ambos— además de en los `href` de esos enlaces; nunca en el título, en metadatos, en datos estructurados, en el almacenamiento ni en la consola. No hay analítica ni parámetros de seguimiento.

- **RNF-6 (SEO y metadatos)**: el documento servido contiene el título estático «Héctor Gutiérrez | Ingeniero de Software» y una descripción en español de entre 50 y 160 caracteres que resume el sitio. El título dinámico no impide leer ese título y esa descripción estáticos. La jerarquía de encabezados es descriptiva y los identificadores son estables y legibles, de modo que las direcciones con fragmento son compartibles. No se añaden etiquetas sociales ni datos estructurados, ni recursos que retrasen el primer render.

- **RNF-7 (verificabilidad, degradación y compatibilidad)**: la sección activa, el título y el año del pie se calculan con funciones puras y deterministas, sin acceso al documento, sin estado global y sin tiempo implícito:

  - `selectActiveSection(scrollY, sections, O, documentHeight, viewportHeight)` devuelve el identificador activo o `null`. `sections` es una lista ordenada de `{ id, top }` en coordenadas del documento y `O` es el margen de anclaje en píxeles —alto medido de la barra más 1 rem; hoy 80—. Reglas: lista vacía → `null`; `documentHeight ≤ viewportHeight` → `null`; `scrollY` negativo se trata como 0; si `scrollY + viewportHeight ≥ documentHeight - 1` → identificador de la última sección; en otro caso, el de la última sección con `top ≤ scrollY + O + 1`, o `null` si ninguna cumple. La tolerancia de 1 px absorbe el redondeo subpíxel y es la misma que usa la línea de referencia.
  - `buildDocumentTitle(activeLabel)` devuelve el título base con `null` y «Héctor Gutiérrez | {etiqueta}» en otro caso.
  - `getFooterYear(hoy)` devuelve el año de la fecha recibida; en la interfaz se llama una vez con la fecha local al cargar.
  - `nextPanelState(open, event)` devuelve `{ open, returnFocus }` y solo admite estos resultados: **botón (abrir o cerrar)** → invierte `open` y `returnFocus: false`; **elegir enlace** → `{ open: false, returnFocus: false }`; **Escape** → `{ open: false, returnFocus: true }`; **tocar fuera** → `{ open: false, returnFocus: false }`; **scroll de página** → `{ open: false, returnFocus: false }` —el evento distingue el desplazamiento de la página del desplazamiento interno del panel, que no cierra nada—; **pasar a `lg` (1024 px)** → `{ open: false, returnFocus: false }`. Desde cualquier estado, el resultado siempre es uno de esos seis, sin estados ambiguos.
  - **Valores esperados de los tests** (con `O = 80`, `viewportHeight = 800`, `documentHeight = 4400` y secciones en 900, 1800, 2700 y 3400): `scrollY = 0` → `null`; `818` → `null`; `819` → «sobre-mi»; `1719` → «proyectos»; `3318` → «servicios»; `3319` → «contacto»; en reposo tras el ancla (`scrollY = top − O`) la sección anclada es la activa: `820` → «sobre-mi», `1720` → «proyectos», `2620` → «servicios» y `3320` → «contacto»; `3599` → «contacto» por final del documento; `-50` → `null`; `documentHeight = 700` → `null`; lista vacía → `null`; dos secciones con el mismo `top` → la última de la lista. Fixture de final: con una única sección en `3400`, `documentHeight = 4000`, `viewportHeight = 800` y `scrollY = 3200` → «contacto»; la regla normal no la alcanza (`3400 > 3281`) y el resultado solo puede venir de la regla de final.
  - **Verificación**: con `node --test`, sin navegador y sin dependencias nuevas, cubriendo los casos anteriores.
  - **Degradación y compatibilidad**: si el navegador no admite el desplazamiento suave nativo, el salto es inmediato; si no completa la colocación en un fragmento, el contenido sigue siendo accesible desde el menú y no hay errores en consola. Se mantienen íntegras las specs 001 y 002 —tema, ausencia de destello, fundido, barra de 4 rem, parallax y límites— y el parallax del hero pasa a estar activo sin cambios en su código. De los criterios 1 y 14 de la spec 002 queda derogada solo la parte que exige que el documento no tenga recorrido; el resto —alto del hero y ausencia de hueco con la barra— sigue vigente y debe revalidarse, junto con el criterio 18, que esta spec exige cerrar. No existe ninguna segunda implementación de la sección activa.

## Casos límite

- **Página en el tope**: no hay sección activa, ningún enlace marcado y título base.
- **Documento sin recorrido** (ventana muy alta o contenido muy corto): no hay sección activa aunque se vea una sección; el tope gana.
- **Volver al tope**: se limpian resaltado y título sin restos.
- **Última sección y pie que superan la ventana**: al llegar al final del documento, el encabezado de «Contacto» puede quedar por encima del borde superior de la ventana porque el final no permite colocarlo a la distancia O. Es el comportamiento esperado y no un fallo; el pie y el final de la sección siguen visibles y «Contacto» sigue siendo la sección activa. Se comprueba también en 640×400.
- **Clic en el enlace de la sección ya activa con el fragmento ya en la dirección**: no se exige re-desplazamiento; el foco sí pasa al encabezado.
- **Clic con Ctrl, Cmd, Mayús o botón central**: se conserva el comportamiento nativo; la pestaña original no se mueve.
- **Carga con fragmento**: la colocación puede animarse; al terminar la carga la sección está a la vista y su encabezado no queda bajo la barra.
- **Fragmento inexistente**: la página queda en el tope, sin sección activa y sin errores en consola.
- **Recarga con la página desplazada**: el navegador restaura la posición; la sección activa y el título corresponden a la posición en reposo, sin exigir colocación instantánea.
- **Panel abierto y Escape**: se cierra, el foco vuelve al botón y la lectura no se mueve.
- **Panel abierto y elección de sección**: se cierra y el foco pasa al encabezado de destino.
- **Panel abierto y toque fuera**: se cierra sin mover el foco de forma forzada.
- **Panel abierto y desplazamiento de la página**: se cierra.
- **Panel abierto y desplazamiento de su propio contenido**: el panel no se cierra y el desplazamiento no se encadena a la página (`overscroll-behavior: contain`).
- **Panel abierto al ensanchar a 1024 px**: se cierra, aparecen los enlaces en línea y el foco no queda en un elemento oculto.
- **Panel cerrado con el tabulador**: sus enlaces no reciben foco; el tabulador pasa al siguiente control visible.
- **Panel abierto con el tabulador**: se puede salir hacia el contenido; no hay ciclo cerrado.
- **Panel abierto con cambio de tema**: conserva superficie, texto y foco del tema nuevo, sin transparencias.
- **320 px**: marca, conmutador y botón caben en una fila sin scroll horizontal; las tarjetas se apilan y los textos no se truncan.
- **320 px con texto al 200 %**: sin scroll horizontal; los textos se reparten en varias líneas; el margen de anclaje crece con el texto y el destino no queda tapado.
- **1024 px con texto al 200 %**: los enlaces pueden no caber en una fila; se reparten o se trunca la marca, todos siguen alcanzables y no hay scroll horizontal de página.
- **Zoom de página al 200 %**: ventana efectiva de 640×400; se usa el panel, las secciones se ven completas y el destino no queda tapado.
- **Desplazamiento rápido o con inercia**: la sección activa no parpadea; termina siendo la de la posición final.
- **Dos secciones con el mismo borde superior**: la regla devuelve una sola, la última de la lista, sin estados alternos.
- **Contenido sustituido con menos o más tarjetas**: la sección conserva encabezado y estructura, sin huecos ni errores; el orden de secciones no cambia.
- **Sin JavaScript**: el sitio no se considera navegable; no se exige que el botón abra el panel ni se duplica contenido.
- **Impresión o exportación a PDF**: fuera de alcance.

## Fuera de alcance

- Blog, casos de estudio, testimonios, premios, currículum descargable o páginas de detalle por proyecto.
- Formularios, boletines, campos de entrada, envío de correo desde el sitio o integraciones de mensajería.
- Imágenes, capturas, logotipos, vídeos, iconos remotos, fuentes nuevas o recursos binarios.
- Datos reales de proyectos, clientes, resultados o métricas; los textos provisionales no representan hechos reales.
- Open Graph, Twitter Cards, datos estructurados, sitemap, robots o analítica.
- Una segunda implementación del scrollspy basada en observación de intersección o en escuchar el desplazamiento como respaldo.
- Rutas propias, páginas adicionales, modales, avisos flotantes o un botón de volver arriba.
- Animaciones de entrada, revelados al hacer scroll, contadores o cualquier efecto distinto del desplazamiento suave y del parallax existente.
- Temas nuevos, colores nuevos o personalización de la paleta.
- Cambiar los textos, el comportamiento o la estética del hero y del conmutador. De la barra solo se admiten el menú y la conversión de la marca en ancla.
- Idiomas distintos del español o traducción de los identificadores.
- Un pie extenso con avisos legales o enlaces a redes distintas de los tres aprobados.
- Presentación específica para impresión o PDF.
- **Sin JavaScript**: el sitio no se considera navegable, igual que en las specs 001 y 002; no se introduce prerender ni HTML duplicado.

## Criterios de finalización

1. Existen exactamente las cuatro secciones, en orden, bajo el hero, con sus encabezados de nivel 2 e identificadores; el hero tiene `inicio` y el pie va después de «Contacto».
   **Cómo se comprueba:** revisar el DOM y el árbol de accesibilidad; comprobar orden, textos, identificadores y ausencia de bloques intermedios.

2. El menú es una única región «Secciones» con exactamente cuatro enlaces; la marca es un ancla a `inicio` que deja el tope sin desplazamiento adicional; las anclas no cancelan el comportamiento nativo; modificadores, atrás y adelante funcionan y no hay recarga.
   **Cómo se comprueba:** contar regiones de navegación y enlaces, comprobar sus destinos y que los textos e identificadores coinciden con los de los encabezados de las secciones; comprobar que activar la marca deja `scrollY = 0`; probar cada enlace con clic normal y con Ctrl/Cmd/Mayús; usar atrás y adelante comprobando dirección, posición y conservación del tema; comprobar que no se cancela el evento por defecto.

3. Al activar un enlace, el encabezado de destino queda justo bajo la barra, a la distancia O = alto medido de la barra + 1 rem (hoy 80 px), sin quedar oculto, en 320, 375, 768, 1024 y 1440 px; si la última sección y el pie superan la ventana, al final el encabezado de «Contacto» puede quedar por encima del borde superior y eso se acepta; al cargar con fragmento, al terminar la carga la sección está a la vista y su encabezado no queda bajo la barra.
   **Cómo se comprueba:** medir la distancia entre el borde superior del encabezado y el de la ventana y compararla con el alto de la barra más 1 rem; repetir con carga directa de cada fragmento, con atrás/adelante y con el caso de «Contacto» al final, también en una ventana de 640×400; comprobar que la colocación de la carga puede animarse y no se exige instantaneidad.

4. La navegación por anclas es suave sin reducción de movimiento e inmediata con `prefers-reduced-motion: reduce`, y el desplazamiento manual del visitante nunca se anima.
   **Cómo se comprueba:** activar enlaces con la preferencia por defecto y comprobar el desplazamiento animado; emular movimiento reducido y comprobar el salto inmediato y que el panel se abre y cierra sin animación; activar la preferencia con la página abierta y repetir; desplazar con la rueda y comprobar que no hay suavizado.

5. En 1024 px (`lg`) y 1440 px, con el texto al 100 %, los cuatro enlaces se muestran en línea dentro de la barra, sin botón de menú, la barra mide 4 rem (64 px) con su borde inferior, el conmutador de tema sigue visible y operable, y no hay desbordamiento ni scroll horizontal.
   **Cómo se comprueba:** medir el alto de la barra y su borde en 1024 y 1440 px; comprobar que los cuatro enlaces son visibles, están en una fila y son enfocables, y que no existe botón de menú; activar el conmutador y comprobar que cambia el tema; medir el ancho del documento frente al de la ventana.

6. El panel cumple: botón de al menos 44×44 px con nombre «Menú» y estado anunciado, panel absoluto con `max-height: calc(100dvh - 4rem)` y scroll interno con `overscroll-behavior: contain`, cierre por Escape con foco al botón, por elección, por toque fuera, por scroll de la página —no del panel—, por el botón y al pasar a 1024 px, sin trampa de foco y con enlaces no enfocables cuando está cerrado.
   **Cómo se comprueba:** medir el botón en 320 y 375 px; comprobar atributos de estado y control; abrir y comprobar que el alto del documento, la posición del contenido y el CLS no cambian; cerrar por cada uno de los seis mecanismos comprobando estado y foco; con contenido interno más alto que el panel, desplazarlo y comprobar que el panel sigue abierto y que la página no se mueve; recorrer el panel con el tabulador y salir de él; con el panel cerrado, comprobar que sus enlaces no reciben foco.

7. La sección activa sigue la regla de RF-6 —`top ≤ scrollY + O + 1`, es decir, la línea de referencia con tolerancia de 1 px, sin recorrido no hay sección activa (el tope gana sobre la regla de final) y última sección al final—, se resalta como máximo un enlace, se indica sin depender solo del color y no produce renders por frame: como máximo, un render por cambio de sección más uno por cierre del panel.
   **Cómo se comprueba:** desplazar en pasos finos y comparar el resaltado con la regla calculada a partir de las posiciones medidas; comprobar que solo el enlace activo expone el estado actual y que ninguno lo expone cuando no hay sección activa; probar tope, final y documento sin recorrido; detenerse en bordes de sección y comprobar que no oscila; perfilear la barra durante 3 s de scroll y comparar el número de renders con los cambios de sección más los cierres de panel.

8. El título del documento es exactamente «Héctor Gutiérrez | Ingeniero de Software» en el tope y «Héctor Gutiérrez | {sección}» en cada sección, cambia solo al cambiar de sección y coincide con la sección visible al terminar la carga con fragmento.
   **Cómo se comprueba:** leer el título en cada sección y en el tope; comprobar que no cambia dentro de una misma sección ni al detenerse; comprobar el título estático del documento servido; cargar con cada fragmento y comprobar el título una vez en reposo.

9. «Saltar al contenido» es el primer elemento enfocable, invisible y sin ocupar espacio hasta recibir foco, visible y legible al enfocarlo, y lleva el foco al contenido principal sin alterar el layout; al navegar, el foco queda en el encabezado de destino sin anillo y el siguiente tabulador sigue dentro de la sección.
   **Cómo se comprueba:** pulsar Tab desde el inicio y comprobar el primer foco; medir el layout antes y después de enfocar; activar y comprobar que el foco llega a `main#contenido` y que el siguiente Tab sigue dentro; activar cada enlace con teclado y ratón y comprobar el elemento enfocado, la ausencia de anillo en el encabezado, el anillo en los controles y que la posición final no cambia.

10. La estructura semántica es correcta: un solo encabezado de nivel 1, un nivel 2 por sección, regiones con nombre, una sola región principal sin barra ni menú y un pie como región propia; el orden de lectura coincide con el visual.
    **Cómo se comprueba:** revisar el árbol de accesibilidad en 320 y 1440 px; comprobar niveles y cantidad de encabezados, nombres de regiones, pertenencia de barra y pie, y el orden de lectura.

11. Las tres primeras secciones tienen biografía con su nota, al menos tres proyectos y tres servicios, todos con título y descripción y etiqueta «Ejemplo»; no hay clientes, métricas, fechas ni importes; todo está en un único punto de definición con comentarios `PROVISIONAL`; sustituir contenido no exige tocar la presentación.
    **Cómo se comprueba:** revisar el contenido renderizado y contar las tarjetas; comprobar la etiqueta y la nota en ambos temas; localizar los comentarios; buscar textos de ejemplo solo en el contenido de proyectos, servicios y biografía, sin contar como incumplimiento las etiquetas «Ejemplo» ni la nota (son interfaz legítima); sustituir temporalmente un bloque y cambiar el número de tarjetas, comprobar layout y orden y revertir; comprobar que el contenido de las secciones no se trunca.

12. «Contacto» muestra el correo y el teléfono como texto visible y los cuatro enlaces con los destinos exactos, con nombres accesibles que indican pestaña nueva en los externos; el pie muestra nombre, año y los enlaces de correo, LinkedIn y GitHub, sin WhatsApp; no hay formularios ni otros datos personales.
    **Cómo se comprueba:** revisar el texto visible (correo y «(667) 231 9477») y los destinos de cada enlace; comprobar que el correo usa `mailto:` y que WhatsApp apunta a `https://wa.me/526672319477`; comprobar pestaña nueva y ausencia de referencia de origen en los externos; comprobar el año frente al reloj del sistema; comprobar los nombres accesibles y la ausencia de campos y de otros datos.

13. En 320, 375, 768, 1024 y 1440 px no hay scroll horizontal, recortes ni solapamientos; las tarjetas se apilan en pantallas estrechas; y los escenarios de 320 px con texto al 200 %, 1024 px con texto al 200 % y zoom de página al 200 % sobre 1280×800 conservan todo el contenido, el destino sin tapar y los cuatro enlaces alcanzables.
    **Cómo se comprueba:** medir el ancho del documento frente al de la ventana en cada ancho; aplicar cada escenario de ampliación y repetir el criterio 3; comprobar que a 1024 px con texto al 200 % los enlaces se reparten o la marca se trunca sin scroll horizontal y sin ocultar enlaces; comprobar que en el zoom de página se usa el panel y que sigue operativo.

14. Los pares de RNF-1 se cumplen en ambos temas —incluido el indicador de sección activa, la etiqueta «Ejemplo», la nota provisional y los anillos de foco—, y el CLS es `< 0,01`, el único umbral, en carga, scroll, panel, tema, cambio de sección y redimensionado.
    **Cómo se comprueba:** medir cada par con los colores renderizados en ambos temas y en reposo, hover y foco; revisar que los componentes nuevos solo usan tokens; registrar el CLS en los escenarios indicados y comprobar que no se usa un umbral distinto.

15. El documento servido tiene el título estático y la descripción de 50 a 160 caracteres, sin etiquetas sociales ni datos estructurados; no hay errores nuevos en consola, ni dependencias añadidas, ni peticiones de red, ni datos guardados salvo la clave del tema; los datos de contacto aparecen solo en Contacto, en el pie y en los `href` de sus enlaces; la navegación no depende de capacidades opcionales del navegador y el código libera sus escuchas al desmontar.
    **Cómo se comprueba:** inspeccionar el documento servido y contar caracteres de la descripción; revisar consola en carga, navegación, scroll, panel, tema, resize y fragmento inválido; revisar dependencias, red y almacenamiento; buscar los datos de contacto en el texto fuera de Contacto y del pie, en título, metadatos, datos estructurados, almacenamiento y consola; revisar en el código que la navegación y el foco no dependen de capacidades opcionales y que el cleanup existe, y desmontar temporalmente el menú en la verificación para comprobar que no quedan escuchas activas.

16. Con las secciones añadidas, el parallax del hero se activa sin cambios en su código —movimiento desde el primer píxel, límite de seguridad y congelación al final—, se revalidan las specs 001 y 002 y queda cerrado el criterio 18 de la 002: al recargar con scroll avanzado y restauración activa, el hero se pinta ya desplazado, sin frame intermedio en composición base. De los criterios 1 y 14 de la 002 solo se da por derogada la parte que exigía que el documento no tuviera recorrido; el alto del hero y la ausencia de hueco con la barra se comprueban igualmente.
    **Cómo se comprueba:** medir los desplazamientos de fondo y texto y compararlos con la fórmula de la 002; comprobar que el código del hero no cambia, que conserva su alto y su único `h1` y que el tema no sufre destellos; desplazar a mitad del recorrido del hero, recargar con restauración activa y revisar el primer frame con contenido mediante un screencast o filmstrip (o una captura del panel Performance), comprobando que no aparece en composición base; si la herramienta no permite aislar frames, basta comprobar que no se observa ningún salto tras el primer pintado del hero, sin exigir distinguir frames; registrar el resultado y actualizar el estado del criterio en la spec 002.

## Dudas abiertas

Sin dudas pendientes.
