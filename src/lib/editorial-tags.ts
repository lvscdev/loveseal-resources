/**
 * Server-side helper for the admin-curated "In focus this week" tags.
 *
 * Reads `editorial_tags` rows where `is_active = true`, ordered by `position`
 * ascending. Returns up to `limit` tags (default 5 — the strip is designed
 * for exactly 5 slots but the limit is configurable in case the design ever
 * expands).
 *
 * Used by `InFocusStrip` as the PRIMARY source. When the editorial table is
 * empty, the strip falls back to `getTopRecentSearchTerms()` which itself
 * falls back to `content.tags[]` aggregation — three tiers total. The strip
 * only self-hides when ALL three are empty.
 *
 * The `as never` cast on `.from('editorial_tags')` mirrors the project-wide
 * workaround for postgrest-js v2.49+ generic widening; it has no runtime
 * effect.
 */

import { createClient } from '@/lib/supabase/server'

export interface EditorialTag {
  id:        string
  tag:       string
  position:  number
  is_active: boolean
}

/**
 * Active editorial tags ordered by position ascending. Returns [] on any
 * error so the caller can fall through to the secondary feed without a
 * branch on success/failure.
 */
export async function getActiveEditorialTags(limit: number = 5): Promise<EditorialTag[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_tags')
      .select('id, tag, position, is_active')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error || !data) return []
    return data as EditorialTag[]
  } catch {
    return []
  }
}

/**
 * Full list (active + inactive) for the admin manager. Ordered by position
 * ascending, then created_at ascending. No limit.
 */
export async function getAllEditorialTags(): Promise<EditorialTag[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_tags')
      .select('id, tag, position, is_active')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error || !data) return []
    return data as EditorialTag[]
  } catch {
    return []
  }
}