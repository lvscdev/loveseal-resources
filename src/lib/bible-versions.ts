/**
 * Curated api.bible (scripture.api.bible) version list.
 *
 * IDs are stable public-domain Bible IDs.  NIV/ESV/NLT require the API key
 * holder to have licensed those translations in their api.bible account.
 *
 * Set BIBLE_API_KEY (server-only, no NEXT_PUBLIC_ prefix) in .env.local /
 * Vercel env vars to enable lookups.
 */

export interface BibleVersion {
  id:       string   // api.bible Bible ID
  label:    string   // Short label shown in the version picker
  fullName: string   // Full name for accessibility
}

export const BIBLE_VERSIONS: readonly BibleVersion[] = [
  { id: 'de4e12af7f28f599-01', label: 'KJV',  fullName: 'King James Version' },
  { id: '9879dbb7cfe39e4d-04', label: 'WEB',  fullName: 'World English Bible' },
  { id: '685d1470fe4d5c3b-01', label: 'ASV',  fullName: 'American Standard Version' },
  { id: 'f421fe261da7624f-01', label: 'ESV',  fullName: 'English Standard Version' },
  { id: '06125adad2d5898a-01', label: 'NIV',  fullName: 'New International Version' },
] as const

export const DEFAULT_VERSION = BIBLE_VERSIONS[0]
