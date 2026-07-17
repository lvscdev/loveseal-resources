'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RichEditor from '@/components/editor/RichEditor'
import { extractedTextToHtml } from '@/lib/pdf'
import AttachmentsPanel, { type PendingAttachment, uploadAttachments } from '@/components/editor/AttachmentsPanel'
import AuthorPicker, { type AuthorPickerOption } from '@/components/admin/AuthorPicker'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import { toast } from '@/lib/toast'
import type { ContentType, Locale } from '@/types'
import { slugify } from '@/lib/slugify'
import { logContentUpdated } from '../actions'
import { translateContent } from '../translate-actions'

interface Item {
  id: string; title: string; slug: string | null; content_type: ContentType
  source_mode: 'pdf' | 'editor'
  category: string; tags: string[]
  theme: string | null; lesson_number: string | null; speaker: string | null
  series: string | null; date_preached: string | null; scripture_refs: string[]
  summary_points: string[] | null; language: Locale; status: 'draft' | 'published'
  published_at: string
  audio_url:    string | null
  video_url:    string | null
  body_html: string | null
  extracted_text: string | null
  pdf_url: string | null
  /* Pass 5a — server-computed 220 wpm read-time. Read-only here; the
     SQL trigger refreshes it on every save that touches the body. */
  read_time_minutes: number | null
  /* Pass 5c — relational link to the authors table. */
  author_id: string | null
  cover_image_url: string | null
}

interface AttachmentRow {
  id: string
  file_url: string
  file_name: string
  file_type: 'pdf' | 'image' | 'audio' | 'other'
  mime_type: string
  size_bytes: number
}

interface Category { id: string; name: string; slug: string; content_type: string | null }

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'manual', label: 'Manual' }, { value: 'prophecy', label: 'Prophecy' },
  { value: 'article', label: 'Article' }, { value: 'blog', label: 'Blog' },
]

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' }, { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
]

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic',
}

export default function EditForm({
  item, categories, authors, existingAttachments, initialCoAuthorIds,
}: {
  item: Item
  categories: Category[]
  authors: AuthorPickerOption[]
  existingAttachments: AttachmentRow[]
  initialCoAuthorIds: string[]
}) {
  const router = useRouter()

  const [title, setTitle]               = useState(item.title)
  const [slug, setSlug]                 = useState(item.slug ?? '')
  const [contentType, setContentType]   = useState<ContentType>(item.content_type)
  const [language, setLanguage]         = useState<Locale>(item.language)
  /* Legacy PDF-mode rows saved before admin-side editing existed have
     `body_html = null` and only `extracted_text` — seed the editor from
     that on first load so the very first save backfills body_html. */
  const [bodyHtml, setBodyHtml]         = useState(
    item.body_html ?? (item.extracted_text ? extractedTextToHtml(item.extracted_text) : '')
  )
  const [theme, setTheme]               = useState(item.theme ?? '')
  const [series, setSeries]             = useState(item.series ?? '')
  const [lessonNumber, setLessonNumber] = useState(item.lesson_number ?? '')
  /* Pass 5c — paired state: relational author_id + denormalised display
     name. Initialised from the row's existing values. */
  const [authorId, setAuthorId]                   = useState<string | null>(item.author_id)
  const [speakerDisplayName, setSpeakerDisplayName] = useState<string>(item.speaker ?? '')
  const [coAuthorIds, setCoAuthorIds]               = useState<string[]>(initialCoAuthorIds)
  const [datePreached, setDatePreached] = useState(item.date_preached ?? '')
  const [publishedAt, setPublishedAt]   = useState(item.published_at.slice(0, 10))
  const [audioUrl, setAudioUrl]         = useState(item.audio_url ?? '')
  const [videoUrl, setVideoUrl]         = useState(item.video_url ?? '')
  const [category, setCategory]         = useState(item.category)
  const [tags, setTags]                 = useState(item.tags.join(', '))
  const [scriptureRefs, setScriptureRefs] = useState(item.scripture_refs.join('; '))
  const [summaryPoints, setSummaryPoints] = useState((item.summary_points ?? []).join('\n'))
  const [status, setStatus]             = useState<'draft' | 'published'>(item.status)

  // Featured image — required. Starts from the existing stored URL;
  // replaced with a fresh upload only if the user picks a new file.
  const imgRef = useRef<HTMLInputElement>(null)
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(item.cover_image_url)

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  // Attachments — convert existing rows to PendingAttachment format
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])

  useEffect(() => {
    setAttachments(existingAttachments.map(a => ({
      id:          a.id,
      db_id:       a.id,
      file:        new File([], a.file_name),  // dummy, never uploaded
      file_name:   a.file_name,
      file_type:   a.file_type,
      mime_type:   a.mime_type,
      size_bytes:  a.size_bytes,
      preview_url: a.file_url,
      stored_url:  a.file_url,
    })))
  }, [existingAttachments])

  /* Save / translate now drive a single loading-pill state each.
     User-facing success/failure feedback flows through `toast.*` so there
     are no longer any inline banner divs in the right-rail Status card. */
  const [saving, setSaving]           = useState(false)
  const [translating, setTranslating] = useState(false)

  const filteredCategories = categories.filter(
    c => c.content_type === null || c.content_type === contentType
  )

  // The source PDF file itself is locked post-creation (can't be replaced
  // from this screen), but the body text — whichever mode it came from —
  // is always editable below.
  const isPdfMode = item.source_mode === 'pdf'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    if (!coverFile && !coverPreview) {
      toast.error('Featured image is required.', { description: 'Recommended size: 1200 × 630 px.' })
      return
    }

    setSaving(true)

    /* A persistent loading toast covers the whole save sequence (DB update,
       audit log, attachment uploads). It's dismissed and replaced by a
       success or error toast when the sequence finishes. */
    const toastId = toast.loading('Saving changes…')

    try {
      const supabase = createClient()

      let coverImageUrl = item.cover_image_url
      if (coverFile) {
        toast.loading('Saving changes…', { id: toastId, description: 'Uploading featured image…' })
        const coverPath = `${Date.now()}-${coverFile.name.replace(/\s+/g, '-')}`
        const { error: coverError } = await supabase.storage
          .from('cover-images')
          .upload(coverPath, coverFile, { contentType: coverFile.type })
        if (coverError) throw new Error(`Featured image upload failed: ${coverError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('cover-images').getPublicUrl(coverPath)
        coverImageUrl = publicUrl
      }

      const { error: updateError } = await supabase.from('content').update({
        title: title.trim(),
        slug:  slug.trim() || slugify(title.trim()) || null,
        content_type: contentType,
        category: category || '',
        language,
        theme:         theme.trim() || null,
        lesson_number: lessonNumber.trim() || null,
        /* Pass 5c — write both. See UploadForm for the rationale. */
        author_id:     authorId,
        speaker:       speakerDisplayName.trim() || null,
        series:        series.trim() || null,
        published_at:  publishedAt + 'T00:00:00.000Z',
        audio_url:     audioUrl.trim() || null,
        video_url:     videoUrl.trim() || null,
        cover_image_url: coverImageUrl,
        date_preached: datePreached || null,
        scripture_refs: scriptureRefs.split(';').map(s => s.trim()).filter(Boolean),
        tags:          tags.split(',').map(t => t.trim()).filter(Boolean),
        body_html:     bodyHtml,
        summary_points: summaryPoints.split('\n').map(s => s.trim()).filter(Boolean).length
                          ? summaryPoints.split('\n').map(s => s.trim()).filter(Boolean) : null,
        status,
      } as never).eq('id', item.id)

      if (updateError) throw new Error(updateError.message)

      // Sync co-authors: delete all then re-insert current selection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sbAny = supabase as any
      await sbAny.from('content_co_authors').delete().eq('content_id', item.id)
      const validCoAuthors = coAuthorIds.filter(Boolean)
      if (validCoAuthors.length > 0) {
        await sbAny.from('content_co_authors').insert(
          validCoAuthors.map((aid, i) => ({ content_id: item.id, author_id: aid, display_order: i }))
        )
      }

      await logContentUpdated(item.id, title.trim())

      // Upload any new attachments
      const newAttachments = attachments.filter(a => !a.db_id)
      if (newAttachments.length > 0) {
        toast.dismiss(toastId)
        const uploadToastId = toast.loading(`Uploading ${newAttachments.length} attachment${newAttachments.length === 1 ? '' : 's'}…`)
        await uploadAttachments(item.id, attachments)
        toast.dismiss(uploadToastId)
      } else {
        toast.dismiss(toastId)
      }

      toast.success('Changes saved', {
        description: status === 'published'
          ? 'Live on the public site within ~60 seconds.'
          : 'Saved as draft.',
      })
      router.refresh()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Save failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleTranslate() {
    if (translating) return
    setTranslating(true)

    /* Translation takes 10–30s depending on body length × locale count, so
       a persistent loading toast is essential — without it, the user
       would just see a "Translating…" button label and nothing else.
       The toast is replaced in place by a success/warning/error toast
       once the server action returns. */
    const toastId = toast.loading('Translating to 4 locales…', {
      description: 'This may take 20–30 seconds.',
    })

    try {
      const result = await translateContent(item.id)
      toast.dismiss(toastId)

      if (!result.ok) {
        toast.error('Translation failed', {
          description: result.error ?? 'Please try again.',
        })
        return
      }

      const okList = (result.succeeded ?? []).map(l => LOCALE_LABEL[l]).join(', ')
      const failCount = result.failed?.length ?? 0

      if (failCount === 0) {
        toast.success('Translation complete', {
          description: `Translated to ${okList}.`,
        })
      } else {
        const failedList = (result.failed ?? []).map(f => LOCALE_LABEL[f.locale]).join(', ')
        toast.warning('Partial translation', {
          description: `Translated to ${okList}. Failed: ${failedList}.`,
        })
      }

      router.refresh()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Translation failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setTranslating(false)
    }
  }

  const canTranslate = Boolean(bodyHtml.trim())

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '20rem 1fr', gap: '1.25rem', alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', position: 'sticky', top: '4.5rem' }}>

          <div style={cardStyle}>
            <SectionHeader label="FEATURED IMAGE" hint="required" />
            <div onClick={() => imgRef.current?.click()} style={{
              border: `0.09375rem dashed ${coverPreview ? 'var(--brand-blue)' : 'var(--border-strong)'}`,
              borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer',
              minHeight: '6.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}>
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: preview or remote Supabase URL, kept as <img> to match the create-form pattern
                <img src={coverPreview} alt="" style={{ width: '100%', height: '8.75rem', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🖼</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Add featured image</p>
                  <p style={{ fontSize: '0.625rem', color: 'var(--brand-gold)', marginTop: '0.25rem', fontWeight: 600 }}>Recommended: 1200 × 630 px</p>
                  <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>JPEG · PNG · WebP · Max 5 MB</p>
                </div>
              )}
            </div>
            {coverPreview && (
              <p style={{ fontSize: '0.625rem', color: 'var(--text-faint)', marginTop: '0.5rem' }}>
                Click image to replace. Keep the subject centered — this crops to square, 4:3, 3:2 and 16:9 boxes across cards, hero banners and social previews on every screen size.
              </p>
            )}
            <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} style={{ display: 'none' }} />
          </div>

          <div style={cardStyle}>
            <SectionHeader label="ATTACHMENTS" />
            <AttachmentsPanel attachments={attachments} onChange={setAttachments} />
          </div>

          <div style={cardStyle}>
            <SectionHeader label="STATUS" />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
              {(['draft', 'published'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '0.5rem',
                  background: status === s ? 'var(--brand-gold)' : 'transparent',
                  color: status === s ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                  border: `0.03125rem solid ${status === s ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                  borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                  textTransform: 'capitalize', fontFamily: 'var(--font-body)',
                }}>{s}</button>
              ))}
            </div>

            <Field label="Publish date" hint="backdate freely">
              <input
                type="date"
                value={publishedAt}
                onChange={e => setPublishedAt(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <button type="submit" disabled={saving} style={{
              width: '100%', padding: '0.6875rem',
              background: saving ? 'var(--bg-elevated)' : 'var(--brand-gold)',
              color: saving ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: '0.4375rem', fontSize: '0.8125rem', fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '2.5rem',
            }}>
              {saving ? <ButtonSpinner label="Saving…" inverse /> : 'Save changes'}
            </button>
          </div>

          {/* Translation card */}
          <div style={cardStyle}>
            <SectionHeader label="TRANSLATIONS" hint="auto via MS Translator" />

            <p style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              marginBottom: '0.75rem',
            }}>
              Source language is <strong style={{ color: 'var(--text-secondary)' }}>{LOCALE_LABEL[language]}</strong>.
              {' '}Translates into the other 4 locales.
            </p>

            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating || !canTranslate}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: translating ? 'var(--bg-elevated)' : 'transparent',
                color: translating ? 'var(--text-muted)' : 'var(--text-primary)',
                border: '0.03125rem solid var(--border-strong)',
                borderRadius: '0.4375rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: (translating || !canTranslate) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                opacity: !canTranslate ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '2.375rem',
              }}
            >
              {translating ? <ButtonSpinner label="Translating…" /> : 'Translate to all locales'}
            </button>
            {!canTranslate && (
              <p style={{
                fontSize: '0.625rem',
                color: 'var(--text-faint)',
                marginTop: '0.5rem',
                fontStyle: 'italic',
              }}>
                Add content body first.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <div style={cardStyle}>
            <SectionHeader label="IDENTITY" />
            <Field label="Title" required>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
            </Field>
            <Field label="URL slug" hint="auto-generated from title if left blank">
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, ''))}
                placeholder={slugify(title) || 'e.g. gods-harvest-in-coming-days'}
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <Field label="Content type" required>
                <select value={contentType} onChange={e => { setContentType(e.target.value as ContentType); setCategory('') }} style={inputStyle}>
                  {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <select value={language} onChange={e => setLanguage(e.target.value as Locale)} style={inputStyle}>
                  {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Body */}
          <div style={cardStyle}>
            <SectionHeader
              label="CONTENT BODY"
              hint={isPdfMode ? 'extracted from PDF — fully editable' : 'rich editor'}
            />
            {isPdfMode && (
              <p style={{
                fontSize: '0.6875rem',
                color: 'var(--text-faint)',
                marginBottom: '0.75rem',
                lineHeight: 1.5,
              }}>
                This is what readers see — edit and format it freely. The original PDF file can&rsquo;t be
                replaced from this screen; delete this item and upload a new one to change it.
              </p>
            )}
            <RichEditor
              initialHtml={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Continue editing… type / for blocks"
            />
          </div>

          <div style={cardStyle}>
            <SectionHeader label="TEACHING DETAILS" hint="optional" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Field label="Theme">
                <input type="text" value={theme} onChange={e => setTheme(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Lesson #">
                <input type="text" value={lessonNumber} onChange={e => setLessonNumber(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Field label="Series">
                <input type="text" value={series} onChange={e => setSeries(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Date preached">
                <input type="date" value={datePreached} onChange={e => setDatePreached(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            {/* Pass 5c — Speaker is now the author picker. */}
            <Field label="Speaker / Author">
              <AuthorPicker
                authors={authors}
                value={authorId}
                displayName={speakerDisplayName}
                onChange={({ authorId: nextId, displayName }) => {
                  setAuthorId(nextId)
                  setSpeakerDisplayName(displayName)
                }}
              />
            </Field>

            {/* Co-authors */}
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 500,
                  color: 'var(--text-tertiary)', letterSpacing: '0.04em',
                }}>
                  Co-authors
                </span>
                <button
                  type="button"
                  onClick={() => setCoAuthorIds(ids => [...ids, ''])}
                  style={{
                    fontSize: '11px', color: 'var(--brand-gold)', fontWeight: 500,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', padding: 0,
                  }}
                >
                  + Add co-author
                </button>
              </div>
              {coAuthorIds.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No co-authors — click &ldquo;+ Add co-author&rdquo; to add one.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {coAuthorIds.map((aid, idx) => {
                    const coAuthorOption = authors.find(a => a.id === aid) ?? null
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <AuthorPicker
                            authors={authors.filter(a => a.id !== authorId && !coAuthorIds.includes(a.id) || a.id === aid)}
                            value={aid || null}
                            displayName={coAuthorOption?.name ?? ''}
                            onChange={({ authorId: nextId }) => {
                              setCoAuthorIds(ids => ids.map((id, i) => i === idx ? (nextId ?? '') : id))
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCoAuthorIds(ids => ids.filter((_, i) => i !== idx))}
                          style={{
                            marginTop: '4px',
                            width: '28px', height: '28px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent',
                            border: '0.5px solid var(--border-strong)',
                            borderRadius: '6px',
                            color: 'var(--danger-fg)',
                            cursor: 'pointer', fontSize: '14px',
                            fontFamily: 'var(--font-body)',
                          }}
                          title="Remove co-author"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pass 5a — read-only display of the trigger-computed read-time. Auto-refreshes on save. */}
            <div style={{
              marginTop:    '0.875rem',
              padding:      '0.5rem 0.75rem',
              background:   'var(--bg-elevated)',
              border:       '0.0625rem solid var(--border-subtle)',
              borderRadius: '0.375rem',
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '0.5rem',
              fontSize:     '0.75rem',
              color:        'var(--text-tertiary)',
              fontFamily:   'var(--font-body)',
            }}>
              <span style={{
                textTransform:  'uppercase',
                letterSpacing:  '0.08em',
                fontWeight:     500,
                color:          'var(--text-muted)',
              }}>
                Auto read time
              </span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {item.read_time_minutes != null
                  ? `${item.read_time_minutes} min`
                  : '—'}
              </span>
              <span style={{ color: 'var(--text-faint)' }}>
                · recomputed on save
              </span>
            </div>
          </div>

          <div style={cardStyle}>
            <SectionHeader label="MEDIA" hint="optional — leave blank if not needed" />
            <Field label="Audio URL" hint="direct link to MP3 / M4A file">
              <input
                type="url"
                value={audioUrl}
                onChange={e => setAudioUrl(e.target.value)}
                placeholder="https://…/sermon.mp3"
                style={inputStyle}
              />
            </Field>
            <Field label="YouTube URL" hint="paste full watch URL">
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={cardStyle}>
            <SectionHeader label="CATEGORISATION" />
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                <option value="">— No category —</option>
                {filteredCategories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="comma separated">
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Scripture references" hint="separate with semicolons">
              <input type="text" value={scriptureRefs} onChange={e => setScriptureRefs(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={cardStyle}>
            <SectionHeader label="KEY POINTS" hint="one per line" />
            <textarea value={summaryPoints} onChange={e => setSummaryPoints(e.target.value)} rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        </div>
      </div>
    </form>
  )
}

function SectionHeader({ label, hint, required }: { label: string; hint?: string; required?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '0.03125rem solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
        {label}{required && <span style={{ color: 'var(--brand-gold)', marginLeft: '0.25rem' }}>*</span>}
      </span>
      {hint && <span style={{ fontSize: '0.625rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>{hint}</span>}
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3125rem' }}>
        <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
          {label}{required && <span style={{ color: 'var(--brand-gold)', marginLeft: '0.1875rem' }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: '0.625rem', color: 'var(--text-faint)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-raised)',
  border: '0.03125rem solid var(--border-subtle)',
  borderRadius: '0.625rem',
  padding: '1.125rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.6875rem',
  background: 'var(--bg-input)', border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.375rem', color: 'var(--text-primary)',
  fontSize: '0.8125rem', fontFamily: 'var(--font-body)', outline: 'none',
}