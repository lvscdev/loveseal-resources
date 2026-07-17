import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import ContentCard from '@/components/public/ContentCard'
import RevealOnScroll from '@/components/landing/RevealOnScroll'

type ContentType = 'manual' | 'prophecy' | 'article' | 'blog'

const TYPE_ACCENT: Record<ContentType, string> = {
  manual:   '#C32126',   /* brand-red */
  prophecy: '#4498CC',   /* brand-blue */
  article:  '#F5AE41',   /* brand-gold */
  blog:     '#C8BFEC',   /* lilac */
}

type CardItem = Parameters<typeof ContentCard>[0]['item']

/**
 * "Latest X" section block.
 *
 * Renders one of: Latest Manuals · Latest Prophecies · Latest Articles ·
 * Latest Blog. Pass 7 update per design template:
 *
 *   • red 8px square bullet
 *   • big Barlow Condensed section heading (uppercase, clamp-sized)
 *   • inline "XX entries" count next to the heading (replaces the
 *     previous tag-pill row on the landing page)
 *   • "View all" link on the right
 *   • content cards grid below
 *
 * The tag pill row remains on /topic/[type] pages — only the landing-page
 * variant drops it. The decision was: less noise on the home page; tags
 * still discoverable from the topic landing.
 *
 * The `totalCount` prop comes pre-computed from page.tsx so we don't issue
 * extra queries in this component.
 */
export default async function LatestSection({
  type,
  items,
  totalCount,
}: {
  type:        ContentType
  items:       CardItem[]
  totalCount:  number
}) {
  const tSections = await getTranslations('sections')
  const titleKey  = sectionTitleKey(type)
  const accent    = TYPE_ACCENT[type]

  if (items.length === 0) return null

  return (
    <section
      style={{
        maxWidth: 'var(--width-site)',
        margin:   '0 auto',
        padding:  '3.5rem var(--page-inline-padding) 1rem',
      }}
    >
      <RevealOnScroll>
        <div
          style={{
            display:        'flex',
            alignItems:     'baseline',
            justifyContent: 'space-between',
            gap:            '1.5rem',
            paddingBottom:  '1rem',
            borderBottom:   '0.0625rem solid var(--border-subtle)',
            marginBottom:   '1.5rem',
          }}
        >
          <div
            style={{
              display:    'flex',
              alignItems: 'baseline',
              gap:        '0.75rem',
              minWidth:   0,
              flex:       '1 1 auto',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width:        '0.5rem',
                height:       '0.5rem',
                borderRadius: '50%',
                background:   accent,
                flexShrink:   0,
                transform:    'translateY(-0.125rem)',
              }}
            />
            <h2
              style={{
                margin:        0,
                fontFamily:    'var(--font-display), "Barlow Condensed", system-ui, sans-serif',
                fontSize:      'clamp(1.75rem, 4vw, 3.5rem)',
                fontWeight:    800,
                lineHeight:    1,
                letterSpacing: '-0.012em',
                textTransform: 'uppercase',
                color:         'var(--text-primary)',
              }}
            >
              {tSections('latest', { type: tSections(titleKey) })}
            </h2>
            <span
              style={{
                fontSize:   '0.8125rem',
                color:      'var(--text-tertiary)',
                fontWeight: 400,
                whiteSpace: 'nowrap',
              }}
            >
              {tSections('entries', { count: totalCount })}
            </span>
          </div>

          <Link
            href={{ pathname: '/content', query: { type } }}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              padding:        '0.625rem 1.125rem',
              borderRadius:   '999rem',
              fontSize:       '0.8125rem',
              fontWeight:     500,
              color:          'var(--text-primary)',
              textDecoration: 'none',
              whiteSpace:     'nowrap',
              boxShadow:      'inset 0 0 0 1px rgba(20,17,13,0.18)',
              transition:     'background-color 0.12s',
            }}
          >
            {tSections('viewAll')} →
          </Link>
        </div>
      </RevealOnScroll>

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(16.25rem, 1fr))',
          gap:                 '0.875rem',
        }}
      >
        {items.map((item, idx) => (
          <RevealOnScroll
            key={item.id}
            delay={Math.min(idx * 0.06, 0.24)}
            yOffset={20}
          >
            <ContentCard item={item} layout="grid" />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  )
}

function sectionTitleKey(type: ContentType): 'manuals' | 'prophecies' | 'articles' | 'blog' {
  switch (type) {
    case 'manual':   return 'manuals'
    case 'prophecy': return 'prophecies'
    case 'article':  return 'articles'
    default:         return 'blog'
  }
}