import { useHeroParallax } from '../../hooks/useHeroParallax.ts'
import { BrandLogo } from '../ui/BrandLogo.tsx'
import { HeroBackground } from './HeroBackground.tsx'

export function Hero() {
  const { sectionRef, contentRef } = useHeroParallax()

  return (
    <section
      id="inicio"
      ref={sectionRef}
      data-brand="hero"
      className="hero__section relative isolate flex items-center justify-center overflow-hidden"
    >
      <HeroBackground />
      <div
        ref={contentRef}
        data-brand="hero-content"
        className="hero__content relative z-10 mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6"
      >
        {/* 4,5 rem de marca y 1 rem de separación con el nombre. */}
        <div className="hero__logo mx-auto mb-4 w-fit" data-brand="logo">
          <BrandLogo className="size-[4.5rem] text-action" />
        </div>
        <h1
          tabIndex={-1}
          className="hero__text text-[2.5rem] leading-tight font-bold break-words hyphens-auto text-ink sm:text-[4rem]"
        >
          {/* `inline-block`: la caja medida es la del texto (no la del `h1`) y
              su alto es exactamente el de la línea, que es lo que replica la
              copia del vuelo. */}
          <span className="hero__name-text inline-block" data-brand="name">
            Héctor Gutiérrez
          </span>
        </h1>
        <p
          className="hero__text mt-4 text-base text-ink-muted sm:text-xl"
          data-brand="role"
        >
          Ingeniero de Software
        </p>
      </div>
    </section>
  )
}
