'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { useEffect, useState } from 'react'

/**
 * Mount-once Toaster — placed in the root layout so toasts can be triggered
 * from anywhere (public + admin). Wraps `sonner` with brand styling that
 * matches the rest of the design system.
 *
 * Position is responsive per the locked decision:
 *   • desktop (≥40rem)  → top-right
 *   • mobile  (<40rem)  → bottom-center
 *
 * Colors come from the brand tokens via inline `toastOptions.style`, with
 * per-variant accents controlled via `unstyled: false` + Sonner's
 * theme-aware defaults. Errors get the brand red, success gets a soft
 * green, info gets the brand gold (used heavily for "Loading…" toasts).
 *
 * Sonner is RTL-friendly out of the box — when the document `dir="rtl"`
 * (Arabic locale), the toast horizontal positions flip automatically.
 */
export default function Toaster() {
  /* Track viewport breakpoint client-side. SSR-safe: start at 'desktop' so
     the initial render matches the most common case; reconcile on mount. */
  const [position, setPosition] =
    useState<'top-right' | 'bottom-center'>('top-right')

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 40rem)')
    const update = () => setPosition(mql.matches ? 'bottom-center' : 'top-right')
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return (
    <SonnerToaster
      position={position}
      duration={4500}
      closeButton
      richColors={false}
      theme="system"
      toastOptions={{
        style: {
          background:    'var(--bg-elevated, #FFFFFF)',
          color:         'var(--text-primary, #212529)',
          border:        '0.0625rem solid var(--border-subtle, #E5E7EB)',
          borderRadius:  '0.625rem',
          padding:       '0.875rem 1rem',
          fontSize:      '0.875rem',
          fontFamily:    'var(--font-body), system-ui, sans-serif',
          boxShadow:     '0 0.5rem 1.5rem rgba(0, 0, 0, 0.08), 0 0.125rem 0.25rem rgba(0, 0, 0, 0.04)',
        },
        classNames: {
          /* Per-variant accent bar — left-side coloured stripe matches the
             pattern used by the Callout component in the admin manual. */
          toast:         'lr-toast',
          error:         'lr-toast--error',
          success:       'lr-toast--success',
          info:          'lr-toast--info',
          warning:       'lr-toast--warning',
          loading:       'lr-toast--loading',
          actionButton:  'lr-toast-action',
          cancelButton:  'lr-toast-cancel',
          closeButton:   'lr-toast-close',
        },
      }}
    />
  )
}