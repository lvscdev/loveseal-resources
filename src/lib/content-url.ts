export const CONTENT_TYPE_PREFIX = {
  manual:   'manuals',
  prophecy: 'prophecies',
  article:  'articles',
  blog:     'blogs',
} as const

export const CONTENT_TYPE_ROUTE = {
  manual:   '/manuals/[slug]',
  prophecy: '/prophecies/[slug]',
  article:  '/articles/[slug]',
  blog:     '/blogs/[slug]',
} as const

type ContentTypeKey = keyof typeof CONTENT_TYPE_ROUTE

export function contentHref(item: { content_type: string; slug: string | null; id: string }) {
  const ct = item.content_type as ContentTypeKey
  return {
    pathname: CONTENT_TYPE_ROUTE[ct] ?? '/manuals/[slug]',
    params: { slug: item.slug ?? item.id },
  } as
    | { pathname: '/manuals/[slug]';   params: { slug: string } }
    | { pathname: '/prophecies/[slug]'; params: { slug: string } }
    | { pathname: '/articles/[slug]';  params: { slug: string } }
    | { pathname: '/blogs/[slug]';     params: { slug: string } }
}
