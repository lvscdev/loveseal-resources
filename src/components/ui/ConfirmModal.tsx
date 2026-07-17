'use client'

import { useEffect } from 'react'
import ButtonSpinner from './ButtonSpinner'

/**
 * App-styled replacement for `window.confirm()`. Renders nothing when
 * `open` is false, so it can be mounted unconditionally at the bottom of
 * any component and driven by local state:
 *
 *   const [target, setTarget] = useState<Item | null>(null)
 *   const [busy, setBusy]     = useState(false)
 *
 *   <ConfirmModal
 *     open={!!target}
 *     title="Delete content"
 *     message={`Delete "${target?.title}"? This cannot be undone.`}
 *     confirmLabel="Delete"
 *     danger
 *     busy={busy}
 *     onConfirm={handleConfirmedDelete}
 *     onCancel={() => setTarget(null)}
 *   />
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger       = false,
  busy         = false,
  onConfirm,
  onCancel,
}: {
  open:          boolean
  title:         string
  message:       React.ReactNode
  confirmLabel?: string
  cancelLabel?:  string
  danger?:       boolean
  busy?:         boolean
  onConfirm:     () => void
  onCancel:      () => void
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={() => !busy && onCancel()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-raised)',
          border: '0.03125rem solid var(--border-strong)',
          borderRadius: '0.75rem',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '25rem',
          boxShadow: '0 1.25rem 3.75rem rgba(0,0,0,0.3)',
        }}
      >
        <h2
          id="confirm-modal-title"
          style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          {title}
        </h2>

        <p style={{
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          marginBottom: '1.5rem',
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '0.03125rem solid var(--border-strong)',
              borderRadius: '0.4375rem',
              color: 'var(--text-tertiary)',
              fontSize: '0.75rem',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            style={{
              padding: '0.5rem 1rem',
              background: danger ? 'var(--danger-fg)' : 'var(--brand-gold)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.4375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '2.125rem',
              minWidth: '6rem',
              fontFamily: 'var(--font-body)',
            }}
          >
            {busy ? <ButtonSpinner label="Working…" inverse /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
