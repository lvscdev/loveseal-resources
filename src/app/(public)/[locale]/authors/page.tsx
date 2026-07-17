import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import { CollectionPageSchema } from '@/components/brand/Schema'
import { getAllAuthorsWithCounts } from '@/lib/authors'
import TopicHeader from '@/components/topic/TopicHeader'
import AuthorCard from '@/components/authors/AuthorCard'

export const revalidate = 3600

interface PageParams {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'authors' })
  return {
    title:       t('indexTitle'),
    description: t('indexBody'),
    alternates:  metadataAlternates(locale, '/authors'),
  }
}

export default async function AuthorsIndexPage({ params }: PageParams) {
  const { locale } = await params
  setRequestLocale(locale)

  const tNav     = await getTranslations({ locale, namespace: 'nav' })
  const tAuthors = await getTranslations({ locale, namespace: 'authors' })

  const authors = await getAllAuthorsWithCounts()

  /* Hide authors with zero published content from the index. They might
     exist as empty rows (created in admin but not yet assigned), and the
     public view shouldn't surface them. The /admin/authors page does show
     them so admins can find and edit/delete. */
  const visibleAuthors = authors.filter(a => a.content_count > 0)

  const pageUrl = localeUrl(locale, '/authors')
  const breadcrumb = [
    { name: tNav('home'),            url: localeUrl(locale, '') },
    { name: tAuthors('indexTitle'),  url: pageUrl },
  ]

  return (
    <div style={{
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 4rem',
    }}>
      <CollectionPageSchema
        title={tAuthors('indexTitle')}
        description={tAuthors('indexBody')}
        url={pageUrl}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />

      <TopicHeader
        eyebrow={tAuthors('eyebrow')}
        title={tAuthors('indexTitle')}
        body={tAuthors('indexBody')}
        countLabel={tAuthors('authorsCount', { count: visibleAuthors.length })}
      />

      {visibleAuthors.length === 0 ? (
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
          {tAuthors('empty')}
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 17rem), 1fr))',
          gap:                 '0.75rem',
        }}>
          {visibleAuthors.map(author => (
            <AuthorCard
              key={author.id}
              slug={author.slug}
              name={author.name}
              avatarUrl={author.avatar_url}
              countLabel={tAuthors('itemsCount', { count: author.content_count })}
            />
          ))}
        </div>
      )}

      <style>{`
        .author-card-tile:hover {
          border-color: var(--border-strong) !important;
          transform: translateY(-0.0625rem);
        }
      `}</style>
    </div>
  )
}