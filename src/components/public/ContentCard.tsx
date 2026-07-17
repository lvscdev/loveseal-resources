'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { contentHref } from '@/lib/content-url'

interface ContentItemForCard {
  id:              string
  slug:            string | null
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  series?:         string | null
  date_preached:   string | null
  cover_image_url: string | null
  published_at:    string
  summary_points:  string[] | null
}

const TYPE_COLORS: Record<string, string> = {
  manual:   '#C32126',
  prophecy: '#4498CC',
  article:  '#F5AE41',
  blog:     '#3C3C3C',
}

/* Diagonal-stripe placeholder — matches design's warm placeholder pattern */
const STRIPE_BG = `
  linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(20,17,13,0.18) 100%),
  repeating-linear-gradient(135deg, #d9c6a0 0 16px, #c9b58a 16px 32px)
`

export default function ContentCard({
  item,
  layout = 'grid',
}: {
  item: ContentItemForCard
  layout?: 'grid' | 'list'
}) {
  const tTypes  = useTranslations('content.types')
  const locale  = useLocale()
  const typeColor = TYPE_COLORS[item.content_type]

  const dateString = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(item.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  if (layout === 'list') {
    return (
      <Link
        href={contentHref(item)}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: '16px',
          alignItems: 'center',
          padding: '14px 16px',
          background: 'var(--bg-raised)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '10px',
          textDecoration: 'none',
          transition: 'border-color 0.12s, transform 0.12s',
        }}
      >
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          borderRadius: '10px',
          overflow: 'hidden',
          flexShrink: 0,
          background: item.cover_image_url ? undefined : STRIPE_BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {item.cover_image_url ? (
            <Image
              src={item.cover_image_url}
              alt={item.title}
              fill
              sizes="64px"
              style={{ objectFit: 'cover' }}
            />
          ) : null}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TypePill type={item.content_type} label={tTypes(item.content_type)} />
            {item.theme && (
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {item.theme}
              </span>
            )}
          </div>
          <h3 style={{
            fontFamily:    'var(--font-body)',
            fontSize:      '15px',
            fontWeight:    'var(--content-title-weight, 800)',
            textTransform: 'var(--content-title-transform, uppercase)',
            color:         'var(--text-primary)',
            marginBottom:  '3px',
            lineHeight:    1.3,
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            display:       '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {item.title}
          </h3>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {item.speaker && <span>{item.speaker} · </span>}
            <span>{dateString}</span>
          </div>
        </div>

        <div style={{ color: 'var(--text-faint)', flexShrink: 0 }}>→</div>
      </Link>
    )
  }

  /* Grid card — design-accurate: rounded photo container (18px radius),
     white/surface bg, no card border, display-font title below the image,
     type pill top-left + read-time/meta pill top-right on the photo. */
  return (
    <Link
      href={contentHref(item)}
      className="content-card"
      style={{
        display:        'flex',
        flexDirection:  'column',
        textDecoration: 'none',
        height:         '100%',
      }}
    >
      {/* Photo */}
      <div style={{
        position:     'relative',
        aspectRatio:  '4 / 3',
        borderRadius: '1.125rem',
        overflow:     'hidden',
        background:   item.cover_image_url ? undefined : STRIPE_BG,
        flexShrink:   0,
      }}>
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 820px) 100vw, (max-width: 1200px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        ) : null}

        {/* Top-left: type pill */}
        <div style={{ position: 'absolute', top: '0.75rem', insetInlineStart: '0.75rem', zIndex: 1 }}>
          <span style={{
            display:       'inline-flex',
            alignItems:    'center',
            padding:       '0.375rem 0.75rem',
            background:    '#FFFFFF',
            color:         'var(--text-primary)',
            fontSize:      '0.6875rem',
            fontWeight:    500,
            borderRadius:  '999rem',
            whiteSpace:    'nowrap',
          }}>
            {tTypes(item.content_type)}
          </span>
        </div>

        {/* Top-right: theme/speaker pill if available */}
        {(item.theme || item.speaker) && (
          <div style={{ position: 'absolute', top: '0.75rem', insetInlineEnd: '0.75rem', zIndex: 1 }}>
            <span style={{
              display:       'inline-flex',
              alignItems:    'center',
              padding:       '0.375rem 0.75rem',
              background:    '#FFFFFF',
              color:         'var(--text-primary)',
              fontSize:      '0.6875rem',
              fontWeight:    500,
              borderRadius:  '999rem',
              whiteSpace:    'nowrap',
              maxWidth:      '9rem',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
            }}>
              {item.theme ?? item.speaker}
            </span>
          </div>
        )}
      </div>

      {/* Text below photo */}
      <div style={{
        paddingTop: '0.875rem',
        display:    'flex',
        flexDirection: 'column',
        gap:        '0.375rem',
        flex:       1,
      }}>
        {/* Eyebrow: type · theme (small all-caps) */}
        {item.theme && (
          <div style={{
            fontSize:      '0.625rem',
            fontWeight:    700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         typeColor,
          }}>
            {item.theme}
          </div>
        )}

        <h3 style={{
          fontFamily:      'var(--font-display), "Barlow Condensed", sans-serif',
          fontSize:        'clamp(1.125rem, 2vw, 1.5rem)',
          fontWeight:      'var(--content-title-weight, 800)',
          textTransform:   'var(--content-title-transform, uppercase)',
          color:           'var(--text-primary)',
          lineHeight:      1.0,
          letterSpacing:   '-0.01em',
          margin:          0,
          display:         '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow:        'hidden',
        }}>
          {item.title}
        </h3>

        <div style={{ flex: 1 }} />

        <div style={{
          fontSize:   '0.75rem',
          color:      'var(--text-secondary)',
          display:    'flex',
          gap:        '0.375rem',
          alignItems: 'center',
          marginTop:  '0.5rem',
        }}>
          {item.speaker && (
            <>
              <span>{item.speaker}</span>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
            </>
          )}
          <span>{dateString}</span>
        </div>
      </div>
    </Link>
  )
}

function TypePill({ type, label }: { type: string; label: string }) {
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      padding:       '3px 9px',
      background:    TYPE_COLORS[type],
      color:         '#FFFFFF',
      fontSize:      '10px',
      fontWeight:    500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      borderRadius:  '20px',
    }}>
      {label}
    </span>
  )
}
