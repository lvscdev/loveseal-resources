'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createEditorialTag,
  updateEditorialTag,
  deleteEditorialTag,
  reorderEditorialTags,
} from './actions'
import type { EditorialTagRow } from './page'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/lib/toast'

/**
 * Editorial tags manager — admin UI for the "In focus this week" strip.
 *
 * Capabilities:
 *   · add a new tag (appends to the bottom of the list)
 *   · inline-edit a tag's text
 *   · toggle active / inactive (inactive tags don't appear on the public strip)
 *   · drag-reorder via the up/down arrow buttons (keyboard accessible)
 *   · delete a tag
 *
 * Reorder uses arrow buttons rather than HTML5 drag-and-drop to keep the
 * implementation simple and accessible. Each click batches a single
 * `reorderEditorialTags` server-action call on the new ordering.
 *
 * Pass 8 — all success/error feedback flows through the global Toaster.
 * No more inline red banner; the `busy` state still drives the button
 * disabled state and an inline spinner where useful.
 */
export default function EditorialTagsManager({
  initialTags,
}: {
  initialTags: EditorialTagRow[]
}) {
  const router = useRouter()
  const [tags, setTags]         = useState(initialTags)
  const [busy, setBusy]         = useState<string | null>(null)
  const [newTag, setNewTag]     = useState('')
  const [editingId, setEditing] = useState<string | null>(null)
  const [editValue, setEditVal] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<EditorialTagRow | null>(null)

  function refresh() {
    /* router.refresh() re-runs the server component and gives us the
       definitive state. We optimistically update local state for snappy
       UX, then reconcile here. */
    router.refresh()
  }

  async function handleAdd() {
    const value = newTag.trim()
    if (!value) return
    setBusy('add')
    const result = await createEditorialTag(value)
    setBusy(null)
    if (!result.ok) {
      toast.error('Failed to add tag', {
        description: result.error ?? 'Please try again.',
      })
      return
    }
    toast.success('Tag added', {
      description: `"${value}" is now in the strip.`,
    })
    setNewTag('')
    refresh()
  }

  async function handleToggleActive(row: EditorialTagRow) {
    setBusy(row.id)
    /* Optimistic update */
    setTags(prev => prev.map(t => t.id === row.id ? { ...t, is_active: !t.is_active } : t))
    const result = await updateEditorialTag(row.id, { is_active: !row.is_active })
    setBusy(null)
    if (!result.ok) {
      toast.error('Failed to update', {
        description: result.error ?? 'Please try again.',
      })
      /* Roll back */
      setTags(prev => prev.map(t => t.id === row.id ? row : t))
      return
    }
    toast.success(row.is_active ? 'Tag hidden' : 'Tag activated', {
      description: row.is_active
        ? `"${row.tag}" no longer appears on the public strip.`
        : `"${row.tag}" is back on the public strip.`,
    })
    refresh()
  }

  async function handleSaveEdit(row: EditorialTagRow) {
    const value = editValue.trim()
    if (!value || value === row.tag) {
      setEditing(null)
      return
    }
    setBusy(row.id)
    const result = await updateEditorialTag(row.id, { tag: value })
    setBusy(null)
    if (!result.ok) {
      toast.error('Failed to save', {
        description: result.error ?? 'Please try again.',
      })
      return
    }
    toast.success('Tag renamed', {
      description: `"${row.tag}" → "${value}"`,
    })
    setEditing(null)
    refresh()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const row = deleteTarget
    setBusy(row.id)
    const result = await deleteEditorialTag(row.id)
    setBusy(null)
    setDeleteTarget(null)
    if (!result.ok) {
      toast.error('Failed to delete', {
        description: result.error ?? 'Please try again.',
      })
      return
    }
    toast.success('Tag deleted', {
      description: `"${row.tag}" has been removed.`,
    })
    refresh()
  }

  async function move(idx: number, direction: -1 | 1) {
    const target = idx + direction
    if (target < 0 || target >= tags.length) return

    /* Optimistic reorder */
    const next = [...tags]
    const [removed] = next.splice(idx, 1)
    next.splice(target, 0, removed)
    setTags(next)
    setBusy('reorder')

    const result = await reorderEditorialTags(next.map(t => t.id))
    setBusy(null)
    if (!result.ok) {
      toast.error('Failed to reorder', {
        description: result.error ?? 'Please try again.',
      })
      setTags(initialTags)
      return
    }
    refresh()
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '50rem', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
            fontSize:      '2rem',
            fontWeight:    900,
            textTransform: 'uppercase',
            letterSpacing: '-0.012em',
            marginBottom:  '0.5rem',
          }}
        >
          In-focus tags
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          These tags appear in the &ldquo;In focus this week&rdquo; strip on the home page,
          in the order shown. Inactive tags are hidden. Recommended: keep 5 active
          tags at a time. When this list is empty, the strip falls back to top
          recent search terms automatically.
        </p>
      </header>

      {/* Add new tag */}
      <div
        style={{
          display:       'flex',
          gap:           '0.5rem',
          marginBottom:  '1.5rem',
        }}
      >
        <input
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="Add a tag (e.g. covenant)"
          maxLength={60}
          style={{
            flex:          1,
            padding:       '0.625rem 0.875rem',
            background:    'var(--bg-input)',
            border:        '0.0625rem solid var(--border-strong)',
            borderRadius:  '0.5rem',
            color:         'var(--text-primary)',
            fontSize:      '0.9375rem',
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={busy === 'add' || !newTag.trim()}
          style={{
            padding:       '0.625rem 1.25rem',
            background:    'var(--brand-red)',
            color:         '#FFFFFF',
            border:        'none',
            borderRadius:  '0.5rem',
            fontSize:      '0.875rem',
            fontWeight:    600,
            cursor:        busy === 'add' || !newTag.trim() ? 'not-allowed' : 'pointer',
            opacity:       busy === 'add' || !newTag.trim() ? 0.5 : 1,
            display:       'inline-flex',
            alignItems:    'center',
            justifyContent:'center',
            minHeight:     '2.5rem',
            minWidth:      '5rem',
          }}
        >
          {busy === 'add' ? <ButtonSpinner label="Adding…" inverse /> : 'Add tag'}
        </button>
      </div>

      {/* List */}
      {tags.length === 0 ? (
        <div
          style={{
            padding:       '2rem',
            background:    'var(--bg-raised)',
            border:        '0.0625rem dashed var(--border-strong)',
            borderRadius:  '0.5rem',
            textAlign:     'center',
            color:         'var(--text-tertiary)',
            fontSize:      '0.875rem',
          }}
        >
          No editorial tags yet. The home-page strip will fall back to top search
          terms until you add some.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tags.map((row, idx) => (
            <li
              key={row.id}
              style={{
                display:       'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap:           '0.75rem',
                alignItems:    'center',
                padding:       '0.75rem 1rem',
                background:    'var(--bg-raised)',
                border:        '0.0625rem solid var(--border-subtle)',
                borderRadius:  '0.5rem',
                opacity:       row.is_active ? 1 : 0.55,
              }}
            >
              {/* Reorder arrows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || busy !== null}
                  aria-label="Move up"
                  style={iconButtonStyle}
                >▲</button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === tags.length - 1 || busy !== null}
                  aria-label="Move down"
                  style={iconButtonStyle}
                >▼</button>
              </div>

              {/* Tag text — inline editable */}
              <div style={{ minWidth: 0 }}>
                {editingId === row.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={() => handleSaveEdit(row)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(row)
                      if (e.key === 'Escape') setEditing(null)
                    }}
                    maxLength={60}
                    autoFocus
                    style={{
                      width:         '100%',
                      padding:       '0.375rem 0.625rem',
                      background:    'var(--bg-input)',
                      border:        '0.0625rem solid var(--brand-red)',
                      borderRadius:  '0.375rem',
                      color:         'var(--text-primary)',
                      fontSize:      '0.9375rem',
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditing(row.id); setEditVal(row.tag) }}
                    style={{
                      background:    'transparent',
                      border:        'none',
                      padding:       '0.25rem 0',
                      cursor:        'pointer',
                      color:         'var(--text-primary)',
                      fontSize:      '0.9375rem',
                      fontWeight:    600,
                      textAlign:     'left',
                      width:         '100%',
                    }}
                  >
                    #{row.tag}
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleToggleActive(row)}
                  disabled={busy !== null}
                  style={{
                    padding:       '0.3125rem 0.75rem',
                    background:    row.is_active ? 'var(--success-bg)' : 'var(--bg-elevated)',
                    color:         row.is_active ? 'var(--success-fg)' : 'var(--text-tertiary)',
                    border:        '0.0625rem solid transparent',
                    borderRadius:  '999rem',
                    fontSize:      '0.75rem',
                    fontWeight:    600,
                    cursor:        'pointer',
                  }}
                >
                  {row.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  disabled={busy !== null}
                  aria-label="Delete"
                  style={{
                    padding:       '0.375rem 0.625rem',
                    background:    'transparent',
                    color:         'var(--text-tertiary)',
                    border:        'none',
                    borderRadius:  '0.375rem',
                    cursor:        'pointer',
                    fontSize:      '0.875rem',
                  }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete tag"
        message={`Delete "${deleteTarget?.tag}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        busy={busy === deleteTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

const iconButtonStyle: React.CSSProperties = {
  width:         '1.5rem',
  height:        '1rem',
  background:    'var(--bg-elevated)',
  color:         'var(--text-tertiary)',
  border:        'none',
  borderRadius:  '0.25rem',
  cursor:        'pointer',
  fontSize:      '0.625rem',
  lineHeight:    1,
  display:       'flex',
  alignItems:    'center',
  justifyContent:'center',
}