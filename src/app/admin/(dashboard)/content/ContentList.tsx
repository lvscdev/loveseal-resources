'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleContentStatus, deleteContent } from './actions'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Item {
  id: string
  title: string
  content_type: 'manual' | 'prophecy' | 'article' | 'blog'
  status: 'draft' | 'published'
  language: string
  category: string
  tags: string[]
  theme: string | null
  lesson_number: string | null
  speaker: string | null
  series: string | null
  date_preached: string | null
  scripture_refs: string[]
  cover_image_url: string | null
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  manual: '#4498CC', prophecy: '#C32126', article: '#F5AE41', blog: '#3C3C3C',
}
const TYPE_LABELS: Record<string, string> = {
  manual: 'Manual', prophecy: 'Prophecy', article: 'Article', blog: 'Blog',
}
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic',
}

export default function ContentList({ items }: { items: Item[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const [search, setSearch]                 = useState('')
  const [selectedTypes, setSelectedTypes]   = useState<Set<string>>(new Set())
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set())
  const [selectedLangs, setSelectedLangs]   = useState<Set<string>>(new Set())
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set())
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set())
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set())

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter(item => {
      if (selectedTypes.size    && !selectedTypes.has(item.content_type)) return false
      if (selectedStatus.size   && !selectedStatus.has(item.status))      return false
      if (selectedLangs.size    && !selectedLangs.has(item.language))     return false
      if (selectedThemes.size   && (!item.theme   || !selectedThemes.has(item.theme)))     return false
      if (selectedSpeakers.size && (!item.speaker || !selectedSpeakers.has(item.speaker))) return false
      if (selectedSeries.size   && (!item.series  || !selectedSeries.has(item.series)))    return false
      if (q) {
        const haystack = [item.title, item.theme ?? '', item.speaker ?? '', item.series ?? '', ...item.tags, ...item.scripture_refs].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, search, selectedTypes, selectedStatus, selectedLangs, selectedThemes, selectedSpeakers, selectedSeries])

  const facets = useMemo(() => {
    const count = (key: keyof Item, ignoredFilter: Set<string>, filterFn: (i: Item) => boolean): Record<string, number> => {
      const result: Record<string, number> = {}
      items.filter(filterFn).forEach(item => {
        const v = item[key]
        if (typeof v === 'string' && v) result[v] = (result[v] ?? 0) + 1
      })
      ignoredFilter.forEach(v => { if (!(v in result)) result[v] = 0 })
      return result
    }
    const baseExceptType = (i: Item) =>
      (!selectedStatus.size   || selectedStatus.has(i.status))      &&
      (!selectedLangs.size    || selectedLangs.has(i.language))     &&
      (!selectedThemes.size   || (i.theme   ? selectedThemes.has(i.theme)     : false)) &&
      (!selectedSpeakers.size || (i.speaker ? selectedSpeakers.has(i.speaker) : false)) &&
      (!selectedSeries.size   || (i.series  ? selectedSeries.has(i.series)    : false))
    const baseExceptStatus = (i: Item) =>
      (!selectedTypes.size    || selectedTypes.has(i.content_type)) &&
      (!selectedLangs.size    || selectedLangs.has(i.language))     &&
      (!selectedThemes.size   || (i.theme   ? selectedThemes.has(i.theme)     : false)) &&
      (!selectedSpeakers.size || (i.speaker ? selectedSpeakers.has(i.speaker) : false)) &&
      (!selectedSeries.size   || (i.series  ? selectedSeries.has(i.series)    : false))
    const baseExceptLang = (i: Item) =>
      (!selectedTypes.size    || selectedTypes.has(i.content_type)) &&
      (!selectedStatus.size   || selectedStatus.has(i.status))      &&
      (!selectedThemes.size   || (i.theme   ? selectedThemes.has(i.theme)     : false)) &&
      (!selectedSpeakers.size || (i.speaker ? selectedSpeakers.has(i.speaker) : false)) &&
      (!selectedSeries.size   || (i.series  ? selectedSeries.has(i.series)    : false))
    const baseExceptTheme = (i: Item) =>
      (!selectedTypes.size    || selectedTypes.has(i.content_type)) &&
      (!selectedStatus.size   || selectedStatus.has(i.status))      &&
      (!selectedLangs.size    || selectedLangs.has(i.language))     &&
      (!selectedSpeakers.size || (i.speaker ? selectedSpeakers.has(i.speaker) : false)) &&
      (!selectedSeries.size   || (i.series  ? selectedSeries.has(i.series)    : false))
    const baseExceptSpeaker = (i: Item) =>
      (!selectedTypes.size    || selectedTypes.has(i.content_type)) &&
      (!selectedStatus.size   || selectedStatus.has(i.status))      &&
      (!selectedLangs.size    || selectedLangs.has(i.language))     &&
      (!selectedThemes.size   || (i.theme   ? selectedThemes.has(i.theme)     : false)) &&
      (!selectedSeries.size   || (i.series  ? selectedSeries.has(i.series)    : false))
    const baseExceptSeries = (i: Item) =>
      (!selectedTypes.size    || selectedTypes.has(i.content_type)) &&
      (!selectedStatus.size   || selectedStatus.has(i.status))      &&
      (!selectedLangs.size    || selectedLangs.has(i.language))     &&
      (!selectedThemes.size   || (i.theme   ? selectedThemes.has(i.theme)     : false)) &&
      (!selectedSpeakers.size || (i.speaker ? selectedSpeakers.has(i.speaker) : false))

    return {
      types:    count('content_type', selectedTypes,    baseExceptType),
      status:   count('status',       selectedStatus,   baseExceptStatus),
      langs:    count('language',     selectedLangs,    baseExceptLang),
      themes:   count('theme',        selectedThemes,   baseExceptTheme),
      speakers: count('speaker',      selectedSpeakers, baseExceptSpeaker),
      series:   count('series',       selectedSeries,   baseExceptSeries),
    }
  }, [items, selectedTypes, selectedStatus, selectedLangs, selectedThemes, selectedSpeakers, selectedSeries])

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function clearAll() {
    setSearch('')
    setSelectedTypes(new Set())
    setSelectedStatus(new Set())
    setSelectedLangs(new Set())
    setSelectedThemes(new Set())
    setSelectedSpeakers(new Set())
    setSelectedSeries(new Set())
  }

  const hasFilters = search || selectedTypes.size || selectedStatus.size || selectedLangs.size || selectedThemes.size || selectedSpeakers.size || selectedSeries.size

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
        <div style={{ marginBottom: '20px' }}>
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
            }}
          />
        </div>

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

        <FacetGroup label="Type" values={Object.entries(facets.types)} selected={selectedTypes}
          onToggle={v => toggle(selectedTypes, setSelectedTypes, v)}
          formatLabel={v => TYPE_LABELS[v] ?? v} accentColor={v => TYPE_COLORS[v]} />
        <FacetGroup label="Status" values={Object.entries(facets.status)} selected={selectedStatus}
          onToggle={v => toggle(selectedStatus, setSelectedStatus, v)}
          formatLabel={v => v.charAt(0).toUpperCase() + v.slice(1)} />
        <FacetGroup label="Language" values={Object.entries(facets.langs)} selected={selectedLangs}
          onToggle={v => toggle(selectedLangs, setSelectedLangs, v)}
          formatLabel={v => LANGUAGE_LABELS[v] ?? v} />
        {Object.keys(facets.themes).length > 0 && (
          <FacetGroup label="Theme" values={Object.entries(facets.themes)} selected={selectedThemes}
            onToggle={v => toggle(selectedThemes, setSelectedThemes, v)} formatLabel={v => v} />
        )}
        {Object.keys(facets.speakers).length > 0 && (
          <FacetGroup label="Speaker" values={Object.entries(facets.speakers)} selected={selectedSpeakers}
            onToggle={v => toggle(selectedSpeakers, setSelectedSpeakers, v)} formatLabel={v => v} />
        )}
        {Object.keys(facets.series).length > 0 && (
          <FacetGroup label="Series" values={Object.entries(facets.series)} selected={selectedSeries}
            onToggle={v => toggle(selectedSeries, setSelectedSeries, v)} formatLabel={v => v} />
        )}
      </aside>

      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '12px', fontSize: '12px', color: 'var(--text-tertiary)',
        }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{filteredItems.length}</strong>
            {filteredItems.length !== items.length && ` of ${items.length}`} items
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{
            background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)',
            borderRadius: '10px', padding: '60px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
              {hasFilters ? 'No content matches the current filters' : 'No content uploaded yet'}
            </p>
            {hasFilters ? (
              <button onClick={clearAll} style={{
                padding: '7px 16px', background: 'transparent',
                border: '0.5px solid var(--border-strong)', borderRadius: '6px',
                color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>Clear filters</button>
            ) : (
              <Link href="/admin/upload" style={{
                display: 'inline-block', padding: '8px 18px',
                background: 'var(--brand-gold)', color: 'var(--text-inverse)',
                borderRadius: '7px', fontSize: '12px', fontWeight: 500, textDecoration: 'none',
              }}>Upload first item</Link>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)',
            borderRadius: '10px', overflow: 'hidden',
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
                {filteredItems.map(item => {
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
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: TYPE_COLORS[item.content_type] }} />
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
                          <Link
                            href={`/${item.language ?? 'en'}/preview/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={iconBtn}
                            title="Preview"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </Link>
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
          </div>
        )}
      </div>

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
          const isDisabled = count === 0 && !isSelected
          return (
            <button
              key={value}
              onClick={() => onToggle(value)}
              disabled={isDisabled}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 8px',
                background: isSelected ? 'rgba(245,174,65,0.10)' : 'transparent',
                border: 'none', borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                color: isDisabled ? 'var(--text-faint)' : isSelected ? 'var(--brand-gold)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
                transition: 'background 0.12s, color 0.12s',
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
