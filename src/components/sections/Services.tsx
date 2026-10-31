import { NAV_SECTIONS } from '../../data/navigation.ts'
import { SERVICES } from '../../data/site.ts'
import { Section } from '../ui/Section.tsx'
import { ServiceCard } from '../ui/ServiceCard.tsx'

const SECTION = NAV_SECTIONS.find((navSection) => navSection.id === 'servicios')!

const GRID_CLASS = 'mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3'

export function Services() {
  return (
    <Section id={SECTION.id} title={SECTION.label}>
      <ul className={GRID_CLASS}>
        {SERVICES.map((service) => (
          <li key={service.title} className="min-w-0">
            <ServiceCard title={service.title} description={service.description} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
