import type { ReactNode } from 'react'
import type { SectionId } from '../../data/navigation.ts'

type SectionProps = {
  readonly id: SectionId
  readonly title: string
  readonly children: ReactNode
  readonly className?: string
}

// El ritmo vertical va en el margen de la sección y en el relleno inferior,
// nunca en un relleno superior: al anclar, el navegador alinea el borde de la
// sección con `scroll-padding-top` y el `h2` debe quedar a O, no más abajo.
const SECTION_CLASS = 'mt-16 sm:mt-24'
const CONTAINER_CLASS = 'mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24'
const TITLE_CLASS = 'text-2xl font-bold break-words text-ink focus:outline-none sm:text-3xl'

export function Section({ id, title, children, className }: SectionProps) {
  const headingId = `${id}-title`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={className ? `${SECTION_CLASS} ${className}` : SECTION_CLASS}
    >
      <div className={CONTAINER_CLASS}>
        <h2 id={headingId} tabIndex={-1} className={TITLE_CLASS}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}
