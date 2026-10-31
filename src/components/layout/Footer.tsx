import { ContactIcon } from '../ui/ContactIcon.tsx'
import { FOOTER } from '../../data/site.ts'
import { getFooterYear } from '../../lib/navigation.ts'

const FOOTER_YEAR = getFooterYear(new Date())

const LINK_CLASS =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-muted transition duration-200 hover:-translate-y-0.5 hover:border-action hover:bg-surface hover:text-action hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-page motion-reduce:transform-none motion-reduce:transition-none'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-ink-muted">
          © {FOOTER_YEAR} {FOOTER.author}
        </p>
        <ul className="flex flex-wrap items-center gap-2">
          {FOOTER.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={`${link.label}${link.external ? ' (se abre en una pestaña nueva)' : ''}`}
                title={link.label}
                className={LINK_CLASS}
              >
                <ContactIcon name={link.icon} className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
