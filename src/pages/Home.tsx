import { About } from '../components/sections/About.tsx'
import { Contact } from '../components/sections/Contact.tsx'
import { Projects } from '../components/sections/Projects.tsx'
import { Services } from '../components/sections/Services.tsx'
import { Hero } from '../components/hero/Hero.tsx'

export function Home() {
  return (
    <>
      <Hero />
      <About />
      <Projects />
      <Services />
      <Contact />
    </>
  )
}
