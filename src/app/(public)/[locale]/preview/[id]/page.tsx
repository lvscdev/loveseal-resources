import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import ContentReader from '@/components/reader/ContentReader'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export const dynamic = 'force-dynamic'

const CONTENT_FIELDS = `
  id, slug, title, content_type, source_mode, category, tags,
  theme, lesson_number, speaker, series, date_preached,
  scripture_refs, extracted_text, body_html, summary_points,
  pdf_url, cover_image_url, status, language,
  read_time_minutes, author_id, created_at, updated_at, published_at, audio_url, video_url,
  author:authors!content_author_id_fkey (
    id, name, slug, avatar_url
  )
`

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  setRequestLocale(locale)

  const me = await getCurrentAdmin()
  if (!me) redirect(`/admin/login`)

  const supabase = await createClient()

  const { data: rawItem } = await supabase
    .from('content')
    .select(CONTENT_FIELDS)
    .eq('id', id)
    .single()

  if (!rawItem) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = rawItem as any

  const { data: attachments } = await supabase
    .from('content_attachments')
    .select('id, file_url, file_name, file_type, mime_type, size_bytes')
    .eq('content_id', id)
    .order('display_order')

  let signedPdfUrl: string | null = null
  if (item.source_mode === 'pdf' && item.pdf_url) {
    const { data: signed } = await supabase.storage
      .from('content-pdfs')
      .createSignedUrl(item.pdf_url, 60 * 60)
    signedPdfUrl = signed?.signedUrl ?? null
  }

  const isDraft = item.status === 'draft'

  return (
    <>
      {/* Sticky admin preview banner */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: isDraft ? 'rgba(195,33,38,0.92)' : 'rgba(68,152,204,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${isDraft ? 'rgba(195,33,38,0.5)' : 'rgba(68,152,204,0.5)'}`,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.18)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#fff',
          }}>
            {isDraft ? '● Draft' : '● Published'}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            Admin preview — not visible to the public
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <Link
            href={`/admin/content/${id}`}
            style={{
              fontSize: '12px', fontWeight: 600, color: '#fff',
              textDecoration: 'none',
              padding: '4px 12px',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.12)',
            }}
          >
            ← Edit
          </Link>
          <Link
            href="/admin/content"
            style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
            }}
          >
            All content
          </Link>
        </div>
      </div>

      <ContentReader
        item={item}
        attachments={attachments ?? []}
        signedPdfUrl={signedPdfUrl}
        translationStatus="native"
        sourceLanguage={item.language}
        seriesItems={[]}
      />
    </>
  )
}
