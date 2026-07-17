import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'
import { localeUrl } from '@/lib/locale-urls'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('content')
    .select('id, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  const items = (data ?? []) as { id: string; updated_at: string }[]

  /* Hreflang alternates for the sitemap.
     NOTE: `MetadataRoute.Sitemap.alternates.languages` does NOT accept
     'x-default' (Next types it as Record<locale, string>). The page-level
     `generateMetadata` carries x-default via the <head>. */
  const alternatesFor = (path: string) => {
    const languages: Record<string, string> = {}
    routing.locales.forEach(loc => {
      languages[loc] = localeUrl(loc, path)
    })
    return { languages }
  }

  const staticPaths = ['', '/content']
  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap(path =>
    routing.locales.map(loc => ({
      url:           localeUrl(loc, path),
      lastModified:  new Date(),
      changeFrequency: path === '' ? 'weekly' : 'daily' as const,
      priority:      path === '' ? 1.0 : 0.9,
      alternates:    alternatesFor(path),
    }))
  )

  // Per-content pages × locales
  const contentEntries: MetadataRoute.Sitemap = items.flatMap(item =>
    routing.locales.map(loc => ({
      url:            localeUrl(loc, `/content/${item.id}`),
      lastModified:   new Date(item.updated_at),
      changeFrequency: 'monthly' as const,
      priority:       0.7,
      alternates:     alternatesFor(`/content/${item.id}`),
    }))
  )

  return [...staticEntries, ...contentEntries]
}