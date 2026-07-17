import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EditForm from './EditForm'

export const metadata = { title: 'Edit content' }

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  /* Pass 5c — added the authors fetch alongside content/categories/attachments.
     Four parallel queries. */
  const [
    { data: item },
    { data: categories },
    { data: authors },
    { data: attachments },
    { data: coAuthorsRows },
  ] = await Promise.all([
    supabase.from('content').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, slug, content_type').order('name'),
    supabase.from('authors').select('id, name, slug, avatar_url').order('name'),
    supabase
      .from('content_attachments')
      .select('id, file_url, file_name, file_type, mime_type, size_bytes')
      .eq('content_id', id)
      .order('display_order'),
    supabase
      .from('content_co_authors')
      .select('author_id, display_order')
      .eq('content_id', id)
      .order('display_order'),
  ])

  if (!item) notFound()

  const itemTyped         = item as Parameters<typeof EditForm>[0]['item']
  const categoriesTyped   = (categories ?? [])   as Parameters<typeof EditForm>[0]['categories']
  const authorsTyped      = (authors ?? [])      as Parameters<typeof EditForm>[0]['authors']
  const attachmentsTyped  = (attachments ?? [])  as Parameters<typeof EditForm>[0]['existingAttachments']
  const coAuthorIdsTyped  = ((coAuthorsRows ?? []) as Array<{ author_id: string }>).map(r => r.author_id)

  // Use the content's own language as the preview locale, defaulting to 'en'
  const previewLocale = (itemTyped as { language?: string }).language ?? 'en'
  const previewHref   = `/${previewLocale}/preview/${id}`

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Link href="/admin/content" style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}>
          ← Back to content
        </Link>
        <Link
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Preview
        </Link>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '6px',
        }}>
          Edit content
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '28px',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 1.05,
        }}>
          {itemTyped.title}
        </h1>
      </div>
      <EditForm
        item={itemTyped}
        categories={categoriesTyped}
        authors={authorsTyped}
        existingAttachments={attachmentsTyped}
        initialCoAuthorIds={coAuthorIdsTyped}
      />
    </div>
  )
}