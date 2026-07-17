/**
 * Slug generator with honorific stripping.
 *
 * Used by the admin Author editor when an admin types a name and we want
 * to suggest a slug without forcing them to type it.
 *
 * MUST STAY IN SYNC with the SQL `strip_honorifics_and_slugify(text)`
 * function in `20260518_pass5c_authors.sql`. Same input → same output.
 * If you change the honorifics list or the slugification logic here,
 * update the migration's PL/pgSQL function to match — otherwise the
 * backfill-time slug and the admin-time slug will disagree on names
 * containing honorifics.
 *
 * The honorifics list also mirrors InitialsAvatar's HONORIFICS set (used
 * for picking the right initials) — keep all three in sync.
 */

const HONORIFICS = new Set([
  'pastor',
  'dr', 'dr.',
  'rev', 'rev.',
  'mr', 'mr.',
  'mrs', 'mrs.',
  'ms', 'ms.',
  'sir',
  'lady',
])

/**
 * Strip a leading honorific (if any), lowercase, replace non-alphanumerics
 * with hyphens, collapse hyphen runs, trim leading/trailing hyphens.
 *
 *   "Pastor Ada Mensah" → "ada-mensah"
 *   "Dr. Femi"          → "femi"
 *   "Femi Olawale"      → "femi-olawale"
 *   ""                  → ""  (caller decides what to do with empty)
 */
/**
 * Convert a content title into a URL-safe slug.
 *
 *   "God's Harvest in Coming Days" → "gods-harvest-in-coming-days"
 *   "Vision: The Latter Times!"    → "vision-the-latter-times"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')   // non-alphanum → space
    .trim()
    .replace(/[\s-]+/g, '-')          // whitespace / hyphens → single hyphen
    .replace(/^-|-$/g, '')            // trim edge hyphens
    .slice(0, 100)
}

export function slugifyAuthorName(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''

  // Drop a leading honorific if present.
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const firstLower = tokens[0]?.toLowerCase() ?? ''
  const startsWithHonorific = HONORIFICS.has(firstLower)
  const remaining = startsWithHonorific ? tokens.slice(1) : tokens
  const cleaned = remaining.length > 0 ? remaining.join(' ') : trimmed

  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}