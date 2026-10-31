import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { computeHeroOffsets } from '../lib/heroParallax.ts'

export type UseHeroParallaxResult = {
  sectionRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLDivElement | null>
}

export function useHeroParallax(): UseHeroParallaxResult {
  const sectionRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const content = contentRef.current

    if (!section || !content) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionQuery.matches
    let active = false
    let frame = 0
    let heroTop = 0
    let height = 0
    let textBlockHeight = 0

    const measure = () => {
      const rect = section.getBoundingClientRect()
      height = rect.height
      heroTop = rect.top + window.scrollY
      textBlockHeight = content.offsetHeight
    }

    const write = (background: number, text: number) => {
      section.style.setProperty('--hero-bg-shift', `${background}px`)
      section.style.setProperty('--hero-text-shift', `${text}px`)
    }

    const update = () => {
      const offsets = computeHeroOffsets(
        {
          scrollY: window.scrollY,
          heroTop,
          H: height,
          textBlockHeight,
        },
        reducedMotion,
      )

      write(offsets.background, offsets.text)
    }

    const tick = () => {
      frame = 0
      update()
    }

    const schedule = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(tick)
    }

    // Los cambios de H se aplican en el mismo rendering update: se mide y se
    // escribe antes del pintado, sin esperar al siguiente frame.
    const sync = () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }

      measure()
      update()
    }

    const observer = new ResizeObserver(sync)

    const startListening = () => {
      if (active) return
      active = true
      observer.observe(section)
      observer.observe(content)
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', sync)
    }

    const stopListening = () => {
      if (!active) return
      active = false
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', sync)
      observer.disconnect()
    }

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches

      if (reducedMotion) {
        if (frame !== 0) {
          cancelAnimationFrame(frame)
          frame = 0
        }

        stopListening()
        write(0, 0)
        return
      }

      measure()
      startListening()
      update()
    }

    // Primera medición y escritura antes del primer pintado (RF-14).
    if (reducedMotion) {
      write(0, 0)
    } else {
      measure()
      update()
      startListening()
    }

    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame)
        frame = 0
      }

      stopListening()
      motionQuery.removeEventListener('change', handleMotionChange)

      section.style.removeProperty('--hero-bg-shift')
      section.style.removeProperty('--hero-text-shift')
    }
  }, [])

  return { sectionRef, contentRef }
}
