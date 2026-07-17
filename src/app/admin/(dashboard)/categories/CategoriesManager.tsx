'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory, renameCategory, deleteCategory } from './actions'
import type { ContentType } from '@/types'
import type { CategoryWithCount } from './page'
import ConfirmModal from '@/components/ui/ConfirmModal'

const TYPE_GROUPS: { key: ContentType | 'all'; label: string; color: string }[] = [
  { key: 'all',      label: 'All content types',  color: 'var(--text-tertiary)' },
  { key: 'manual',   label: 'Manuals',            color: '#4498CC' },
  { key: 'prophecy', label: 'Prophecies',         color: '#C32126' },
  { key: 'article',  label: 'Articles',           color: '#F5AE41' },
  { key: 'blog',     label: 'Blog',               color: '#3C3C3C' },
]

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryWithCount[]
}) {
  const router = useRouter()
  const [busy, setBusy]   = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add form state — one per group
  const [addingTo, setAddingTo]     = useState<ContentType | 'all' | null>(null)
  const [newName, setNewName]       = useState('')

  // Edit state
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editName, setEditName]     = useState('')

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null)

  const grouped = useMemo(() => {
    const map: Record<string, CategoryWithCount[]> = {
      all: [], manual: [], prophecy: [], article: [], blog: [],
    }
    initialCategories.forEach(cat => {
      const key = cat.content_type ?? 'all'
      map[key].push(cat)
    })
    return map
  }, [initialCategories])

  async function handleAdd(contentType: ContentType | 'all') {
    if (!newName.trim()) return
    setBusy('add')
    setError(null)

    const result = await createCategory(newName, contentType)
    if (!result.ok) {
      setError(result.error ?? 'Failed to add')
      setBusy(null)
      return
    }

    setNewName('')
    setAddingTo(null)
    setBusy(null)
    router.refresh()
  }

  async function handleRename(id: string) {
    if (!editName.trim()) { setEditingId(null); return }
    setBusy(id)
    setError(null)

    const result = await renameCategory(id, editName)
    if (!result.ok) {
      setError(result.error ?? 'Failed to rename')
      setBusy(null)
      return
    }

    setEditingId(null)
    setBusy(null)
    router.refresh()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusy(deleteTarget.id)
    setError(null)

    const result = await deleteCategory(deleteTarget.id)
    if (!result.ok) {
      setError(result.error ?? 'Failed to delete')
      setBusy(null)
      setDeleteTarget(null)
      return
    }

    setBusy(null)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--danger-bg)',
          border: '0.5px solid var(--danger-border)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--danger-fg)',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {TYPE_GROUPS.map(group => {
          const cats = grouped[group.key] ?? []
          const isAdding = addingTo === group.key

          return (
            <div key={group.key} style={cardStyle}>

              {/* Group header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '0.5px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color }} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-primary)',
                  }}>
                    {group.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {cats.length}
                  </span>
                </div>
                {!isAdding && (
                  <button
                    type="button"
                    onClick={() => { setAddingTo(group.key); setNewName('') }}
                    style={addBtnStyle}
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* Add form */}
              {isAdding && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Category name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAdd(group.key) }
                      if (e.key === 'Escape') { setAddingTo(null); setNewName('') }
                    }}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => handleAdd(group.key)}
                    disabled={busy === 'add' || !newName.trim()}
                    style={{
                      padding: '8px 14px',
                      background: !newName.trim() ? 'var(--bg-elevated)' : 'var(--brand-gold)',
                      color: !newName.trim() ? 'var(--text-muted)' : 'var(--text-inverse)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: !newName.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {busy === 'add' ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingTo(null); setNewName('') }}
                    style={cancelBtnStyle}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Categories list */}
              {cats.length === 0 ? (
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-faint)',
                  fontStyle: 'italic',
                  padding: '6px 0',
                }}>
                  No categories yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cats.map(cat => {
                    const isEditing = editingId === cat.id
                    const isBusy = busy === cat.id
                    return (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isEditing ? 'var(--bg-elevated)' : 'transparent',
                          opacity: isBusy ? 0.5 : 1,
                          transition: 'background 0.12s',
                        }}
                      >
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              autoFocus
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter')  { e.preventDefault(); handleRename(cat.id) }
                                if (e.key === 'Escape') { setEditingId(null) }
                              }}
                              style={{ ...inputStyle, flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRename(cat.id)}
                              style={{
                                padding: '6px 12px',
                                background: 'var(--brand-gold)',
                                color: 'var(--text-inverse)',
                                border: 'none',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              style={{ ...cancelBtnStyle, fontSize: '11px', padding: '6px 12px' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{
                              fontSize: '13px',
                              color: 'var(--text-primary)',
                              flex: 1,
                              fontWeight: 500,
                            }}>
                              {cat.name}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                              background: 'var(--bg-base)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}>
                              {cat.slug}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: cat.usage_count > 0 ? 'var(--text-secondary)' : 'var(--text-faint)',
                              minWidth: '60px',
                              textAlign: 'right',
                            }}>
                              {cat.usage_count} item{cat.usage_count !== 1 ? 's' : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                                disabled={isBusy}
                                style={iconBtn}
                                title="Rename"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(cat)}
                                disabled={isBusy}
                                style={{ ...iconBtn, color: 'var(--danger-fg)' }}
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete category"
        message={
          deleteTarget && deleteTarget.usage_count > 0
            ? `"${deleteTarget.name}" is used by ${deleteTarget.usage_count} content item${deleteTarget.usage_count > 1 ? 's' : ''}. These items will lose this category but won't be deleted. Continue?`
            : `Delete category "${deleteTarget?.name}"?`
        }
        confirmLabel="Delete"
        danger
        busy={busy === deleteTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-raised)',
  border: '0.5px solid var(--border-subtle)',
  borderRadius: '10px',
  padding: '18px',
}

const addBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  background: 'transparent',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '5px',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '6px',
  color: 'var(--text-tertiary)',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 11px',
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  background: 'transparent',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '5px',
  color: 'var(--text-tertiary)',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}
