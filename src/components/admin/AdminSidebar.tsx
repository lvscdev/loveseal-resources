'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme/ThemeProvider'

const baseNavLinks = [
  { href: '/admin',                label: 'Dashboard',    icon: HomeIcon         },
  { href: '/admin/analytics',      label: 'Analytics',    icon: AnalyticsIcon    },
  { href: '/admin/content',        label: 'Content',      icon: ContentIcon      },
  { href: '/admin/upload',         label: 'Upload',       icon: UploadIcon       },
  { href: '/admin/authors',        label: 'Authors',      icon: AuthorsIcon      },
  { href: '/admin/categories',     label: 'Categories',   icon: CategoriesIcon   },
  { href: '/admin/editorial-tags', label: 'In-focus',     icon: EditorialTagsIcon },
]

const superAdminNavLinks = [
  { href: '/admin/admins', label: 'Admins', icon: AdminsIcon },
]

export default function AdminSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted]     = useState(false)

  const { mode } = useTheme()
  const logoSrc = mode === 'light' ? '/icons/LVSC_logo_color.png' : '/icons/LVSC_logo_dark.png'

  const navLinks = isSuperAdmin ? [...baseNavLinks, ...superAdminNavLinks] : baseNavLinks
  // Limit bottom nav to 5 items to avoid overflow
  const bottomNavLinks = navLinks.slice(0, 5)

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('admin-sidebar-collapsed', String(next))
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  if (!mounted) {
    return (
      <aside className="admin-sidebar-wrap" style={{ width: '220px', flexShrink: 0 }} />
    )
  }

  const width = collapsed ? '68px' : '228px'

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="admin-sidebar-wrap"
        style={{
          width,
          flexShrink: 0,
          background: 'var(--sidebar-bg)',
          borderRight: '0.5px solid var(--border-subtle)',
          height: '100dvh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'visible',
          zIndex: 50,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute',
            top: '22px',
            right: '-10px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '0.5px solid var(--border-strong)',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            padding: 0,
            transition: 'background 0.12s, color 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#F5AE41'
            e.currentTarget.style.color = '#1a0f00'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,174,65,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-elevated)'
            e.currentTarget.style.color = 'var(--text-tertiary)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <svg
            width="9" height="9" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Logo area */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0' : '0 18px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '0.5px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          {collapsed ? (
            <Image
              src="/icons/LVSC_fav_icon_color.png"
              alt="LoveSeal"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <Image
              src={logoSrc}
              alt="LoveSeal Church"
              width={140}
              height={44}
              style={{ width: '140px', height: 'auto', objectFit: 'contain', objectPosition: 'left center' }}
              priority
            />
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: active ? 'rgba(245,174,65,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.12s, color 0.12s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                  }
                }}
              >
                {/* Active accent bar */}
                {active && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3px',
                    borderRadius: '0 3px 3px 0',
                    background: 'var(--brand-gold)',
                  }} />
                )}
                <Icon style={{
                  flexShrink: 0,
                  color: active ? 'var(--brand-gold)' : 'currentColor',
                  marginLeft: active && !collapsed ? '3px' : '0',
                }} />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '8px', borderTop: '0.5px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign out' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'transparent',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-muted)',
              transition: 'background 0.12s, color 0.12s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              width: '100%',
              fontSize: '12px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(195,33,38,0.1)'
              e.currentTarget.style.color = 'var(--brand-red)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <SignOutIcon />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="admin-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(15,16,18,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '0.5px solid var(--border-subtle)',
          flexDirection: 'row',
          alignItems: 'stretch',
          zIndex: 200,
          padding: '0 4px',
        }}
      >
        {bottomNavLinks.map(link => {
          const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                textDecoration: 'none',
                color: active ? 'var(--brand-gold)' : 'var(--text-muted)',
                fontSize: '9px',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.04em',
                transition: 'color 0.12s',
                padding: '6px 2px',
                borderTop: active ? '2px solid var(--brand-gold)' : '2px solid transparent',
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span style={{ lineHeight: 1 }}>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

/* ── Icons ── */

function AnalyticsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  )
}
function HomeIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function ContentIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function UploadIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
function CategoriesIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}
function AdminsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function AuthorsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function EditorialTagsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
