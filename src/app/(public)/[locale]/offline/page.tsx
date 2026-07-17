import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { metadataAlternates } from '@/lib/locale-urls'
import OfflineCachedPages from './OfflineCachedPages'

export const dynamic = 'force-static'

interface PageParams {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'offline' })
  return {
    title:      t('title'),
    alternates: metadataAlternates(locale, '/offline'),
    robots:     { index: false, follow: false },
  }
}

export default async function OfflinePage({ params }: PageParams) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'offline' })

  return (
    <div style={{
      /* Narrow centered status page — uses --width-narrow (640px).
         Was 560px before consolidation; bumped to the token value for
         consistency with the not-found and content-list-sheet caps. */
      maxWidth:    'var(--width-narrow)',
      margin:      '0 auto',
      padding:     'clamp(3rem, 10vw, 6rem) var(--page-inline-padding)',
      textAlign:   'center',
      minHeight:   '60dvh',
      display:     'flex',
      flexDirection: 'column',
      alignItems:  'center',
      justifyContent: 'center',
      gap:         '1rem',
    }}>
      <div style={{
        fontSize:    '11px',
        fontWeight:  500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color:       'var(--brand-gold)',
      }}>
        {t('eyebrow')}
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontSize:   'clamp(40px, 8vw, 72px)',
        fontWeight: 900,
        lineHeight: 0.95,
        textTransform: 'uppercase',
        color:      'var(--text-primary)',
        letterSpacing: '-0.02em',
        margin:     '0',
      }}>
        {t('title')}
      </h1>

      <p style={{
        fontSize:   '16px',
        lineHeight: 1.6,
        color:      'var(--text-secondary)',
        maxWidth:   '40ch',
        margin:     '8px 0 0',
      }}>
        {t('body')}
      </p>

      <OfflineCachedPages />
    </div>
  )
}