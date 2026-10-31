import { SITE_AUTHOR, SITE_ROLE } from '../../lib/navigation.ts'
import { BrandLogo } from '../ui/BrandLogo.tsx'

/**
 * Capa decorativa del vuelo: copias del nombre y de la marca, fuera del flujo
 * y sin puntero. El hook escribe su opacidad y sus transformaciones; no es
 * contenido, no se anuncia y no añade paradas de tabulación.
 */
export function BrandFlight() {
  return (
    <div className="brand-flight" data-brand="layer" aria-hidden="true">
      <span className="brand-flight__logo" data-brand="copy-logo">
        <BrandLogo className="size-[4.5rem] text-action" />
      </span>
      <span
        className="brand-flight__name block text-[2.5rem] leading-tight font-bold break-words hyphens-auto text-center sm:text-[4rem]"
        data-brand="copy-name"
        lang="es"
      >
        {SITE_AUTHOR}
      </span>
      <span
        className="brand-flight__role block text-base leading-normal text-center text-ink-muted sm:text-xl"
        data-brand="copy-role"
        lang="es"
      >
        {SITE_ROLE}
      </span>
    </div>
  )
}
