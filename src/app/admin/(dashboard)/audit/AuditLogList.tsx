'use client'

import { useState, useMemo } from 'react'
import type { AuditAction } from '@/types'
import type { AuditLogRow } from './page'

const ACTION_LABELS: Record<AuditAction, string> = {
  'content.created':        'Created content',
  'content.updated':        'Updated content',
  'content.deleted':        'Deleted content',
  'content.published':      'Published',
  'content.unpublished':    'Unpublished',
  'category.created':       'Created category',
  'category.updated':       'Updated category',
  'category.deleted':       'Deleted category',
  'admin.invited':          'Invited admin',
  'admin.accepted':         'Accepted invite',
  'admin.removed':          'Removed admin',
  'admin.role_changed':     'Changed admin role',
  'attachment.uploaded':    'Uploaded attachment',
  'attachment.deleted':     'Deleted attachment',
  'author.created':         'Created author',
  'author.updated':         'Updated author',
  'author.deleted':         'Deleted author',
  'editorial_tag.created':  'Created editorial tag',
  'editorial_tag.updated':  'Updated editorial tag',
  'editorial_tag.deleted':  'Deleted editorial tag',
}

const ACTION_GROUPS: Record<string, { label: string; color: string }> = {
  content:    { label: 'Content',    color: '#4498CC' },
  category:   { label: 'Category',   color: '#F5AE41' },
  admin:      { label: 'Admin',      color: '#C32126' },
  attachment: { label: 'Attachment', color: '#7B5EA7' },
  author:     { label: 'Author',     color: '#5BAA6E' },
  editorial_tag: { label: 'Editorial', color: '#7B5EA7' },
}

export default function AuditLogList({ entries }: { entries: AuditLogRow[] }) {
  const [search, setSearch]                  = useState('')
  const [selectedActors, setSelectedActors]  = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups]  = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return entries.filter(e => {
      const group = e.action.split('.')[0]
      if (selectedActors.size && !selectedActors.has(e.actor_email)) return false
      if (selectedGroups.size && !selectedGroups.has(group))         return false
      if (q) {
        const haystack = [e.actor_email, e.resource_label ?? '', e.action].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [entries, search, selectedActors, selectedGroups])

  // Facet counts
  const actorCounts = useMemo(() => {
    const map: Record<string, number> = {}
    entries.forEach(e => { map[e.actor_email] = (map[e.actor_email] ?? 0) + 1 })
    return map
  }, [entries])

  const groupCounts = useMemo(() => {
    const map: Record<string, number> = {}
    entries.forEach(e => {
      const g = e.action.split('.')[0]
      map[g] = (map[g] ?? 0) + 1
    })
    return map
  }, [entries])

  function toggle<T>(set: Set<T>, setter: (s: Set<T>) => void, value: T) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function clearAll() {
    setSearch('')
    setSelectedActors(new Set())
    setSelectedGroups(new Set())
  }

  function formatRelative(s: string) {
    const d = new Date(s)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diffSec < 60)    return `${diffSec}s ago`
    if (diffSec < 3600)  return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  function formatTime(s: string) {
    return new Date(s).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  const hasFilters = search || selectedActors.size || selectedGroups.size

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>

      <aside style={{
        position: 'sticky',
        top: '72px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '16px',
        maxHeight: 'calc(100dvh - 88px)',
        overflowY: 'auto',
      }}>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 11px',
            background: 'var(--bg-input)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            marginBottom: '20px',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em',
            color: 'var(--text-muted)', textTransform: 'uppercase',
          }}>Filters</span>
          {hasFilters && (
            <button onClick={clearAll} style={{
              fontSize: '10px', color: 'var(--brand-gold)', background: 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Clear all</button>
          )}
        </div>

        <FacetGroup
          label="Type"
          values={Object.entries(groupCounts)}
          selected={selectedGroups}
          onToggle={v => toggle(selectedGroups, setSelectedGroups, v)}
          formatLabel={v => ACTION_GROUPS[v]?.label ?? v}
          accentColor={v => ACTION_GROUPS[v]?.color ?? 'var(--text-tertiary)'}
        />
        <FacetGroup
          label="Actor"
          values={Object.entries(actorCounts)}
          selected={selectedActors}
          onToggle={v => toggle(selectedActors, setSelectedActors, v)}
          formatLabel={v => v.split('@')[0]}
        />
      </aside>

      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '12px', fontSize: '12px', color: 'var(--text-tertiary)',
        }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{filtered.length}</strong>
            {filtered.length !== entries.length && ` of ${entries.length}`} events
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)',
            borderRadius: '10px', padding: '40px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {hasFilters ? 'No events match the current filters' : 'No audit events recorded yet'}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            {filtered.map((entry, idx) => {
              const group = entry.action.split('.')[0]
              const groupColor = ACTION_GROUPS[group]?.color ?? 'var(--text-tertiary)'

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '4px 1fr auto',
                    gap: '14px',
                    padding: '14px 16px',
                    borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: '4px',
                    alignSelf: 'stretch',
                    background: groupColor,
                    borderRadius: '2px',
                  }} />

                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      marginBottom: '2px',
                    }}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                      {entry.resource_label && (
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '6px' }}>
                          · &ldquo;{entry.resource_label}&rdquo;
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      by <span style={{ color: 'var(--text-secondary)' }}>{entry.actor_email}</span>
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <span style={{ marginLeft: '8px' }}>
                          · {Object.entries(entry.metadata)
                              .filter(([k]) => k !== 'invited_by')
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatRelative(entry.created_at)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {formatTime(entry.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FacetGroup({
  label, values, selected, onToggle, formatLabel, accentColor,
}: {
  label: string
  values: [string, number][]
  selected: Set<string>
  onToggle: (v: string) => void
  formatLabel: (v: string) => string
  accentColor?: (v: string) => string
}) {
  const sorted = [...values].sort((a, b) => b[1] - a[1])
  if (!sorted.length) return null

  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em',
        color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px',
      }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sorted.map(([value, count]) => {
          const isSelected = selected.has(value)
          return (
            <button
              key={value}
              onClick={() => onToggle(value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 8px',
                background: isSelected ? 'rgba(245,174,65,0.10)' : 'transparent',
                border: 'none', borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                color: isSelected ? 'var(--brand-gold)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {accentColor && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: accentColor(value), flexShrink: 0,
                  }} />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatLabel(value)}
                </span>
              </span>
              <span style={{
                fontSize: '10px',
                color: isSelected ? 'var(--brand-gold)' : 'var(--text-muted)',
                marginLeft: '6px',
                flexShrink: 0,
              }}>{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
