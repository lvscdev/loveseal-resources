/**
 * Root not-found.
 *
 * Catches requests Next.js can't even route to a locale (e.g. a path that
 * doesn't begin with a recognised locale prefix, or a request that arrives
 * before middleware has resolved a locale). Sits *outside* `[locale]`, so
 * `next-intl` hooks aren't usable here — keep this English-only.
 *
 * The locale-aware sibling at `(public)/[locale]/not-found.tsx` handles
 * the common case: a known locale, an unknown path inside it. That one
 * gets translations, header + footer, and a fuller layout.
 */

import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin:        0,
          minHeight:     '100dvh',
          display:       'flex',
          flexDirection: 'column',
          background:    '#FFFFFF',
          color:         '#14110D',
          fontFamily:    '"DM Sans", system-ui, sans-serif',
        }}
      >
        {/* Minimal header */}
        <header
          style={{
            borderBottom:   '1px solid rgba(20,17,13,0.08)',
            padding:        '0.875rem 2rem',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            flexShrink:     0,
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display:        'flex',
              alignItems:     'center',
              gap:            '0.625rem',
            }}
          >
            <div
              style={{
                width:          '2.5rem',
                height:         '2.5rem',
                background:     '#14110D',
                borderRadius:   '0.375rem',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          '#FFFFFF',
                fontFamily:     '"Barlow Condensed", system-ui, sans-serif',
                fontWeight:     900,
                fontSize:       '0.5rem',
                letterSpacing:  '0.06em',
                textTransform:  'uppercase',
                lineHeight:     1.2,
                textAlign:      'center',
                padding:        '0 0.25rem',
              }}
            >
              LIVELY RESOURCES
            </div>
            <span
              style={{
                fontFamily:    '"Barlow Condensed", system-ui, sans-serif',
                fontWeight:    700,
                fontSize:      '0.875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color:         '#14110D',
              }}
            >
              Lively Resources
            </span>
          </Link>
          <Link
            href="/"
            style={{
              fontSize:       '0.8125rem',
              color:          '#C32126',
              fontWeight:     500,
              textDecoration: 'none',
            }}
          >
            &larr; Home
          </Link>
        </header>

        {/* Page body */}
        <main
          style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '3rem 1.5rem',
            textAlign:      'center',
          }}
        >
          <div
            style={{
              fontSize:      '0.6875rem',
              fontWeight:    500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         '#F5AE41',
              marginBottom:  '0.75rem',
            }}
          >
            404
          </div>

          <h1
            style={{
              fontFamily:    '"Barlow Condensed", system-ui, sans-serif',
              fontSize:      'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight:    900,
              lineHeight:    0.95,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              margin:        '0 0 1rem',
            }}
          >
            Page not found
          </h1>

          <p
            style={{
              fontSize:   '1rem',
              lineHeight: 1.6,
              color:      '#6c757d',
              maxWidth:   '40ch',
              margin:     '0 0 1.5rem',
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Link
            href="/"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '0.5rem',
              padding:        '0.75rem 1.375rem',
              background:     '#C32126',
              color:          '#FFFFFF',
              borderRadius:   '999rem',
              fontSize:       '0.875rem',
              fontWeight:     500,
              textDecoration: 'none',
            }}
          >
            Go home &rarr;
          </Link>
        </main>

        {/* Minimal footer */}
        <footer
          style={{
            borderTop:      '1px solid rgba(20,17,13,0.08)',
            padding:        '1rem 2rem',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            gap:            '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94897A' }}>
            &copy; {new Date().getFullYear()} LoveSeal Church &middot; Lively Resources
          </span>
          <Link
            href="/content"
            style={{
              fontSize:       '0.75rem',
              color:          '#C32126',
              textDecoration: 'none',
              fontWeight:     500,
            }}
          >
            Browse the library &rarr;
          </Link>
        </footer>
      </body>
    </html>
  )
}
