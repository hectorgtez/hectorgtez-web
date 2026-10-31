import { HERO_ID } from '../../data/navigation.ts'
import { focusDestination, isPlainClick } from '../../lib/focusHeading.ts'
import { BrandLogo } from '../ui/BrandLogo.tsx'
import { NavMenu } from './NavMenu.tsx'
import { ThemeSwitch } from './ThemeSwitch.tsx'

type NavbarProps = {
  isDark: boolean
  onToggleTheme: () => void
  activeId?: string | null
}

// El enlace ya no trunca: es el contenedor flex. El truncado vive en el
// `span` del texto para que la marca nunca se comprima.
const BRAND_CLASS =
  'focus-ring flex min-w-0 items-center text-lg font-bold text-ink underline-offset-4 visited:text-ink hover:underline focus-visible:underline'

export function Navbar({ isDark, onToggleTheme, activeId = null }: NavbarProps) {
  return (
    <header
      data-brand="bar"
      className="sticky top-0 z-50 bg-surface shadow-[inset_0_-1px_0_var(--color-line)] transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none"
    >
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <a
          href={`#${HERO_ID}`}
          onClick={(event) => {
            if (isPlainClick(event)) focusDestination(HERO_ID)
          }}
          data-brand="brand-link"
          className={BRAND_CLASS}
        >
          {/* Solo el contenido lleva la opacidad del vuelo: el anillo de foco
              del enlace sigue visible cuando la marca está oculta. */}
          <span className="brand__inner flex min-w-0 items-center gap-2">
            <span className="shrink-0" data-brand="brand-logo">
              <BrandLogo className="size-8 text-action" />
            </span>
            <span className="min-w-0 truncate" data-brand="brand-name">
              Héctor Gutiérrez
            </span>
          </span>
        </a>
        {/* Separación fija en píxeles: con el texto al 200 % la fila de
            controles no debe crecer hasta desbordar el ancho de la ventana. */}
        {/* `ml-auto` mantiene los controles a la derecha también cuando la fila
            salta a una segunda línea; a ≤374 px la separación baja a 4 px para
            que menú (44) + conmutador compacto (44) quepan junto a la copia. */}
        <div className="ml-auto flex min-w-0 items-center gap-[8px] max-[374px]:gap-[4px] sm:gap-[12px]">
          <NavMenu activeId={activeId} />
          <div className="shrink-0">
            <ThemeSwitch isDark={isDark} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </header>
  )
}
