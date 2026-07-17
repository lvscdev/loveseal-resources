import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import { CollectionPageSchema } from '@/components/brand/Schema'
import TopicHeader from '@/components/topic/TopicHeader'
import TopicGrid from '@/components/topic/TopicGrid'
import { isContentType, typeAccentColor, typeNavKey } from '@/lib/topic'

export const revalidate = 3600

interface PageParams {
  params: Promise<{ locale: string; type: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, type } = await params

  // Unknown type → no metadata. notFound() inside the page does the actual
  // 404 routing; this just avoids a misleading meta title on the 404 response.
  if (!isContentType(type)) return {}

  const tNav     = await getTranslations({ locale, namespace: 'nav' })
  const tTopic   = await getTranslations({ locale, namespace: 'topic' })
  const typeName = tNav(typeNavKey(type))

  return {
    title:       `${typeName} — ${tTopic('eyebrow.type')}`,
    description: tTopic('typeBody', { type: typeName.toLowerCase() }),
    alternates:  metadataAlternates(locale, `/topic/${type}`),
  }
}

export default async function TopicTypePage({ params }: PageParams) {
  const { locale, type } = await params
  setRequestLocale(locale)

  if (!isContentType(type)) notFound()

  const tNav     = await getTranslations({ locale, namespace: 'nav' })
  const tTopic   = await getTranslations({ locale, namespace: 'topic' })
  const tLibrary = await getTranslations({ locale, namespace: 'library' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select(`
      id, slug, title, content_type, theme, speaker, series,
      date_preached, cover_image_url, summary_points, published_at
    `)
    .eq('status', 'published')
    .eq('content_type', type)
    .order('published_at', { ascending: false })

  const items = (data ?? []) as Parameters<typeof TopicGrid>[0]['items']

  /* Breadcrumb: Home → Library → {Type}. Mirrors the library page's pattern. */
  const pageUrl = localeUrl(locale, `/topic/${type}`)
  const typeName = tNav(typeNavKey(type))
  const breadcrumb = [
    { name: tNav('home'),      url: localeUrl(locale, '') },
    { name: tLibrary('title'), url: localeUrl(locale, '/content') },
    { name: typeName,          url: pageUrl },
  ]

  return (
    <div style={{
      /* Centered topic page — uses --width-content (1280px). */
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 4rem',
    }}>
      <CollectionPageSchema
        title={typeName}
        description={tTopic('typeBody', { type: typeName.toLowerCase() })}
        url={pageUrl}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />

      <TopicHeader
        eyebrow={tTopic('eyebrow.type')}
        title={typeName}
        body={tTopic('typeBody', { type: typeName.toLowerCase() })}
        countLabel={tLibrary('itemsCount', { count: items.length })}
        accentColor={typeAccentColor(type)}
      />

      <TopicGrid
        items={items}
        emptyMessage={tTopic('emptyType', { type: typeName.toLowerCase() })}
      />
    </div>
  )
}