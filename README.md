# Héctor Gutiérrez Web

Portafolio personal de Héctor Gutiérrez: muestra los proyectos en los que he trabajado (y mi parte en cada uno cuando fue un proyecto de equipo) y los servicios que ofrezco como freelancer.

Es una aplicación de una sola página (SPA) con React, TypeScript y TailwindCSS, construida con Vite. No tiene backend ni base de datos: el contenido del sitio vive en `src/data/`.

## Stack

- React 19 + TypeScript
- Vite (servidor de desarrollo y build)
- TailwindCSS 4
- ESLint y `node --test` para la comprobación del código y la lógica

## Requisitos

- Node.js (versión LTS reciente) y npm.
- Google Chrome, si quieres usar el MCP de Chrome DevTools para verificar la interfaz.

## Puesta en marcha

```bash
npm install
npm run dev
```

El servidor de desarrollo arranca en `http://localhost:5173`.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Comprueba los tipos con `tsc -b` y compila el proyecto en `dist/`. |
| `npm run preview` | Sirve el build de `dist/` para probarlo como en producción. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `node --test` | Ejecuta los tests de la lógica (`src/lib/*.test.ts`). |

## Configuración de los MCP (Claude Code)

El proyecto usa dos servidores MCP, definidos en `.mcp.json`:

- **chrome-devtools**: permite a Claude abrir la web, revisar la consola y comprobar la vista móvil. Lo usamos para verificar cada cambio en la interfaz.
- **context7**: consulta la documentación actualizada de librerías.

El archivo `.mcp.json` **no está en el repositorio** porque contiene la configuración local de cada persona. Hay una plantilla versionada, `.mcp.json.template`, que hay que copiar:

1. Haz una copia de `.mcp.json.template` y renómbrala a `.mcp.json` en la raíz del proyecto.
2. Pon tu clave de Context7 en la variable de entorno `CONTEXT7_API_KEY`. El archivo `.mcp.json` la lee de ahí, así que **no escribas la clave en ningún archivo del proyecto**.
   - Windows (PowerShell, permanente): `[Environment]::SetEnvironmentVariable('CONTEXT7_API_KEY', 'tu-clave', 'User')`
   - macOS / Linux: `export CONTEXT7_API_KEY='tu-clave'` en tu perfil de shell (`~/.bashrc`, `~/.zshrc`).
3. Reinicia Claude Code para que cargue la variable y los servidores.

`.mcp.json` está en `.gitignore`, así que tu configuración local no se sube al repositorio. La clave nunca debe aparecer en `.mcp.json.template` ni en ningún archivo versionado.

## Flujo de trabajo con Spec-Driven Development (SDD)

Las funcionalidades nuevas se trabajan con SDD: primero la especificación, luego el plan, las tareas y, por último, el código. Cada spec vive en su carpeta `specs/NNN-nombre/` con `spec.md`, `plan.md` y `tasks.md`.

Para llevar una funcionalidad completa, usa el comando **`/sdd`** de Claude Code. Actúa como agente coordinador: no escribe código, sino que reparte el trabajo entre los subagentes `planner` (spec, plan y tareas), `reviewer` (revisión y validación) e `implementer` (una tarea cada vez, con tests primero).

```text
/sdd añade una sección de testimonios en la home
```

El coordinador sigue estas fases y **se detiene a pedirte aprobación** antes de cada una de las que lo requieren:

1. **Spec**: `planner` redacta `spec.md` y te hace las preguntas necesarias, una a una.
2. **Clarificación**: `reviewer` revisa la spec como QA. Esperas a tu aprobación.
3. **Plan y tareas**: `planner` escribe `plan.md` y `tasks.md`. Esperas a tu aprobación.
4. **Implementación**: `implementer` ejecuta una tarea a la vez; tras cada una se comprueba que `node --test` está en verde.
5. **Validación**: `reviewer` valida la spec requisito por requisito.
6. **Cierre**: resumen de lo hecho y de lo pendiente.

Para un cambio sobre una spec existente, `/sdd` actualiza primero la spec y, con tu aprobación, el plan y las tareas, y después el código.

Para cambios pequeños que no merecen una spec, usa `/feature`, que prepara un plan antes de tocar código. También existen comandos sueltos por fase (`/sdd-spec`, `/sdd-plan`, `/sdd-tasks`, `/sdd-implement`, `/sdd-validate`, `/sdd-status`), pero para una funcionalidad completa basta con `/sdd`.

## Estructura del proyecto

```text
src/
├── pages/          Componentes por página
├── components/     Componentes reutilizables
│   └── layout/     Layout principal (barra de navegación, pie)
├── data/           Contenido y datos del sitio (site.ts, navigation.ts)
├── hooks/          Hooks de React
└── lib/            Lógica pura y sus tests (node --test)
specs/              Especificaciones SDD (una carpeta por funcionalidad)
docs/               Constitución del proyecto
.claude/            Agentes, comandos y skills de Claude Code (versionados)
```

## Documentación interna

- `AGENTS.md`: reglas del proyecto (convenciones, paleta de colores, forma de trabajar y verificación).
- `MEMORY.md`: estado actual, decisiones tomadas y errores a evitar. Se actualiza al terminar cada tarea.
- `docs/constitution.md`: principios innegociables del proyecto.
- `specs/`: especificaciones de cada funcionalidad.

## Convenciones

- Textos de la interfaz en español; nombres de código en inglés claro.
- Diseño responsivo: cualquier pantalla nueva debe verse bien en móvil.
- Prioridad a la accesibilidad (A11y), el SEO y el rendimiento.
- Sin dependencias ni pasos de build nuevos sin una decisión explícita.
- Verificación: después de cada cambio en la interfaz, revisar la consola y la vista móvil con Chrome DevTools.
