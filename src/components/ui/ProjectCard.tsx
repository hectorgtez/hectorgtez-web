import type { Card } from '../../data/site.ts'

const CARD_CLASS =
  'flex h-full flex-col rounded-2xl border border-line bg-surface p-5 sm:p-6'
const TITLE_CLASS = 'text-lg font-semibold break-words text-ink'
const DESCRIPTION_CLASS = 'mt-2 text-sm leading-relaxed break-words text-ink-muted'
const BADGE_CLASS =
  'inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-action'

export function ProjectCard({ title, description }: Card) {
  return (
    <article className={CARD_CLASS}>
      <h3 className={TITLE_CLASS}>{title}</h3>
      <p className={DESCRIPTION_CLASS}>{description}</p>
      <div className="mt-auto pt-4">
        <span className={BADGE_CLASS}>Ejemplo</span>
      </div>
    </article>
  )
}
