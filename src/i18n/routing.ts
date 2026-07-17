import { defineRouting } from 'next-intl/routing'

/**
 * Routing config for next-intl.
 *
 * `pathnames` declares the typed routes so `<Link href={{ pathname, params }}>`
 * is type-checked and locale-aware. Only routes used inside typed Link calls
 * need to appear here; ad-hoc string hrefs (`href="/content"`) still work
 * without being declared.
 *
 * Today these route shapes are identical across locales, so each entry maps
 * to itself. If we ever want localised slugs (e.g. `/contenido` on `/es`,
 * `/contenu` on `/fr`), we can switch to per-locale variants here without
 * changing any call sites.
 *
 * Pass 5b — split the old `/topic/[slug]` route into:
 *   - `/topic/[type]`   for the 4 content-type filters
 *                       (type ∈ {manual, prophecy, article, blog} — singular,
 *                       matches the content_type enum so the page can pass
 *                       the slug straight to .eq('content_type', ...))
 *   - `/topics`         tag index (new concept)
 *   - `/topics/[slug]`  single-tag landing
 *   - `/authors`        author index — built in Pass 5c
 *   - `/authors/[slug]` author profile — built in Pass 5c
 *
 *   `latest` is no longer a topic slug; it's just `/content` (already sorted
 *   newest-first), so the footer points there directly.
 */
export const routing = defineRouting({
  locales:       ['en', 'es', 'fr', 'pt', 'ar'] as const,
  defaultLocale: 'en',
  localePrefix:  'as-needed', // / for English, /fr/, /es/, etc. for others

  pathnames: {
    '/':                    '/',
    '/content':             '/content',
    '/content/[slug]':      '/content/[slug]',
    '/manuals/[slug]':      '/manuals/[slug]',
    '/prophecies/[slug]':   '/prophecies/[slug]',
    '/articles/[slug]':     '/articles/[slug]',
    '/blogs/[slug]':        '/blogs/[slug]',
    '/topic/[type]':        '/topic/[type]',
    '/topics':              '/topics',
    '/topics/[slug]':       '/topics/[slug]',
    '/authors':             '/authors',
    '/authors/[slug]':      '/authors/[slug]',
    '/offline':             '/offline',
  },
})

export type AppLocale = (typeof routing.locales)[number]

export const LOCALES_META: Record<AppLocale, { label: string; native: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',     native: 'English',     flag: '🇬🇧', dir: 'ltr' },
  es: { label: 'Spanish',     native: 'Español',     flag: '🇪🇸', dir: 'ltr' },
  fr: { label: 'French',      native: 'Français',    flag: '🇫🇷', dir: 'ltr' },
  pt: { label: 'Portuguese',  native: 'Português',   flag: '🇵🇹', dir: 'ltr' },
  ar: { label: 'Arabic',      native: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
}