# Spec 001 — Navbar con conmutador de tema claro/oscuro

Estado: implementada

## Contexto y objetivo

El sitio es un portafolio personal que hoy muestra una única página con un contenido mínimo (un título) sobre fondo oscuro. No existe una barra de navegación ni un sistema de temas, aunque la identidad visual del proyecto ya define una paleta completa para modo claro y modo oscuro.

Se quiere que cualquier visitante pueda alternar entre ambos modos desde una barra de navegación fija en la parte superior, y que el cambio afecte al fondo de la página, a los textos, a la superficie y al borde inferior de la propia barra y al conmutador, según esa paleta. El modo oscuro es la identidad visual del sitio y su valor de reserva; el modo claro es una alternativa de confort visual. En la primera visita, si el visitante aún no ha elegido, el sitio se adapta al tema que ya usa su sistema operativo; a partir de la primera elección explícita, manda siempre la elección del visitante.

El objetivo es doble:

1. Dar al sitio una estructura de navegación mínima y coherente con su identidad (marca + control de tema), sin prometer más de lo que existe hoy.
2. Ofrecer control real al visitante sobre el contraste de la interfaz, sin que su elección se pierda al recargar, sin deslumbrarle en la primera visita y sin parpadeos desagradables.

**Paleta de referencia (ya definida en el proyecto, no se inventa aquí):**

| Rol | Modo oscuro (identidad y reserva) | Modo claro | Uso admitido |
| --- | --- | --- | --- |
| Fondo principal | `#0E0C10` | `#FAF9FA` | Fondo de página y relleno del tirador del conmutador |
| Superficie (tarjetas y navbar) | `#17141B` | `#FFFFFF` | Superficie de tarjetas y de la navbar |
| Bordes / separadores | `#2B2533` | `#E6E1E8` | Solo decorativos (ver RNF-1) |
| Primario | `#7A4578` (base `#5E335C`) | `#5E335C` | Oscuro: solo decorativo. Claro: admite texto, enlaces, foco y pista/icono del conmutador |
| Primario hover | — | `#472645` | Claro: admite hover de enlaces y pista del conmutador en hover |
| Acento | `#E5C378` | `#B88E3B` | Oscuro: admite texto, hover y pista/icono del conmutador. Claro: solo decorativo |
| Acento hover | `#F2D899` | `#9E772E` | Oscuro: admite hover y pista del conmutador en hover. Claro: solo decorativo |
| Texto principal | `#F4F2F5` | `#1E1822` | Texto y anillo de foco |
| Texto secundario | `#A8A1B0` | `#655D6C` | Texto |

**Conmutador de tema (modelo píldora):** la pista toma el color de interacción del tema y el tirador toma el color de fondo principal del tema; el icono va dentro del tirador y toma el color de interacción del tema.

| Tema | Pista (reposo / hover) | Tirador | Icono dentro del tirador | Contraste mínimo medido |
| --- | --- | --- | --- | --- |
| Oscuro | `#E5C378` / `#F2D899` | `#0E0C10` | `#E5C378` | Pista/fondo 11.5:1 (sobre la navbar, 10.8:1); tirador/pista 11.5:1; icono/tirador 11.5:1. En hover: 14:1 (navbar 13.1:1) / 14:1 / 11.5:1 |
| Claro | `#5E335C` / `#472645` | `#FAF9FA` | `#5E335C` | Pista/fondo 9.5:1 (sobre la navbar, 10:1); tirador/pista 9.5:1; icono/tirador 9.5:1. En hover: 12.3:1 (navbar 12.9:1) / 12.3:1 / 9.5:1 |

## Usuarios

- **Visitante del portafolio**: persona que llega al sitio para conocer el trabajo y los servicios ofrecidos. Puede estar en un entorno con poca o mucha luz, y puede preferir un contraste claro u oscuro.
- **Visitante que llega por primera vez**: no ha elegido nada todavía y espera que el sitio no le deslumbre; su sistema operativo ya indica un tema preferido.
- **Visitante recurrente**: ya eligió un tema en una visita anterior y espera encontrarlo igual.
- **Visitante que usa lector de pantalla o solo teclado**: necesita identificar, conocer el estado y activar el control de tema sin depender del color ni del ratón.

## Historias de usuario

- HU-1. Como visitante, quiero ver una barra de navegación siempre a la vista en la parte superior con la marca del sitio para saber dónde estoy y poder volver al inicio.
- HU-2. Como visitante, quiero alternar entre modo claro y oscuro con un solo control para adaptar el sitio a la luz de mi entorno.
- HU-3. Como visitante recurrente, quiero que el sitio recuerde el tema que elegí para no tener que cambiarlo en cada visita.
- HU-4. Como visitante que usa teclado o lector de pantalla, quiero identificar, conocer el estado y activar el control de tema sin ambigüedad para usar el sitio con autonomía.
- HU-5. Como visitante, quiero que el tema correcto aparezca desde el primer instante para no ver un destello de colores equivocados al cargar.
- HU-6. Como visitante que aún no ha elegido un tema, quiero que el sitio use el mismo tema que mi sistema operativo, y que lo siga si cambia, para no sufrir un contraste incómodo.

## Definiciones

- **Tema**: conjunto de colores de fondo, texto, superficie, bordes y acentos aplicado a la página. En esta spec existen exactamente dos: **oscuro** (identidad del sitio y valor de reserva) y **claro**.
- **Tema activo**: el tema que se está mostrando en un momento dado. Se determina por la elección manual del visitante (guardada o hecha en esta sesión); si no existe, por la preferencia del sistema; si esta no se puede determinar, por el modo oscuro. Una preferencia guardada inválida se ignora (RNF-8).
- **Conmutador de tema**: control único de tipo interruptor con forma de píldora, compuesto por una **pista** y un **tirador** que se desplaza entre los dos extremos de la pista. Dentro del tirador se muestra un icono de sol o de luna. Su estado es perceptible por la posición del tirador y por la forma del icono, además del estado anunciado, no solo por el color.
- **Pista**: el carril o fondo alargado del conmutador sobre el que se desplaza el tirador.
- **Tirador (knob)**: la pieza móvil del conmutador; contiene el icono y su relleno se distingue de la pista.
- **Indicador de estado**: cualquier señal visual del conmutador distinta del icono (por ejemplo, la posición del tirador o el relleno de la pista) que ayude a saber si el modo oscuro está activo.
- **Identidad del sitio (marca)**: nombre o marca visible del portafolio, presentado como enlace al inicio del sitio.
- **Elección manual**: decisión explícita del visitante al activar el conmutador. Puede quedar **guardada** entre visitas o quedar solo **hecha en esta sesión** si el navegador no permite guardarla. Cualquiera de las dos tiene prioridad sobre la preferencia del sistema.
- **Preferencia guardada**: elección manual que el navegador conserva entre visitas (mediante almacenamiento local del navegador). No contiene datos personales. Tiene prioridad sobre cualquier otra indicación de tema.
- **Preferencia del sistema**: tema claro u oscuro que el sistema operativo del visitante comunica al navegador. Solo se usa mientras no exista una elección manual, guardada o hecha en esta sesión.
- **Destello de tema (FOUC de tema)**: aparición breve del tema equivocado al cargar la página antes de aplicar el tema correcto.
- **Primer pintado**: primer instante en que el navegador muestra píxeles de la página. En ese instante ya deben verse el fondo y el texto del tema correcto. Todo lo que deba ocurrir "antes del primer pintado" debe ser síncrono y de coste despreciable.
- **Primer render del conmutador**: primer instante en que el conmutador aparece en pantalla. Puede ocurrir después del primer pintado; en ese instante su icono y su estado anunciado ya coinciden con el tema aplicado.
- **Declaración de diseño (superficies futuras)**: cualquier superficie o borde que se añada al contenido en el futuro deberá usar la paleta del tema activo y declarar y medir sus pares de contraste antes de darse por válido. Es una guía de diseño permanente, no un requisito verificable en esta spec: hoy solo existe el bloque de contenido actual.
- **Separación de la navbar**: el borde inferior de la barra es una separación decorativa entre la barra y el contenido. No delimita ningún control y no tiene requisito de contraste.

## Requisitos funcionales

- **RF-1 (navbar e identidad, responsiva)**: CUANDO el visitante abre el sitio, EL SISTEMA muestra en la parte superior una barra de navegación que contiene únicamente la marca como enlace al inicio del sitio y el conmutador de tema, sin enlaces de navegación adicionales, sin llamadas a la acción y sin menú. El enlace de marca lleva al inicio del sitio; si el visitante ya está en el inicio y en la parte superior de la página, activarlo no recarga la página ni produce ningún salto. El texto de la marca usa el color de texto principal del tema activo; sus estados reposo, hover, foco, visitado y activo se indican con subrayado y, si cambia el color, solo con los colores admitidos por RNF-1, sin introducir colores nuevos. En cualquier estado, el color del texto de la marca mantiene el contraste de texto exigido por RNF-1 y el anillo de foco cumple el par de foco de RNF-1. MIENTRAS el ancho de pantalla es el de un móvil (desde 320 px), EL SISTEMA mantiene la barra en una sola fila legible, sin scroll horizontal, sin solapamientos y con el conmutador completamente visible y utilizable.
- **RF-1b (barra fija)**: MIENTRAS el visitante se desplaza por la página, EL SISTEMA mantiene la barra fija en la parte superior, con la superficie del tema activo y un borde inferior presente como separación decorativa (sin requisito de contraste), de modo que el contenido no queda oculto bajo la barra ni se produce desplazamiento de layout al cargar ni al desplazarse. Esta ausencia de ocultación es un requisito de maquetación, no de contraste.
- **RF-2 (cambio de tema)**: CUANDO el visitante activa el conmutador de tema, EL SISTEMA aplica el tema opuesto en el siguiente frame, sin recargar la página y sin perder la posición de lectura, y actualiza con la paleta del tema activo el fondo de la página, todos los textos, la superficie y el borde inferior de la barra y el propio conmutador (pista, tirador e icono).
- **RF-3 (conmutador accesible, tipo píldora)**: EL SISTEMA presenta el conmutador como un único control de tipo interruptor (rol `switch`, estado expuesto como `aria-checked`) con un modelo coherente y estable: (a) nombre accesible fijo en español, «Modo oscuro», que no cambia con el tema; (b) el estado se anuncia como activado cuando el tema oscuro está aplicado y desactivado cuando está el claro; (c) se muestra como una píldora con pista y tirador, sin texto visible, con el tirador en un extremo u otro según el tema activo (posición estable: el mismo tema ocupa siempre el mismo extremo) y, dentro del tirador, un único icono que representa el tema activo (sol cuando el tema activo es claro, luna cuando es oscuro) y se distingue por su forma, no solo por el color; (d) es operable con teclado (Tab para enfocar, Espacio y Enter para activar); (e) muestra un indicador de foco visible que no depende del color: anillo de al menos 2 px de grosor, separado al menos 2 px del control, trazado con el color de texto principal del tema activo; (f) su objetivo táctil mide al menos 24×24 px (recomendado 44×44 px).
- **RF-4a (resolución inicial del tema)**: CUANDO el visitante abre la página, EL SISTEMA aplica la preferencia guardada si existe y es válida; SI no existe o no es válida, ENTONCES aplica la preferencia del sistema; SI la preferencia del sistema no se puede determinar, ENTONCES aplica el modo oscuro.
- **RF-4b (persistencia de la elección)**: CUANDO el visitante activa el conmutador, EL SISTEMA aplica el tema opuesto, guarda esa elección (si el almacenamiento lo permite; ver RF-4d) y, desde ese momento, la preferencia guardada manda sobre el sistema tanto en la sesión actual como en visitas posteriores.
- **RF-4c (fin del seguimiento del sistema)**: MIENTRAS no exista una elección manual —ni guardada ni hecha en esta sesión—, EL SISTEMA sigue los cambios de preferencia del sistema que ocurran con la página abierta y aplica el nuevo tema sin recargar. CUANDO ya existe una elección manual, guardada o hecha en esta sesión (aunque no se haya podido guardar), EL SISTEMA ignora los cambios del sistema y mantiene el tema elegido durante el resto de la sesión.
- **RF-4d (degradación del almacenamiento)**: SI leer la preferencia guardada falla o el almacenamiento no está disponible, ENTONCES EL SISTEMA resuelve el tema con la preferencia del sistema y, en su defecto, en oscuro, sin errores visibles y con el conmutador operativo durante la sesión. SI guardar la elección falla, ENTONCES EL SISTEMA aplica igualmente el tema elegido durante la sesión, el conmutador muestra ese estado y sigue operativo, no se muestra ningún error al visitante y, tal como establece RF-4c, esa elección ya cuenta como elección manual de la sesión: la siguiente carga se resuelve como si no hubiera elección guardada.
- **RF-5 (sin destello de tema)**: CUANDO la página se carga con una preferencia guardada válida o, en su defecto, con una preferencia del sistema determinable, EL SISTEMA aplica el tema resuelto por RF-4a antes del primer pintado, de modo que el primer píxel visible ya use el tema correcto en fondo y texto; SI no hay ninguna preferencia determinable, ENTONCES el primer pintado usa el modo oscuro. El conmutador puede no existir todavía en el primer pintado; CUANDO el conmutador se renderiza por primera vez, EL SISTEMA muestra el icono y el estado anunciado coincidentes con el tema ya aplicado. Antes del primer pintado solo se permite la lectura síncrona de la preferencia guardada y la consulta de la preferencia del sistema.

## Requisitos no funcionales

- **RNF-1 (contraste)**: en ambos temas se cumplen los pares obligatorios de la tabla siguiente, medidos sobre el color realmente renderizado. Un par que no figure en la tabla y que implique texto o un elemento funcional no se da por válido por omisión.

| Par obligatorio | Ratio mínimo | Cómo se verifica |
| --- | --- | --- |
| Texto principal sobre fondo principal | 4.5:1 | Medición del par en ambos temas |
| Texto principal sobre superficie | 4.5:1 | Medición del par en ambos temas |
| Texto secundario sobre fondo principal | 4.5:1 | Medición del par en ambos temas |
| Texto secundario sobre superficie | 4.5:1 | Medición del par en ambos temas |
| Texto grande (≥24 px, o ≥18.66 px en negrita) sobre fondo principal o superficie | 3:1 | Medición del par en ambos temas |
| Color del texto de la marca y de los enlaces en reposo, hover, foco, visitado y activo | 4.5:1 | Medición del color del texto en cada estado y tema |
| Pista del conmutador contra el fondo o superficie adyacente (la navbar) | 3:1 | Medición del par en ambos temas, incluido el hover de la pista |
| Tirador del conmutador contra la pista | 3:1 | Medición del par en ambos temas, incluido el hover de la pista |
| Icono (sol/luna) contra el relleno del tirador | 3:1 | Medición del par en ambos temas |
| Delimitación del conmutador como control interactivo (pista o borde, si existe) | 3:1 | Medición contra el fondo adyacente en ambos temas |
| Anillo de foco de marca y conmutador | 3:1 | Medición contra el fondo adyacente; además, grosor ≥2 px y separación ≥2 px respecto al control, visible sin depender del color |
| Bordes y separadores puramente decorativos (borde inferior de la barra, separadores de contenido) | Sin requisito | No son la única pista de ningún control |
| Cualquier par nuevo de texto | 4.5:1 | Debe declararse y medirse antes de darse por válido |
| Cualquier par nuevo de elemento funcional (iconos, indicadores, bordes de control) | 3:1 | Debe declararse y medirse antes de darse por válido |

  **Colores de la paleta que son solo decorativos y no pueden usarse como color de texto, de icono funcional, de pista de control ni de foco:**

  - Acento del tema claro `#B88E3B` sobre fondo claro `#FAF9FA`: 2.87:1.
  - Primario del tema oscuro `#7A4578` sobre fondo oscuro `#0E0C10`: 2.73:1; su base `#5E335C` usada en el tema oscuro sobre el mismo fondo: ≈1.95:1.
  - Acento hover del tema claro `#9E772E` sobre fondo claro `#FAF9FA`: 3.9:1 (insuficiente para texto normal).
  - Bordes de paleta `#2B2533` y `#E6E1E8` sobre sus fondos: ≈1.2–1.3:1; sirven de separador decorativo, nunca para delimitar el conmutador ni como única pista de un control.

  Para texto, enlaces, iconos funcionales, pistas de control y foco se usan exclusivamente los pares que cumplen la tabla: texto principal y secundario y, cuando haga falta un color de interacción, primario claro `#5E335C` / hover `#472645` en tema claro y acento `#E5C378` / hover `#F2D899` en tema oscuro. Esto implica que el acento del tema claro no se usa como color de texto, y que el primario oscuro no se usa para interacción; en su lugar se emplean los pares anteriores.

  **Usos adicionales admitidos en el conmutador, siempre que se cumplan los ratios:**

  - El color de fondo principal del tema (`#0E0C10` en oscuro, `#FAF9FA` en claro) se admite como relleno del tirador. No es color de texto ni de icono.
  - El color de interacción del tema (acento `#E5C378` / hover `#F2D899` en oscuro; primario `#5E335C` / hover `#472645` en claro) se admite como color de la pista y como tinta del icono dentro del tirador, porque se mide contra el relleno del tirador y no directamente contra la pista.
  - El icono nunca se pinta directamente sobre la pista: siempre va dentro del tirador. Por eso no se admite ningún par icono/pista como sustituto de los pares pista/fondo, tirador/pista e icono/tirador.
- **RNF-2 (inmediatez y estabilidad visual)**: el tema se aplica en el siguiente frame tras la interacción; cualquier transición de color dura como máximo 200 ms, no bloquea la interacción y no produce desplazamientos de layout (CLS 0 durante la carga, el cambio de tema y el scroll con la barra fija).
- **RNF-3 (sin dependencias ni red)**: la funcionalidad se consigue con capacidades nativas del navegador, sin añadir dependencias, frameworks ni pasos de build nuevos, y sin ninguna petición de red para resolver, aplicar o guardar el tema.
- **RNF-4 (límite del primer pintado)**: antes del primer pintado solo se permite la lectura síncrona de la preferencia guardada y la consulta de la preferencia del sistema. No se permite ningún trabajo asíncrono, petición de red ni espera que retrase el primer pintado; en caso de conflicto entre este límite y RF-5, manda RF-5: el primer pintado siempre muestra el tema correcto en fondo y texto.
- **RNF-5 (privacidad)**: lo único que se guarda en el navegador es el tema elegido; nunca la preferencia del sistema, datos personales, credenciales ni identificadores.
- **RNF-6 (idioma)**: el elemento raíz del documento declara el idioma español (`lang="es"`; hoy declara inglés) y todos los textos de interfaz y etiquetas accesibles, nuevos o existentes, están en español.
- **RNF-7 (movimiento reducido)**: SI el sistema operativo del visitante pide reducir animaciones, ENTONCES EL SISTEMA aplica el tema sin transición de color (duración 0 ms) y sin animaciones asociadas, manteniendo el cambio inmediato y visible.
- **RNF-8 (compatibilidad futura)**: una preferencia guardada desconocida o de una versión futura nunca rompe la página: se ignora y se resuelve como si no existiera, sin errores en consola.

## Casos límite

- **Primera visita, sin preferencia guardada y sistema en claro**: el sitio abre en modo claro, sin destello del modo oscuro.
- **Preferencia del sistema no determinable**: el sitio abre en modo oscuro.
- **Preferencia guardada en oscuro y sistema en claro**: manda la preferencia guardada; el sitio abre en oscuro.
- **El sistema cambia con la página abierta y el visitante aún no ha elegido**: el sitio sigue el nuevo tema del sistema, sin recargar y sin destello perceptible.
- **El sistema cambia después de una elección manual guardada**: el sitio mantiene el tema elegido y guardado.
- **El sistema cambia después de una elección hecha en la sesión que no se pudo guardar**: el sitio mantiene la elección de la sesión y deja de seguir al sistema; no vuelve al tema del sistema hasta una nueva carga.
- **Preferencia inválida o desconocida** (valor manipulado o de una versión futura): se ignora y se resuelve como si no existiera (preferencia del sistema y, en su defecto, oscuro); el conmutador queda operativo y no aparecen errores en consola.
- **Almacenamiento bloqueado o no disponible** (navegación privada, permisos restringidos): el tema inicial se resuelve con la preferencia del sistema y, si no se puede, en oscuro; el conmutador sigue funcionando durante la sesión, muestra el estado correcto y no se muestra ningún error.
- **Fallo al guardar la elección** (almacenamiento lleno o bloqueado en ese momento): el tema elegido se aplica en la sesión, el conmutador muestra y anuncia el estado correcto, sigue operativo, no aparece ningún error visible y el sitio deja de seguir los cambios del sistema en esa sesión; la siguiente carga vuelve a resolverse como si no hubiera elección guardada.
- **Cambios repetidos y rápidos** del conmutador: el último estado elegido es el que se aplica y se guarda, sin estados intermedios inconsistentes ni parpadeos; el tirador termina en el extremo que corresponde al tema aplicado.
- **Carga con preferencia guardada o del sistema y conexión lenta**: no se observa un destello del tema contrario antes de pintar; el fondo y el texto ya son los correctos en el primer pintado y, en el primer render del conmutador, el icono y el estado coinciden con ese tema.
- **Conmutador sin texto visible**: conserva siempre el nombre accesible «Modo oscuro» y su estado activado/desactivado; el estado se distingue por la posición del tirador y por la forma del icono sol/luna.
- **Pantalla de 320 px de ancho**: la marca y el conmutador permanecen visibles y operables, sin scroll horizontal; si la marca es larga, puede truncarse o reducirse, pero nunca se oculta el conmutador.
- **Zoom de texto al 200 %**: la barra sigue siendo legible, el conmutador no queda cortado y sigue midiendo al menos 24×24 px.
- **Uso exclusivo de teclado**: el foco entra en la marca y en el conmutador en un orden lógico, es visible, no queda atrapado y ambos se activan con Enter y Espacio.
- **Scroll con la barra fija**: el contenido nunca queda oculto bajo la barra ni se produce desplazamiento de layout al cargar o al desplazarse; el borde inferior de la barra se mantiene presente como separación decorativa, sin exigencia de contraste.
- **Movimiento reducido**: con la preferencia de reducir animaciones activa, el cambio de tema es instantáneo (sin transición).
- **Contenido de la página actual (título y bloque existente)**: pasa a usar la paleta del tema activo; no quedan colores fijos del tema anterior.
- **Navegador con dos pestañas abiertas**: no se exige coherencia entre pestañas (ver fuera de alcance).

## Fuera de alcance

- Crear secciones, rutas o páginas nuevas (portafolio, servicios, contacto).
- Añadir enlaces de navegación adicionales, una llamada a la acción de contacto o un menú hamburguesa: queda para una spec posterior. En esta spec la barra solo muestra la marca y el conmutador.
- Reservar o prever espacio estructural para enlaces futuros más allá de lo que exige la maquetación actual.
- Ofrecer un control para restablecer la preferencia manual y volver a seguir el tema del sistema.
- Que el tema del sistema prevalezca sobre una elección explícita ya guardada o hecha en la sesión.
- Coherencia del tema entre pestañas o ventanas abiertas a la vez: cada carga resuelve su propio tema; no se exige sincronización en vivo entre ellas.
- Temas adicionales (alto contraste, sepia), personalización de colores por el visitante o sincronización entre dispositivos.
- Rediseño visual completo de la página, tipografías o animaciones decorativas.
- Cambios en el contenido textual del portafolio.
- Cualquier forma de analítica o seguimiento del visitante.
- **Sin JavaScript**: el sitio no se considera navegable en ese escenario. Expectativa mínima no exigible más allá de esto: la página no se rompe ni pierde su maquetación, el texto sigue siendo legible y el conmutador puede mostrarse no operable. No hay requisito de que el tema inicial coincida con el del sistema.

## Criterios de finalización

1. La barra superior contiene únicamente la marca (enlace al inicio, sin recarga ni salto si ya se está arriba) y el conmutador, sin enlaces de navegación adicionales, CTA ni menú; se ve correctamente en escritorio y a 320 px y 375 px de ancho, sin scroll horizontal.
2. Al hacer scroll, la barra permanece fija arriba con la superficie del tema activo y su borde inferior presente como separación decorativa, sin ocultar contenido ni desplazar el layout; el CLS medido es 0 durante carga, scroll y cambio de tema.
3. Activar el conmutador aplica el tema opuesto en el siguiente frame (transición ≤200 ms), sin recargar ni perder la posición de lectura, y actualiza fondo de página, textos, superficie y borde inferior de la barra, y la pista, el tirador y el icono del conmutador.
4. Los pares obligatorios de la tabla de RNF-1 se cumplen en ambos temas, incluidos pista/fondo, tirador/pista e icono/tirador; los colores declarados decorativos (`#B88E3B`, `#7A4578`, `#9E772E`, bordes `#2B2533` / `#E6E1E8`) no se usan para texto, iconos funcionales, pistas de control ni foco; el fondo principal se usa como relleno del tirador y el color de interacción como tinta del icono solo dentro de esos pares medidos.
5. En una primera visita sin preferencia guardada, el sitio abre con el tema del sistema (claro u oscuro); si el sistema no lo determina, abre en oscuro.
6. Tras cambiar de tema y recargar, el sitio abre con el tema elegido aunque el sistema indique lo contrario; tras borrar la preferencia guardada, vuelve a resolverse con el tema del sistema y, en su defecto, en oscuro.
7. Con la página abierta y sin elección manual, un cambio de tema del sistema se refleja en el sitio; después de una elección manual —guardada o hecha en la sesión, aunque no se haya podido guardar— el sitio ya no cambia con el sistema durante esa sesión.
8. Si guardar la elección falla, el tema se aplica en la sesión, el conmutador refleja y anuncia el estado correcto, sigue operativo y no aparece ningún error visible.
9. Si la preferencia guardada es inválida o desconocida, el tema se resuelve por la preferencia del sistema y, en su defecto, en oscuro; el conmutador queda operativo y la consola no muestra errores.
10. Si el almacenamiento está bloqueado o no disponible, el tema se resuelve por la preferencia del sistema y, en su defecto, en oscuro; el conmutador queda operativo durante la sesión y la consola no muestra errores.
11. La comprobación de destello se hace con recargas repetidas (al menos 5) en dos escenarios —preferencia guardada y preferencia del sistema— con la red limitada: en el primer pintado el fondo y el texto ya son del tema correcto, y en el primer render del conmutador el icono y el estado ya coinciden con él; no hay destello ni mensaje en consola.
12. El conmutador es un `switch` con `aria-checked` coherente, nombre accesible estable «Modo oscuro», modelo píldora con pista y tirador, icono sol/luna dentro del tirador distinguible por forma y posición coherente con el tema; es operable con Tab, Espacio y Enter, con anillo de foco de al menos 2 px, separación de al menos 2 px y 3:1 de contraste (sin depender del color), y objetivo táctil de al menos 24×24 px.
13. El elemento raíz del documento declara `lang="es"` (hoy declara `en`) y todos los textos y etiquetas accesibles están en español.
14. Con la preferencia de movimiento reducido activa, el cambio de tema se aplica sin transición.
15. La consola no muestra errores ni advertencias nuevos; no se ha añadido ninguna dependencia y la resolución, aplicación y guardado del tema no hacen peticiones de red.
16. Lo único guardado en el navegador es el tema elegido.

## Dudas abiertas

Sin dudas pendientes.
