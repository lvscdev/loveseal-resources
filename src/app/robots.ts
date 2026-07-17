import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/locale-urls'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: [
      {
        userAgent:  '*',
        allow:      '/',
        disallow:   ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
