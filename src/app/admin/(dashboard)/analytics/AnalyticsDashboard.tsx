'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsData, DateRange } from '@/lib/analytics-ga'

const RANGES: { label: string; value: DateRange }[] = [
  { label: '7 days',  value: '7d'  },
  { label: '28 days', value: '28d' },
  { label: '90 days', value: '90d' },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(value)}</span>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-raised) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: '8px',
      ...style,
    }} />
  )
}

export default function AnalyticsDashboard() {
  const [range,   setRange]   = useState<DateRange>('28d')
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async (r: DateRange) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(range) }, [range, load])

  const summary     = data?.summary
  const topViews    = data?.topPages?.[0]?.views   ?? 1
  const topSessions = data?.channels?.[0]?.sessions ?? 1
  const topUsers    = data?.countries?.[0]?.users   ?? 1
  const totalDev    = data?.devices?.reduce((s, d) => s + d.sessions, 0) ?? 1

  const heroStats = [
    { label: 'Users',        value: summary?.totalUsers,         accent: '#F5AE41', icon: UsersIcon,    format: fmt            },
    { label: 'Sessions',     value: summary?.sessions,           accent: '#4498CC', icon: SessionsIcon, format: fmt            },
    { label: 'Page views',   value: summary?.pageViews,          accent: '#3C3C3C', icon: ViewsIcon,    format: fmt            },
    { label: 'Avg session',  value: summary?.avgSessionDuration, accent: '#C32126', icon: ClockIcon,    format: fmtDuration    },
  ]

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .an-hero  { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 12px; }
        .an-two   { display: grid; grid-template-columns: 1fr 1fr;       gap: 16px; margin-bottom: 16px; }
        .an-three { display: grid; grid-template-columns: 2fr 1fr 1fr;   gap: 16px; }
        @media (max-width: 1100px) { .an-three { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 800px)  { .an-hero  { grid-template-columns: repeat(2,1fr); } .an-two { grid-template-columns: 1fr; } .an-three { grid-template-columns: 1fr; } }
        @media (max-width: 480px)  { .an-hero  { grid-template-columns: 1fr; } }
      `}</style>

      {/* Range picker */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: range === r.value ? 600 : 400,
              border: range === r.value ? '0.5px solid rgba(245,174,65,0.5)' : '0.5px solid var(--border-subtle)',
              background: range === r.value ? 'rgba(245,174,65,0.1)' : 'transparent',
              color: range === r.value ? 'var(--brand-gold)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.12s',
            }}
          >
            {r.label}
          </button>
        ))}
        {loading && (
          <span style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <span style={{
              display: 'inline-block', width: '14px', height: '14px',
              borderRadius: '50%',
              border: '2px solid var(--border-subtle)',
              borderTopColor: 'var(--brand-gold)',
              animation: 'spin 0.7s linear infinite',
            }} />
          </span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Error state */}
      {error && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(195,33,38,0.08)',
          border: '0.5px solid rgba(195,33,38,0.3)',
          borderRadius: '12px',
          color: 'var(--brand-red)',
          fontSize: '13px',
          marginBottom: '24px',
        }}>
          {error.includes('GA_') ? (
            <span>Google Analytics is not configured yet. Add <code>GA_PROPERTY_ID</code> and <code>GA_SERVICE_ACCOUNT_CREDENTIALS</code> to your environment variables.</span>
          ) : error}
        </div>
      )}

      {/* Hero stats */}
      <div className="an-hero">
        {heroStats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} style={{
              background: 'var(--bg-raised)',
              border: '0.5px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.accent, opacity: 0.7 }} />
              <div>
                {loading || stat.value === undefined ? (
                  <>
                    <Skeleton style={{ width: '64px', height: '44px', marginBottom: '8px' }} />
                    <Skeleton style={{ width: '48px', height: '10px' }} />
                  </>
                ) : (
                  <>
                    <div style={{
                      fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
                      fontSize: '42px', fontWeight: 900, color: stat.accent,
                      lineHeight: 0.95, marginBottom: '8px', letterSpacing: '-0.02em',
                    }}>
                      {stat.format(stat.value)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {stat.label}
                    </div>
                  </>
                )}
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${stat.accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: stat.accent,
              }}>
                <Icon />
              </div>
            </div>
          )
        })}
      </div>

      {/* Bounce rate pill */}
      {!loading && summary && (
        <div style={{ marginBottom: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 14px',
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}>
            Bounce rate: <strong style={{ color: summary.bounceRate > 60 ? 'var(--brand-red)' : 'var(--text-primary)' }}>{summary.bounceRate}%</strong>
          </div>
        </div>
      )}

      {/* Top pages */}
      <div style={{
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}>
        <SectionHeading>Top pages</SectionHeading>
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <Skeleton style={{ width: '55%', height: '14px' }} />
              <Skeleton style={{ width: '14%', height: '14px' }} />
            </div>
          ))
        ) : !data?.topPages?.length ? (
          <EmptyState>No page data available</EmptyState>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Page</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '80px' }}>Views</th>
                <th style={{ ...thStyle, width: '140px' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((page, i) => (
                <tr key={i} style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 0', paddingRight: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                      {page.title && page.title !== '(not set)' ? page.title : page.path}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                      {page.path}
                    </div>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#4498CC', whiteSpace: 'nowrap' }}>
                    {fmt(page.views)}
                  </td>
                  <td style={{ padding: '10px 0 10px 12px' }}>
                    <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((page.views / topViews) * 100)}%`, background: '#4498CC', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Channels + Countries + Devices */}
      <div className="an-three">
        {/* Traffic sources */}
        <div style={{ background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)', borderRadius: '14px', padding: '20px 24px' }}>
          <SectionHeading>Traffic sources</SectionHeading>
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} style={{ height: '32px', marginBottom: '10px' }} />)
          ) : !data?.channels?.length ? (
            <EmptyState>No channel data</EmptyState>
          ) : (
            data.channels.map(c => (
              <BarRow key={c.channel} label={c.channel} value={c.sessions} max={topSessions} color="#F5AE41" />
            ))
          )}
        </div>

        {/* Countries */}
        <div style={{ background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)', borderRadius: '14px', padding: '20px 24px' }}>
          <SectionHeading>Countries</SectionHeading>
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} style={{ height: '32px', marginBottom: '10px' }} />)
          ) : !data?.countries?.length ? (
            <EmptyState>No country data</EmptyState>
          ) : (
            data.countries.map(c => (
              <BarRow key={c.country} label={c.country} value={c.users} max={topUsers} color="#4498CC" />
            ))
          )}
        </div>

        {/* Devices */}
        <div style={{ background: 'var(--bg-raised)', border: '0.5px solid var(--border-subtle)', borderRadius: '14px', padding: '20px 24px' }}>
          <SectionHeading>Devices</SectionHeading>
          {loading ? (
            [1,2,3].map(i => <Skeleton key={i} style={{ height: '32px', marginBottom: '10px' }} />)
          ) : !data?.devices?.length ? (
            <EmptyState>No device data</EmptyState>
          ) : (
            data.devices.map(d => (
              <BarRow key={d.device} label={d.device} value={d.sessions} max={totalDev} color="#C32126" />
            ))
          )}
        </div>
      </div>
    </>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      marginBottom: '16px',
    }}>
      {children}
    </h2>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{children}</p>
}

const thStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  paddingBottom: '8px', textAlign: 'left',
}

/* Icons */
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function SessionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}
function ViewsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
