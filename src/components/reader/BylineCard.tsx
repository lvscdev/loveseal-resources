'use client'

import { Link } from '@/i18n/navigation'
import InitialsAvatar from './InitialsAvatar'

/**
 * Single-row byline that sits under the Full/Quick toggle.
 *
 *   [ avatar ]  Pastor Ada Mensah  ·  May 13  ·  9 min
 *
 * The dots are middle-dot separators inside spans so that on a narrow
 * viewport the row wraps gracefully — name on row 1, the rest on row 2 —
 * without orphaning a separator at the start of a wrap line.
 *
 * Pass 5c additions:
 *   - `avatarUrl`  — when present, InitialsAvatar shows the image; otherwise
 *                    falls back to initials.
 *   - `authorSlug` — when present, wraps the name in a Link to
 *                    /authors/[slug]. When absent (legacy rows whose
 *                    speaker text didn't match any backfilled author),
 *                    the name renders as plain text.
 */
export default function BylineCard({
  name,
  date,
  readTimeLabel,
  avatarUrl = null,
  authorSlug = null,
  coAuthors,
}: {
  name:          string | null | undefined
  date:          string
  readTimeLabel: string
  avatarUrl?:    string | null
  authorSlug?:   string | null
  coAuthors?:    Array<{ name: string; slug: string | null; avatarUrl: string | null }>
}) {
  const displayName = (name && name.trim()) || ''
  const hasCoAuthors = coAuthors && coAuthors.length > 0

  function AuthorName({ n, slug }: { n: string; slug: string | null }) {
    return slug ? (
      <Link
        href={{ pathname: '/authors/[slug]', params: { slug } }}
        style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}
        className="byline-author-link"
      >
        {n}
      </Link>
    ) : (
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{n}</span>
    )
  }

  return (
    <>
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          flexWrap:   'wrap',
          gap:        '0.625rem 0.75rem',
          marginBottom: '1.25rem',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* Stacked avatars for primary + co-authors */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InitialsAvatar name={displayName} size={2.25} avatarUrl={avatarUrl} />
          {hasCoAuthors && coAuthors!.slice(0, 2).map((ca, i) => (
            <div key={i} style={{ marginLeft: '-0.5rem' }}>
              <InitialsAvatar name={ca.name} size={2.25} avatarUrl={ca.avatarUrl} />
            </div>
          ))}
        </div>

        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            flexWrap:   'wrap',
            gap:        '0.375rem 0.5rem',
            fontSize:   '0.875rem',
            color:      'var(--text-secondary)',
            lineHeight: 1.3,
          }}
        >
          {displayName && <AuthorName n={displayName} slug={authorSlug} />}
          {hasCoAuthors && coAuthors!.map((ca, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>&amp;</span>
              <AuthorName n={ca.name} slug={ca.slug} />
            </span>
          ))}
          {displayName && <Dot />}
          <span>{date}</span>
          <Dot />
          <span>{readTimeLabel}</span>
        </div>
      </div>

      <style>{`
        .byline-author-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      style={{
        color:    'var(--text-faint)',
        fontSize: '0.875rem',
        lineHeight: 1,
      }}
    >
      ·
    </span>
  )
}