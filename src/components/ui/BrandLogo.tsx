type BrandLogoProps = {
  readonly className?: string
}

/**
 * Marca provisional: monograma «H» en un cuadrado redondeado. No es el logo
 * definitivo; sustituirlo es cambiar solo este dibujo. El tamaño y el color
 * vienen de fuera con `className` (`size-*` y un token de texto).
 */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" />
      <path d="M17 15v18M31 15v18M17 24h14" />
    </svg>
  )
}
