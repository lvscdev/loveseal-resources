/**
 * Shared hero header for topic landing pages.
 *
 * Desktop layout (≥ 768px) — two columns per design:
 *   LEFT: eyebrow dot + "CONTENT TYPE · N of 4" label + giant display heading + intro copy
 *   RIGHT: count badge + Follow pill (future) + digest hint
 *
 * Mobile: single column stack.
 */

interface TopicHeaderProps {
  eyebrow:     string
  title:       string
  body?:       string | null
  countLabel:  string
  accentColor?: string
}

const TYPE_INDEX: Record<string, number> = {
  manual:   1,
  prophecy: 2,
  article:  3,
  blog:     4,
}

export default function TopicHeader({
  eyebrow,
  title,
  body,
  countLabel,
  accentColor = 'var(--brand-red)',
}: TopicHeaderProps) {
  /* Derive a "02 of 04" style label from the title for content-type pages.
     Falls back gracefully if the title doesn't map. */
  const typeSlug = title.toLowerCase().replace(/s$/, '') // "Prophecies" → "prophecy" (rough)
  const typeIdx  = TYPE_INDEX[typeSlug] ?? TYPE_INDEX[title.toLowerCase()]

  return (
    <header className="topic-header" style={{ marginBottom: '2rem' }}>
      <div className="topic-header-inner">
        {/* LEFT: eyebrow + title + body */}
        <div>
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.75rem',
            marginBottom: '1rem',
          }}>
            <span
              aria-hidden="true"
              style={{
                width:        '0.625rem',
                height:       '0.625rem',
                borderRadius: '50%',
                background:   accentColor,
                display:      'inline-block',
                flexShrink:   0,
              }}
            />
            <p style={{
              fontSize:      '0.6875rem',
              fontWeight:    700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         'var(--text-secondary)',
              margin:        0,
            }}>
              {typeIdx
                ? `${eyebrow} · ${String(typeIdx).padStart(2, '0')} OF 04`
                : eyebrow}
            </p>
          </div>

          <h1 style={{
            fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
            fontSize:      'clamp(3rem, 10vw, 8rem)',
            fontWeight:    800,
            textTransform: 'uppercase',
            color:         'var(--text-primary)',
            lineHeight:    0.92,
            letterSpacing: '-0.02em',
            margin:        '0 0 1rem',
          }}>
            {title}
          </h1>

          {body && (
            <p style={{
              fontSize:   '1.0625rem',
              lineHeight: 1.55,
              color:      'var(--text-secondary)',
              maxWidth:   '36rem',
              margin:     0,
            }}>
              {body}
            </p>
          )}
        </div>

        {/* RIGHT: count + future follow pill */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'flex-end',
          gap:           '1rem',
        }}>
          <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            padding:      '0.625rem 1rem',
            borderRadius: '999rem',
            background:   'var(--bg-elevated, #F5F5F5)',
            color:        'var(--text-secondary)',
            fontSize:     '0.8125rem',
            fontWeight:   500,
            whiteSpace:   'nowrap',
          }}>
            {countLabel}
          </span>
        </div>
      </div>

      <style>{`
        .topic-header-inner {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 3.5rem;
          align-items: flex-end;
        }
        @media (max-width: 48rem) {
          .topic-header-inner {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .topic-header-inner > div:last-child {
            align-items: flex-start;
          }
        }
      `}</style>
    </header>
  )
}
