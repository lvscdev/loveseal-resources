'use client'

/**
 * Skeleton — neutral placeholder block with a soft shimmer. Used in
 * loading.tsx route fallbacks and any in-page suspense boundary.
 *
 * Mimics the size and shape of the content that's loading so the layout
 * doesn't reflow when real content arrives. Pair with the same widths/
 * heights/border-radius as the actual component.
 *
 * Defaults to a subtle gradient that adapts to light/dark theme via CSS
 * variables — looks deliberate, not broken.
 *
 * Respects `prefers-reduced-motion` (skips the shimmer animation but
 * keeps the placeholder block visible).
 */
export default function Skeleton({
  width        = '100%',
  height       = '1rem',
  borderRadius = '0.375rem',
  style,
}: {
  width?:        string | number
  height?:       string | number
  borderRadius?: string
  style?:        React.CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display:      'block',
        width,
        height,
        borderRadius,
        background:   'var(--bg-skeleton, color-mix(in srgb, var(--text-primary) 6%, transparent))',
        position:     'relative',
        overflow:     'hidden',
        ...style,
      }}
    >
      <style>{`
        span[aria-hidden="true"]::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in srgb, var(--text-primary) 8%, transparent) 50%,
            transparent 100%
          );
          animation: lr-shimmer 1.6s ease-in-out infinite;
        }
        @keyframes lr-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%);  }
        }
        @media (prefers-reduced-motion: reduce) {
          span[aria-hidden="true"]::after {
            animation: none;
          }
        }
      `}</style>
    </span>
  )
}