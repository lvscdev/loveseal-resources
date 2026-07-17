'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { LOCALES_META, routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/lib/toast'

export default function LanguageSwitcher() {
  const t        = useTranslations('languageSwitcher')
  const locale   = useLocale() as AppLocale
  const pathname = usePathname()
  const params   = useParams()
  const router   = useRouter()
  const [open, setOpen]     = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function changeLocale(next: AppLocale) {
    if (next === locale) {
      setOpen(false)
      return
    }
    setOpen(false)

    /* Trigger the global route-progress bar manually here since router.replace
       runs inside a transition and the bar's click interceptor doesn't fire
       (the click was on a button, not an <a>). */
    if (typeof window !== 'undefined') {
      window.__routeProgress?.start()
    }

    /* Inform the user the switch is happening. The toast is replaced in
       place by the success message once the new locale's content has
       rendered (the i18n change is fast — usually <500ms — so this is
       mostly for assurance). */
    const toastId = toast.loading(`Switching to ${LOCALES_META[next].native}…`)

    startTransition(() => {
      // usePathname() returns the route template ("/content/[id]") with typed
      // routes enabled. useParams() gives the filled-in values ({ id: "abc" }).
      // Passing both lets next-intl construct the correct locale-switched URL.
      // @ts-expect-error -- next-intl typed router can't fully infer this shape
      router.replace({ pathname, params }, { locale: next })
      /* Replace the loading toast with a success toast. Sonner's toast.success
         with the same `id` updates the existing toast in place. */
      toast.success(`Language: ${LOCALES_META[next].native}`, { id: toastId })
    })
  }

  const current = LOCALES_META[locale]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={t('label')}
        aria-label={t('current')}
        disabled={isPending}
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '0.375rem',
          padding:      '0.375rem 0.625rem',
          height:       '2.125rem',
          background:   open ? 'var(--bg-elevated)' : 'transparent',
          border:       '0.03125rem solid var(--border-subtle)',
          borderRadius: '999rem',
          cursor:       isPending ? 'wait' : 'pointer',
          fontFamily:   'var(--font-body)',
          fontSize:     '0.75rem',
          color:        'var(--text-tertiary)',
          transition:   'background 0.12s, color 0.12s',
          opacity:      isPending ? 0.7 : 1,
        }}
      >
        {isPending ? (
          <Spinner size="sm" />
        ) : (
          <span style={{ fontSize: '0.875rem' }}>{current.flag}</span>
        )}
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {locale}
        </span>
        <ChevronDown open={open} />
      </button>

      {open && (
        <div style={{
          position:       'absolute',
          top:            'calc(100% + 0.375rem)',
          /* In LTR: dropdown's right edge aligns with trigger's right edge.
             In RTL: dropdown's left edge aligns with trigger's left edge.
             Both render *inside* the viewport — that's what we want. */
          insetInlineEnd: 0,
          minWidth:       '11.25rem',
          background:     'var(--bg-raised)',
          border:         '0.03125rem solid var(--border-strong)',
          borderRadius:   '0.625rem',
          padding:        '0.25rem',
          boxShadow:      '0 0.625rem 2rem rgba(0,0,0,0.15)',
          zIndex:         200,
        }}>
          {routing.locales.map((loc) => {
            const meta     = LOCALES_META[loc]
            const isActive = loc === locale
            return (
              <button
                key={loc}
                onClick={() => changeLocale(loc as AppLocale)}
                disabled={isPending}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '0.625rem',
                  width:        '100%',
                  padding:      '0.5rem 0.75rem',
                  background:   isActive ? 'rgba(245,174,65,0.10)' : 'transparent',
                  border:       'none',
                  borderRadius: '0.375rem',
                  cursor:       isPending ? 'wait' : 'pointer',
                  fontFamily:   'var(--font-body)',
                  fontSize:     '0.75rem',
                  color:        isActive ? 'var(--brand-gold)' : 'var(--text-secondary)',
                  textAlign:    'start',
                  fontWeight:   isActive ? 500 : 400,
                }}
              >
                <span style={{ fontSize: '0.9375rem' }}>{meta.flag}</span>
                <span style={{ flex: 1 }}>{meta.native}</span>
                {isActive && <span style={{ fontSize: '0.75rem' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        transform:  open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.18s',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}