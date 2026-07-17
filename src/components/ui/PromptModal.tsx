'use client'

import { useEffect, useState } from 'react'

export interface PromptField {
  name:         string
  label:        string
  placeholder?: string
  required?:    boolean
  multiline?:   boolean
}

/**
 * App-styled replacement for `window.prompt()`. Collects one or more text
 * fields in a single dialog instead of chaining sequential browser prompts.
 *
 *   <PromptModal
 *     open={showLinkPrompt}
 *     title="Insert link"
 *     fields={[{ name: 'url', label: 'Link URL', placeholder: 'https://…', required: true }]}
 *     initialValues={{ url: previousUrl }}
 *     submitLabel="Insert"
 *     onSubmit={values => applyLink(values.url)}
 *     onCancel={() => setShowLinkPrompt(false)}
 *   />
 */
export default function PromptModal({
  open,
  title,
  fields,
  initialValues = {},
  submitLabel = 'Insert',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: {
  open:            boolean
  title:           string
  fields:          PromptField[]
  initialValues?:  Record<string, string>
  submitLabel?:    string
  cancelLabel?:    string
  onSubmit:        (values: Record<string, string>) => void
  onCancel:        () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)

  useEffect(() => {
    if (open) setValues(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const canSubmit = fields.every(f => !f.required || (values[f.name] ?? '').trim())

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(values)
  }

  return (
    <div
      role="presentation"
      onClick={onCancel}
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
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
          id="prompt-modal-title"
          style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}
        >
          {title}
        </h2>

        {fields.map((field, i) => (
          <div key={field.name} style={{ marginBottom: i === fields.length - 1 ? '1.5rem' : '0.875rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-tertiary)',
              marginBottom: '0.375rem',
              letterSpacing: '0.04em',
            }}>
              {field.label}{field.required && ' *'}
            </label>
            {field.multiline ? (
              <textarea
                value={values[field.name] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                autoFocus={i === 0}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }}
              />
            ) : (
              <input
                type="text"
                value={values[field.name] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                autoFocus={i === 0}
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit() }}
                style={inputStyle}
              />
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '0.03125rem solid var(--border-strong)',
              borderRadius: '0.4375rem',
              color: 'var(--text-tertiary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--brand-gold)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '0.4375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
              fontFamily: 'var(--font-body)',
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5625rem 0.75rem',
  background: 'var(--bg-input)',
  border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.4375rem',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}
