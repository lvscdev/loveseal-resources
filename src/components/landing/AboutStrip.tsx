'use client'

import { useTranslations } from 'next-intl'
import { BRAND } from '@/components/brand/Brand'
import RevealOnScroll from './RevealOnScroll'

export default function AboutStrip() {
  const t = useTranslations('about')

  return (
    <section style={{
      /* Centered section, capped at --width-content (1280px). Horizontal
         padding from --page-inline-padding so the section's edges align
         with the rest of the site chrome below the cap; on viewports
         wider than 1280px the side margin grows naturally. */
      maxWidth: 'var(--width-site)',
      margin:   '0 auto',
      padding:  '5rem var(--page-inline-padding)',
    }}>
      <div className="about-grid" style={{
        background: 'var(--bg-elevated, #F5F5F5)',
        borderRadius: '1.75rem',
        padding: 'clamp(36px, 6vw, 72px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(2rem, 5vw, 3.5rem)',
        alignItems: 'center',
      }}>
        {/* Background accent */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          insetInlineEnd: '-80px',
          width: '320px',
          height: '320px',
          background: 'var(--brand-red)',
          opacity: 0.04,
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* LEFT — eyebrow + headline */}
        <div>
          <RevealOnScroll>
            <p style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--brand-red)',
              marginBottom: '20px',
            }}>
              {t('eyebrow')}
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.05}>
            <p style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: 'clamp(28px, 4.4vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.0,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              letterSpacing: '-0.012em',
              margin: 0,
            }}>
              {t.rich('headline', {
                highlight: (chunks) => (
                  <span style={{ color: 'var(--brand-red)' }}>{chunks}</span>
                ),
              })}
            </p>
          </RevealOnScroll>
        </div>

        {/* RIGHT — body copy + stats */}
        <div>
          <RevealOnScroll delay={0.1}>
            <p style={{
              fontSize: '17px',
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              maxWidth: '31.25rem',
              marginBottom: '2rem',
            }}>
              {t('body', { parent: BRAND.parent })}
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '18px',
            }}>
              <ValueStat number="4"  label={t('stats.types')} />
              <ValueStat number="5"  label={t('stats.languages')} />
              <ValueStat number="100%" label={t('stats.readable')} />
              <ValueStat number="$0" label={t('stats.cost')} />
            </div>
          </RevealOnScroll>
        </div>
      </div>

      <style>{`
        @media (max-width: 48rem) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function ValueStat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontSize: 'clamp(2rem, 3.5vw, 2.375rem)',
        fontWeight: 800,
        color: 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: '4px',
        letterSpacing: '-0.02em',
      }}>
        {number}
      </div>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>
        {label}
      </div>
    </div>
  )
}