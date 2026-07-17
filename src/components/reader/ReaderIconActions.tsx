'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '@/lib/toast'

export default function ReaderIconActions({
  shareTitle,
  copyLinkLabel,
  copiedLabel,
  shareLabel,
  downloadLabel,
  downloadUrl,
}: {
  shareTitle:    string
  copyLinkLabel: string
  copiedLabel:   string
  shareLabel:    string
  downloadLabel: string
  downloadUrl:   string | null
}) {
  const [copied, setCopied]         = useState(false)
  const [shareOpen, setShareOpen]   = useState(false)
  const shareRef                    = useRef<HTMLDivElement>(null)
  const buttonRef                   = useRef<HTMLButtonElement>(null)
  const dropRef                     = useRef<HTMLDivElement>(null)
  const [dropPos, setDropPos]       = useState<{ top: number; left: number } | null>(null)

  /* Close on outside click — must check both the toggle button wrapper AND
     the portal dropdown (which is in document.body, outside shareRef). */
  useEffect(() => {
    if (!shareOpen) return
    function onDown(e: MouseEvent) {
      const inButton = shareRef.current?.contains(e.target as Node)
      const inDrop   = dropRef.current?.contains(e.target as Node)
      if (!inButton && !inDrop) setShareOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [shareOpen])

  /* Re-position dropdown whenever it opens */
  useEffect(() => {
    if (!shareOpen || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const PANEL_W = 272
    const left = Math.min(
      rect.left + window.scrollX,
      window.innerWidth - PANEL_W - 12,
    )
    setDropPos({
      top:  rect.bottom + window.scrollY + 8,
      left: Math.max(8, left),
    })
  }, [shareOpen])

  async function handleCopyLink() {
    if (typeof window === 'undefined') return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.info('Copy this link', { description: window.location.href, duration: 8000 })
    }
  }

  function openShare() {
    setShareOpen(v => !v)
  }

  const url   = typeof window !== 'undefined' ? window.location.href : ''
  const text  = encodeURIComponent(shareTitle)
  const href  = encodeURIComponent(url)

  const platforms: { label: string; url: string; icon: React.ReactNode; bg: string; color: string }[] = [
    {
      label: 'WhatsApp',
      url:   `https://api.whatsapp.com/send?text=${text}%20${href}`,
      icon:  <WhatsAppIcon />,
      bg:    '#25D366',
      color: '#fff',
    },
    {
      label: 'X / Twitter',
      url:   `https://twitter.com/intent/tweet?text=${text}&url=${href}`,
      icon:  <XIcon />,
      bg:    '#000000',
      color: '#fff',
    },
    {
      label: 'Facebook',
      url:   `https://www.facebook.com/sharer/sharer.php?u=${href}`,
      icon:  <FacebookIcon />,
      bg:    '#1877F2',
      color: '#fff',
    },
    {
      label: 'Telegram',
      url:   `https://t.me/share/url?url=${href}&text=${text}`,
      icon:  <TelegramIcon />,
      bg:    '#26A5E4',
      color: '#fff',
    },
    {
      label: 'Email',
      url:   `mailto:?subject=${text}&body=${href}`,
      icon:  <EmailIcon />,
      bg:    'var(--bg-elevated)',
      color: 'var(--text-primary)',
    },
    {
      label: copied ? 'Copied!' : 'Copy link',
      url:   '',
      icon:  copied ? <CheckIcon /> : <LinkIcon />,
      bg:    'var(--bg-elevated)',
      color: copied ? 'var(--brand-gold)' : 'var(--text-primary)',
    },
  ]

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '0.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* "SHARE" label */}
      <span
        style={{
          fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
          fontSize:      '0.6875rem',
          fontWeight:    700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         'var(--text-tertiary)',
          marginRight:   '0.125rem',
          userSelect:    'none',
        }}
      >
        Share
      </span>

      {/* Copy link */}
      <IconButton
        onClick={handleCopyLink}
        ariaLabel={copied ? copiedLabel : copyLinkLabel}
        title={copied ? copiedLabel : copyLinkLabel}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </IconButton>

      {/* Share — opens platform dropdown */}
      <div ref={shareRef} style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={openShare}
          aria-label={shareLabel}
          aria-expanded={shareOpen}
          title={shareLabel}
          style={{
            ...iconButtonStyle,
            background: shareOpen ? 'var(--bg-elevated)' : 'var(--bg-raised)',
          }}
        >
          <ShareIcon />
        </button>

        {shareOpen && dropPos && typeof document !== 'undefined' && createPortal(
          <div
            ref={dropRef}
            style={{
              position:     'absolute',
              top:          dropPos.top,
              left:         dropPos.left,
              width:        272,
              background:   'var(--bg-raised)',
              border:       '0.03125rem solid var(--border-strong)',
              borderRadius: '0.875rem',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
              padding:      '0.875rem',
              zIndex:       9999,
            }}
          >
            {/* Header */}
            <div
              style={{
                fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
                fontSize:      '0.6875rem',
                fontWeight:    700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         'var(--text-tertiary)',
                marginBottom:  '0.75rem',
              }}
            >
              Share this
            </div>

            {/* Platform grid — 3 across */}
            <div
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap:                 '0.5rem',
              }}
            >
              {platforms.map(p => (
                p.url ? (
                  <a
                    key={p.label}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareOpen(false)}
                    style={platformItemStyle}
                  >
                    <span
                      style={{
                        width:          '2.25rem',
                        height:         '2.25rem',
                        borderRadius:   '50%',
                        background:     p.bg,
                        color:          p.color,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                      }}
                    >
                      {p.icon}
                    </span>
                    <span style={platformLabelStyle}>{p.label}</span>
                  </a>
                ) : (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { handleCopyLink(); setShareOpen(false) }}
                    style={{ ...platformItemStyle, border: 'none', cursor: 'pointer' }}
                  >
                    <span
                      style={{
                        width:          '2.25rem',
                        height:         '2.25rem',
                        borderRadius:   '50%',
                        background:     p.bg,
                        color:          p.color,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        transition:     'color 0.15s',
                      }}
                    >
                      {p.icon}
                    </span>
                    <span style={platformLabelStyle}>{p.label}</span>
                  </button>
                )
              ))}
            </div>
          </div>,
          document.body,
        )}
      </div>

      {/* Download */}
      {downloadUrl && (
        <IconButtonAnchor
          href={downloadUrl}
          ariaLabel={downloadLabel}
          title={downloadLabel}
        >
          <DownloadIcon />
        </IconButtonAnchor>
      )}
    </div>
  )
}

/* ── Shared styles ──────────────────────────────────────────────────────── */

const iconButtonStyle: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  width:          '2.5rem',
  height:         '2.5rem',
  borderRadius:   '50%',
  background:     'var(--bg-raised)',
  color:          'var(--text-primary)',
  border:         '0.03125rem solid var(--border-subtle)',
  cursor:         'pointer',
  fontFamily:     'var(--font-body)',
  transition:     'background-color 0.12s, transform 0.08s',
  flexShrink:     0,
}

const platformItemStyle: React.CSSProperties = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  gap:            '0.375rem',
  padding:        '0.5rem 0.25rem',
  borderRadius:   '0.625rem',
  textDecoration: 'none',
  background:     'transparent',
  transition:     'background 0.12s',
}

const platformLabelStyle: React.CSSProperties = {
  fontFamily:    'var(--font-body)',
  fontSize:      '0.625rem',
  fontWeight:    500,
  color:         'var(--text-secondary)',
  textAlign:     'center',
  lineHeight:    1.2,
  whiteSpace:    'nowrap',
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function IconButton({
  onClick, ariaLabel, title, children,
}: {
  onClick:  () => void
  ariaLabel: string
  title:    string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      style={iconButtonStyle}
    >
      {children}
    </button>
  )
}

function IconButtonAnchor({
  href, ariaLabel, title, children,
}: {
  href:      string
  ariaLabel: string
  title:     string
  children:  React.ReactNode
}) {
  return (
    <a
      href={href}
      download
      aria-label={ariaLabel}
      title={title}
      style={{ ...iconButtonStyle, textDecoration: 'none' }}
    >
      {children}
    </a>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6"  cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.114.554 4.1 1.524 5.823L.057 23.928a.5.5 0 0 0 .611.611l6.105-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.526-5.217-1.44l-.374-.222-3.877.932.949-3.877-.243-.389A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}
