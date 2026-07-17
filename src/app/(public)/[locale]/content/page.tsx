import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import { CollectionPageSchema } from '@/components/brand/Schema'
import PublicContentList from './PublicContentList'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'library' })
  return {
    title:       t('title'),
    description: t('body'),
    alternates:  metadataAlternates(locale, '/content'),
  }
}

export default async function PublicContentPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tLibrary = await getTranslations({ locale, namespace: 'library' })
  const tNav     = await getTranslations({ locale, namespace: 'nav' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select(`
      id, slug, title, content_type, language, category, tags,
      theme, lesson_number, speaker, series, date_preached, scripture_refs,
      cover_image_url, summary_points, published_at
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const items = (data ?? []) as Parameters<typeof PublicContentList>[0]['items']

  /* Breadcrumb: Home → Library. The final crumb (Library) points at this page. */
  const pageUrl = localeUrl(locale, '/content')
  const breadcrumb = [
    { name: tNav('home'),         url: localeUrl(locale, '') },
    { name: tLibrary('title'),    url: pageUrl },
  ]

  return (
    <div style={{
      /* Library index — centered, capped at --width-content (1280px). */
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 4rem',
    }}>
      <CollectionPageSchema
        title={tLibrary('title')}
        description={tLibrary('itemsCount', { count: items.length })}
        url={pageUrl}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />

      <div style={{ marginBottom: '28px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--brand-gold)',
          marginBottom: '10px',
        }}>
          {tLibrary('eyebrow')}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.96,
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          {tLibrary('title')}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-tertiary)',
        }}>
          {tLibrary('itemsCount', { count: items.length })}
        </p>
      </div>

      <PublicContentList items={items} locale={locale} />
    </div>
  )
}