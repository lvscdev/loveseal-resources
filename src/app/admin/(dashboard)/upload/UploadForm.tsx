'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractTextFromPDF, extractedTextToHtml } from '@/lib/pdf'
import RichEditor from '@/components/editor/RichEditor'
import AttachmentsPanel, { type PendingAttachment, uploadAttachments } from '@/components/editor/AttachmentsPanel'
import AuthorPicker, { type AuthorPickerOption } from '@/components/admin/AuthorPicker'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import { toast } from '@/lib/toast'
import type { ContentType, Locale } from '@/types'
import { slugify } from '@/lib/slugify'
import { logContentCreated } from '../content/actions'

interface Category {
  id: string
  name: string
  slug: string
  content_type: string | null
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'manual', label: 'Manual' }, { value: 'prophecy', label: 'Prophecy' },
  { value: 'article', label: 'Article' }, { value: 'blog', label: 'Blog' },
]

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' }, { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
]

type SourceMode = 'pdf' | 'editor'

export default function UploadForm({
  categories,
  authors,
}: {
  categories: Category[]
  /* Pass 5c — supplied by the upload/page.tsx server fetch. */
  authors:    AuthorPickerOption[]
}) {
  const pdfRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const [title, setTitle]               = useState('')
  const [contentType, setContentType]   = useState<ContentType>('manual')
  const [language, setLanguage]         = useState<Locale>('en')
  const [sourceMode, setSourceMode]     = useState<SourceMode>('editor')
  const [bodyHtml, setBodyHtml]         = useState('')
  const [pdfFile, setPdfFile]           = useState<File | null>(null)
  const [pdfExtracting, setPdfExtracting] = useState(false)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [attachments, setAttachments]   = useState<PendingAttachment[]>([])
  const [theme, setTheme]               = useState('')
  const [series, setSeries]             = useState('')
  const [lessonNumber, setLessonNumber] = useState('')
  /* Pass 5c — paired state: relational author_id + denormalised display
     name. The display name lives on `content.speaker` so the byline still
     works if the author is later deleted. */
  const [authorId, setAuthorId]                   = useState<string | null>(null)
  const [speakerDisplayName, setSpeakerDisplayName] = useState<string>('')
  const [datePreached, setDatePreached] = useState('')
  const [publishedAt, setPublishedAt]   = useState(() => new Date().toISOString().slice(0, 10))
  const [audioUrl, setAudioUrl]         = useState('')
  const [videoUrl, setVideoUrl]         = useState('')
  const [category, setCategory]         = useState('')
  const [tags, setTags]                 = useState('')
  const [scriptureRefs, setScriptureRefs] = useState('')
  const [summaryPoints, setSummaryPoints] = useState('')
  const [status, setStatus]             = useState<'draft' | 'published'>('draft')

  /* Pass 8 — single `loading` boolean drives the submit-button state. All
     error / progress messaging now flows through the global Toaster (see
     `lib/toast.ts`). No more inline red banner. */
  const [loading, setLoading]   = useState(false)

  const filteredCategories = categories.filter(
    c => c.content_type === null || c.content_type === contentType
  )

  // For non-manual types, always force editor mode
  const isManual    = contentType === 'manual'
  const effectiveMode: SourceMode = isManual ? sourceMode : 'editor'

  function handleContentTypeChange(next: ContentType) {
    setContentType(next)
    setCategory('')
    if (next !== 'manual') setSourceMode('editor')
  }

  async function handlePDFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.')
      return
    }
    if (file.size > 52428800) {
      toast.error('PDF must be under 50 MB.')
      return
    }
    setPdfFile(file)
    if (!title) setTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))

    /* Extraction happens immediately on file pick, not at submit time — the
       result seeds the rich editor below so the admin reviews and formats
       it before anything is published, instead of the raw extraction being
       what readers see. */
    setPdfExtracting(true)
    setExtractedText(null)
    setBodyHtml('')
    try {
      const text = await extractTextFromPDF(file)
      setExtractedText(text)
      setBodyHtml(extractedTextToHtml(text))
      if (!text.trim()) {
        toast.warning('No text found in this PDF', {
          description: 'It may be a scanned image — you can still write the content manually below.',
        })
      }
    } catch (err) {
      toast.error('Could not read text from this PDF', {
        description: err instanceof Error ? err.message : 'You can still write the content manually below.',
      })
    } finally {
      setPdfExtracting(false)
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    /* ── Client-side validation (toast each failure, return early). ── */
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (effectiveMode === 'pdf' && !pdfFile) {
      toast.error('Please select a PDF file.')
      return
    }
    if (effectiveMode === 'pdf' && pdfExtracting) {
      toast.error('Still extracting text from the PDF — one moment.')
      return
    }
    if (!bodyHtml.trim()) {
      toast.error('Please write some content in the editor.')
      return
    }
    if (!coverFile) {
      toast.error('Featured image is required.', { description: 'Recommended size: 1200 × 630 px.' })
      return
    }

    setLoading(true)

    /* Single persistent loading toast covers the whole multi-step pipeline
       (PDF extract → upload → cover upload → DB insert → attachment uploads
       → audit log → fire-and-forget translate). Its `description` is
       updated through the pipeline so the user can see which step is
       running without us spawning a stack of toasts. */
    const toastId = toast.loading('Uploading content…', {
      description: 'Preparing…',
    })

    /* Helper to update the toast's description in place as the pipeline
       advances. Uses `toast.loading` with the same id, which sonner
       interprets as "update existing toast". */
    function updateProgress(description: string) {
      toast.loading('Uploading content…', { id: toastId, description })
    }

    try {
      const supabase = createClient()

      let pdfPath: string | null = null

      if (effectiveMode === 'pdf' && pdfFile) {
        updateProgress('Uploading PDF…')
        pdfPath = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '-')}`
        const { error: pdfError } = await supabase.storage
          .from('content-pdfs')
          .upload(pdfPath, pdfFile, { contentType: 'application/pdf' })
        if (pdfError) throw new Error(`PDF upload failed: ${pdfError.message}`)
      }

      let coverImageUrl: string | null = null
      if (coverFile) {
        updateProgress('Uploading cover image…')
        const coverPath = `${Date.now()}-${coverFile.name.replace(/\s+/g, '-')}`
        const { error: coverError } = await supabase.storage
          .from('cover-images')
          .upload(coverPath, coverFile, { contentType: coverFile.type })
        if (coverError) throw new Error(`Cover upload failed: ${coverError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('cover-images').getPublicUrl(coverPath)
        coverImageUrl = publicUrl
      }

      updateProgress('Saving…')
      const { data: inserted, error: dbError } = await (supabase
        .from('content')
        .insert({
          title:           title.trim(),
          slug:            slugify(title.trim()),
          content_type:    contentType,
          source_mode:     effectiveMode,
          category:        category || '',
          language,
          theme:           theme.trim() || null,
          lesson_number:   lessonNumber.trim() || null,
          /* Pass 5c — write both. `author_id` is the relational link;
             `speaker` is denormalised so legacy code paths (e.g. the
             content_translations table's speaker column) and the
             "deleted author" fallback continue to work. */
          author_id:       authorId,
          speaker:         speakerDisplayName.trim() || null,
          series:          series.trim() || null,
          published_at:    publishedAt + 'T00:00:00.000Z',
          audio_url:       audioUrl.trim() || null,
          video_url:       videoUrl.trim() || null,
          date_preached:   datePreached || null,
          scripture_refs:  scriptureRefs.split(';').map(s => s.trim()).filter(Boolean),
          tags:            tags.split(',').map(t => t.trim()).filter(Boolean),
          extracted_text:  effectiveMode === 'pdf' ? extractedText : null,
          body_html:       bodyHtml,
          summary_points:  summaryPoints.split('\n').map(s => s.trim()).filter(Boolean).length
                            ? summaryPoints.split('\n').map(s => s.trim()).filter(Boolean) : null,
          pdf_url:         pdfPath,
          cover_image_url: coverImageUrl,
          status,
        } as never)
        .select('id')
        .single()) as { data: { id: string } | null; error: { message: string } | null }

      if (dbError || !inserted) throw new Error(`Save failed: ${dbError?.message ?? 'unknown error'}`)

      // Upload attachments after content row is created
      if (attachments.length > 0) {
        updateProgress(`Uploading ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}…`)
        await uploadAttachments(inserted.id, attachments)
      }

      await logContentCreated(inserted.id, title.trim(), contentType, status)

      /* Fire-and-forget translation. We don't await it because translating into
         4 locales can take 5-15s and we don't want to block the redirect. The
         endpoint logs its own audit row on completion. */
      fetch('/api/translate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contentId: inserted.id }),
        keepalive: true,
      }).catch(() => { /* silent — admins can retry from the edit screen */ })

      /* Replace the loading toast with a success toast. The `id` match makes
         sonner update the existing toast in place instead of stacking. */
      toast.success('Content saved', {
        id: toastId,
        description: status === 'published'
          ? 'Live on the public site within ~60 seconds. Translations running in background.'
          : 'Saved as draft. Translations running in background.',
      })

      window.location.href = '/admin/content'

    } catch (err) {
      toast.error('Upload failed', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Something went wrong.',
      })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '20rem 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ──── LEFT — Sidebar ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', position: 'sticky', top: '4.5rem' }}>

          {/* Cover */}
          <div style={cardStyle}>
            <SectionHeader label="FEATURED IMAGE" hint="required" />
            <div onClick={() => imgRef.current?.click()} style={{
              border: `0.09375rem dashed ${coverFile ? 'var(--brand-blue)' : 'var(--border-strong)'}`,
              borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer',
              minHeight: '6.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}>
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URL from URL.createObjectURL, can't be optimized by next/image
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
                Keep the subject centered — this crops to square, 4:3, 3:2 and 16:9 boxes across cards, hero banners and social previews on every screen size.
              </p>
            )}
            <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} style={{ display: 'none' }} />
          </div>

          {/* Attachments */}
          <div style={cardStyle}>
            <SectionHeader label="ATTACHMENTS" hint="optional" />
            <AttachmentsPanel attachments={attachments} onChange={setAttachments} />
          </div>

          {/* Publishing */}
          <div style={cardStyle}>
            <SectionHeader label="PUBLISHING" />
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

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.6875rem',
              background: loading ? 'var(--bg-elevated)' : 'var(--brand-gold)',
              color: loading ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: '0.4375rem', fontSize: '0.8125rem', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '2.5rem',
            }}>
              {loading ? <ButtonSpinner label="Uploading…" inverse /> : 'Save content'}
            </button>
          </div>
        </div>

        {/* ──── RIGHT — Main content ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Identity */}
          <div style={cardStyle}>
            <SectionHeader label="IDENTITY" />
            <Field label="Title" required>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Becoming a Disciple Indeed" required style={inputStyle} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <Field label="Content type" required>
                <select value={contentType} onChange={e => handleContentTypeChange(e.target.value as ContentType)} style={inputStyle}>
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

          {/* Body — Mode toggle for Manuals, editor or PDF */}
          <div style={cardStyle}>
            <SectionHeader
              label="CONTENT BODY"
              required
              hint={isManual ? 'choose mode' : 'rich editor'}
            />

            {isManual && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                {(['editor', 'pdf'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSourceMode(m)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: sourceMode === m ? 'var(--brand-gold)' : 'transparent',
                      color: sourceMode === m ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                      border: `0.03125rem solid ${sourceMode === m ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {m === 'editor' ? '✎  Rich Editor' : '📄  PDF Upload'}
                  </button>
                ))}
              </div>
            )}

            {effectiveMode === 'pdf' ? (
              <>
                <div onClick={() => pdfRef.current?.click()} style={{
                  border: `0.09375rem dashed ${pdfFile ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                  borderRadius: '0.5rem',
                  padding: pdfFile ? '0.875rem 1rem' : '2rem 1rem',
                  textAlign: pdfFile ? 'left' : 'center',
                  cursor: 'pointer',
                  marginBottom: pdfFile ? '0.875rem' : 0,
                }}>
                  {pdfFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>📄</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--brand-gold)', fontWeight: 500, wordBreak: 'break-all' }}>{pdfFile.name}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · click to replace
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📎</div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Click to select PDF</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Max 50 MB</p>
                    </>
                  )}
                  <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePDFChange} style={{ display: 'none' }} />
                </div>

                {pdfExtracting && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Extracting text from the PDF…
                  </p>
                )}

                {pdfFile && !pdfExtracting && (
                  <>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-faint)', marginBottom: '0.5rem' }}>
                      Extracted from the PDF below — review and format it like any other content. This is what
                      readers will see; the PDF itself is only kept as a downloadable attachment.
                    </p>
                    <RichEditor
                      key={pdfFile.name + pdfFile.size}
                      initialHtml={bodyHtml}
                      onChange={setBodyHtml}
                      placeholder="Extracted text will appear here…"
                    />
                  </>
                )}
              </>
            ) : (
              <RichEditor
                onChange={setBodyHtml}
                placeholder="Start writing… type / for blocks, or use the toolbar above"
              />
            )}
          </div>

          {/* Teaching */}
          <div style={cardStyle}>
            <SectionHeader label="TEACHING DETAILS" hint="optional" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Field label="Theme">
                <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. Discipleship" style={inputStyle} />
              </Field>
              <Field label="Lesson #">
                <input type="text" value={lessonNumber} onChange={e => setLessonNumber(e.target.value)} placeholder="e.g. Four" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Field label="Series">
                <input type="text" value={series} onChange={e => setSeries(e.target.value)} placeholder="e.g. God's Process" style={inputStyle} />
              </Field>
              <Field label="Date preached">
                <input type="date" value={datePreached} onChange={e => setDatePreached(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            {/* Pass 5c — Speaker is now the author picker. Free-text fallback
                kicks in automatically via the AuthorPicker's "+ Create" path. */}
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
          </div>

          {/* Media */}
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

          {/* Categorisation */}
          <div style={cardStyle}>
            <SectionHeader label="CATEGORISATION" />
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                <option value="">— No category —</option>
                {filteredCategories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="comma separated">
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. faith, surrender" style={inputStyle} />
            </Field>
            <Field label="Scripture references" hint="separate with semicolons">
              <input type="text" value={scriptureRefs} onChange={e => setScriptureRefs(e.target.value)} placeholder="e.g. Matthew 16:24; John 8:31-32" style={inputStyle} />
            </Field>
          </div>

          {/* Summary */}
          <div style={cardStyle}>
            <SectionHeader label="KEY POINTS" hint="one per line · shown in summary view" />
            <textarea value={summaryPoints} onChange={e => setSummaryPoints(e.target.value)}
              placeholder={"Hundredfold Return — multiplied blessings\nEverlasting Life — eternal reward"}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--font-body)' }} />
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