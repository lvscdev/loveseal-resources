'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import ContentCard from '@/components/public/ContentCard'
import { searchContentAction } from './search-action'

interface PublicItem {
  id: string
  slug: string | null
  title: string
  content_type: 'manual' | 'prophecy' | 'article' | 'blog'
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
  summary_points: string[] | null
  published_at: string
}

const TYPE_COLORS: Record<string, string> = {
  manual: '#4498CC', prophecy: '#C32126', article: '#F5AE41', blog: '#3C3C3C',
}

type Layout = 'grid' | 'list'

/* Debounce window for the FTS server call. 250ms is the sweet spot: responsive
   on a desktop keystroke, but not chatty enough to fire on every char during
   sustained typing. */
const SEARCH_DEBOUNCE_MS = 250

/* Minimum query length before we hit the server. Single-char queries return
   noise and waste round-trips. Mirrors the same guard inside searchContent(). */
const SEARCH_MIN_CHARS = 2

interface FtsState {
  /** The query string the result was computed against. */
  forQuery: string
  /** Whether the server ran the FTS query (vs. returning empty due to short input). */
  ran: boolean
  /** Map of content_id → rank, for fast intersection in the filter memo. */
  rankById: Map<string, number>
  /** True while a request is in flight against the current query. */
  loading: boolean
}

const FTS_INITIAL: FtsState = {
  forQuery: '',
  ran:      false,
  rankById: new Map(),
  loading:  false,
}

export default function PublicContentList({
  items,
  locale,
}: {
  items:  PublicItem[]
  locale: string
}) {
  const t            = useTranslations('filters')
  const tResults     = useTranslations('results')
  const tContent     = useTranslations('content.types')
  const searchParams = useSearchParams()

  const [layout, setLayout]                  = useState<Layout>('grid')
  const [search, setSearch]                  = useState('')
  const [selectedTypes, setSelectedTypes]    = useState<Set<string>>(new Set())
  const [selectedThemes, setSelectedThemes]  = useState<Set<string>>(new Set())
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set())
  const [selectedSeries, setSelectedSeries]  = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen]        = useState(false)
  const [fts, setFts]                        = useState<FtsState>(FTS_INITIAL)

  useEffect(() => {
    const saved = localStorage.getItem('lr-layout')
    if (saved === 'list' || saved === 'grid') setLayout(saved)
  }, [])

  function changeLayout(next: Layout) {
    setLayout(next)
    localStorage.setItem('lr-layout', next)
  }

  useEffect(() => {
    const tp = searchParams?.get('type')
    if (tp && ['manual', 'prophecy', 'article', 'blog'].includes(tp)) {
      setSelectedTypes(new Set([tp]))
    }
  }, [searchParams])

  /* ── FTS effect ──────────────────────────────────────────────────────────
     Debounce keystrokes, then call the server. The cancellation pattern
     guards against a slow earlier request landing after a faster later
     request and overwriting fresher results.                                 */
  useEffect(() => {
    const trimmed = search.trim()

    // Short / empty input: reset to "no server search". The facet filter
    // logic alone takes over.
    if (trimmed.length < SEARCH_MIN_CHARS) {
      setFts(prev => prev === FTS_INITIAL ? prev : FTS_INITIAL)
      return
    }

    let cancelled = false
    setFts(s => ({ ...s, loading: true }))

    const timer = setTimeout(async () => {
      const result = await searchContentAction(trimmed, locale)
      if (cancelled) return

      const rankById = new Map<string, number>()
      result.hits.forEach(h => rankById.set(h.id, h.rank))

      setFts({
        forQuery: trimmed,
        ran:      result.ran,
        rankById,
        loading:  false,
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, locale])

  const filteredItems = useMemo(() => {
    /* When an FTS search has run, intersect items with the matched ID set
       and sort by rank (descending). When no FTS search has run (empty/short
       input), keep the original `items` order (already sorted by created_at
       descending from the server query). */
    const ftsApplies = fts.ran && fts.forQuery === search.trim()

    const facetFiltered = items.filter(item => {
      if (selectedTypes.size    && !selectedTypes.has(item.content_type)) return false
      if (selectedThemes.size   && (!item.theme   || !selectedThemes.has(item.theme)))     return false
      if (selectedSpeakers.size && (!item.speaker || !selectedSpeakers.has(item.speaker))) return false
      if (selectedSeries.size   && (!item.series  || !selectedSeries.has(item.series)))    return false
      if (ftsApplies && !fts.rankById.has(item.id))                                        return false
      return true
    })

    if (ftsApplies) {
      // Sort by rank desc; items not in the rank map can't appear here (filtered above).
      return facetFiltered.sort((a, b) =>
        (fts.rankById.get(b.id) ?? 0) - (fts.rankById.get(a.id) ?? 0)
      )
    }
    return facetFiltered
  }, [items, search, selectedTypes, selectedThemes, selectedSpeakers, selectedSeries, fts])

  /* Facet counts are computed on the in-memory items (not FTS-filtered) so
     the sidebar always reflects the true corpus shape, not just current
     search hits. This matches the existing behavior. */
  const facets = useMemo(() => {
    function buildCount(key: keyof PublicItem, ignoredFilter: Set<string>, predicate: (i: PublicItem) => boolean) {
      const result: Record<string, number> = {}
      items.filter(predicate).forEach(item => {
        const v = item[key]
        if (typeof v === 'string' && v) result[v] = (result[v] ?? 0) + 1
      })
      ignoredFilter.forEach(v => { if (!(v in result)) result[v] = 0 })
      return result
    }

    return {
      types: buildCount('content_type', selectedTypes, item =>
        (!selectedThemes.size   || (item.theme   ? selectedThemes.has(item.theme)     : false)) &&
        (!selectedSpeakers.size || (item.speaker ? selectedSpeakers.has(item.speaker) : false)) &&
        (!selectedSeries.size   || (item.series  ? selectedSeries.has(item.series)    : false))
      ),
      themes: buildCount('theme', selectedThemes, item =>
        (!selectedTypes.size    || selectedTypes.has(item.content_type)) &&
        (!selectedSpeakers.size || (item.speaker ? selectedSpeakers.has(item.speaker) : false)) &&
        (!selectedSeries.size   || (item.series  ? selectedSeries.has(item.series)    : false))
      ),
      speakers: buildCount('speaker', selectedSpeakers, item =>
        (!selectedTypes.size  || selectedTypes.has(item.content_type)) &&
        (!selectedThemes.size || (item.theme  ? selectedThemes.has(item.theme)  : false)) &&
        (!selectedSeries.size || (item.series ? selectedSeries.has(item.series) : false))
      ),
      series: buildCount('series', selectedSeries, item =>
        (!selectedTypes.size    || selectedTypes.has(item.content_type)) &&
        (!selectedThemes.size   || (item.theme   ? selectedThemes.has(item.theme)     : false)) &&
        (!selectedSpeakers.size || (item.speaker ? selectedSpeakers.has(item.speaker) : false))
      ),
    }
  }, [items, selectedTypes, selectedThemes, selectedSpeakers, selectedSeries])

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function clearAll() {
    setSearch('')
    setSelectedTypes(new Set())
    setSelectedThemes(new Set())
    setSelectedSpeakers(new Set())
    setSelectedSeries(new Set())
  }

  const hasFilters = search ||
    selectedTypes.size || selectedThemes.size ||
    selectedSpeakers.size || selectedSeries.size

  const FilterPanel = (
    <aside style={{
      background: 'var(--bg-raised)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '18px',
      maxHeight: 'calc(100dvh - 88px)',
      overflowY: 'auto',
    }}>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            paddingInlineEnd: fts.loading ? '34px' : '12px',
            background: 'var(--bg-input)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: '7px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            textAlign: 'start',
          }}
        />
        {fts.loading && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              insetInlineEnd: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              border: '1.5px solid var(--text-muted)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'lr-search-spin 0.7s linear infinite',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em',
          color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
          {t('title')}
        </span>
        {hasFilters && (
          <button onClick={clearAll} style={{
            fontSize: '10px', color: 'var(--brand-gold)', background: 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            {t('clearAll')}
          </button>
        )}
      </div>

      <FacetGroup
        label={t('type')}
        values={Object.entries(facets.types)}
        selected={selectedTypes}
        onToggle={v => toggle(selectedTypes, setSelectedTypes, v)}
        formatLabel={v => tContent(v as 'manual' | 'prophecy' | 'article' | 'blog')}
        accentColor={v => TYPE_COLORS[v]}
      />
      {Object.keys(facets.themes).length > 0 && (
        <FacetGroup
          label={t('theme')}
          values={Object.entries(facets.themes)}
          selected={selectedThemes}
          onToggle={v => toggle(selectedThemes, setSelectedThemes, v)}
          formatLabel={v => v}
        />
      )}
      {Object.keys(facets.speakers).length > 0 && (
        <FacetGroup
          label={t('speaker')}
          values={Object.entries(facets.speakers)}
          selected={selectedSpeakers}
          onToggle={v => toggle(selectedSpeakers, setSelectedSpeakers, v)}
          formatLabel={v => v}
        />
      )}
      {Object.keys(facets.series).length > 0 && (
        <FacetGroup
          label={t('series')}
          values={Object.entries(facets.series)}
          selected={selectedSeries}
          onToggle={v => toggle(selectedSeries, setSelectedSeries, v)}
          formatLabel={v => v}
        />
      )}
    </aside>
  )

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          {tResults('showing')} <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{filteredItems.length}</strong>
          {filteredItems.length !== items.length && ` ${tResults('of')} ${items.length}`}{' '}
          {tResults('items', { count: filteredItems.length })}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="filter-toggle-mobile"
            onClick={() => setFiltersOpen(true)}
            style={{
              display: 'none',
              padding: '8px 14px',
              background: hasFilters ? 'var(--brand-gold)' : 'transparent',
              color: hasFilters ? 'var(--text-inverse)' : 'var(--text-primary)',
              border: '0.5px solid var(--border-strong)',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FilterIcon /> {t('title')} {hasFilters ? `(${
              [
                ...selectedTypes, ...selectedThemes,
                ...selectedSpeakers, ...selectedSeries,
              ].length
            })` : ''}
          </button>

          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '7px',
            padding: '2px',
          }}>
            <LayoutBtn active={layout === 'grid'} onClick={() => changeLayout('grid')}>
              <GridIcon />
            </LayoutBtn>
            <LayoutBtn active={layout === 'list'} onClick={() => changeLayout('list')}>
              <ListIcon />
            </LayoutBtn>
          </div>
        </div>
      </div>

      <div className="content-grid-wrapper" style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        <div className="filter-sidebar-desktop" style={{ position: 'sticky', top: '80px' }}>
          {FilterPanel}
        </div>

        <div>
          {filteredItems.length === 0 ? (
            <div style={{
              background: 'var(--bg-raised)',
              border: '0.5px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '60px 24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                {hasFilters ? t('noMatches') : t('noContent')}
              </p>
              {hasFilters && (
                <button onClick={clearAll} style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}>
                  {t('clearAll')}
                </button>
              )}
            </div>
          ) : layout === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '14px',
            }}>
              {filteredItems.map(item => (
                <ContentCard key={item.id} item={item} layout="grid" />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredItems.map(item => (
                <ContentCard key={item.id} item={item} layout="list" />
              ))}
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div
          onClick={() => setFiltersOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.18s',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-base)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              maxHeight: '85dvh',
              overflowY: 'auto',
              width: '100%',
              /* Modal/sheet cap — uses --width-narrow (640px) to keep
                 a comfortable reading width on wide viewports. */
              maxWidth: 'var(--width-narrow)',
              padding: '1rem',
              border: '0.5px solid var(--border-strong)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '0.5px solid var(--border-subtle)',
            }}>
              <h2 style={{
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}>
                {t('title')}
              </h2>
              <button
                onClick={() => setFiltersOpen(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '0.5px solid var(--border-strong)',
                  color: 'var(--text-tertiary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                ×
              </button>
            </div>
            {FilterPanel}
            <button
              onClick={() => setFiltersOpen(false)}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '12px',
                background: 'var(--brand-gold)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {t('showCount', { count: filteredItems.length })}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 820px) {
          .filter-sidebar-desktop  { display: none !important; }
          .filter-toggle-mobile    { display: inline-flex !important; }
          .content-grid-wrapper    { grid-template-columns: 1fr !important; }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lr-search-spin { from { transform: translateY(-50%) rotate(0deg) } to { transform: translateY(-50%) rotate(360deg) } }
      `}</style>
    </div>
  )
}

function LayoutBtn({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '32px',
        height: '30px',
        background: active ? 'var(--bg-elevated)' : 'transparent',
        color: active ? 'var(--brand-gold)' : 'var(--text-tertiary)',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
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
                textAlign: 'start',
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
                marginInlineStart: '6px',
                flexShrink: 0,
              }}>{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6"  x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6"  x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}