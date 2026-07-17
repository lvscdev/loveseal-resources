import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import RecentUploadsTable from '@/components/admin/RecentUploadsTable'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const supabase = await createClient()
  const me = await getCurrentAdmin()

  type AuthorProfile = { id: string; name: string; slug: string; avatar_url: string | null; bio: string | null }

  // Try to find an author profile linked by display_name
  let authorProfile: AuthorProfile | null = null
  if (me?.display_name) {
    const { data } = await supabase
      .from('authors')
      .select('id, name, slug, avatar_url, bio')
      .ilike('name', me.display_name)
      .maybeSingle()
    authorProfile = data as AuthorProfile | null
  }

  const [
    { count: total },
    { count: published },
    { count: drafts },
    { count: manuals },
    { count: prophecies },
    { count: articles },
    { count: blogs },
    { data: recent },
  ] = await Promise.all([
    supabase.from('content').select('*', { count: 'exact', head: true }),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'manual'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'prophecy'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'article'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'blog'),
    supabase
      .from('content')
      .select('id, title, content_type, status, language, theme, speaker, date_preached, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const heroStats = [
    { label: 'Total',     value: total ?? 0,     accent: '#F5AE41', icon: TotalIcon    },
    { label: 'Published', value: published ?? 0, accent: '#4498CC', icon: PublishedIcon },
    { label: 'Drafts',    value: drafts ?? 0,    accent: '#808080', icon: DraftIcon    },
  ]

  const typeStats = [
    { label: 'Manuals',    value: manuals ?? 0,    color: '#4498CC' },
    { label: 'Prophecies', value: prophecies ?? 0, color: '#C32126' },
    { label: 'Articles',   value: articles ?? 0,   color: '#F5AE41' },
    { label: 'Blog',       value: blogs ?? 0,      color: '#3C3C3C' },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={eyebrowStyle}>Overview</p>
          <h1 style={pageTitleStyle}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/admin/upload" style={primaryBtn}>+ Upload</Link>
          <Link href="/admin/content" style={secondaryBtn}>View all</Link>
        </div>
      </div>

      {/* Profile block */}
      {me && (
        <div style={{
          background: 'var(--bg-raised)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {authorProfile?.avatar_url ? (
              <Image
                src={authorProfile.avatar_url}
                alt={authorProfile.name}
                width={52}
                height={52}
                style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5AE41 0%, #C32126 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 700, color: '#1a0f00',
                flexShrink: 0,
              }}>
                {(me.display_name ?? me.email).slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {me.display_name ?? me.email.split('@')[0]}
              </span>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase',
                background: me.role === 'super_admin' ? 'rgba(245,174,65,0.15)' : 'var(--bg-elevated)',
                color: me.role === 'super_admin' ? 'var(--brand-gold)' : 'var(--text-secondary)',
              }}>
                {me.role === 'super_admin' ? '★ Super Admin' : 'Admin'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{me.email}</div>
            {authorProfile?.bio && (
              <div style={{
                fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px',
                display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {authorProfile.bio}
              </div>
            )}
          </div>

          {/* Author profile actions */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {authorProfile ? (
              <>
                <Link
                  href={`/admin/authors/${authorProfile.id}`}
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    border: '0.5px solid var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  Edit author profile
                </Link>
                <Link
                  href={`/authors/${authorProfile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    border: '0.5px solid var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '12px', fontWeight: 500, color: 'var(--brand-gold)',
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  View public profile ↗
                </Link>
              </>
            ) : (
              <Link
                href="/admin/authors"
                style={{
                  padding: '7px 14px',
                  background: 'rgba(245,174,65,0.1)',
                  border: '0.5px solid rgba(245,174,65,0.3)',
                  borderRadius: '8px',
                  fontSize: '12px', fontWeight: 500, color: 'var(--brand-gold)',
                  textDecoration: 'none', display: 'inline-block',
                }}
              >
                + Create author profile
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero stats — 1 col mobile, 3 col desktop */}
      <style>{`
        .dash-hero-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
        .dash-type-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 32px; }
        @media (max-width: 640px) {
          .dash-hero-grid { grid-template-columns: 1fr; gap: 8px; }
          .dash-type-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .dash-hero-grid { grid-template-columns: repeat(3, 1fr); }
          .dash-type-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="dash-hero-grid">
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
              {/* Accent glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: stat.accent,
                opacity: 0.7,
              }} />
              <div>
                <div style={{
                  fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
                  fontSize: '48px',
                  fontWeight: 900,
                  color: stat.accent,
                  lineHeight: 0.95,
                  marginBottom: '8px',
                  letterSpacing: '-0.02em',
                }}>{stat.value}</div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>{stat.label}</div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${stat.accent}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: stat.accent,
              }}>
                <Icon />
              </div>
            </div>
          )
        })}
      </div>

      {/* Type stats */}
      <div className="dash-type-grid">
        {typeStats.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ width: '4px', height: '36px', borderRadius: '4px', background: stat.color, flexShrink: 0 }} />
            <div>
              <div style={{
                fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
                fontSize: '26px',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent uploads */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            Recent uploads
          </h2>
          <Link href="/admin/content" style={{ fontSize: '12px', color: 'var(--brand-gold)', textDecoration: 'none', fontWeight: 500 }}>
            View all →
          </Link>
        </div>
        <RecentUploadsTable items={recent ?? []} />
      </div>
    </div>
  )
}

/* ── Stat icons ── */
function TotalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}
function PublishedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function DraftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '4px',
}

const pageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
  fontSize: '28px',
  fontWeight: 900,
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
  lineHeight: 1.0,
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 18px',
  background: 'var(--brand-gold)',
  color: '#1a0f00',
  border: 'none',
  borderRadius: '9px',
  fontSize: '13px',
  fontWeight: 600,
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  display: 'inline-block',
  letterSpacing: '0.01em',
}

const secondaryBtn: React.CSSProperties = {
  padding: '9px 18px',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '9px',
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  display: 'inline-block',
}
