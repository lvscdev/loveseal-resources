import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { localeUrl } from '@/lib/locale-urls'
import { CONTENT_TYPE_PREFIX } from '@/lib/content-url'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* This route now only exists for backward-compat redirects.
   All content is served from /manuals/, /prophecies/, /articles/, /blogs/. */
export default async function ContentSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const query = supabase
    .from('content')
    .select('id, slug, content_type')
    .eq('status', 'published')

  const { data: row } = UUID_RE.test(slug)
    ? await query.eq('id', slug).single()
    : await query.eq('slug', slug).single()

  if (!row) notFound()

  const r = row as { id: string; slug: string | null; content_type: string }
  const prefix     = CONTENT_TYPE_PREFIX[r.content_type as keyof typeof CONTENT_TYPE_PREFIX] ?? 'content'
  const targetSlug = r.slug ?? (UUID_RE.test(slug) ? slug : slug)

  redirect(localeUrl(locale, `/${prefix}/${targetSlug}`))
}
