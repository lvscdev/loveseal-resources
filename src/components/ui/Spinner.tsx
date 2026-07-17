'use client'

/**
 * Brand spinner — a circular conic-gradient ring that rotates indefinitely.
 *
 * Three sizes:
 *   sm  → 14px  (inline use next to text, in pills, in field labels)
 *   md  → 24px  (default — buttons, inline form sections)
 *   lg  → 40px  (centred page loaders, route fallbacks)
 *
 * Colours come from the brand palette (gold border on a near-transparent
 * track). Used throughout the app — by ButtonSpinner, RouteProgressBar's
 * accompanying centre dot, route-level loading.tsx fallbacks, and any
 * inline place that needs to show "something's happening".
 *
 * Respects `prefers-reduced-motion` by switching the spinning ring to a
 * static gold dot (still clearly visible, but doesn't animate).
 */
export type SpinnerSize = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<SpinnerSize, { box: string; border: string }> = {
  sm: { box: '0.875rem', border: '0.125rem' },
  md: { box: '1.5rem',   border: '0.1875rem' },
  lg: { box: '2.5rem',   border: '0.25rem' },
}

export default function Spinner({
  size  = 'md',
  color = 'var(--brand-gold)',
  label = 'Loading',
}: {
  size?:  SpinnerSize
  color?: string
  label?: string
}) {
  const { box, border } = SIZE_MAP[size]

  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display:        'inline-block',
        width:          box,
        height:         box,
        border:         `${border} solid color-mix(in srgb, ${color} 18%, transparent)`,
        borderTopColor: color,
        borderRadius:   '50%',
        animation:      'lr-spin 0.7s linear infinite',
        verticalAlign:  'middle',
      }}
    >
      <style>{`
        @keyframes lr-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] {
            animation: none !important;
            background: ${color};
            border-color: transparent !important;
          }
        }
      `}</style>
    </span>
  )
}