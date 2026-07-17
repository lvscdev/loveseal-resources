'use client'

import { useTheme } from '@/components/theme/ThemeProvider'

/**
 * Exact design wordmark: rectangular 56×44 tile, Barlow Condensed.
 * - "lively"    weight 800, fontSize ~16
 * - "RESOURCES" weight 700, fontSize ~7, wide letter-spacing
 *
 * tone: 'dark' = ink bg (light mode), 'red' = brand red bg (dark mode)
 * size prop controls height; width scales at the design's 56:44 ratio.
 */
export default function BrandLogo({ size = 44 }: { size?: number }) {
  const { resolved } = useTheme()
  const tone = resolved === 'dark' ? 'red' : 'dark'

  const h = size
  const w = Math.round((56 / 44) * h)
  const bg = tone === 'red' ? '#C32126' : '#14110D'
  const fLively = Math.round((16 / 44) * h * 10) / 10
  const fRes    = Math.round((7  / 44) * h * 10) / 10
  const pad     = Math.round((8  / 44) * h * 10) / 10
  const mt      = Math.round((2  / 44) * h * 10) / 10

  return (
    <div
      aria-label="Lively Resources"
      style={{
        width:          w,
        height:         h,
        background:     bg,
        color:          '#ffffff',
        fontFamily:     'var(--font-display), "Barlow Condensed", sans-serif',
        lineHeight:     1,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'flex-start',
        padding:        `0 ${pad}px`,
        boxSizing:      'border-box',
        letterSpacing:  '-0.01em',
        flexShrink:     0,
        userSelect:     'none',
      }}
    >
      <span style={{ fontWeight: 800, fontSize: fLively, lineHeight: 0.95 }}>
        lively
      </span>
      <span
        style={{
          fontWeight:    700,
          fontSize:      fRes,
          lineHeight:    1,
          letterSpacing: '0.16em',
          marginTop:     mt,
        }}
      >
        RESOURCES
      </span>
    </div>
  )
}
