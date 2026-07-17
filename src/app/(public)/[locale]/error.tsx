'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[locale-error]', error)
  }, [error])

  return (
    <div style={{
      maxWidth:       'var(--width-narrow)',
      margin:         '0 auto',
      padding:        'clamp(3rem, 10vw, 6rem) var(--page-inline-padding)',
      textAlign:      'center',
      minHeight:      '60dvh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '1rem',
    }}>
      <div style={{
        fontSize:      '0.6875rem',
        fontWeight:    500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color:         'var(--brand-gold)',
      }}>
        Something went wrong
      </div>

      <h1 style={{
        fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
        fontSize:      'clamp(2.5rem, 8vw, 4.5rem)',
        fontWeight:    900,
        lineHeight:    0.95,
        textTransform: 'uppercase',
        color:         'var(--text-primary)',
        letterSpacing: '-0.02em',
        margin:        0,
      }}>
        Unexpected Error
      </h1>

      <p style={{
        fontSize:   '1rem',
        lineHeight: 1.6,
        color:      'var(--text-secondary)',
        maxWidth:   '40ch',
        margin:     '0.5rem 0 0',
      }}>
        We ran into a problem loading this page. Try again or head back to the library.
      </p>

      <div style={{
        marginTop:      '1rem',
        display:        'flex',
        gap:            '0.625rem',
        flexWrap:       'wrap',
        justifyContent: 'center',
      }}>
        <button
          onClick={reset}
          style={{
            display:        'inline-block',
            padding:        '0.6875rem 1.375rem',
            background:     'var(--brand-gold)',
            color:          'var(--text-inverse)',
            borderRadius:   '0.5rem',
            fontSize:       '0.875rem',
            fontWeight:     500,
            border:         'none',
            cursor:         'pointer',
            fontFamily:     'var(--font-body)',
          }}
        >
          Try again
        </button>
        <Link href="/content" style={{
          display:        'inline-block',
          padding:        '0.6875rem 1.375rem',
          background:     'transparent',
          color:          'var(--text-primary)',
          border:         '0.0625rem solid var(--border-strong)',
          borderRadius:   '0.5rem',
          fontSize:       '0.875rem',
          fontWeight:     500,
          textDecoration: 'none',
        }}>
          Browse library
        </Link>
      </div>
    </div>
  )
}
