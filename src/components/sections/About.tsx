import { NAV_SECTIONS } from '../../data/navigation.ts'
import { ABOUT } from '../../data/site.ts'
import { Section } from '../ui/Section.tsx'

const SECTION = NAV_SECTIONS.find((navSection) => navSection.id === 'sobre-mi')!

export function About() {
  return (
    <Section id={SECTION.id} title={SECTION.label}>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink-muted">{ABOUT.bio}</p>
      <p className="mt-4 border-l-2 border-line pl-3 text-sm text-ink-muted">
        {ABOUT.provisionalNote}
      </p>
    </Section>
  )
}
