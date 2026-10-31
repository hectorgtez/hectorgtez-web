import { NAV_SECTIONS } from '../../data/navigation.ts'
import { PROJECTS } from '../../data/site.ts'
import { ProjectCard } from '../ui/ProjectCard.tsx'
import { Section } from '../ui/Section.tsx'

const SECTION = NAV_SECTIONS.find((navSection) => navSection.id === 'proyectos')!

const GRID_CLASS = 'mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3'

export function Projects() {
  return (
    <Section id={SECTION.id} title={SECTION.label}>
      <ul className={GRID_CLASS}>
        {PROJECTS.map((project) => (
          <li key={project.title} className="min-w-0">
            <ProjectCard title={project.title} description={project.description} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
