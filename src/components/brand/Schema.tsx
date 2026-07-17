import { BRAND } from './Brand'
import { getBaseUrl } from '@/lib/locale-urls'

/* ─────────────────────────────────────────────────────────────────────────────
   JSON-LD Schema helpers for SEO + rich results.

   Two kinds of components in here:

   A. Site-level singletons rendered once from the locale layout:
        • <OrganizationSchema />
        • <WebsiteSchema />

   B. Per-page composite schemas — emit a single `@graph` with multiple nodes,
      cross-linked by `@id`. This is what Google's documentation recommends for
      pages that need to express both a WebPage / CollectionPage and an Article
      and a BreadcrumbList simultaneously:
        • <ArticlePageSchema />   ← detail page (Article + WebPage + Breadcrumbs)
        • <CollectionPageSchema /> ← list page (CollectionPage + Breadcrumbs)

   The graph approach means one <script> tag per page instead of three, which is
   easier to debug in Google's Rich Results Test and avoids duplicate @id
   references across multiple JSON-LD blocks.
   ──────────────────────────────────────────────────────────────────────────── */


/* ── Shared types ────────────────────────────────────────────────────────── */

export interface BreadcrumbItem {
  name: string
  url:  string
}

/* ── Small utilities ─────────────────────────────────────────────────────── */

const baseUrl = getBaseUrl

/* Build a BreadcrumbList node from an ordered array of crumbs.
   The final crumb (the current page) intentionally omits `item` per Google's
   guidance — the user is already on it, so it doesn't need a clickable URL.
   In practice both Google and Bing accept it either way, so we include the URL
   for resilience and let crawlers pick the convention they prefer. */
function breadcrumbListNode(items: BreadcrumbItem[]) {
  return {
    '@type':           'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       it.name,
      item:       it.url,
    })),
  }
}

/* Stringify-and-render a JSON-LD blob. JSON.stringify with the second arg as
   undefined strips keys whose values are undefined, so optional fields stay
   clean rather than emitting "image": null. */
function ldJson(data: object): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}


/* ═══════════════════════════════════════════════════════════════════════════
   A. SITE-LEVEL SINGLETONS
   ═══════════════════════════════════════════════════════════════════════════ */

export function OrganizationSchema(): React.ReactElement {
  const url = baseUrl()
  const schema = {
    '@context':    'https://schema.org',
    '@type':       'Organization',
    '@id':         `${url}#organization`,
    name:          BRAND.parent,
    alternateName: BRAND.short,
    url,
    description:   `Manuals, prophecies, articles, and blog from ${BRAND.parent}.`,
  }
  return ldJson(schema)
}

export function WebsiteSchema(): React.ReactElement {
  const url = baseUrl()
  const schema = {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    '@id':      `${url}#website`,
    name:       BRAND.short,
    url,
    publisher:  { '@id': `${url}#organization` },
    potentialAction: {
      '@type':       'SearchAction',
      target:        `${url}/content?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  return ldJson(schema)
}


/* ═══════════════════════════════════════════════════════════════════════════
   B. PER-PAGE COMPOSITE SCHEMAS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── B1. Article detail page ─────────────────────────────────────────────── */

interface ArticlePageSchemaProps {
  title:         string
  description:   string
  url:           string
  imageUrl?:     string | null
  authorName?:   string | null
  publishedAt:   string
  updatedAt:     string
  contentType:   string
  /** Ordered crumbs ending with the current page (the article). */
  breadcrumb:    BreadcrumbItem[]
  /** BCP-47 language code of the page (e.g. 'en', 'es', 'ar'). */
  inLanguage?:   string
}

/* Renders a single @graph containing WebPage, Article (or BlogPosting),
   and BreadcrumbList — all cross-linked by @id. */
export function ArticlePageSchema({
  title, description, url, imageUrl,
  authorName, publishedAt, updatedAt, contentType,
  breadcrumb, inLanguage,
}: ArticlePageSchemaProps): React.ReactElement {
  const site   = baseUrl()
  const pageId = `${url}#webpage`
  const artId  = `${url}#article`
  const crumbId = `${url}#breadcrumb`

  const articleType = contentType === 'blog' ? 'BlogPosting' : 'Article'

  const webPage = {
    '@type':         'WebPage',
    '@id':           pageId,
    url,
    name:            title,
    description,
    inLanguage,
    isPartOf:        { '@id': `${site}#website` },
    primaryImageOfPage: imageUrl ? { '@type': 'ImageObject', url: imageUrl } : undefined,
    breadcrumb:      { '@id': crumbId },
    datePublished:   publishedAt,
    dateModified:    updatedAt,
  }

  const article = {
    '@type':       articleType,
    '@id':         artId,
    headline:      title,
    description,
    url,
    inLanguage,
    datePublished: publishedAt,
    dateModified:  updatedAt,
    image:         imageUrl ? [imageUrl] : undefined,
    author: authorName ? {
      '@type': 'Person',
      name:    authorName,
    } : {
      '@type': 'Organization',
      '@id':   `${site}#organization`,
      name:    BRAND.parent,
    },
    publisher: {
      '@type': 'Organization',
      '@id':   `${site}#organization`,
      name:    BRAND.parent,
      url:     site,
    },
    isPartOf:         { '@id': pageId },
    mainEntityOfPage: { '@id': pageId },
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      webPage,
      article,
      { ...breadcrumbListNode(breadcrumb), '@id': crumbId },
    ],
  }

  return ldJson(graph)
}


/* ── B2. Collection / list page ──────────────────────────────────────────── */

interface CollectionPageSchemaProps {
  title:        string
  description?: string
  url:          string
  breadcrumb:   BreadcrumbItem[]
  inLanguage?:  string
}

/* Renders CollectionPage + BreadcrumbList for the /content list view.
   CollectionPage is the right schema.org type for a page that lists multiple
   pieces of content (Article, BlogPosting, etc.) rather than being a single
   article itself. */
export function CollectionPageSchema({
  title, description, url, breadcrumb, inLanguage,
}: CollectionPageSchemaProps): React.ReactElement {
  const site    = baseUrl()
  const pageId  = `${url}#webpage`
  const crumbId = `${url}#breadcrumb`

  const collectionPage = {
    '@type':    'CollectionPage',
    '@id':      pageId,
    url,
    name:       title,
    description,
    inLanguage,
    isPartOf:   { '@id': `${site}#website` },
    breadcrumb: { '@id': crumbId },
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      collectionPage,
      { ...breadcrumbListNode(breadcrumb), '@id': crumbId },
    ],
  }

  return ldJson(graph)
}


/* ═══════════════════════════════════════════════════════════════════════════
   C. LEGACY EXPORT — kept for backward compatibility only.

   The old <ArticleSchema /> emitted a standalone Article node without the
   BreadcrumbList or WebPage. New code should use <ArticlePageSchema />
   instead. This shim re-exports the old name as the new function with a
   single empty-breadcrumb fallback, so any forgotten import site still
   compiles but loses breadcrumb output.

   Once all call sites are migrated to <ArticlePageSchema />, this export
   can be removed.
   ═══════════════════════════════════════════════════════════════════════════ */

interface LegacyArticleSchemaProps {
  title:         string
  description:   string
  url:           string
  imageUrl?:     string | null
  authorName?:   string | null
  publishedAt:   string
  updatedAt:     string
  contentType:   string
}

export function ArticleSchema(props: LegacyArticleSchemaProps): React.ReactElement {
  return (
    <ArticlePageSchema
      {...props}
      breadcrumb={[]}
    />
  )
}