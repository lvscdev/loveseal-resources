import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { localeUrl, metadataAlternates } from '@/lib/locale-urls'
import { BRAND } from '@/components/brand/Brand'
import { CONTENT_TYPE_PREFIX } from '@/lib/content-url'

export type ContentType = 'manual' | 'prophecy' | 'article' | 'blog'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CONTENT_FIELDS = `
  id, slug, title, content_type, source_mode, category, tags,
  theme, lesson_number, speaker, series, date_preached,
  scripture_refs, extracted_text, body_html, summary_points,
  pdf_url, cover_image_url, status, language, search_vector,
  read_time_minutes, author_id, created_by, last_edited_by,
  created_at, updated_at, published_at, audio_url, video_url,
  author:authors!content_author_id_fkey (
    id, name, slug, avatar_url
  )
`

export async function fetchContentDetail(
  slug: string,
  locale: string,
  contentType: ContentType,
) {
  const supabase = await createClient()
  const isUUID   = UUID_RE.test(slug)
  const prefix   = CONTENT_TYPE_PREFIX[contentType]

  if (isUUID) {
    const { data: row } = await supabase
      .from('content')
      .select('slug')
      .eq('id', slug)
      .eq('content_type', contentType)
      .eq('status', 'published')
      .single()
    if (!row) notFound()
    const rowSlug = (row as { slug: string | null }).slug
    if (rowSlug) redirect(localeUrl(locale, `/${prefix}/${rowSlug}`))
    // No slug yet — fall through and render by ID
  }

  const base = supabase
    .from('content')
    .select(CONTENT_FIELDS)
    .eq('content_type', contentType)
    .eq('status', 'published')

  const { data: rawItem } = isUUID
    ? await base.eq('id', slug).single()
    : await base.eq('slug', slug).single()

  if (!rawItem) notFound()

  const { data: attachments } = await supabase
    .from('content_attachments')
    .select('id, file_url, file_name, file_type, mime_type, size_bytes')
    .eq('content_id', (rawItem as { id: string }).id)
    .order('display_order')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = rawItem as any
  let translationStatus: 'native' | 'translated' | 'pending' = 'native'

  if (locale !== item.language) {
    const { data: rawTr } = await supabase
      .from('content_translations')
      .select('title, theme, series, speaker, body_html, extracted_text, summary_points, scripture_refs')
      .eq('content_id', item.id)
      .eq('locale', locale)
      .maybeSingle()

    if (rawTr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tr = rawTr as any
      item.title          = tr.title
      item.theme          = tr.theme          ?? item.theme
      item.series         = tr.series         ?? item.series
      item.body_html      = tr.body_html      ?? item.body_html
      item.extracted_text = tr.extracted_text ?? item.extracted_text
      item.summary_points = tr.summary_points ?? item.summary_points
      translationStatus = 'translated'
    } else {
      translationStatus = 'pending'
    }
  }

  let signedPdfUrl: string | null = null
  if (item.source_mode === 'pdf' && item.pdf_url) {
    const { data: signed } = await supabase.storage
      .from('content-pdfs')
      .createSignedUrl(item.pdf_url, 60 * 60)
    signedPdfUrl = signed?.signedUrl ?? null
  }

  let seriesItems: Array<{
    id: string; slug: string | null; title: string
    content_type: string; cover_image_url: string | null; published_at: string
  }> = []
  if (item.series) {
    const { data: siblings } = await supabase
      .from('content')
      .select('id, slug, title, content_type, cover_image_url, published_at')
      .eq('status', 'published')
      .eq('series', item.series)
      .neq('id', item.id)
      .order('published_at', { ascending: true })
      .limit(6)
    seriesItems = (siblings ?? []) as typeof seriesItems
  }

  // Related content — same category first (richer signal than content_type
  // alone), topped up with same-content_type items if the category didn't
  // yield enough. Shown at the bottom of every content page.
  type RelatedItem = {
    id: string; slug: string | null; title: string
    content_type: string; cover_image_url: string | null; published_at: string
  }
  let relatedItems: RelatedItem[] = []
  if (item.category) {
    const { data: byCategory } = await supabase
      .from('content')
      .select('id, slug, title, content_type, cover_image_url, published_at')
      .eq('status', 'published')
      .eq('category', item.category)
      .neq('id', item.id)
      .order('published_at', { ascending: false })
      .limit(6)
    relatedItems = (byCategory ?? []) as RelatedItem[]
  }
  if (relatedItems.length < 6) {
    const excludeIds = [item.id, ...relatedItems.map(r => r.id)]
    const { data: byType } = await supabase
      .from('content')
      .select('id, slug, title, content_type, cover_image_url, published_at')
      .eq('status', 'published')
      .eq('content_type', item.content_type)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(6 - relatedItems.length)
    relatedItems = [...relatedItems, ...((byType ?? []) as RelatedItem[])]
  }

  // Co-authors — secondary contributors, ordered by display_order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coAuthorRows } = await (supabase as any)
    .from('content_co_authors')
    .select('display_order, author:authors!content_co_authors_author_id_fkey(id, name, slug, avatar_url)')
    .eq('content_id', item.id)
    .order('display_order')

  type CoAuthor = { id: string; name: string; slug: string; avatar_url: string | null }
  const coAuthors: CoAuthor[] = (coAuthorRows ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.author)
    .filter(Boolean)

  item.co_authors = coAuthors

  return { item, attachments: attachments ?? [], signedPdfUrl, translationStatus, prefix, seriesItems, relatedItems }
}

export async function generateContentMetadata(
  slug: string,
  locale: string,
  contentType: ContentType,
): Promise<Metadata> {
  const supabase = await createClient()
  const prefix   = CONTENT_TYPE_PREFIX[contentType]

  const query = supabase
    .from('content')
    .select('id, language, title, theme, speaker, content_type, body_html, extracted_text, summary_points, cover_image_url, slug')
    .eq('status', 'published')
    .eq('content_type', contentType)

  const { data } = UUID_RE.test(slug)
    ? await query.eq('id', slug).single()
    : await query.eq('slug', slug).single()

  if (!data) {
    const t = await getTranslations({ locale, namespace: 'notFound' })
    return { title: t('title') }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = data as any
  let title      = item.title
  let theme      = item.theme
  let body       = item.body_html
  let extracted  = item.extracted_text
  let summaryPts = item.summary_points

  if (locale !== item.language) {
    const { data: tr } = await supabase
      .from('content_translations')
      .select('title, theme, body_html, extracted_text, summary_points')
      .eq('content_id', item.id)
      .eq('locale', locale)
      .maybeSingle()

    if (tr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trTyped = tr as any
      title      = trTyped.title      ?? title
      theme      = trTyped.theme      ?? theme
      body       = trTyped.body_html  ?? body
      extracted  = trTyped.extracted_text ?? extracted
      summaryPts = trTyped.summary_points ?? summaryPts
    }
  }

  let description = ''
  if (summaryPts?.length > 0) description = summaryPts.slice(0, 2).join('. ')
  else if (body) description = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
  else if (extracted) description = extracted.replace(/\s+/g, ' ').trim().slice(0, 200)
  if (description.length > 200) description = description.slice(0, 197) + '…'

  const titleSuffix = theme ? ` — ${theme}` : item.speaker ? ` — ${item.speaker}` : ''
  const path = `/${prefix}/${item.slug ?? slug}`

  return {
    title:       `${title}${titleSuffix}`,
    description: description || `${item.content_type} from ${BRAND.parent}`,
    alternates:  metadataAlternates(locale, path),
    openGraph: {
      title,
      description,
      type:   'article',
      url:    localeUrl(locale, path),
      images: item.cover_image_url ? [{ url: item.cover_image_url }] : undefined,
    },
    twitter: {
      card:  item.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  }
}
