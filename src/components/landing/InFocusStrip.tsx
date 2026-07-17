import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { tagSlug } from '@/lib/topic'
import { getActiveEditorialTags } from '@/lib/editorial-tags'
import { getTopRecentSearchTerms } from '@/lib/recent-searches'
import { SOCIAL_LINKS } from '@/lib/social-links'
import { SocialIcon } from '@/components/public/FooterSocialIcons'

/**
 * "In focus this week" hashtags + "JOIN US" social squares.
 *
 * Three-tier source strategy:
 *   1. `editorial_tags` — admin-curated list, primary. The home page surfaces
 *      whatever the editorial team has pinned via /admin/editorial-tags.
 *   2. `recent_searches` aggregate — what readers have actually been searching
 *      for in the last 7 days.
 *   3. `content.tags[]` from recently-published content — cold-start floor
 *      (lives inside getTopRecentSearchTerms already).
 *
 * Only self-hides when all three tiers return empty — which on a real install
 * effectively means "no content has ever been published". Cold-start sites
 * still see real hashtags from day one as long as a handful of pieces are up.
 *
 * Tag rendering: each tag is a Link to /topics/[slug] using tagSlug() so the
 * URL is consistent with the topics index page (Pass 5b).
 */
export default async function InFocusStrip() {
  const t = await getTranslations('sections')

  /* ── Tier 1: editorial admin-curated tags ──────────────────────────────── */
  const editorial = await getActiveEditorialTags(5)
  let terms: { term: string }[] = editorial.map(e => ({ term: e.tag }))

  /* ── Tier 2 + 3: search aggregate (which itself falls back to content.tags) */
  if (terms.length === 0) {
    const fallback = await getTopRecentSearchTerms(168, 5)
    terms = fallback.map(f => ({ term: f.term }))
  }

  /* Three tiers exhausted — truly nothing to show. */
  if (terms.length === 0) return null

  return (
    <section
      aria-label={t('inFocus.label')}
      style={{
        maxWidth:     'var(--width-site)',
        marginInline: 'auto',
        width:        '100%',
        padding:      '0 var(--page-inline-padding)',
      }}
    >
      <div
        className="lr-infocus"
        style={{
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '1.5rem',
          padding:        '1.5rem 0 0',
          marginTop:      '2rem',
        }}
      >
        {/* LEFT — eyebrow label + hashtag row */}
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              fontSize:     '0.75rem',
              color:        'var(--text-tertiary)',
              marginBottom: '0.5rem',
            }}
          >
            {t('inFocus.label')}
          </div>
          <div
            className="lr-infocus-tags"
            style={{
              display:       'flex',
              flexWrap:      'wrap',
              gap:           '0.5rem 1rem',
              fontFamily:    'var(--font-display, "Barlow Condensed"), system-ui, sans-serif',
              fontSize:      '0.875rem',
              fontWeight:    800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color:         'var(--text-primary)',
            }}
          >
            {terms.map(({ term }) => (
              <Link
                key={term}
                href={{ pathname: '/topics/[slug]', params: { slug: tagSlug(term) } }}
                style={{
                  color:          'inherit',
                  textDecoration: 'none',
                  transition:     'opacity 0.12s',
                }}
              >
                #{term}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT — JOIN US label + social squares */}
        <div
          className="lr-infocus-join"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.875rem',
            flex:       '0 0 auto',
          }}
        >
          <span
            style={{
              fontSize:      '0.75rem',
              fontWeight:    700,
              letterSpacing: '0.2em',
              color:         'var(--text-tertiary)',
              whiteSpace:    'nowrap',
            }}
          >
            {t('joinUs')}
          </span>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  width:           '2.25rem',
                  height:          '2.25rem',
                  borderRadius:    '50%',
                  color:           '#FFFFFF',
                  background:      s.background ?? 'transparent',
                  backgroundImage: s.gradient,
                  textDecoration:  'none',
                  flexShrink:      0,
                  transition:      'transform 0.12s, opacity 0.12s',
                }}
              >
                <SocialIcon name={s.icon} size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 40rem) {
          .lr-infocus {
            flex-direction: column;
            align-items: stretch;
            margin-top: 0.25rem !important;
            padding-top: 0.75rem !important;
          }
          .lr-infocus-join {
            justify-content: space-between;
          }
          .lr-infocus-tags {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            font-size: 0.625rem !important;
            gap: 0.25rem 0.625rem !important;
            padding-bottom: 0.25rem !important;
          }
          .lr-infocus-tags::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </section>
  )
}