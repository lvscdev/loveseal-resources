/**
 * Data helpers for the Authors feature (Pass 5c).
 *
 * Centralises the Supabase reads so `/authors`, `/authors/[slug]`, and the
 * admin pages all agree on the shape of an author row and how content is
 * counted per author. Pages call these directly — there's no client cache
 * layer here; ISR + `revalidate = 3600` on the page-level handles it.
 */

import { createClient } from '@/lib/supabase/server'

export interface AuthorRow {
  id:         string
  name:       string
  slug:       string
  bio:        string | null
  avatar_url: string | null
  created_at: string
}

export interface AuthorWithCount extends AuthorRow {
  /** Number of published content rows whose `author_id` points here. */
  content_count: number
}

/**
 * All authors with a per-author published-content count, sorted by content
 * count desc, then alphabetically. Used by `/authors` and `/admin/authors`.
 *
 * Two queries because Supabase's count aggregation can't be combined with
 * the row data in a single Postgrest call without a custom RPC. At
 * church-scale (≪1k authors) this is fine; if the library ever grows past
 * 10k authors we can switch to a proper RPC.
 */
export async function getAllAuthorsWithCounts(): Promise<AuthorWithCount[]> {
  const supabase = await createClient()

  const [{ data: authors }, { data: contentRows }] = await Promise.all([
    supabase.from('authors').select('*'),
    supabase
      .from('content')
      .select('author_id')
      .eq('status', 'published')
      .not('author_id', 'is', null),
  ])

  if (!authors) return []

  // Count occurrences of each author_id across published content.
  const counts = new Map<string, number>()
  for (const row of (contentRows ?? []) as Array<{ author_id: string | null }>) {
    if (row.author_id) {
      counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1)
    }
  }

  return (authors as AuthorRow[])
    .map(a => ({ ...a, content_count: counts.get(a.id) ?? 0 }))
    .sort((a, b) => (b.content_count - a.content_count) || a.name.localeCompare(b.name))
}

/**
 * Resolve an author by their URL slug. Returns null if missing.
 */
export async function getAuthorBySlug(slug: string): Promise<AuthorRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('authors')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as AuthorRow | null) ?? null
}

/**
 * Published content for a given author_id, newest first. Optional
 * content_type filter for the segment-row UI on the profile page.
 */
export async function getContentByAuthor(
  authorId:    string,
  contentType: 'manual' | 'prophecy' | 'article' | 'blog' | 'all' = 'all',
) {
  const supabase = await createClient()

  let query = supabase
    .from('content')
    .select(`
      id, slug, title, content_type, theme, speaker, series,
      date_preached, cover_image_url, summary_points, published_at
    `)
    .eq('status', 'published')
    .eq('author_id', authorId)
    .order('published_at', { ascending: false })

  if (contentType !== 'all') {
    query = query.eq('content_type', contentType)
  }

  const { data } = await query
  return (data ?? []) as Array<{
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
  }>
}

/**
 * Per-type breakdown for an author's published content. Drives the segment
 * row on the profile page (only show tabs that actually have content).
 */
export async function getContentTypesForAuthor(authorId: string): Promise<{
  manual:   number
  prophecy: number
  article:  number
  blog:     number
  total:    number
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select('content_type')
    .eq('status', 'published')
    .eq('author_id', authorId)

  const breakdown = { manual: 0, prophecy: 0, article: 0, blog: 0, total: 0 }
  for (const row of (data ?? []) as Array<{ content_type: 'manual' | 'prophecy' | 'article' | 'blog' }>) {
    breakdown[row.content_type] += 1
    breakdown.total += 1
  }
  return breakdown
}