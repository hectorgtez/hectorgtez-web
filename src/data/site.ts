import { SITE_AUTHOR, SITE_ROLE } from '../lib/navigation.ts'

/**
 * Contenido del sitio en un único punto, separado de la presentación.
 *
 * PROVISIONAL: los bloques marcados como provisionales son texto de ejemplo y
 * deben sustituirse por el contenido real. Cambiarlos —incluido el número de
 * tarjetas— no exige tocar componentes ni navegación. No añadir clientes,
 * resultados, métricas, fechas ni importes.
 *
 * Los datos de contacto viven solo aquí; no repetirlos en otros archivos.
 */

export type Card = {
  readonly title: string
  readonly description: string
}

export type ContactIconName = 'email' | 'linkedin' | 'github' | 'whatsapp'

export type ContactLink = {
  readonly label: string
  readonly href: string
  /** Icono que acompaña al medio de contacto. */
  readonly icon: ContactIconName
  /** Abre en una pestaña nueva (solo los enlaces externos). */
  readonly external: boolean
  /** Dato visible junto al enlace; hoy, el teléfono de WhatsApp. */
  readonly detail?: string
}

export type SiteIdentity = {
  readonly author: string
  readonly role: string
}

export type AboutContent = {
  readonly bio: string
  readonly provisionalNote: string
}

export type ContactContent = {
  readonly intro: string
  readonly email: string
  readonly phone: string
  readonly links: readonly ContactLink[]
}

export type FooterContent = {
  readonly author: string
  readonly links: readonly ContactLink[]
}

/** Nombre y puesto salen de `src/lib/navigation.ts` para no duplicarlos. */
export const SITE_IDENTITY: SiteIdentity = {
  author: SITE_AUTHOR,
  role: SITE_ROLE,
}

// PROVISIONAL: biografía de ejemplo. Sin años de experiencia, clientes ni métricas.
export const ABOUT: AboutContent = {
  bio: 'Construyo interfaces web claras y accesibles, cuidando los detalles que hacen que una página resulte fácil de usar. Trabajo con React, TypeScript y Tailwind CSS, y me interesa especialmente la relación entre diseño, rendimiento y accesibilidad. Disfruto convirtiendo ideas sencillas en herramientas digitales que funcionan bien y son fáciles de mantener.',
  provisionalNote: 'Texto provisional pendiente de sustituir',
}

// PROVISIONAL: proyectos de ejemplo. Sin clientes, resultados, fechas ni importes.
export const PROJECTS: readonly Card[] = [
  {
    title: 'Sitio de reservas',
    description:
      'Aplicación web para consultar disponibilidad y reservar en línea, con un flujo de pasos claros y confirmación inmediata.',
  },
  {
    title: 'Panel de inventario',
    description:
      'Interfaz para consultar existencias, registrar entradas y salidas y revisar el estado del almacén desde un solo lugar.',
  },
  {
    title: 'API de integración',
    description:
      'Servicio que conecta sistemas internos mediante una interfaz documentada y mantiene los datos sincronizados entre ellos.',
  },
]

// PROVISIONAL: servicios de ejemplo. Sin precios ni plazos.
export const SERVICES: readonly Card[] = [
  {
    title: 'Desarrollo web',
    description:
      'Sitios y aplicaciones con React, TypeScript y Tailwind CSS, atendiendo al rendimiento, la accesibilidad y el mantenimiento.',
  },
  {
    title: 'Interfaz y experiencia',
    description:
      'Diseño y ajuste de pantallas responsivas, con jerarquía clara, navegación comprensible y buen comportamiento en móvil.',
  },
  {
    title: 'Mantenimiento y optimización',
    description:
      'Revisión de proyectos existentes para corregir errores, mejorar la carga y actualizar el código sin cambiar su comportamiento.',
  },
]

const CONTACT_EMAIL = 'hectorgtezta@gmail.com'
const CONTACT_PHONE = '(667) 231 9477'

const EMAIL_LINK: ContactLink = {
  label: 'Correo',
  href: `mailto:${CONTACT_EMAIL}`,
  icon: 'email',
  external: false,
}

const LINKEDIN_LINK: ContactLink = {
  label: 'LinkedIn',
  href: 'https://linkedin.com/in/hectorgtez/',
  icon: 'linkedin',
  external: true,
}

const GITHUB_LINK: ContactLink = {
  label: 'GitHub',
  href: 'https://github.com/hectorgtez',
  icon: 'github',
  external: true,
}

const WHATSAPP_LINK: ContactLink = {
  label: 'WhatsApp',
  href: 'https://wa.me/526672319477',
  icon: 'whatsapp',
  external: true,
  detail: CONTACT_PHONE,
}

// PROVISIONAL: texto de contacto de ejemplo. Orden: WhatsApp, correo, LinkedIn y GitHub.
export const CONTACT: ContactContent = {
  intro:
    '¿Tienes un proyecto entre manos o quieres comentar una idea? Escríbeme por correo o encuéntrame en LinkedIn, GitHub o WhatsApp.',
  email: CONTACT_EMAIL,
  phone: CONTACT_PHONE,
  links: [WHATSAPP_LINK, EMAIL_LINK, LINKEDIN_LINK, GITHUB_LINK],
}

/** El pie lleva correo, LinkedIn y GitHub; WhatsApp solo aparece en Contacto. */
export const FOOTER: FooterContent = {
  author: SITE_IDENTITY.author,
  links: [EMAIL_LINK, LINKEDIN_LINK, GITHUB_LINK],
}
