'use client'

/**
 * BibleRefActivator — single client component for all Bible-reference spans.
 *
 * Uses event delegation on the article container so there's no per-reference
 * React overhead. Interaction model:
 *   - Desktop (hover capable):  hover with 350 ms delay → floating popover
 *   - Mobile (touch):           tap → bottom sheet (full-width, slides up)
 *
 * Results are cached in a module-level Map so re-opening the same verse at the
 * same version never re-fetches.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BIBLE_VERSIONS, DEFAULT_VERSION, type BibleVersion } from '@/lib/bible-versions'

/* ── Module-level fetch cache (survives re-renders, cleared on page nav) ─── */
const CACHE = new Map<string, { text: string; reference: string }>()

interface OpenRef {
  passageId:   string
  displayText: string
  anchorRect:  DOMRect
}

interface VerseResult {
  text:      string
  reference: string
}

export default function BibleRefActivator({ containerId }: { containerId: string }) {
  const [open, setOpen]         = useState<OpenRef | null>(null)
  const [version, setVersion]   = useState<BibleVersion>(DEFAULT_VERSION)
  const [result, setResult]     = useState<VerseResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const hoverTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popoverRef   = useRef<HTMLDivElement>(null)

  /* Detect touch/hover capability once on mount */
  useEffect(() => {
    setIsMobile(window.matchMedia('(hover: none)').matches)
  }, [])

  /* ── Fetch verse text whenever open ref or version changes ──────────── */
  useEffect(() => {
    if (!open) { setResult(null); setError(null); return }

    const key = `${open.passageId}::${version.id}`
    if (CACHE.has(key)) {
      setResult(CACHE.get(key)!)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    const params = new URLSearchParams({ bible: version.id, passage: open.passageId })
    fetch(`/api/bible?${params}`)
      .then(r => r.json())
      .then((data: { text?: string; reference?: string; error?: string }) => {
        if (data.error) {
          setError(data.error === 'verse_not_found'
            ? 'Not available in this version'
            : 'Could not load verse')
        } else {
          const r = { text: data.text ?? '', reference: data.reference ?? '' }
          CACHE.set(key, r)
          setResult(r)
        }
      })
      .catch(() => setError('Could not load verse'))
      .finally(() => setLoading(false))
  }, [open?.passageId, version])

  /* ── Event delegation on article container ──────────────────────────── */
  const openRef = useCallback((el: HTMLElement) => {
    const passageId   = el.dataset.bibleRef
    const displayText = decodeURIComponent(el.dataset.bibleText ?? '')
    if (!passageId) return
    setOpen({ passageId, displayText, anchorRect: el.getBoundingClientRect() })
  }, [])

  useEffect(() => {
    const container = document.getElementById(containerId)
    if (!container) return

    function onMouseEnter(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.bible-ref')
      if (!el) return
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
      hoverTimer.current = setTimeout(() => openRef(el), 350)
    }

    function onMouseLeave() {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      // Small grace period — lets user move cursor from text into the popover
      leaveTimer.current = setTimeout(() => {
        if (!popoverRef.current?.matches(':hover')) setOpen(null)
      }, 200)
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'touch') return
      const el = (e.target as HTMLElement).closest<HTMLElement>('.bible-ref')
      if (!el) return
      e.preventDefault()
      openRef(el)
    }

    container.addEventListener('mouseenter', onMouseEnter, true)
    container.addEventListener('mouseleave', onMouseLeave, true)
    container.addEventListener('pointerdown', onPointerDown, { capture: true, passive: false })

    return () => {
      container.removeEventListener('mouseenter', onMouseEnter, true)
      container.removeEventListener('mouseleave', onMouseLeave, true)
      container.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [containerId, openRef])

  /* Keep popover open while cursor is over it */
  function onPopoverMouseEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }
  function onPopoverMouseLeave() {
    leaveTimer.current = setTimeout(() => setOpen(null), 150)
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      {/* Backdrop — mobile only */}
      {isMobile && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 9998,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div
        ref={popoverRef}
        onMouseEnter={onPopoverMouseEnter}
        onMouseLeave={onPopoverMouseLeave}
        style={isMobile
          ? mobileSheet
          : desktopPopover(open.anchorRect)}
      >
        <BiblePanel
          open={open}
          result={result}
          loading={loading}
          error={error}
          version={version}
          onVersionChange={setVersion}
          onClose={() => setOpen(null)}
          isMobile={isMobile}
        />
      </div>
    </>,
    document.body,
  )
}

/* ── Position helpers ────────────────────────────────────────────────────── */

const mobileSheet: React.CSSProperties = {
  position:     'fixed',
  bottom:       0,
  left:         0,
  right:        0,
  zIndex:       9999,
  background:   'var(--bg-base, #ffffff)',
  borderRadius: '1.25rem 1.25rem 0 0',
  boxShadow:    '0 -8px 40px rgba(0,0,0,0.18)',
  padding:      '1rem 1.25rem 1.5rem',
  maxHeight:    '70vh',
  overflowY:    'auto',
  WebkitOverflowScrolling: 'touch',
}

function desktopPopover(rect: DOMRect): React.CSSProperties {
  const POPOVER_W = 340
  const POPOVER_H = 240
  const GAP = 8

  // Attempt to place above; fall back to below
  const spaceAbove = rect.top + window.scrollY - window.scrollY
  const placeAbove = spaceAbove > POPOVER_H + GAP

  const top    = placeAbove
    ? rect.top + window.scrollY - POPOVER_H - GAP
    : rect.bottom + window.scrollY + GAP

  // Clamp left to stay in viewport
  const raw  = rect.left + window.scrollX
  const left = Math.max(8, Math.min(raw, window.innerWidth - POPOVER_W - 8))

  return {
    position:     'absolute',
    top,
    left,
    width:        POPOVER_W,
    zIndex:       9999,
    background:   'var(--bg-base, #ffffff)',
    borderRadius: '0.875rem',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
    padding:      '1rem',
    border:       '0.5px solid var(--border-subtle, rgba(20,17,13,0.08))',
  }
}

/* ── Inner panel (shared between sheet and popover) ──────────────────────── */

function BiblePanel({
  open, result, loading, error, version, onVersionChange, onClose, isMobile,
}: {
  open:            OpenRef
  result:          VerseResult | null
  loading:         boolean
  error:           string | null
  version:         BibleVersion
  onVersionChange: (v: BibleVersion) => void
  onClose:         () => void
  isMobile:        boolean
}) {
  return (
    <>
      {/* Header: drag handle (mobile) + reference label + close */}
      {isMobile && (
        <div style={{
          width: '2.5rem', height: '0.25rem',
          background: 'var(--border-strong, rgba(20,17,13,0.16))',
          borderRadius: '999rem',
          margin: '0 auto 0.875rem',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <span style={{
          fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
          fontSize:      '1rem',
          fontWeight:    800,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          color:         'var(--text-primary)',
        }}>
          {result?.reference ?? open.displayText}
        </span>

        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'var(--bg-elevated, #f5f5f5)',
            border:     'none',
            borderRadius: '50%',
            width: '1.75rem', height: '1.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* Version pill row */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {BIBLE_VERSIONS.map(v => (
          <button
            key={v.id}
            onClick={() => onVersionChange(v)}
            aria-pressed={v.id === version.id}
            title={v.fullName}
            style={{
              padding:      '0.1875rem 0.5rem',
              borderRadius: '999rem',
              border:       'none',
              fontSize:     '0.6875rem',
              fontWeight:   700,
              letterSpacing:'0.06em',
              cursor:       'pointer',
              background:   v.id === version.id ? '#14110D' : 'var(--bg-elevated, #f5f5f5)',
              color:        v.id === version.id ? '#fff'    : 'var(--text-secondary)',
              transition:   'background 0.15s',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Verse text area */}
      <div style={{
        fontSize:   isMobile ? '1rem' : '0.9375rem',
        lineHeight: 1.65,
        color:      'var(--text-primary)',
        minHeight:  '3.5rem',
      }}>
        {loading && (
          <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Loading…</span>
        )}
        {error && !loading && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>{error}</span>
        )}
        {result && !loading && (
          <span>&ldquo;{result.text.trim()}&rdquo;</span>
        )}
      </div>

      {/* Version attribution */}
      {result && (
        <div style={{
          marginTop:  '0.625rem',
          fontSize:   '0.6875rem',
          color:      'var(--text-faint, #c9bfac)',
          letterSpacing: '0.06em',
        }}>
          {version.fullName}
        </div>
      )}
    </>
  )
}
