'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top-of-screen progress bar that appears during route transitions.
 *
 * Trigger sources:
 *   1. **Link clicks**  — a document-level click listener watches for
 *      <a> elements that point to a same-origin route. When one is clicked,
 *      the bar starts.
 *   2. **Programmatic** — `window.__routeProgress.start()` / `.done()` can
 *      be called from anywhere (e.g. router.push handlers in forms).
 *
 * Stop conditions:
 *   • Pathname or search-params change → the new route has rendered, bar
 *     finishes its sweep and hides.
 *   • 8s timeout → safety net if something hangs; bar finishes regardless
 *     so it never stays visible forever.
 *
 * Debounce: bar only becomes visible after 500ms of pending state — so
 * fast same-page navigations don't strobe. The user's exact ask was "show
 * something when the next page is loading", which means it's better to
 * skip the bar entirely on instant navs than to flash it for 50ms.
 *
 * Placement: top:0, height 0.1875rem (3px), full width, brand red. Sits
 * above the gold scroll progress bar (which is also at top:0 but only on
 * the public layout). Z-index 9999 so it floats above the header.
 */

const SHOW_AFTER_MS  = 500
const SAFETY_TIMEOUT = 8000

declare global {
  interface Window {
    __routeProgress?: {
      start: () => void
      done:  () => void
    }
  }
}

export default function RouteProgressBar() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  /* Three-state machine:
       'idle'    — bar hidden, no transition in flight
       'pending' — click happened, but <500ms ago (bar still hidden)
       'visible' — bar shown, sweeping right                        */
  const [state, setState] = useState<'idle' | 'pending' | 'visible'>('idle')

  const showTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Start: timer kicks in 500ms after; if route doesn't change before
        that, the bar becomes visible. */
  function start() {
    if (showTimerRef.current || state !== 'idle') return
    setState('pending')
    showTimerRef.current = setTimeout(() => {
      setState('visible')
      showTimerRef.current = null
    }, SHOW_AFTER_MS)
    safetyTimerRef.current = setTimeout(done, SAFETY_TIMEOUT)
  }

  /* ── Done: cancels pending visibility, completes a final sweep if
        already visible, then returns to idle. */
  function done() {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }
    if (state === 'visible') {
      /* Stay visible briefly so the user perceives the completion sweep,
         then hide. */
      finishTimerRef.current = setTimeout(() => setState('idle'), 200)
    } else {
      setState('idle')
    }
  }

  /* ── Expose imperative API on `window` so callers anywhere (form
        handlers, language switcher, etc.) can drive the bar without
        importing this component. */
  useEffect(() => {
    window.__routeProgress = { start, done }
    return () => { delete window.__routeProgress }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  /* ── Click interception: catch link clicks anywhere in the document. */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      /* Modifier-key clicks (cmd/ctrl/shift) open new tabs/windows — no
         in-page nav happens, so don't show the bar. */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return

      const target = (e.target as HTMLElement | null)?.closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || target.target === '_blank') return

      /* Same-origin check: only fire for internal navigation. External
         links open elsewhere; the bar would never complete. */
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        /* Same exact URL → no navigation, bail. */
        if (url.pathname === window.location.pathname &&
            url.search   === window.location.search) return
      } catch {
        return
      }

      start()
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── When pathname or search-params change, the new route has rendered;
        complete the bar. */
  useEffect(() => {
    done()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  /* ── Cleanup all timers on unmount. */
  useEffect(() => {
    return () => {
      if (showTimerRef.current)   clearTimeout(showTimerRef.current)
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    }
  }, [])

  /* Visible state renders a 3px tall bar. Two-phase animation:
       phase 1: 0% → 70% over 1.2s (eased, builds anticipation)
       phase 2: completion sweep to 100% in 200ms when done() fires      */
  const visible = state === 'visible'

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        top:           0,
        insetInlineStart: 0,
        height:        '0.1875rem',
        width:         visible ? '70%' : '0%',
        background:    'var(--brand-red)',
        transition:    visible
          ? 'width 1.2s cubic-bezier(0.1, 0.5, 0.2, 1), opacity 0.2s'
          : 'width 0.2s ease-out, opacity 0.3s 0.2s',
        opacity:       visible ? 1 : 0,
        zIndex:        9999,
        pointerEvents: 'none',
        boxShadow:     visible
          ? '0 0 0.5rem color-mix(in srgb, var(--brand-red) 50%, transparent)'
          : 'none',
      }}
    />
  )
}