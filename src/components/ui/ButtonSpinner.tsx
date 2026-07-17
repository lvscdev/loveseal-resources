'use client'

import Spinner from './Spinner'

/**
 * Button-in-loading-state content. Use this INSIDE a button when the
 * button's async action is running:
 *
 *   <button onClick={handleSave} disabled={saving}>
 *     {saving ? <ButtonSpinner label="Saving…" /> : 'Save'}
 *   </button>
 *
 * The spinner sits at the original button width — we don't reflow. The
 * label text appears next to the spinner, giving the user something to
 * read while the action runs (especially valuable for long actions
 * like translate or PDF upload).
 *
 * Pass `inverse` when the button has a coloured background (red/gold)
 * — switches the spinner to white so it stays visible.
 */
export default function ButtonSpinner({
  label   = 'Working…',
  inverse = false,
}: {
  label?:   string
  inverse?: boolean
}) {
  const color = inverse ? '#FFFFFF' : 'var(--brand-gold)'

  return (
    <span
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        '0.5rem',
        whiteSpace: 'nowrap',
      }}
    >
      <Spinner size="sm" color={color} label={label} />
      <span style={{ fontSize: 'inherit' }}>{label}</span>
    </span>
  )
}