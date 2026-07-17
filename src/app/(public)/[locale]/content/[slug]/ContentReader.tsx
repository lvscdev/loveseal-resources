'use client'

import { Suspense, useCallback, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { readTimeMinutes } from '@/lib/read-time'
import { contentHref } from '@/lib/content-url'
import Breadcrumb         from '@/components/reader/Breadcrumb'
import ReaderToggle       from '@/components/reader/ReaderToggle'
import BylineCard         from '@/components/reader/BylineCard'
import ReaderIconActions  from '@/components/reader/ReaderIconActions'
import QuickStoryView     from '@/components/reader/QuickStoryView'
import BibleRefActivator  from '@/components/reader/BibleRefActivator'
import MediaSection       from '@/components/reader/MediaSection'
import { processBibleRefs } from '@/lib/bible-parse'
import '@/components/editor/editor.css'

interface Item {
  id: string
  slug: string | null
  title: string
  content_type: 'manual' | 'prophecy' | 'article' | 'blog'
  source_mode: 'pdf' | 'editor'
  category: string
  tags: string[]
  theme: string | null
  lesson_number: string | null
  speaker: string | null
  series: string | null
  date_preached: string | null
  scripture_refs: string[]
  extracted_text: string | null
  body_html: string | null
  summary_points: string[] | null
  pdf_url: string | null
  cover_image_url: string | null
  language: string
  read_time_minutes: number | null
  /* Pass 5c — joined author row. NULL when content has no author_id
     (legacy rows where speaker text didn't match any backfilled author,
     or where the author was later deleted via ON DELETE SET NULL). When
     null, BylineCard falls back to `speaker` text and initials. */
  author: {
    id:         string
    name:       string
    slug:       string
    avatar_url: string | null
  } | null
  published_at: string
  updated_at:   string
  audio_url:    string | null
  video_url:    string | null
}

interface Attachment {
  id: string
  file_url: string
  file_name: string
  file_type: 'pdf' | 'image' | 'audio' | 'other'
  mime_type: string
  size_bytes: number
}

interface SeriesItem {
  id: string
  slug: string | null
  title: string
  content_type: string
  cover_image_url: string | null
  published_at: string
}

const TYPE_COLORS: Record<string, string> = {
  manual: '#4498CC', prophecy: '#C32126', article: '#F5AE41', blog: '#3C3C3C',
}

type ReadMode = 'full' | 'quick'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/* The exported default wraps the inner component in <Suspense> because
   `useSearchParams()` requires it under Next.js 15's static-rendering
   model. Without the Suspense boundary the whole page deopts to dynamic.
   We render `null` as the fallback (the article is hydrated client-side
   anyway — there's no visible flash). */
export default function ContentReader(props: {
  item:              Item
  attachments:       Attachment[]
  signedPdfUrl:      string | null
  translationStatus?: 'native' | 'translated' | 'pending'
  sourceLanguage?:    string
  seriesItems?:       SeriesItem[]
}) {
  return (
    <Suspense fallback={null}>
      <ContentReaderInner {...props} />
    </Suspense>
  )
}

function ContentReaderInner({
  item, attachments, signedPdfUrl,
  translationStatus = 'native',
  sourceLanguage,
  seriesItems,
}: {
  item:              Item
  attachments:       Attachment[]
  signedPdfUrl:      string | null
  translationStatus?: 'native' | 'translated' | 'pending'
  sourceLanguage?:    string
  seriesItems?:       SeriesItem[]
}) {
  const t        = useTranslations('content')
  const tTypes   = useTranslations('content.types')
  const tBread   = useTranslations('content.breadcrumb')
  const tReader  = useTranslations('content.reader')
  const locale   = useLocale()

  /* Mode is driven by the `?view=quick|full` search param so deep links
     to either view work and reload behaviour is predictable. Anything
     other than 'quick' resolves to 'full' (default). */
  const router       = useRouter()
  const searchParams = useSearchParams()
  const viewParam    = searchParams.get('view')
  const mode: ReadMode = viewParam === 'quick' ? 'quick' : 'full'

  const hasKeyPoints = !!(item.summary_points && item.summary_points.length > 0)
  const isPdfMode    = item.source_mode === 'pdf'
  const readMin = item.read_time_minutes ?? readTimeMinutes(isPdfMode ? item.extracted_text : item.body_html)

  /* If Quick is requested but the item has no summary points, silently
     fall back to Full — the Quick view would be empty anyway. */
  const effectiveMode: ReadMode = mode === 'quick' && hasKeyPoints ? 'quick' : 'full'

  const setMode = useCallback((next: ReadMode) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (next === 'full') sp.delete('view')
    else                  sp.set('view', next)
    const qs = sp.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }, [router, searchParams])

  /* If the URL says `?view=quick` but the article has no summary points,
     strip the param so a refresh stays clean. Side-effect, not render-time. */
  useEffect(() => {
    if (mode === 'quick' && !hasKeyPoints) {
      const sp = new URLSearchParams(searchParams.toString())
      sp.delete('view')
      const qs = sp.toString()
      router.replace(qs ? `?${qs}` : '?', { scroll: false })
    }
  }, [mode, hasKeyPoints, router, searchParams])

  const dateString = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(item.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  const ARTICLE_ID = `content-article-${item.id}`
  const processedHtml = item.body_html ? processBibleRefs(item.body_html) : ''

  return (
    <article id={ARTICLE_ID} style={{
      /* Long-form prose article — uses --width-prose (780px), the
         typographic sweet spot for sustained reading (~70-80 chars
         per line at body font size). */
      maxWidth: 'var(--width-prose)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 5rem',
    }}>
      {/* Breadcrumb — Home / Topics / Type / Title.
          "Topics" is a Pass 4 label-only rename; the link still routes to
          /content. Pass 5 will introduce the real /topic index and repoint. */}
      <Breadcrumb
        homeLabel={tBread('home')}
        topicsLabel={tReader('breadcrumb.topics')}
        typeLabel={tTypes(item.content_type)}
        title={item.title}
        contentType={item.content_type}
      />

      {/* Translation banner — unchanged. Shows in both Quick and Full modes
          since translation status is about the content itself, not the view. */}
      {translationStatus !== 'native' && (
        <div
          role="note"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            background: translationStatus === 'pending'
              ? 'var(--warning-bg, rgba(245, 174, 65, 0.10))'
              : 'var(--info-bg, rgba(68, 152, 204, 0.08))',
            border: `0.5px solid ${
              translationStatus === 'pending'
                ? 'var(--warning-border, rgba(245, 174, 65, 0.35))'
                : 'var(--info-border, rgba(68, 152, 204, 0.30))'
            }`,
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: '14px', flexShrink: 0 }} aria-hidden>
            {translationStatus === 'pending' ? '⚠' : '🌐'}
          </span>
          <span style={{ flex: 1 }}>
            {translationStatus === 'translated'
              ? t('translatedNotice')
              : t('pendingTranslationNotice', { source: sourceLanguage ?? '' })}
          </span>
        </div>
      )}

      {/* Full / Quick toggle — only when summary points exist (otherwise
          Quick view would be empty). Sits above the title in both modes
          per the design. Works for editor mode AND pdf mode (Pass 4 Q7 = b
          unifies the two: dropping the old inner Plain Text / PDF Viewer
          sub-toggle that used to live inside PdfViewer). */}
      {hasKeyPoints && (
        <ReaderToggle
          mode={effectiveMode}
          onChange={setMode}
          fullLabel={tReader('toggleFull')}
          quickLabel={tReader('toggleQuick')}
        />
      )}

      {/* Type pill + lesson badge + theme/series eyebrow + title — both
          modes show these as orientation. */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 11px',
          background: TYPE_COLORS[item.content_type],
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderRadius: '20px',
        }}>
          {tTypes(item.content_type)}
        </span>
        {item.lesson_number && (
          <span style={{
            padding: '4px 11px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: '20px',
          }}>
            {t('lesson', { number: item.lesson_number })}
          </span>
        )}
      </div>

      {(item.theme || item.series) && (
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '12px',
        }}>
          {item.theme}
          {item.theme && item.series && ' · '}
          {item.series}
        </div>
      )}

      <h1 style={{
        fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
        fontSize:      'clamp(32px, 5vw, 52px)',
        fontWeight:    'var(--content-title-weight, 800)',
        textTransform: 'var(--content-title-transform, uppercase)',
        color:         'var(--text-primary)',
        lineHeight:    1.0,
        letterSpacing: '-0.01em',
        marginBottom:  '20px',
      }}>
        {item.title}
      </h1>

      {/* Byline card — avatar + name · date · read-time, single row.
          Pass 5c: when the content row has a joined author, we pass
          their avatar URL (renders inside the circle) and their slug
          (turns the name into a Link to /authors/[slug]). Legacy rows
          without an author_id fall back to initials and plain text via
          item.speaker — see BylineCard for the branch logic. */}
      <BylineCard
        name={item.author?.name ?? item.speaker}
        date={dateString}
        readTimeLabel={tReader('byline.readTime', { minutes: readMin })}
        avatarUrl={item.author?.avatar_url ?? null}
        authorSlug={item.author?.slug ?? null}
      />

      {/* Icon actions — link / share / (PDF) download as small circular
          icon buttons on their own row. Replaces the old text-button
          action bar above the cover and the duplicate action group at
          the page footer. */}
      <ReaderIconActions
        shareTitle={item.title}
        copyLinkLabel={tReader('actions.copyLink')}
        copiedLabel={tReader('actions.copied')}
        shareLabel={tReader('actions.share')}
        downloadLabel={tReader('actions.downloadPdf')}
        downloadUrl={isPdfMode ? signedPdfUrl : null}
      />

      {/* Audio player + YouTube embed — shown when either URL is set. */}
      <MediaSection
        audioUrl={item.audio_url}
        videoUrl={item.video_url}
        contentType={item.content_type}
      />

      {/* ────────────────────────────────────────────────────────────
          QUICK MODE: only the cover + paginated summary cards.
          Skips body, scripture refs, tags, attachments. Final card's
          "Read full story" pill flips us to Full mode (handled inside
          QuickStoryView via the onReadFull callback).
          ──────────────────────────────────────────────────────────── */}
      {effectiveMode === 'quick' && hasKeyPoints ? (
        <>
          <QuickStoryView
            points={item.summary_points!}
            coverImageUrl={item.cover_image_url}
            paginationLabel={(current, total) =>
              tReader('quick.pagination', { current, total })
            }
            nextLabel={tReader('quick.next')}
            prevLabel={tReader('quick.prev')}
            readFullLabel={tReader('quick.readFull')}
            pointFallbackLabel={(n) => tReader('quick.pointFallback', { n })}
            onReadFull={() => setMode('full')}
          />

          {seriesItems && seriesItems.length > 0 && (
            <SeriesStrip series={item.series!} items={seriesItems} />
          )}

          {/* Minimal footer — just "Back to all content". Action icons live
              at the top of the page (icon row); no duplicates here. */}
          <section style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '0.5px solid var(--border-subtle)',
          }}>
            <Link href="/content" style={{
              fontSize: '13px',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
            }}>
              {t('backToAll')}
            </Link>
          </section>
        </>
      ) : (
        <>
          {/* ──────────────────────────────────────────────────────────
              FULL MODE: cover image + body + scripture refs + tags +
              attachments + minimal footer.
              ────────────────────────────────────────────────────────── */}
          {item.cover_image_url && (
            <div style={{
              aspectRatio: '16 / 9',
              background: `url(${item.cover_image_url}) center/cover`,
              borderRadius: '12px',
              marginBottom: '32px',
              overflow: 'hidden',
            }} />
          )}

          {isPdfMode ? (
            <PdfViewer
              signedUrl={signedPdfUrl}
              title={item.title}
              tUnavailable={t('pdfUnavailable')}
            />
          ) : (
            <>
              <div className="lr-editor-content" style={{
                background: 'transparent',
                padding: 0,
                minHeight: 'auto',
                maxHeight: 'none',
                fontSize: '17px',
                lineHeight: 1.75,
                textAlign: 'start',
              }}
              dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
              <BibleRefActivator containerId={ARTICLE_ID} />
            </>
          )}

          {item.scripture_refs.length > 0 && (
            <section style={{ marginTop: '40px', paddingTop: '24px', borderTop: '0.5px solid var(--border-subtle)' }}>
              <h2 style={sectionHeadingStyle}>{t('scriptureRefs')}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.scripture_refs.map(ref => (
                  <span key={ref} style={{
                    padding: '5px 11px',
                    background: 'rgba(245,174,65,0.08)',
                    border: '0.5px solid rgba(245,174,65,0.3)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    color: 'var(--brand-gold)',
                    fontWeight: 500,
                  }}>
                    {ref}
                  </span>
                ))}
              </div>
            </section>
          )}

          {item.tags.length > 0 && (
            <section style={{ marginTop: '24px' }}>
              <h2 style={sectionHeadingStyle}>{t('tags')}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '4px 10px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {attachments.length > 0 && (
            <section style={{ marginTop: '40px', paddingTop: '24px', borderTop: '0.5px solid var(--border-subtle)' }}>
              <h2 style={sectionHeadingStyle}>{t('attachments')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {attachments.map(att => <AttachmentRow key={att.id} att={att} />)}
              </div>
            </section>
          )}

          {seriesItems && seriesItems.length > 0 && (
            <SeriesStrip series={item.series!} items={seriesItems} />
          )}

          {/* Minimal footer — just "Back to all content". Action icons live
              at the top of the page (icon row); no duplicates here. */}
          <section style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '0.5px solid var(--border-subtle)',
          }}>
            <Link href="/content" style={{
              fontSize: '13px',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
            }}>
              {t('backToAll')}
            </Link>
          </section>
        </>
      )}
    </article>
  )
}

/**
 * PDF viewer — Pass 4 simplified.
 *
 * Previously had an inner "PDF Viewer / Plain Text" toggle, which Pass 4
 * dropped (Q7 = b unifies the two views: PDF mode's Quick view becomes the
 * summary cards via QuickStoryView, and PDF mode's Full view is just the
 * iframe). Extracted text is still stored in the DB and used for read-time
 * computation upstream — it's just no longer surfaced as a user toggle.
 */
function PdfViewer({
  signedUrl, title, tUnavailable,
}: {
  signedUrl:    string | null
  title:        string
  tUnavailable: string
}) {
  if (!signedUrl) {
    return (
      <div style={{
        padding: '40px 24px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '13px',
      }}>
        {tUnavailable}
      </div>
    )
  }

  return (
    <iframe
      src={signedUrl}
      title={title}
      style={{
        width: '100%',
        aspectRatio: '8.5 / 11',
        maxHeight: '85dvh',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px',
        display: 'block',
      }}
    />
  )
}

function AttachmentRow({ att }: { att: Attachment }) {
  const styles: Record<typeof att.file_type, { bg: string; emoji: string }> = {
    pdf:   { bg: 'rgba(195,33,38,0.12)',  emoji: '📕' },
    image: { bg: 'rgba(68,152,204,0.12)', emoji: '🖼' },
    audio: { bg: 'rgba(245,174,65,0.12)', emoji: '🎵' },
    other: { bg: 'var(--bg-elevated)',     emoji: '📄' },
  }
  const s = styles[att.file_type]

  return (
    <a
      href={att.file_url}
      download
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '8px',
        textDecoration: 'none',
        transition: 'border-color 0.12s',
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '7px',
        background: s.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '17px',
        flexShrink: 0,
      }}>
        {s.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-primary)',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {att.file_name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
          {att.file_type.toUpperCase()} · {formatBytes(att.size_bytes)}
        </div>
      </div>
      <DownloadIcon />
    </a>
  )
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '12px',
  fontFamily: 'var(--font-body)',
}

const TYPE_BG: Record<string, string> = {
  manual: '#D5E9F6', prophecy: '#F9D6D7', article: '#FEF0D5', blog: '#C8BFEC',
}

function SeriesStrip({ series, items }: { series: string; items: SeriesItem[] }) {
  return (
    <section style={{ marginTop: '48px', paddingTop: '24px', borderTop: '0.5px solid var(--border-subtle)' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={sectionHeadingStyle}>Series</div>
        <h2 style={{
          fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
          fontSize:      'clamp(1.125rem, 3vw, 1.375rem)',
          fontWeight:    800,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          color:         'var(--text-primary)',
          margin:        0,
        }}>
          More from &ldquo;{series}&rdquo;
        </h2>
      </div>

      <div style={{
        display:               'grid',
        gridTemplateColumns:   'repeat(auto-fill, minmax(10rem, 1fr))',
        gap:                   '0.75rem',
      }}>
        {items.map(si => (
          <Link
            key={si.id}
            href={contentHref(si)}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div style={{
              borderRadius: '0.75rem',
              background:   TYPE_BG[si.content_type] ?? '#F0EDE8',
              overflow:     'hidden',
              transition:   'transform 0.15s, box-shadow 0.15s',
            }}>
              {/* Cover thumbnail */}
              <div style={{
                aspectRatio: '3 / 2',
                background:  si.cover_image_url
                  ? `url(${si.cover_image_url}) center/cover`
                  : TYPE_BG[si.content_type] ?? '#F0EDE8',
              }} />

              {/* Title area */}
              <div style={{ padding: '0.625rem 0.75rem 0.75rem' }}>
                <div style={{
                  fontSize:      '0.6875rem',
                  fontWeight:    600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color:         TYPE_COLORS[si.content_type] ?? 'var(--text-secondary)',
                  marginBottom:  '0.25rem',
                }}>
                  {si.content_type}
                </div>
                <div style={{
                  fontFamily:      'var(--font-display), Barlow Condensed, sans-serif',
                  fontSize:        '0.9375rem',
                  fontWeight:      700,
                  lineHeight:      1.15,
                  color:           'var(--text-primary)',
                  display:         '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow:        'hidden',
                }}>
                  {si.title}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* DownloadIcon is still used by <AttachmentRow>; the share/copy/check icons
   that used to live here moved into <ReaderIconActions>. */
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}