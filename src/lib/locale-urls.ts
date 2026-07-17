/**
 * Shared helpers for building locale-prefixed URLs and the hreflang
 * `alternates.languages` object used in both `generateMetadata` and the sitemap.
 *
 * Mirrors the routing config:
 *   - English uses no prefix (`/`, `/content`, …)
 *   - Other locales prefixed (`/es`, `/fr/content`, …)
 *
 * Always include `x-default` pointing at the canonical (English) URL — Google
 * uses this when no other language matches the user's preferences.
 */

import { routing } from '@/i18n/routing'

export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

/** Build a full URL for a given locale and pathname. */
export function localeUrl(locale: string, path: string): string {
  const base = getBaseUrl()
  if (locale === routing.defaultLocale) return `${base}${path}`
  return `${base}/${locale}${path}`
}

/**
 * Build a Next.js `alternates.languages` object for a given path.
 * Keys are BCP-47 language codes; values are absolute URLs.
 *
 * Result is the shape `Metadata.alternates.languages` expects.
 */
export function alternateLanguages(path: string): Record<string, string> {
  const langs: Record<string, string> = {}
  routing.locales.forEach(loc => {
    langs[loc] = localeUrl(loc, path)
  })
  // x-default → canonical English URL
  langs['x-default'] = localeUrl(routing.defaultLocale, path)
  return langs
}

/**
 * Convenience: full `alternates` block for `Metadata`, including canonical.
 *
 * Pass the locale-agnostic path (e.g. '/content' or '/content/abc-123').
 * The canonical is set to the *current* locale's URL — which prevents
 * duplicate content issues when the same page is reachable at /es/content
 * and the translation actually exists.
 */
export function metadataAlternates(currentLocale: string, path: string) {
  return {
    canonical: localeUrl(currentLocale, path),
    languages: alternateLanguages(path),
  }
}