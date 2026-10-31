import { NAV_SECTIONS } from '../../data/navigation.ts'
import { CONTACT } from '../../data/site.ts'
import type { ContactLink } from '../../data/site.ts'
import { ContactIcon } from '../ui/ContactIcon.tsx'
import { Section } from '../ui/Section.tsx'

const SECTION = NAV_SECTIONS.find((navSection) => navSection.id === 'contacto')!

const LINK_CLASS =
  'group mt-1 inline-flex max-w-full items-start gap-3 text-ink hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-page'
const LABEL_CLASS = 'font-medium underline decoration-2 underline-offset-4'

function isEmailLink(link: ContactLink): boolean {
  return link.href.startsWith('mailto:')
}

export function Contact() {
  return (
    <Section id={SECTION.id} title={SECTION.label}>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink-muted">{CONTACT.intro}</p>
      <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {CONTACT.links.map((link) => (
          <li key={link.label} className="min-w-0">
            <a
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={LINK_CLASS}
            >
              <ContactIcon
                name={link.icon}
                className="mt-0.5 size-5 shrink-0 text-action transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
              />
              <span className="min-w-0">
                <span className={LABEL_CLASS}>{link.label}</span>
                {isEmailLink(link) && (
                  <span className="mt-1 block text-sm break-words text-ink-muted">
                    {CONTACT.email}
                  </span>
                )}
                {link.external && (
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                )}
              </span>
            </a>
            {link.detail !== undefined && (
              <span className="mt-1 block pl-8 text-sm text-ink-muted">{link.detail}</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
