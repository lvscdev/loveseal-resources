import Spinner from '@/components/ui/Spinner'

/**
 * Generic centered page loader. Use as the default for any route's
 * loading.tsx that doesn't have a bespoke skeleton.
 *
 * Renders a large brand spinner vertically and horizontally centered in
 * the available viewport, with a subtle label below. Sized to feel like
 * a real page (min-height 60vh) so it doesn't feel like a tiny flash.
 *
 * The accompanying RouteProgressBar handles the top-of-screen visual cue
 * during the transition — this component handles the body of the page
 * while the new route's data is being fetched.
 */
export default function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      style={{
        minHeight:       '60vh',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             '1.25rem',
        padding:         '2rem 1rem',
      }}
    >
      <Spinner size="lg" />
      <span
        style={{
          fontSize:      '0.875rem',
          color:         'var(--text-tertiary)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </div>
  )
}