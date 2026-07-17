'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import RevealOnScroll from './RevealOnScroll'
import { contentHref } from '@/lib/content-url'

interface FeaturedItem {
  id:                 string
  slug:               string | null
  title:              string
  content_type:       'manual' | 'prophecy' | 'article' | 'blog'
  theme:              string | null
  category:           string | null
  speaker:            string | null
  summary_points:     string[] | null
  date_preached:      string | null
  cover_image_url:    string | null
  read_time_minutes:  number | null
  published_at:       string
}

/* Type colors kept for the secondary card eyebrows ONLY (per locked decision:
   "Keep type colors but hide them on landing only" — the secondary card type
   tags surface category color subtly via the eyebrow). Primary card type pill
   is neutral white (design-accurate). */
const TYPE_COLORS: Record<string, string> = {
  manual:   '#4498CC',
  prophecy: '#C32126',
  article:  '#F5AE41',
  blog:     '#3C3C3C',
}

export default function FeaturedSection({ items }: { items: FeaturedItem[] }) {
  const t      = useTranslations('featured')
  const tTypes = useTranslations('content.types')
  const locale = useLocale()

  if (items.length === 0) return null

  const [primary, ...rest] = items
  /* Secondary count strategy per locked decision: match the LEFT column's
     height precisely. The left column = stripe card + eyebrow + title +
     description + byline. On desktop this empirically lands between 3 and
     4 secondaries. We render up to 4 (rest.slice(0, 4)) and let the inner
     grid auto-distribute via CSS flex; the JustifyContent: 'space-between'
     on the right column visually matches the heights. */
  const secondary = rest.slice(0, 4)

  return (
    <section
      style={{
        maxWidth: 'var(--width-site)',
        margin:   '0 auto',
        padding:  '2.5rem var(--page-inline-padding) 5rem',
      }}
    >
      {/* Section header — red square bullet + uppercase title;
          right-side text is descriptive (not a "view all" link) to
          match the design's "Hand-picked by the editorial team". */}
      <RevealOnScroll>
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'baseline',
            marginBottom:   '1.5rem',
            paddingBottom:  '0.875rem',
            borderBottom:   '0.03125rem solid var(--border-subtle)',
            gap:            '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span
              aria-hidden="true"
              style={{
                width:      '0.5rem',
                height:     '0.5rem',
                background: 'var(--brand-red)',
                flexShrink: 0,
                transform:  'translateY(-0.125rem)',
              }}
            />
            <h2
              style={{
                fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
                fontSize:      'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight:    900,
                textTransform: 'uppercase',
                color:         'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin:        0,
                lineHeight:    1,
              }}
            >
              {t('title')}
            </h2>
          </div>
          <span
            style={{
              fontSize: '0.8125rem',
              color:    'var(--text-tertiary)',
              flexShrink: 0,
            }}
          >
            {t('handpicked')}
          </span>
        </div>
      </RevealOnScroll>

      <div
        className="featured-grid"
        style={{
          display:             'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap:                 '1.25rem',
          alignItems:          'stretch',
        }}
      >
        {/* LEFT COLUMN — stripe-only primary card, then eyebrow/title/desc/byline AS PLAIN TEXT BELOW */}
        <RevealOnScroll delay={0.05}>
          <PrimaryColumn
            item={primary}
            typeLabel={tTypes(primary.content_type)}
            locale={locale}
            chaptersLabel={t('chapters', { count: chaptersFromSummary(primary.summary_points) })}
            readTimeLabel={t('readTime',  { count: primary.read_time_minutes ?? 0 })}
          />
        </RevealOnScroll>

        {/* RIGHT COLUMN — secondary cards distributed to fill column height */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            gap:            '0.75rem',
            justifyContent: 'space-between',
            height:         '100%',
          }}
        >
          {secondary.map((item, idx) => (
            <RevealOnScroll key={item.id} delay={0.1 + idx * 0.05}>
              <SecondaryCard
                item={item}
                typeLabel={tTypes(item.content_type)}
                locale={locale}
              />
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 51.25rem) {
          .featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

/* Approximate "chapters" count from summary_points length, with a sane
   floor of 1. Real chapter counts will arrive from a future schema field;
   for now this is the same heuristic the reader uses. */
function chaptersFromSummary(summary: string[] | null | undefined): number {
  return Math.max(1, summary?.length ?? 1)
}

/* ─────────────────────────────────────────────────────────────────────────────
   PrimaryColumn — design-literal layout:
     · Stripe-only card with pills overlaid (no padded content area inside)
     · Eyebrow ("CATEGORY · TYPE") + title + description + byline rendered
       as PLAIN TEXT BELOW the card (not inside it)
   ───────────────────────────────────────────────────────────────────────── */
function PrimaryColumn({
  item, typeLabel, locale, chaptersLabel, readTimeLabel,
}: {
  item:          FeaturedItem
  typeLabel:     string
  locale:        string
  chaptersLabel: string
  readTimeLabel: string
}) {
  const dateString = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(item.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  const categoryLabel = (item.category || item.theme || typeLabel).toUpperCase()
  const readMinsLine  = item.read_time_minutes ? ` · ${readTimeLabel}` : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Stripe card — fills available width, ~30rem tall; cover overrides
          the stripe pattern when present. Type pill top-left + chapter/read
          pill top-right are the only overlays. */}
      <Link
        href={contentHref(item)}
        style={{
          position:       'relative',
          display:        'block',
          width:          '100%',
          minHeight:      '24rem',
          borderRadius:   '1rem',
          overflow:       'hidden',
          background:     item.cover_image_url
            ? '#000'
            : `repeating-linear-gradient(
                135deg,
                #E8D9B8 0 1.5rem,
                #D4C19A 1.5rem 3rem
              )`,
          textDecoration: 'none',
          flexShrink:     0,
        }}
      >
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 51.25rem) 100vw, 37.5rem"
            style={{ objectFit: 'cover' }}
          />
        ) : null}

        {/* Top-left type pill — neutral white, red text, design-accurate.
            Type colors are explicitly NOT used here per locked decision. */}
        <span
          style={{
            position:        'absolute',
            top:             '1rem',
            insetInlineStart: '1rem',
            background:      '#FFFFFF',
            color:           'var(--brand-red)',
            fontSize:        '0.6875rem',
            fontWeight:      600,
            letterSpacing:   '0.06em',
            textTransform:   'uppercase',
            padding:         '0.375rem 0.875rem',
            borderRadius:    '999rem',
            zIndex:          1,
          }}
        >
          {typeLabel}
        </span>

        {/* Top-right chapter / read-time pill */}
        <span
          style={{
            position:       'absolute',
            top:            '1rem',
            insetInlineEnd: '1rem',
            background:     '#FFFFFF',
            color:          '#212529',
            fontSize:       '0.6875rem',
            fontWeight:     500,
            padding:        '0.375rem 0.875rem',
            borderRadius:   '999rem',
            zIndex:         1,
          }}
        >
          {chaptersLabel}{readMinsLine}
        </span>
      </Link>

      {/* Below the card — eyebrow / title / description / byline as PLAIN TEXT.
          Not inside any rounded panel. Matches design literally. */}
      <div
        style={{
          padding:        '1.5rem 0 0',
          display:        'flex',
          flexDirection:  'column',
          gap:            '0.75rem',
          flex:           '1 1 auto',
        }}
      >
        <div
          style={{
            fontSize:      '0.6875rem',
            fontWeight:    600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         'var(--brand-red)',
          }}
        >
          {categoryLabel} · {typeLabel.toUpperCase()}
        </div>

        <Link
          href={contentHref(item)}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3
            style={{
              fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
              fontSize:      'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight:    'var(--content-title-weight, 800)',
              textTransform: 'var(--content-title-transform, uppercase)',
              color:         'var(--text-primary)',
              lineHeight:    1.05,
              letterSpacing: '-0.01em',
              margin:        0,
            }}
          >
            {item.title}
          </h3>
        </Link>

        {item.summary_points && item.summary_points.length > 0 && (
          <p
            style={{
              fontSize:        '0.9375rem',
              lineHeight:      1.55,
              color:           'var(--text-secondary)',
              margin:          0,
              display:         '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow:        'hidden',
            }}
          >
            {item.summary_points[0]}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.25rem' }}>
          <SpeakerAvatar name={item.speaker} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {item.speaker && (
              <span
                style={{
                  fontSize:   '0.875rem',
                  fontWeight: 500,
                  color:      'var(--text-primary)',
                }}
              >
                {item.speaker}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {dateString}{readMinsLine}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Compact initial avatar — neutral grey background with white initials.
   Matches the design's small circular byline avatar. No type color here. */
function SpeakerAvatar({ name }: { name: string | null }) {
  const initials = (name ?? '?').split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('') || '·'
  return (
    <div
      aria-hidden="true"
      style={{
        width:          '2rem',
        height:         '2rem',
        borderRadius:   '50%',
        background:     'var(--brand-red)',
        color:          '#FFFFFF',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '0.75rem',
        fontWeight:     600,
        flexShrink:     0,
      }}
    >
      {initials}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SecondaryCard — horizontal small card with colored square thumb + meta.
   Type color comes through SUBTLY here (left-edge color bar) since the
   locked decision was "keep type colors but hide them on landing only" —
   the design does show subtle color differentiation on these mini cards
   (light-blue / pink / dark blocks), so this is the one landing surface
   where the color system surfaces — but as a soft tint, not a bold pill.
   ───────────────────────────────────────────────────────────────────────── */
function SecondaryCard({
  item, typeLabel, locale,
}: {
  item:      FeaturedItem
  typeLabel: string
  locale:    string
}) {
  const typeColor = TYPE_COLORS[item.content_type]
  const date = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    : new Date(item.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  const eyebrowLabel = item.category || item.theme || ''

  return (
    <Link
      href={contentHref(item)}
      style={{
        display:             'grid',
        gridTemplateColumns: '4.5rem 1fr',
        gap:                 '0.875rem',
        background:          'var(--bg-raised)',
        border:              '0.03125rem solid var(--border-subtle)',
        borderRadius:        '0.75rem',
        textDecoration:      'none',
        overflow:            'hidden',
        padding:             '0.75rem',
        alignItems:          'center',
        flex:                '1 1 auto',
        minHeight:           '4.5rem',
      }}
    >
      <div
        style={{
          position:     'relative',
          width:        '4.5rem',
          height:       '4.5rem',
          borderRadius: '0.5rem',
          overflow:     'hidden',
          background:   item.cover_image_url
            ? undefined
            /* Diagonal stripe in a soft tint of the type color. Matches
               the design's placeholder thumbnails. */
            : `repeating-linear-gradient(
                135deg,
                ${typeColor}55 0 0.5rem,
                ${typeColor}22 0.5rem 1rem
              )`,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        {item.cover_image_url && (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="4.5rem"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize:      '0.625rem',
            fontWeight:    600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         'var(--text-tertiary)',
            marginBottom:  '0.25rem',
          }}
        >
          {typeLabel.toUpperCase()}{eyebrowLabel ? ` · ${eyebrowLabel.toUpperCase()}` : ''}
        </div>
        <h4
          style={{
            fontFamily:      'var(--font-body)',
            fontSize:        '0.875rem',
            fontWeight:      'var(--content-title-weight, 800)',
            textTransform:   'var(--content-title-transform, uppercase)',
            color:           'var(--text-primary)',
            marginBottom:    '0.25rem',
            lineHeight:      1.3,
            overflow:        'hidden',
            textOverflow:    'ellipsis',
            display:         '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.title}
        </h4>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          <span>{date}</span>
          {item.read_time_minutes ? <span> · {item.read_time_minutes} min read</span> : null}
        </div>
      </div>
    </Link>
  )
}