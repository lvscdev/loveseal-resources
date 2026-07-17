'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BRAND } from '@/components/brand/Brand'
import { SOCIAL_LINKS } from '@/lib/social-links'
import { EXTERNAL_LINKS } from '@/lib/external-links'
import { SocialIcon } from '@/components/public/FooterSocialIcons'
import FooterSubscribeForm from '@/components/public/FooterSubscribeForm'

export default function PublicFooter() {
  const t          = useTranslations('footer')
  const year       = new Date().getFullYear()
  const langLabel  = t('langs')

  return (
    <footer
      style={{
        background: 'var(--footer-bg)',
        color:      'var(--footer-text)',
        marginTop:  '4rem',
      }}
    >
      <div
        className="footer-inner"
        style={{
          maxWidth:     'var(--width-site)',
          marginInline: 'auto',
          width:        '100%',
          padding:      '3.5rem var(--page-inline-padding) 2rem',
        }}
      >
        {/* ─── TOP ROW: 4 columns (1 display + 3 nav) ───────────────────
            Note: NO inline `gridTemplateColumns` here — that's defined in
            the embedded <style> block below, with breakpoint-specific
            rules. Inline styles beat media queries on specificity, so the
            earlier inline `1fr` value blocked the 4-col desktop rule from
            ever taking effect. */}
        <div
          className="footer-top"
          style={{
            display:    'grid',
            gap:        '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* Display column — headline + tagline + CTAs + (future) subscribe.
              Pass 4 places this FIRST in source order so the desktop grid
              renders it as the leftmost column. */}
          <div className="footer-col-display">
            <h2
              style={{
                fontFamily:    'var(--font-display), "Barlow Condensed", system-ui, sans-serif',
                fontSize:      'clamp(1.75rem, 3.5vw, 2.75rem)',
                fontWeight:    900,
                lineHeight:    0.92,
                letterSpacing: '-0.012em',
                textTransform: 'uppercase',
                margin:        0,
              }}
            >
              <span>{t('display.read')}</span>{' '}
              <span style={{ color: 'var(--footer-red)' }}>{t('display.share')}</span>{' '}
              <span>{t('display.multiply')}</span>
            </h2>

            <p
              style={{
                marginTop:  '1rem',
                fontSize:   '0.9375rem',
                lineHeight: 1.5,
                color:      'var(--footer-text-soft)',
              }}
            >
              {t('tagline')}
            </p>

            <div
              className="footer-ctas"
              style={{
                marginTop:     '1.25rem',
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'flex-start',
                gap:           '0.75rem',
              }}
            >
              <Link href="/content" style={pillRedStyle}>
                {t('cta.browse')}
              </Link>
              <FooterSubscribeForm />
            </div>
          </div>

          <div className="footer-col-content">
            <FooterColumn label={t('columns.content')}>
              {/* Pass 5b — point at the canonical /topic/[type] landing for each content type.
                  Header now uses the same route, so footer + header stay in sync. */}
              <FooterLink href={{ pathname: '/topic/[type]', params: { type: 'manual'   } }}>{t('links.manuals')}</FooterLink>
              <FooterLink href={{ pathname: '/topic/[type]', params: { type: 'prophecy' } }}>{t('links.prophecies')}</FooterLink>
              <FooterLink href={{ pathname: '/topic/[type]', params: { type: 'article'  } }}>{t('links.articles')}</FooterLink>
              <FooterLink href={{ pathname: '/topic/[type]', params: { type: 'blog'     } }}>{t('links.blog')}</FooterLink>
            </FooterColumn>
          </div>

          <div className="footer-col-browse">
            <FooterColumn label={t('columns.browse')}>
              <FooterLink href="/content">{t('links.allContent')}</FooterLink>
              {/* Pass 5b — `latest` is just /content sorted newest-first (already the default), so we point straight at it. */}
              <FooterLink href="/content">{t('links.latest')}</FooterLink>
              <FooterLink href="/topics">{t('links.topics')}</FooterLink>
              <FooterLink href="/authors">{t('links.authors')}</FooterLink>
            </FooterColumn>
          </div>

          <div className="footer-col-about">
            <FooterColumn label={t('columns.about')}>
              <FooterExternalLink href={EXTERNAL_LINKS.loveseal}>{t('links.loveseal')}</FooterExternalLink>
              <FooterExternalLink href={EXTERNAL_LINKS.story}>{t('links.story')}</FooterExternalLink>
              <FooterExternalLink href={EXTERNAL_LINKS.contact}>{t('links.contact')}</FooterExternalLink>
              <FooterExternalLink href={EXTERNAL_LINKS.give}>{t('links.give')}</FooterExternalLink>
            </FooterColumn>
          </div>
        </div>

        {/* ─── HAIRLINE DIVIDER ──────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            marginTop:    '3rem',
            marginBottom: '1.5rem',
            height:       '0.0625rem',
            background:   'var(--footer-divider)',
          }}
        />

        {/* ─── BOTTOM ROW: brand · socials · langs/copyright ──────────── */}
        <div
          className="footer-bottom"
          style={{
            display:        'flex',
            flexWrap:       'wrap',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            '1.5rem',
          }}
        >
          {/* Bottom-left: small red tile + Lively Resources wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BrandChip />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display), "Barlow Condensed", system-ui, sans-serif',
                  fontSize:   '1.375rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color:      'var(--footer-text)',
                }}
              >
                {BRAND.short}
              </div>
              <div
                style={{
                  marginTop:     '0.25rem',
                  fontSize:      '0.6875rem',
                  fontStyle:     'italic',
                  letterSpacing: '0.04em',
                  color:         'var(--footer-text-faint)',
                }}
              >
                {BRAND.byline}
              </div>
            </div>
          </div>

          {/* Bottom-center: JOIN US label + 5 monochrome socials */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <span
              style={{
                fontSize:      '0.75rem',
                fontWeight:    700,
                letterSpacing: '0.2em',
                color:         'var(--footer-text-faint)',
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
                  className="footer-social"
                  style={{
                    display:         'inline-flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    width:           '2.25rem',
                    height:          '2.25rem',
                    borderRadius:    '50%',
                    color:           '#FFFFFF',
                    background:      s.background ?? 'rgba(255,255,255,0.15)',
                    backgroundImage: s.gradient,
                    textDecoration:  'none',
                    flexShrink:      0,
                    transition:      'opacity 0.18s, transform 0.12s',
                  } as React.CSSProperties}
                >
                  <SocialIcon name={s.icon} size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom-right: language list · copyright */}
          <div
            style={{
              display:    'flex',
              alignItems: 'center',
              flexWrap:   'wrap',
              gap:        '0.75rem 1.5rem',
              fontSize:   '0.75rem',
              color:      'var(--footer-text-dim)',
            }}
          >
            <span>{langLabel}</span>
            <span>{t('copyright', { year, parent: BRAND.parent })}</span>
          </div>
        </div>
      </div>

      {/* Responsive layout + social hover ─────────────────────────────── */}
      <style>{`
        /* Social icon hover — slight opacity lift so the always-visible
           brand circle dims subtly on hover, indicating interactivity. */
        .footer-social:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        /* Link hover — lighten muted footer links toward full white. */
        footer .footer-col-content a:hover,
        footer .footer-col-browse  a:hover,
        footer .footer-col-about   a:hover {
          color: var(--footer-text);
        }

        /* Base (mobile-first, < 40rem): single-column stack.
           No 'grid-template-columns' was set inline, so we declare it
           here explicitly. */
        footer .footer-top {
          grid-template-columns: 1fr;
        }

        /* Desktop ≥ 64rem: 4 columns — display first (widest), then 3 nav cols.
           Pass 4: display moved to leftmost position. Source order matches
           visual order so no grid-template-areas trickery needed at desktop. */
        @media (min-width: 64rem) {
          footer .footer-top {
            grid-template-columns:
              minmax(0, 1.6fr)
              minmax(0, 0.7fr)
              minmax(0, 0.7fr)
              minmax(0, 0.7fr);
            gap: 3rem;
          }
        }

        /* Below 1024px (anything < 64rem and ≥ 25rem ~= 400px):
           Display column on its own row (full width), then a 2×2 nav grid
           below with CONTENT and BROWSE on the first nav row and ABOUT
           spanning both columns on the second nav row. This is the "2 cols,
           2 rows" layout for the nav columns while keeping the display
           block visible at full width — switching the display block to
           a quarter-cell crammed it visually.

           If you want the display column to instead share the grid as
           a peer cell (true 2×2 with READ.SHARE.MULTIPLY. in one cell),
           change the areas to:
             "display content"
             "browse  about"
           and the templateColumns to repeat(2, 1fr). */
        @media (min-width: 25rem) and (max-width: 63.9375rem) {
          footer .footer-top {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-areas:
              "display display"
              "content browse"
              "about   about";
            gap: 2.25rem 1.5rem;
          }
          footer .footer-col-display { grid-area: display; }
          footer .footer-col-content { grid-area: content; }
          footer .footer-col-browse  { grid-area: browse; }
          footer .footer-col-about   { grid-area: about; }
        }

        /* Mobile < 25rem (very narrow phones / split-screen):
           Fully vertical stack — each column takes its own row. */
        @media (max-width: 24.9375rem) {
          footer .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
        }

        /* Bottom row also collapses to a vertical stack below 40rem
           regardless of the 2-col nav grid above. */
        @media (max-width: 40rem) {
          footer .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
        }
      `}</style>
    </footer>
  )
}

/* ─── Sub-components & shared styles ────────────────────────────────── */

/**
 * Small fixed-colour brand chip in the footer bottom-left.
 *
 * NOT theme-switching — always red background, always white text. The
 * "lively" line uses Barlow Condensed (matches display family). Inlined
 * here because there's exactly one consumer.
 */
function BrandChip() {
  return (
    <div
      aria-hidden="true"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'flex-start',
        justifyContent: 'center',
        width:          '3.5rem',
        height:         '2.75rem',
        padding:        '0 0.5rem',
        background:     'var(--footer-red)',
        color:          'var(--footer-text)',
        fontFamily:     'var(--font-display), "Barlow Condensed", system-ui, sans-serif',
        lineHeight:     1,
      }}
    >
      <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
        lively
      </span>
      <span
        style={{
          marginTop:     '0.125rem',
          fontSize:      '0.4375rem',
          fontWeight:    700,
          letterSpacing: '0.16em',
        }}
      >
        RESOURCES
      </span>
    </div>
  )
}

function FooterColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize:      '0.6875rem',
          fontWeight:    700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color:         'var(--footer-text-label)',
          marginBottom:  '0.875rem',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {children}
      </div>
    </div>
  )
}

type FooterLinkProps = {
  href:     React.ComponentProps<typeof Link>['href']
  children: React.ReactNode
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <Link href={href} style={footerLinkStyle}>{children}</Link>
  )
}

/**
 * External link in the footer. Always `target="_blank"`, always
 * `rel="noopener noreferrer"`. Uses native <a>, not next-intl Link.
 */
function FooterExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={footerLinkStyle}
    >
      {children}
    </a>
  )
}

const footerLinkStyle: React.CSSProperties = {
  fontSize:       '0.875rem',
  color:          'var(--footer-text-muted)',
  textDecoration: 'none',
  transition:     'color 0.12s',
  lineHeight:     1.4,
}

const pillRedStyle: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  height:         '2.625rem',
  padding:        '0 1.375rem',
  fontSize:       '0.875rem',
  fontWeight:     500,
  color:          'var(--footer-text)',
  background:     'var(--footer-red)',
  borderRadius:   '999rem',
  textDecoration: 'none',
  whiteSpace:     'nowrap',
  lineHeight:     1,
  transition:     'background-color 0.12s',
}