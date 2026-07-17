import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import { CollectionPageSchema } from '@/components/brand/Schema'
import { getAllTagsWithCounts } from '@/lib/content-tags'
import TopicHeader from '@/components/topic/TopicHeader'

export const revalidate = 3600

interface PageParams {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'topics' })

  return {
    title:       t('title'),
    description: t('body'),
    alternates:  metadataAlternates(locale, '/topics'),
  }
}

export default async function TopicsIndexPage({ params }: PageParams) {
  const { locale } = await params
  setRequestLocale(locale)

  const tNav    = await getTranslations({ locale, namespace: 'nav' })
  const tTopics = await getTranslations({ locale, namespace: 'topics' })

  const tags = await getAllTagsWithCounts()

  const pageUrl = localeUrl(locale, '/topics')
  const breadcrumb = [
    { name: tNav('home'),    url: localeUrl(locale, '') },
    { name: tTopics('title'), url: pageUrl },
  ]

  /* Pre-format the count plurals on the server. We use the same library
     plural helper for consistency with other pages. */
  const countLabel = tTopics('tagsCount', { count: tags.length })

  return (
    <div style={{
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 4rem',
    }}>
      <CollectionPageSchema
        title={tTopics('title')}
        description={tTopics('body')}
        url={pageUrl}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />

      <TopicHeader
        eyebrow={tTopics('eyebrow')}
        title={tTopics('title')}
        body={tTopics('body')}
        countLabel={countLabel}
      />

      {tags.length === 0 ? (
        <div style={{
          padding:      '3rem 1rem',
          textAlign:    'center',
          background:   'var(--bg-raised)',
          border:       '0.0625rem solid var(--border-subtle)',
          borderRadius: '0.75rem',
          color:        'var(--text-tertiary)',
          fontSize:     '0.9375rem',
          lineHeight:   1.6,
        }}>
          {tTopics('empty')}
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 14rem), 1fr))',
          gap:                 '0.75rem',
        }}>
          {tags.map(tag => (
            <Link
              key={tag.slug}
              href={{ pathname: '/topics/[slug]', params: { slug: tag.slug } }}
              style={{
                display:        'flex',
                flexDirection:  'column',
                gap:            '0.375rem',
                padding:        '1rem 1.125rem',
                background:     'var(--bg-raised)',
                border:         '0.0625rem solid var(--border-subtle)',
                borderRadius:   '0.625rem',
                textDecoration: 'none',
                color:          'var(--text-primary)',
                transition:     'border-color 0.12s, transform 0.12s',
              }}
              className="topic-index-tile"
            >
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize:   '0.9375rem',
                fontWeight: 500,
                color:      'var(--text-primary)',
              }}>
                #{tag.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize:   '0.75rem',
                color:      'var(--text-tertiary)',
              }}>
                {tTopics('itemsCount', { count: tag.occurrences })}
              </span>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .topic-index-tile:hover {
          border-color: var(--border-strong) !important;
          transform: translateY(-0.0625rem);
        }
      `}</style>
    </div>
  )
}