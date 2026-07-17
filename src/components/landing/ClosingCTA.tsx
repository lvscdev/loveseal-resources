import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import FooterSubscribeForm from '@/components/public/FooterSubscribeForm'

/**
 * Full-width dark slab before the footer — "READ. SHARE. MULTIPLY."
 * Matches the design's closing CTA section exactly:
 *   - Dark ink background (#14110D)
 *   - Large Barlow Condensed headline with red "SHARE." accent
 *   - Body copy beneath
 *   - Two CTAs: red Browse pill + outline Subscribe pill
 */
export default async function ClosingCTA() {
  const t = await getTranslations('footer')

  return (
    <section style={{ maxWidth: 'var(--width-site)', marginInline: 'auto', width: '100%', padding: '6rem var(--page-inline-padding) 5rem' }}>
      <div style={{
        background:   '#14110D',
        color:        '#FFFFFF',
        borderRadius: '1.75rem',
        padding:      'clamp(3.5rem, 8vw, 5.5rem) clamp(2rem, 6vw, 4rem)',
        textAlign:    'center',
        position:     'relative',
        overflow:     'hidden',
      }}>
        <h2 style={{
          fontFamily:    'var(--font-display), "Barlow Condensed", system-ui, sans-serif',
          fontSize:      'clamp(2.5rem, 8vw, 6rem)',
          fontWeight:    800,
          lineHeight:    0.95,
          letterSpacing: '-0.012em',
          textTransform: 'uppercase',
          margin:        0,
        }}>
          {t('display.read')}{' '}
          <span style={{ color: '#C32126' }}>{t('display.share')}</span>
          <br />
          {t('display.multiply')}
        </h2>

        <p style={{
          marginTop:  '1.5rem',
          fontSize:   'clamp(0.9375rem, 1.5vw, 1.0625rem)',
          lineHeight: 1.55,
          color:      'rgba(255,255,255,0.7)',
          maxWidth:   '32.5rem',
          margin:     '1.5rem auto 0',
        }}>
          {t('tagline')}
        </p>

        <div style={{
          marginTop:      '2rem',
          display:        'inline-flex',
          gap:            '0.75rem',
          flexWrap:       'wrap',
          justifyContent: 'center',
        }}>
          <Link
            href="/content"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '2.875rem',
              padding:        '0 1.75rem',
              fontSize:       '0.9375rem',
              fontWeight:     500,
              color:          '#FFFFFF',
              background:     '#C32126',
              borderRadius:   '999rem',
              textDecoration: 'none',
              whiteSpace:     'nowrap',
              lineHeight:     1,
            }}
          >
            {t('cta.browse')}
          </Link>

          <FooterSubscribeForm />
        </div>
      </div>
    </section>
  )
}
