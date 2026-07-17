'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'

/**
 * Subscribe-by-email control for the public footer.
 *
 * Renders as a pill button by default. When clicked, it transforms into an
 * inline `<input type="email"> + Submit` row. On submit it logs to console
 * and flashes a success state for 2.5s, then collapses back to the button.
 *
 * THERE IS NO BACKEND YET. Captured emails are not persisted anywhere — this
 * component is deliberately a UI shell for the design merge. The full
 * subscribe + admin subscribers feature is scheduled as a dedicated phase
 * after Pass 6 of the design merge.
 *
 * When the backend lands, swap the `handleSubmit` body with a POST to the
 * subscribe endpoint; the rest of this component (states, transitions,
 * a11y) should not need to change.
 */
export default function FooterSubscribeForm() {
  const t      = useTranslations('footer.subscribe')
  const locale = useLocale()

  const [open,    setOpen]    = useState(false)
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Focus the input as soon as the form opens. */
  useEffect(() => {
    if (open && status === 'idle') {
      inputRef.current?.focus()
    }
  }, [open, status])

  /* Clean up any pending timer on unmount. */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
        timerRef.current = setTimeout(() => {
          setStatus('idle')
          setOpen(false)
        }, 2500)
      } else {
        setStatus('error')
        timerRef.current = setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setStatus('error')
      timerRef.current = setTimeout(() => setStatus('idle'), 3000)
    }
  }

  /* Collapsed: pill button. */
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={pillOutlineStyle}
        aria-expanded={false}
        aria-controls="footer-subscribe-form"
      >
        {t('button')}
      </button>
    )
  }

  /* Expanded — either input form or success message. */
  return (
    <div
      id="footer-subscribe-form"
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.5rem',
        minWidth:   '17.5rem',
      }}
    >
      {status === 'success' ? (
        <span
          style={{
            fontSize:   '0.875rem',
            fontWeight: 500,
            color:      'var(--footer-text)',
            padding:    '0.75rem 1.375rem',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999rem',
          }}
          role="status"
        >
          {t('success')}
        </span>
      ) : status === 'error' ? (
        <span
          style={{
            fontSize:   '0.875rem',
            fontWeight: 500,
            color:      'var(--brand-red, #C32126)',
            padding:    '0.75rem 1.375rem',
            background: 'rgba(195, 33, 38, 0.1)',
            borderRadius: '999rem',
          }}
          role="alert"
        >
          Something went wrong — please try again.
        </span>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.5rem',
            width:      '100%',
          }}
          noValidate
        >
          <input
            ref={inputRef}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            style={{
              flex:           1,
              minWidth:       '12rem',
              height:         '2.625rem',
              padding:        '0 1rem',
              fontSize:       '0.875rem',
              fontFamily:     'inherit',
              color:          'var(--footer-text)',
              background:     'var(--footer-input-bg)',
              border:         '1px solid var(--footer-input-border)',
              borderRadius:   '999rem',
              outline:        'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{ ...pillRedStyle, opacity: status === 'loading' ? 0.6 : 1 }}
            aria-label={t('submit')}
          >
            {status === 'loading' ? '…' : t('submit')}
          </button>
        </form>
      )}
    </div>
  )
}

const pillBaseStyle: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  height:         '2.625rem',
  padding:        '0 1.375rem',
  fontSize:       '0.875rem',
  fontWeight:     500,
  fontFamily:     'inherit',
  color:          'var(--footer-text)',
  borderRadius:   '999rem',
  border:         'none',
  cursor:         'pointer',
  whiteSpace:     'nowrap',
  textDecoration: 'none',
  lineHeight:     1,
  transition:     'background-color 0.12s, box-shadow 0.12s',
}

const pillRedStyle: React.CSSProperties = {
  ...pillBaseStyle,
  background: 'var(--footer-red)',
}

const pillOutlineStyle: React.CSSProperties = {
  ...pillBaseStyle,
  background: 'transparent',
  boxShadow:  'inset 0 0 0 1px var(--footer-pill-outline)',
}