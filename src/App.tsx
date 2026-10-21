import { Navbar } from './components/layout/Navbar.tsx'
import { useTheme } from './hooks/useTheme.ts'

export default function App() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <>
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center px-4 text-ink">
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">hectorgtez-web</h1>
      </main>
    </>
  )
}
