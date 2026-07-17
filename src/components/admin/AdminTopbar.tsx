'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/components/theme/ThemeProvider'
import ThemeToggleGrid from '@/components/theme/ThemeToggleGrid'

export default function AdminTopbar({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { mode, setMode } = useTheme()

  const localPart = userEmail.split('@')[0] ?? ''
  const name = localPart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
  const initials = name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header style={{
      height: '64px',
      borderBottom: '0.5px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--topbar-bg)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      gap: '12px',
    }}>

      {/* Mobile brand — hidden on desktop via CSS */}
      <div className="admin-topbar-brand" style={{ alignItems: 'center', gap: '10px' }}>
        <Image
          src={mode === 'light' ? '/icons/LVSC_logo_color.png' : '/icons/LVSC_logo_dark.png'}
          alt="LoveSeal Church"
          width={120}
          height={38}
          style={{ width: '120px', height: 'auto', objectFit: 'contain', objectPosition: 'left center' }}
          priority
        />
      </div>

      {/* Spacer — pushes avatar to right on desktop */}
      <div style={{ flex: 1 }} />

      {/* Avatar / user menu */}
      <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px 4px 4px',
            background: open ? 'var(--bg-elevated)' : 'transparent',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '40px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'background 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => {
            if (!open) e.currentTarget.style.borderColor = 'var(--border-strong)'
          }}
          onMouseLeave={e => {
            if (!open) e.currentTarget.style.borderColor = 'var(--border-subtle)'
          }}
        >
          {/* Avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F5AE41 0%, #C32126 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          {/* Name — hidden on small screens via flex shrink */}
          <div style={{
            textAlign: 'left',
            lineHeight: 1.2,
            overflow: 'hidden',
            maxWidth: '140px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          </div>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: '248px',
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: '14px',
            padding: '6px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
            zIndex: 60,
          }}>
            {/* Profile heading */}
            <div style={{
              padding: '10px 12px 12px',
              borderBottom: '0.5px solid var(--border-subtle)',
              marginBottom: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F5AE41 0%, #C32126 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{userEmail}</div>
                </div>
              </div>
            </div>

            {/* Theme switcher */}
            <div style={{ padding: '8px 12px 6px' }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontWeight: 500,
              }}>
                Appearance
              </div>
              <ThemeToggleGrid mode={mode} onSelectMode={setMode} />
            </div>

            <div style={{ height: '0.5px', background: 'var(--border-subtle)', margin: '6px 4px' }} />

            <Link href="/admin/settings" style={dropdownItemStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Account settings
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={dropdownItemStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              View public site ↗
            </a>
          </div>
        )}
      </div>
    </header>
  )
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '9px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  transition: 'background 0.1s',
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="var(--text-tertiary)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
