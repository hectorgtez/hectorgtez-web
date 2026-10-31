export type SectionId = 'sobre-mi' | 'proyectos' | 'servicios' | 'contacto'

export type NavSection = {
  readonly id: SectionId
  readonly label: string
}

/** Identificador del bloque del hero: destino de la marca y tope del documento. */
export const HERO_ID = 'inicio'
/** Identificador de la región principal: destino de «Saltar al contenido». */
export const MAIN_ID = 'contenido'

/**
 * Fuente de verdad de las secciones: identificadores en el orden del documento
 * y etiquetas idénticas al texto de sus encabezados de nivel 2.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'contacto', label: 'Contacto' },
]
