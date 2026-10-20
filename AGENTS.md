# AGENTS.md — Héctor Gutiérrez Web
Web personal que sirve como un portafolio personal para mostrar los proyectos en los que he trabajado (y participado si es un proyecto en conjunto con un equipo), así como los servicios que puedo ofrecer. El objetivo es que sirva como un medio para darme a conocer y dar servicios profesionales como freelancer.

## Stack y estructura
- React (Vite), TypeScript y TailwindCSS.
- El proyecto está dividido en páginas y componentes.
## Comandos
- `npm run dev` inicia el servidor de desarrollo.
- `npm run build` compila el proyecto.
- `node --test` para testing
## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño elegante y responsivo; cualquier pantalla nueva debe verse bien en el móvil.
- Prioriza la experiencia de usuario (UX) y la accesibilidad (A11y).
- Optimiza el rendimiento y el SEO.
- Implementa buenas prácticas de desarrollo y patrones de diseño.
## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).
## Límites
- ✅ Siempre: mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome DevTools: accede a la vista de la app, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
## Estructura
- `src/pages/` contiene los componentes por página.
- `src/components/` contiene componentes reutilizables.
- `src/components/layout/` contiene el layout principal y componentes asociados.
- `src/assets/` contiene recursos estáticos.
## Paleta de colores
### Modo oscuro (predeterminado)
- Fondo principal: `#0E0C10` (negro carbón con matiz sutil)
- Fondo secundario / Cards: `#17141B`
- Bordes / Separadores: `#2B2533`
- Primario (Morado): `#7A4578` (adaptado para legibilidad en oscuro) / `#5E335C` base
- Detalle / Acento (Dorado): `#E5C378`
- Acento Hover: `#F2D899`
- Texto principal: `#F4F2F5`
- Texto secundario / Muted: `#A8A1B0`
### Modo claro
- Fondo principal: `#FAF9FA` (blanco roto)
- Fondo secundario / Cards: `#FFFFFF`
- Bordes / Separadores: `#E6E1E8`
- Primario (Morado): `#5E335C`
- Primario Hover: `#472645`
- Detalle / Acento (Dorado): `#B88E3B`
- Acento Hover: `#9E772E`
- Texto principal: `#1E1822`
- Texto secundario / Muted: `#655D6C`