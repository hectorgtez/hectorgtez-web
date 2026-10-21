# MEMORY.md — Héctor Gutiérrez Web
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- Spec 001 (navbar + tema claro/oscuro) implementada y verificada (T1–T9); 31 tests en verde.
- App: navbar sticky con marca «Héctor Gutiérrez» (`text-lg font-bold`), switch píldora 72×44, tema persistente y sin FOUC.
- Título principal `<h1>` con escala `text-4xl` → `sm:text-5xl` → `md:text-6xl` y negrita (700).

## Decisiones (y por qué)
- Tema como `data-theme="light|dark"` en `<html>` + variables CSS mapeadas con `@theme inline`: una sola fuente de color, sin pares `dark:` dispersos; `inline` evita congelar valores.
- Paleta solo en `src/index.css` (page, surface, line, ink, ink-muted, action, action-hover); los componentes usan tokens, nunca hex.
- Script síncrono inline en `<head>` aplica el tema antes del primer pintado; React lee `dataset.theme` (`readAppliedTheme`) y no recalcula.
- Prioridad: guardada > sistema > oscuro (`resolveTheme`); solo se guarda una elección manual en `hectorgtez-theme` con valor plano `light|dark`.
- Toggle: `applyTheme` antes de `setState` (sin frame con tema viejo); un fallo de `localStorage` no rompe la sesión (el resultado de escritura se ignora).
- Listener del sistema solo sin elección manual; la limpieza del efecto evita duplicados con StrictMode.
- Switch: `role="switch"` + `aria-checked`, nombre constante «Modo oscuro», icono sol/luna, foco de 2 px con 2 px de separación.
- Tests de lógica pura con `node --test` y type stripping (imports con `.ts`); `tsconfig.app.json` incluye types `node` para tipar los tests.

## Aprendizajes y errores a evitar
- Validar el FOUC con `npm run build && npm run preview`: en dev Vite inyecta el CSS por JS y puede verse HTML sin estilos.
- `@theme` sin `inline` congela los colores y rompe el cambio de tema.
- No usar hex ni `bg-white dark:bg-*` en componentes; medir contraste sobre colores computados reales.
- Medir contraste/transición tras ≥200 ms: a mitad de transición los colores son intermedios.
- Una CSP `script-src 'self'` bloquearía el script inline; si se añade CSP, moverlo a un `/theme-init.js` clásico.
- Tailwind v4 aplica `translate-x-*` con la propiedad `translate`, no `transform`; medir el offset con `getBoundingClientRect`.
- A 320 px con zoom proxy 200 %, el `<h1>` existente desborda 3 px; la navbar no se corta.
- No repetir `bg-page` en contenedores interiores (`<main>`, wrappers): si no comparten la transición de `<html>`, el centro cambia a 0 ms y las orillas a 200 ms. Dejar el fondo solo en `<html>`.

## Próximos pasos
- (vacío; futuras specs: contenido y secciones del portafolio)
