import { setRequestLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import ContentReader from '@/components/reader/ContentReader'
import { ArticlePageSchema } from '@/components/brand/Schema'
import { BRAND } from '@/components/brand/Brand'
import { fetchContentDetail, generateContentMetadata } from '@/lib/content-detail'
import { localeUrl } from '@/lib/locale-urls'

export const revalidate = 3600

interface PageParams { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug, locale } = await params
  return generateContentMetadata(slug, locale, 'manual')
}

export default async function ManualsDetailPage({ params }: PageParams) {
  const { slug, locale } = await params
  setRequestLocale(locale)

  const tNav     = await getTranslations({ locale, namespace: 'nav' })
  const tLibrary = await getTranslations({ locale, namespace: 'library' })

  const { item, attachments, signedPdfUrl, translationStatus, prefix, seriesItems, relatedItems } =
    await fetchContentDetail(slug, locale, 'manual')

  let description = ''
  if (item.summary_points?.length > 0) {
    description = item.summary_points.slice(0, 2).join('. ')
  } else if (item.body_html) {
    description = item.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
  } else if (item.extracted_text) {
    description = item.extracted_text.replace(/\s+/g, ' ').trim().slice(0, 200)
  }

  const articleUrl = localeUrl(locale, `/${prefix}/${item.slug ?? item.id}`)
  const breadcrumb = [
    { name: tNav('home'),      url: localeUrl(locale, '') },
    { name: tLibrary('title'), url: localeUrl(locale, '/content') },
    { name: item.title,        url: articleUrl },
  ]

  return (
    <>
      <ArticlePageSchema
        title={item.title}
        description={description || `${item.content_type} from ${BRAND.parent}`}
        url={articleUrl}
        imageUrl={item.cover_image_url}
        authorName={item.speaker}
        publishedAt={item.published_at}
        updatedAt={item.updated_at}
        contentType={item.content_type}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />
      <ContentReader
        item={item}
        attachments={attachments}
        signedPdfUrl={signedPdfUrl}
        translationStatus={translationStatus}
        sourceLanguage={item.language}
        seriesItems={seriesItems}
        relatedItems={relatedItems}
      />
    </>
  )
}
