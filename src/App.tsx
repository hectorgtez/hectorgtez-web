import { BrandFlight } from './components/brand/BrandFlight.tsx'
import { Footer } from './components/layout/Footer.tsx'
import { Navbar } from './components/layout/Navbar.tsx'
import { SkipLink } from './components/layout/SkipLink.tsx'
import { useTheme } from './hooks/useTheme.ts'
import { useActiveSection } from './hooks/useActiveSection.ts'
import { useBrandFlight } from './hooks/useBrandFlight.ts'
import { MAIN_ID } from './data/navigation.ts'
import { Home } from './pages/Home.tsx'

export default function App() {
  const { isDark, toggleTheme } = useTheme()
  const activeId = useActiveSection()
  useBrandFlight()

  return (
    <>
      <SkipLink />
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} activeId={activeId} />
      <BrandFlight />
      <main id={MAIN_ID} tabIndex={-1} className="focus:outline-none">
        <Home />
      </main>
      <Footer />
    </>
  )
}
