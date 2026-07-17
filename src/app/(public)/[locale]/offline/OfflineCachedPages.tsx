'use client'

import { useEffect, useState } from 'react'

interface CachedPage {
  url:   string
  path:  string
  title: string
}

const PAGES_CACHE = 'liveseal-pages-v1'

function cleanTitle(url: string): string {
  try {
    const path = new URL(url).pathname
    // Strip locale prefix
    const stripped = path.replace(/^\/(en|es|fr|pt|ar)\//, '/')
    // Strip /content/ prefix and trailing slash
    const slug = stripped.replace(/^\/content\//, '').replace(/\/$/, '')
    return slug || 'Home'
  } catch {
    return url
  }
}

export default function OfflineCachedPages() {
  const [pages, setPages] = useState<CachedPage[]>([])

  useEffect(() => {
    if (!('caches' in window)) return

    caches.open(PAGES_CACHE).then(async cache => {
      const keys = await cache.keys()
      const results: CachedPage[] = []

      for (const req of keys) {
        const path = new URL(req.url).pathname
        // Only show content pages, not the offline page itself
        if (path.includes('/offline') || path === '/') continue
        results.push({
          url:   req.url,
          path,
          title: cleanTitle(req.url),
        })
      }

      setPages(results.slice(0, 8))
    }).catch(() => {})
  }, [])

  if (pages.length === 0) return null

  return (
    <div style={{ marginTop: '2.5rem', width: '100%', maxWidth: '28rem' }}>
      <p style={{
        fontSize:      '0.6875rem',
        fontWeight:    600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         'var(--text-muted)',
        marginBottom:  '0.875rem',
        textAlign:     'center',
      }}>
        Available offline
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {pages.map(page => (
          <a
            key={page.url}
            href={page.path}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '0.625rem',
              padding:        '0.75rem 1rem',
              background:     'var(--bg-raised)',
              border:         '0.5px solid var(--border-subtle)',
              borderRadius:   '0.625rem',
              textDecoration: 'none',
              color:          'var(--text-secondary)',
              fontSize:       '0.875rem',
            }}
          >
            <span style={{ color: 'var(--brand-gold)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {page.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
