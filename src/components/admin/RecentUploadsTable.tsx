'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { toggleContentStatus, deleteContent } from '@/app/admin/(dashboard)/content/actions'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface RecentItem {
  id: string
  title: string
  content_type: 'manual' | 'prophecy' | 'article' | 'blog'
  status: 'draft' | 'published'
  language: string
  theme: string | null
  speaker: string | null
  date_preached: string | null
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  manual:   '#4498CC',
  prophecy: '#C32126',
  article:  '#F5AE41',
  blog:     '#3C3C3C',
}

export default function RecentUploadsTable({ items }: { items: RecentItem[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  if (!items.length) {
    return (
      <div style={{
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
          No content uploaded yet
        </p>
        <Link href="/admin/upload" style={{
          display: 'inline-block',
          padding: '8px 18px',
          background: 'var(--brand-gold)',
          color: 'var(--text-inverse)',
          borderRadius: '7px',
          fontSize: '12px',
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          Upload first item
        </Link>
      </div>
    )
  }

  async function toggleStatus(id: string, _current: string) {
    setBusy(id)
    await toggleContentStatus(id)
    router.refresh()
    setBusy(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusy(deleteTarget.id)
    await deleteContent(deleteTarget.id)
    router.refresh()
    setBusy(null)
    setDeleteTarget(null)
  }

  function formatDate(dateString: string) {
    const d = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7)   return `${diffDays}d ago`
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: 'var(--bg-table-head)', borderBottom: '0.5px solid var(--border-subtle)' }}>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Theme</th>
            <th style={thStyle}>Speaker</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Lang</th>
            <th style={thStyle}>Uploaded</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const isBusy = busy === item.id
            return (
              <tr key={item.id} style={{
                borderBottom: '0.5px solid var(--border-subtle)',
                opacity: isBusy ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}>
                <td style={tdStyle}>
                  <Link href={`/admin/content/${item.id}`} style={{
                    color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500,
                  }}>{item.title}</Link>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize',
                  }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: TYPE_COLORS[item.content_type],
                    }} />
                    {item.content_type}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: item.theme ? 'var(--text-secondary)' : 'var(--text-faint)' }}>
                    {item.theme ?? '—'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: item.speaker ? 'var(--text-secondary)' : 'var(--text-faint)' }}>
                    {item.speaker ?? '—'}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {item.language}
                </td>
                <td style={{ ...tdStyle, color: 'var(--text-tertiary)', fontSize: '11px' }}>
                  {formatDate(item.created_at)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    disabled={isBusy}
                    style={{
                      padding: '3px 9px', borderRadius: '20px',
                      fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em',
                      textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                      background: item.status === 'published' ? 'var(--success-bg)' : 'var(--bg-elevated)',
                      color: item.status === 'published' ? 'var(--success-fg)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >{item.status}</button>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <Link href={`/admin/content/${item.id}`} style={iconBtn} title="Edit">✎</Link>
                    <button onClick={() => setDeleteTarget({ id: item.id, title: item.title })} disabled={isBusy}
                      style={{ ...iconBtn, color: 'var(--danger-fg)' }} title="Delete">×</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete content"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        busy={busy === deleteTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left',
  fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px', color: 'var(--text-primary)', verticalAlign: 'middle',
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '24px', height: '24px',
  background: 'transparent', border: '0.5px solid var(--border-strong)', borderRadius: '5px',
  color: 'var(--text-tertiary)', fontSize: '13px', cursor: 'pointer',
  textDecoration: 'none', fontFamily: 'var(--font-body)',
}
