'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import Image from 'next/image'
import LanguageSwitcher from '@/components/public/LanguageSwitcher'
import ThemeTogglePopover from '@/components/theme/ThemeTogglePopover'
import ThemeToggleGrid from '@/components/theme/ThemeToggleGrid'
import { useTheme } from '@/components/theme/ThemeProvider'
import { fetchDiscoverItems, type DiscoverItem } from '@/app/(public)/_actions/discoverItems'
import { contentHref } from '@/lib/content-url'

const TYPE_COLORS: Record<string, string> = {
  manual:   '#4498CC',
  prophecy: '#C32126',
  article:  '#F5AE41',
  blog:     '#3C3C3C',
}

const STRIPE_BG = `repeating-linear-gradient(135deg, #d9c6a0 0 10px, #c9b58a 10px 20px)`

export default function PublicHeader() {
  const t        = useTranslations('nav')
  const locale   = useLocale()
  const pathname = usePathname()
  const { mode } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [now,        setNow]        = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const navLinks = [
    { href: '/' as const,                                                                  label: t('whatsNew') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'manual'   } }, label: t('manuals') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'prophecy' } }, label: t('prophecies') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'article'  } }, label: t('articles') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'blog'     } }, label: t('blog') },
  ]

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  /* Lock body scroll while sidebar is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function isLinkActive(href: typeof navLinks[number]['href']): boolean {
    if (typeof href === 'string') return pathname === href
    if (href && typeof href === 'object' && 'params' in href) {
      return pathname === `/topic/${href.params.type}`
    }
    return false
  }

  const dateString = now
    ? now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
    : ''

  return (
    <>
      <header style={{
        position:       'sticky',
        top:            0,
        zIndex:         100,
        background:     'var(--bg-base)',
        borderBottom:   scrolled ? '0.03125rem solid var(--border-subtle)' : '0.03125rem solid transparent',
        transition:     'border-color 0.18s, backdrop-filter 0.18s',
        backdropFilter: scrolled ? 'blur(0.75rem)' : 'none',
      }}>
        <div
          className="public-header-grid"
          style={{
            maxWidth:            'var(--width-site)',
            marginInline:        'auto',
            width:               '100%',
            padding:             '1rem var(--page-inline-padding)',
            display:             'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems:          'center',
            gap:                 '1.25rem',
          }}
        >
          {/* ── LEFT ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
            <Link href="/" aria-label={t('home')} style={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}>
              <Image
                src={mode === 'light' ? '/icons/LVSC_logo_color.png' : '/icons/LVSC_logo_dark.png'}
                alt="LoveSeal Church"
                width={150}
                height={48}
                style={{ width: '150px', height: 'auto', objectFit: 'contain', objectPosition: 'left center' }}
                priority
              />
            </Link>
            <span
              className="header-date"
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.12em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
              suppressHydrationWarning
            >
              {dateString}
            </span>
          </div>

          {/* ── CENTER: nav pill ── */}
          <nav className="public-nav-pill" style={{ justifySelf: 'center', display: 'flex', gap: '0.25rem', background: '#1A1A1A', borderRadius: '999rem', padding: '0.5rem 0.75rem' }}>
            {navLinks.map((link, idx) => {
              const active = isLinkActive(link.href)
              return (
                <Link
                  key={idx}
                  href={link.href}
                  className={`public-nav-link${active ? ' public-nav-link--active' : ''}`}
                  style={{ position: 'relative', padding: '0.5rem 1.125rem', borderRadius: '999rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.4)', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.18s' }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      style={{ position: 'absolute', inset: 0, background: 'var(--footer-red, #C32126)', borderRadius: '999rem', zIndex: 0 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* ── RIGHT ── */}
          <div className="public-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <span className="public-header-theme"><ThemeTogglePopover /></span>
            <span className="public-header-language"><LanguageSwitcher /></span>

            <Link href="/content" title={t('search')} aria-label={t('search')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: '#1A1A1A', color: '#FFFFFF', textDecoration: 'none', flexShrink: 0, transition: 'transform 0.12s' }}>
              <SearchIcon />
            </Link>

            <button
              type="button"
              className="public-nav-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label={t('menu')}
              aria-expanded={mobileOpen}
              style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'transparent', color: 'var(--text-primary)', border: '0.03125rem solid var(--border-strong)', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', flexShrink: 0 }}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar portal */}
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
        isLinkActive={isLinkActive}
        dateString={dateString}
      />

      <style>{`
        .public-nav-link:hover { color: rgba(255,255,255,0.85) !important; }
        .public-nav-link--active, .public-nav-link--active:hover { color: #FFFFFF !important; }
        @media (max-width: 64rem) {
          .public-header-grid { grid-template-columns: auto 1fr auto !important; gap: 0.75rem !important; }
          .header-date { display: none !important; }
        }
        @media (max-width: 55rem) {
          .public-nav-pill        { display: none !important; }
          .public-nav-hamburger   { display: inline-flex !important; }
          .public-header-theme,
          .public-header-language { display: none !important; }
        }
      `}</style>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MobileSidebar — right-sliding panel rendered into document.body via portal.
   Framer-motion handles the enter/exit animations so the sidebar slides in
   smoothly even though it lives outside the header's DOM subtree.
   ───────────────────────────────────────────────────────────────────────── */
function MobileSidebar({
  open,
  onClose,
  navLinks,
  isLinkActive,
  dateString,
}: {
  open:        boolean
  onClose:     () => void
  navLinks:    ReadonlyArray<{ href: string | { pathname: string; params: { type: string } }; label: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isLinkActive: (href: any) => boolean
  dateString:  string
}) {
  const { mode, setMode } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const sidebar = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position:   'fixed',
              inset:      0,
              background: 'rgba(0,0,0,0.52)',
              zIndex:     200,
              cursor:     'pointer',
            }}
          />

          {/* Panel */}
          <motion.div
            key="sidebar-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            style={{
              position:   'fixed',
              top:        0,
              right:      0,
              bottom:     0,
              width:      'clamp(17rem, 88vw, 22rem)',
              background: 'var(--bg-base)',
              zIndex:     201,
              display:    'flex',
              flexDirection: 'column',
              overflowY:  'auto',
              boxShadow:  '-0.5rem 0 2rem rgba(0,0,0,0.18)',
            }}
          >
            {/* ── Header row ── */}
            <div style={{
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              padding:        '1rem 1.25rem 0.875rem',
              borderBottom:   '0.03125rem solid var(--border-subtle)',
              flexShrink:     0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <Image
                  src={mode === 'light' ? '/icons/LVSC_logo_color.png' : '/icons/LVSC_logo_dark.png'}
                  alt="LoveSeal Church"
                  width={125}
                  height={40}
                  style={{ width: '125px', height: 'auto', objectFit: 'contain', objectPosition: 'left center' }}
                />
                {dateString && (
                  <span
                    suppressHydrationWarning
                    style={{
                      fontFamily:    'var(--font-body)',
                      fontSize:      '0.6875rem',
                      fontWeight:    600,
                      letterSpacing: '0.12em',
                      color:         'var(--text-tertiary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {dateString}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  width:          '2.25rem',
                  height:         '2.25rem',
                  borderRadius:   '50%',
                  background:     'var(--bg-elevated)',
                  border:         '0.03125rem solid var(--border-strong)',
                  color:          'var(--text-primary)',
                  cursor:         'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontFamily:     'var(--font-body)',
                  flexShrink:     0,
                  marginTop:      '0.25rem',
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* ── Nav links ── */}
            <nav style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}>
              {navLinks.map((link, idx) => {
                const active = isLinkActive(link.href)
                return (
                  <Link
                    key={idx}
                    // @ts-expect-error — typed Link href union passes through safely
                    href={link.href}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            '0.625rem',
                      padding:        '0.75rem 0.875rem',
                      borderRadius:   '0.625rem',
                      fontFamily:     'var(--font-body)',
                      fontSize:       '0.9375rem',
                      fontWeight:     active ? 600 : 400,
                      color:          active ? 'var(--brand-red)' : 'var(--text-primary)',
                      background:     active ? 'rgba(195,33,38,0.07)' : 'transparent',
                      textDecoration: 'none',
                      transition:     'background 0.12s, color 0.12s',
                    }}
                  >
                    {active && (
                      <span style={{ width: '0.25rem', height: '0.25rem', borderRadius: '50%', background: 'var(--brand-red)', flexShrink: 0 }} />
                    )}
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* ── Theme + language ── */}
            <div style={{ padding: '0.25rem 1.25rem 1rem', flexShrink: 0 }}>
              <Divider />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.875rem' }}>
                <ThemeToggleGrid mode={mode} onSelectMode={setMode} />
                <LanguageSwitcher />
              </div>
            </div>

            {/* ── Discover carousel ── */}
            <div style={{ flexShrink: 0, paddingBottom: '1.5rem' }}>
              <Divider />
              <div style={{ padding: '1rem 1.25rem 0.625rem' }}>
                <div style={{
                  fontSize:      '0.625rem',
                  fontWeight:    600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:         'var(--brand-gold)',
                  marginBottom:  '0.25rem',
                }}>
                  From the Library
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  Recent teachings &amp; insights
                </p>
              </div>
              <DiscoverCarousel />
            </div>

            {/* ── Social icons footer ── */}
            <div style={{ marginTop: 'auto', flexShrink: 0 }}>
              <Divider />
              <div style={{
                padding:        '1rem 1.25rem',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily:    'var(--font-body)',
                  fontSize:      '0.6875rem',
                  fontWeight:    700,
                  letterSpacing: '0.18em',
                  color:         'var(--text-tertiary)',
                  textTransform: 'uppercase',
                }}>
                  Join Us
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <SocialIcon href="https://youtube.com"   bg="#FF0000"   label="YouTube"   icon={<YoutubeIcon />} />
                  <SocialIcon href="https://tiktok.com"    bg="#000000"   label="TikTok"    icon={<TiktokIcon />} />
                  <SocialIcon href="https://x.com"         bg="#0F1419"   label="X"         icon={<XIcon />} />
                  <SocialIcon href="https://instagram.com" bg="radial-gradient(circle at 30% 110%,#FFD75E 0%,#F95B3D 35%,#D6249F 65%,#4F5BD5 100%)" label="Instagram" icon={<InstagramIcon />} />
                  <SocialIcon href="https://linkedin.com"  bg="#0A66C2"   label="LinkedIn"  icon={<LinkedInIcon />} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(sidebar, document.body)
}

/* ─────────────────────────────────────────────────────────────────────────────
   DiscoverCarousel — horizontal scroll strip of fact cards.
   Fetches the 6 most-recent published items client-side on first render.
   Each card shows a key point (first summary_point) as the "fact".
   ───────────────────────────────────────────────────────────────────────── */
function DiscoverCarousel() {
  const [items, setItems]     = useState<DiscoverItem[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDiscoverItems().then(data => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '0.625rem', padding: '0 1.25rem', overflowX: 'hidden' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flexShrink: 0,
            width:      '10rem',
            height:     '13rem',
            borderRadius: '0.75rem',
            background: 'var(--bg-elevated)',
            animation:  'sidebar-pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
        <style>{`@keyframes sidebar-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div
      ref={scrollRef}
      style={{
        display:              'flex',
        gap:                  '0.625rem',
        padding:              '0.25rem 1.25rem 0.5rem',
        overflowX:            'auto',
        scrollSnapType:       'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth:       'none',
      }}
    >
      <style>{`.sidebar-scroll::-webkit-scrollbar { display: none; }`}</style>
      {items.map(item => (
        <DiscoverCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function DiscoverCard({ item }: { item: DiscoverItem }) {
  const typeColor = TYPE_COLORS[item.content_type] ?? '#3C3C3C'
  const fact      = item.summary_points?.[0] ?? item.theme ?? item.title

  return (
    <Link
      href={contentHref(item)}
      style={{
        flexShrink:     0,
        width:          '9.5rem',
        scrollSnapAlign: 'start',
        display:        'flex',
        flexDirection:  'column',
        background:     'var(--bg-raised)',
        border:         '0.03125rem solid var(--border-subtle)',
        borderRadius:   '0.75rem',
        overflow:       'hidden',
        textDecoration: 'none',
        transition:     'transform 0.12s',
      }}
    >
      {/* Cover */}
      <div style={{
        position:    'relative',
        height:      '5.5rem',
        flexShrink:  0,
        background:  item.cover_image_url ? '#000' : STRIPE_BG,
        overflow:    'hidden',
      }}>
        {item.cover_image_url && (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="9.5rem"
            style={{ objectFit: 'cover' }}
          />
        )}
        {/* Type color bar */}
        <div style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          height:     '0.1875rem',
          background: typeColor,
        }} />
      </div>

      {/* Body */}
      <div style={{ padding: '0.625rem 0.625rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <span style={{
          fontSize:      '0.5625rem',
          fontWeight:    600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         typeColor,
        }}>
          {item.content_type}
        </span>

        <p style={{
          fontFamily:      'var(--font-body)',
          fontSize:        '0.75rem',
          fontWeight:      600,
          color:           'var(--text-primary)',
          lineHeight:      1.3,
          margin:          0,
          display:         '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow:        'hidden',
          flex:            1,
        }}>
          {fact}
        </p>

        <span style={{
          fontSize:  '0.625rem',
          color:     'var(--brand-red)',
          fontWeight: 500,
          marginTop: 'auto',
        }}>
          Read →
        </span>
      </div>
    </Link>
  )
}

function Divider() {
  return (
    <div style={{ height: '0.03125rem', background: 'var(--border-subtle)', marginInline: '1.25rem' }} />
  )
}

/* ── Social icon dot ── */
function SocialIcon({ href, bg, label, icon }: { href: string; bg: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width:          '2rem',
        height:         '2rem',
        borderRadius:   '50%',
        background:     bg,
        color:          '#FFFFFF',
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        textDecoration: 'none',
      }}
    >
      {icon}
    </a>
  )
}
function YoutubeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.24 5 12 5 12 5s-6.24 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.76 19 12 19 12 19s6.24 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z"/></svg>
}
function TiktokIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 7.2a5.6 5.6 0 0 1-3.4-1.2 5.6 5.6 0 0 1-2.1-3.5h-3.3v12.6a2.7 2.7 0 1 1-2-2.6V9a6 6 0 1 0 5.3 6V9.3a8.9 8.9 0 0 0 5.5 1.9V7.2z"/></svg>
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.4L4.8 21H1.6l7.5-8.6L1.3 3h6.5l4.5 6L17.5 3zm-1.1 16h1.8L7.7 5H5.8l10.6 14z"/></svg>
}
function InstagramIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
}
function LinkedInIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 9v10.5h-3V9h3zM5 4.3a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM9 9h2.9v1.5h.04a3.2 3.2 0 0 1 2.86-1.6c3 0 3.6 2 3.6 4.6V19.5h-3V14c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6H9V9z"/></svg>
}

/* ── Icons ── */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}
