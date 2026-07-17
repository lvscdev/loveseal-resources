import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import { CollectionPageSchema } from '@/components/brand/Schema'
import TopicHeader from '@/components/topic/TopicHeader'
import TopicGrid from '@/components/topic/TopicGrid'
import { getAllTagsWithCounts } from '@/lib/content-tags'

export const revalidate = 3600

interface PageParams {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params

  /* Look up the display label so the page title reads "#prayer — Topic"
     rather than "#prayer". Falls back to the raw slug if the tag has been
     deleted out from under us. */
  const tags = await getAllTagsWithCounts()
  const tag = tags.find(t => t.slug === slug)
  if (!tag) return {}

  const t = await getTranslations({ locale, namespace: 'topics' })

  return {
    title:      `#${tag.label} — ${t('eyebrow')}`,
    alternates: metadataAlternates(locale, `/topics/${slug}`),
  }
}

export default async function TopicTagPage({ params }: PageParams) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const tNav     = await getTranslations({ locale, namespace: 'nav' })
  const tTopics  = await getTranslations({ locale, namespace: 'topics' })
  const tLibrary = await getTranslations({ locale, namespace: 'library' })

  /* Resolve the slug back to a display label. We could query the content
     table directly with a `tags && ARRAY[...]` filter using slug variants,
     but going through the same aggregator the /topics index uses keeps
     the display name consistent ("#Prayer" not "#prayer"). */
  const tags = await getAllTagsWithCounts()
  const tag  = tags.find(t => t.slug === slug)
  if (!tag) notFound()

  /* Fetch published content where any tag (case-insensitive) matches the
     tag's label or where theme matches. Postgres array operators don't do
     case-insensitive natively, so we expand the slug into the recorded
     label variants and use the `overlaps` operator. */
  const supabase = await createClient()

  /* Collect every distinct casing of this tag from the bucketed aggregator
     so we can match content rows that recorded the tag in any of those
     forms. The aggregator already grouped by slug, so `tag.label` is the
     most-frequent variant — for matching we also need the others. */
  const allLabels = await collectLabelVariantsForSlug(slug)

  const { data } = await supabase
    .from('content')
    .select(`
      id, slug, title, content_type, theme, speaker, series,
      date_preached, cover_image_url, summary_points, published_at, tags
    `)
    .eq('status', 'published')
    .or(
      // tag array overlaps any recorded variant
      `tags.ov.{${allLabels.map(quote).join(',')}},` +
      // OR theme matches case-insensitively (themes are the same source pool)
      `theme.in.(${allLabels.map(quote).join(',')})`,
    )
    .order('published_at', { ascending: false })

  /* Belt-and-braces filter: trim to rows where any tag/theme matches the
     slug after normalisation. Defensive against `.or()` returning extra
     rows for unrelated reasons. */
  const items = ((data ?? []) as Array<{
    id:              string
    slug:            string | null
    title:           string
    content_type:    'manual' | 'prophecy' | 'article' | 'blog'
    theme:           string | null
    speaker:         string | null
    series:          string | null
    date_preached:   string | null
    cover_image_url: string | null
    summary_points:  string[] | null
    published_at:    string
    tags:            string[] | null
  }>).filter(row => {
    const allTokens = [
      ...(Array.isArray(row.tags) ? row.tags : []),
      row.theme ?? '',
    ]
    return allTokens.some(t => normalise(t) === slug)
  })

  const pageUrl = localeUrl(locale, `/topics/${slug}`)
  const breadcrumb = [
    { name: tNav('home'),     url: localeUrl(locale, '') },
    { name: tTopics('title'), url: localeUrl(locale, '/topics') },
    { name: `#${tag.label}`,  url: pageUrl },
  ]

  return (
    <div style={{
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 4rem',
    }}>
      <CollectionPageSchema
        title={`#${tag.label}`}
        description={tTopics('tagBody', { tag: tag.label })}
        url={pageUrl}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />

      <TopicHeader
        eyebrow={tTopics('tagEyebrow')}
        title={`#${tag.label}`}
        body={tTopics('tagBody', { tag: tag.label })}
        countLabel={tLibrary('itemsCount', { count: items.length })}
      />

      <TopicGrid
        items={items}
        emptyMessage={tTopics('emptyTag', { tag: tag.label })}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Helpers — kept local because they're tightly coupled to this page's
   case-insensitive tag-matching logic. If a second page ever needs them
   they're easy to lift into lib/content-tags.ts.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Re-runs the aggregator to collect every recorded label variant for a
 * given slug. Two calls per page render is fine — both are cached by
 * `revalidate = 3600`.
 */
async function collectLabelVariantsForSlug(slug: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select('tags, theme')
    .eq('status', 'published')

  const variants = new Set<string>()
  for (const row of (data ?? []) as Array<{ tags: string[] | null; theme: string | null }>) {
    for (const raw of Array.isArray(row.tags) ? row.tags : []) {
      if (normalise(raw) === slug) variants.add(raw.trim())
    }
    if (row.theme && normalise(row.theme) === slug) variants.add(row.theme.trim())
  }
  // Fallback: at minimum, search by the slug itself so empty result sets
  // don't break the .or() filter syntax.
  if (variants.size === 0) variants.add(slug)
  return [...variants]
}

function normalise(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .toLowerCase()
    .trim()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .replace(/\s+/g, '-')
}

/** Postgrest `.or()` filter syntax needs values quoted when they contain commas
 *  or spaces. Wrap in double quotes and escape any embedded quotes. */
function quote(v: string): string {
  return `"${v.replace(/"/g, '\\"')}"`
}