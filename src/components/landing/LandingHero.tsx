'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link, useRouter } from '@/i18n/navigation'

interface HeroItem {
  id:              string
  slug:            string | null
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  series:          string | null
  speaker:         string | null
  cover_image_url: string | null
  published_at:    string
}

const TYPE_ORDER: HeroItem['content_type'][] = ['manual', 'prophecy', 'article', 'blog']

// Light tints derived from the design token brand colors:
// Blue #4498CC → manual, Red #C32126 → prophecy, Gold #F5AE41 → article, Lilac #C8BFEC → blog
const TYPE_BG: Record<HeroItem['content_type'], string> = {
  manual:   '#D5E9F6',
  prophecy: '#F9D6D7',
  article:  '#FEF0D5',
  blog:     '#C8BFEC',
}

const TYPE_COLORS: Record<HeroItem['content_type'], string> = {
  manual:   '#2F87C3',   // brand blue
  prophecy: '#C32126',   // brand red
  article:  '#B87D0A',   // brand gold, darkened for text contrast
  blog:     '#6E5FAE',   // brand lilac, darkened for text contrast
}

// Placeholder stripe backgrounds — matched to each type's token color family
const TYPE_PLACEHOLDER: Record<HeroItem['content_type'], string> = {
  manual:   'linear-gradient(180deg,rgba(255,255,255,0)0%,rgba(20,17,13,0.18)100%),repeating-linear-gradient(135deg,#b9c9d1 0 16px,#97b3c0 16px 32px)',
  prophecy: 'linear-gradient(180deg,rgba(255,255,255,0)0%,rgba(20,17,13,0.18)100%),repeating-linear-gradient(135deg,#d9b6a3 0 16px,#c69680 16px 32px)',
  article:  'linear-gradient(180deg,rgba(255,255,255,0)0%,rgba(20,17,13,0.20)100%),repeating-linear-gradient(135deg,#f1c97a 0 16px,#d8a94f 16px 32px)',
  blog:     'linear-gradient(180deg,rgba(255,255,255,0)0%,rgba(20,17,13,0.18)100%),repeating-linear-gradient(135deg,#b8a8c8 0 16px,#9a87b0 16px 32px)',
}

export default function LandingHero({ items }: { items: HeroItem[] }) {
  const t       = useTranslations('hero')
  const tNav    = useTranslations('nav')
  const tTypes  = useTranslations('content.types')
  const locale  = useLocale()

  const [activeIdx, setActiveIdx] = useState(0)
  const [showHint, setShowHint]   = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile]   = useState(false)
  const cardCount = items.length

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 56.25rem)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (activeIdx > 0) setShowHint(false)
  }, [activeIdx])

  useEffect(() => {
    if (isHovered || cardCount <= 1) return
    const timer = setTimeout(() => setActiveIdx((i) => (i + 1) % cardCount), 4000)
    return () => clearTimeout(timer)
  }, [activeIdx, isHovered, cardCount])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const swipe = info.offset.x
    if (Math.abs(swipe) < 60) return
    if (swipe < 0) {
      setActiveIdx((i) => (i + 1) % cardCount)
    } else {
      setActiveIdx((i) => (i - 1 + cardCount) % cardCount)
    }
  }

  const activeItem    = items[activeIdx]
  const activeType    = activeItem?.content_type
  const activeTypeIdx = activeType ? TYPE_ORDER.indexOf(activeType) : 0
  const activeColor   = activeType ? TYPE_COLORS[activeType] : 'var(--brand-red)'

  function jumpToType(type: HeroItem['content_type']) {
    const next = items.findIndex((item, j) => item.content_type === type && j !== activeIdx)
    if (next !== -1) { setShowHint(false); setActiveIdx(next) }
  }

  return (
    <section
      className="lr-hero-section"
      style={{
        maxWidth:     'var(--width-site)',
        marginInline: 'auto',
        width:        '100%',
        padding:      '2.5rem var(--page-inline-padding) 3.75rem',
      }}
    >
      <div
        className="lr-hero-grid"
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap:                 '2rem',
          alignItems:          'center',
          minHeight:           '28rem',
        }}
      >
        {/* ── LEFT: headline + view-all CTA ──────────────────────────── */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
              fontSize:      'clamp(3rem, 7vw, 7.5rem)',
              fontWeight:    900,
              lineHeight:    0.92,
              color:         'var(--text-primary)',
              letterSpacing: '-0.018em',
              marginBottom:  '1rem',
              textTransform: 'uppercase',
            }}
          >
            {t('peace.line1')}
            <br />
            <span style={{ color: 'var(--brand-red)' }}>
              {t('peace.line2a')}
              {t('peace.line2b') && (
                <>
                  {' '}
                  <br className="lr-hero-you-break" />
                  {t('peace.line2b')}
                </>
              )}
            </span>
          </motion.h1>

          <motion.p
            className="lr-hero-subline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily:   'var(--font-body), system-ui, sans-serif',
              fontSize:     'clamp(0.9375rem, 1.4vw, 1.125rem)',
              lineHeight:   1.5,
              color:        'var(--text-secondary)',
              maxWidth:     '32rem',
              marginBottom: '1.75rem',
            }}
          >
            {t('peace.subline')}
          </motion.p>

          <motion.div
            className="lr-hero-cta"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '0.5rem' }}
          >
            <Link
              href="/content"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '0.625rem',
                padding:        '0.875rem 1.375rem',
                background:     'var(--brand-red)',
                color:          '#FFFFFF',
                borderRadius:   '999rem',
                fontSize:       '0.875rem',
                fontWeight:     500,
                textDecoration: 'none',
              }}
            >
              {t('viewAllLatest')}
              <span
                style={{
                  width:          '1.5rem',
                  height:         '1.5rem',
                  borderRadius:   '50%',
                  background:     '#14110D',
                  color:          '#FFFFFF',
                  display:        'inline-flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '0.8125rem',
                }}
              >→</span>
            </Link>
          </motion.div>
        </div>

        {/* ── CENTER: fanned card stack ─────────────────────────────── */}
        <div
          className="lr-hero-card-wrap"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position:       'relative',
            height:         '27.5rem',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          {cardCount === 0 ? (
            <EmptyStack message={t('empty')} />
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => {
                const offset = (idx - activeIdx + cardCount) % cardCount
                if (offset > 3) return null
                return (
                  <Card
                    key={item.id}
                    item={item}
                    offset={offset}
                    isActive={offset === 0}
                    compact={isMobile}
                    onDragEnd={offset === 0 ? handleDragEnd : undefined}
                    typeLabel={tTypes(item.content_type)}
                    locale={locale}
                    showHint={offset === 0 && showHint && !isMobile}
                    hintLabel={t('drag')}
                  />
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── RIGHT: type column (desktop only) ─────────────────────── */}
        <div
          className="lr-hero-cats"
          style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'flex-end',
            gap:           '0.125rem',
          }}
        >
          {TYPE_ORDER.map((type, idx) => {
            const isActive = idx === activeTypeIdx
            return (
              <CategoryRow
                key={type}
                label={tNav(typeNavKey(type))}
                isActive={isActive}
                onClick={() => jumpToType(type)}
              />
            )
          })}
        </div>
      </div>

      {/* ── MOBILE BOTTOM: pill tabs + CTA ─────────────────────────── */}
      <div
        className="lr-hero-mobile-bottom"
        style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '2rem' }}
      >
        {/* Progress track */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {items.slice(0, Math.min(items.length, 6)).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`Go to card ${i + 1}`}
              style={{
                width:        i === activeIdx ? '1.25rem' : '0.375rem',
                height:       '0.375rem',
                borderRadius: '999rem',
                background:   i === activeIdx ? activeColor : 'var(--border-strong)',
                border:       'none',
                padding:      0,
                cursor:       'pointer',
                transition:   'width 0.25s, background 0.25s',
              }}
            />
          ))}
        </div>

        {/* Type pill tabs */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {TYPE_ORDER.map((type, idx) => {
            const isActive = idx === activeTypeIdx
            const color    = TYPE_COLORS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => jumpToType(type)}
                style={{
                  padding:       '0.4375rem 0.9375rem',
                  borderRadius:  '999rem',
                  border:        `0.0625rem solid ${isActive ? color + '60' : 'var(--border-subtle)'}`,
                  background:    isActive ? color + '14' : 'var(--bg-raised)',
                  color:         isActive ? color : 'var(--text-tertiary)',
                  fontSize:      '0.75rem',
                  fontWeight:    isActive ? 700 : 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor:        'pointer',
                  fontFamily:    'var(--font-body)',
                  transition:    'background 0.18s, color 0.18s, border-color 0.18s',
                }}
              >
                {tNav(typeNavKey(type))}
              </button>
            )
          })}
        </div>

        {/* Mobile CTA */}
        <Link
          href="/content"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.5rem',
            padding:        '0.8125rem 1.375rem',
            background:     'var(--brand-red)',
            color:          '#FFFFFF',
            borderRadius:   '999rem',
            fontSize:       '0.875rem',
            fontWeight:     500,
            textDecoration: 'none',
          }}
        >
          {t('viewAllLatest')}
          <span
            style={{
              width:          '1.375rem',
              height:         '1.375rem',
              borderRadius:   '50%',
              background:     '#14110D',
              color:          '#FFFFFF',
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '0.75rem',
            }}
          >→</span>
        </Link>
      </div>

      <style>{`
        /* Desktop-only line break before "YOU." */
        .lr-hero-you-break { display: none; }
        @media (min-width: 56.25rem) {
          .lr-hero-you-break { display: block; }
        }
        /* Desktop: hide subline + mobile-only elements */
        @media (min-width: 56.25rem) {
          .lr-hero-subline       { display: none !important; }
          .lr-hero-mobile-bottom { display: none !important; }
        }
        /* Mobile: single-column layout, centered text, hide desktop cats + CTA */
        @media (max-width: 56.25rem) {
          .lr-hero-section { padding-bottom: 1.25rem !important; }
          .lr-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
            min-height: 0 !important;
          }
          .lr-hero-grid > div:first-child   { text-align: center !important; }
          .lr-hero-grid > div:first-child h1 { font-size: clamp(3.25rem, 16vw, 5.5rem) !important; }
          .lr-hero-subline { margin-inline: auto !important; max-width: min(22rem, 88%) !important; }
          .lr-hero-cats    { display: none !important; }
          .lr-hero-cta            { display: none !important; }
          .lr-hero-mobile-bottom  { display: flex !important; }
          .lr-hero-card-wrap {
            overflow: hidden !important;
            height: 27.5rem !important;
            margin-inline: -0.5rem;
          }
          .lr-hero-card {
            width: min(20rem, 84vw) !important;
            height: min(27.5rem, 116vw) !important;
          }
        }
      `}</style>
    </section>
  )
}

function typeNavKey(type: HeroItem['content_type']): 'manuals' | 'prophecies' | 'articles' | 'blog' {
  switch (type) {
    case 'manual':   return 'manuals'
    case 'prophecy': return 'prophecies'
    case 'article':  return 'articles'
    default:         return 'blog'
  }
}

function Card({
  item, offset, isActive, compact, onDragEnd, typeLabel, locale,
  showHint, hintLabel,
}: {
  item:       HeroItem
  offset:     number
  isActive:   boolean
  compact:    boolean
  onDragEnd?: (e: unknown, info: PanInfo) => void
  typeLabel:  string
  locale:     string
  showHint:   boolean
  hintLabel:  string
}) {
  const router     = useRouter()
  const didDrag    = useRef(false)

  const desktopOffsets = [
    { rotate: -2,   x:   0, y:   0, scale: 1    },
    { rotate:  3,   x:  12, y:  -8, scale: 1    },
    { rotate: -6,   x: -32, y:  18, scale: 1    },
    { rotate:  8,   x:  22, y:  28, scale: 1    },
  ]
  const mobileOffsets = [
    { rotate: -2,   x:   0, y:   0, scale: 1    },
    { rotate:  3,   x:   8, y:  -6, scale: 1    },
    { rotate: -5,   x: -20, y:  14, scale: 1    },
    { rotate:  6,   x:  16, y:  22, scale: 1    },
  ]
  const layout = (compact ? mobileOffsets : desktopOffsets)[offset]
  const bg     = TYPE_BG[item.content_type]

  function handleDragStart() { didDrag.current = false }
  function handleDrag()      { didDrag.current = true }
  function handleDragEnd(e: unknown, info: PanInfo) {
    onDragEnd?.(e, info)
    setTimeout(() => { didDrag.current = false }, 50)
  }
  function handleClick() {
    if (didDrag.current) return
    const TYPE_PATHNAME = {
      manual:   '/manuals/[slug]',
      prophecy: '/prophecies/[slug]',
      article:  '/articles/[slug]',
      blog:     '/blogs/[slug]',
    } as const
    router.push({ pathname: TYPE_PATHNAME[item.content_type], params: { slug: item.slug ?? item.id } })
  }

  return (
    <motion.div
      className="lr-hero-card"
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        rotate:  layout.rotate,
        x:       layout.x,
        y:       layout.y,
        scale:   layout.scale,
        zIndex:  20 - offset,
        opacity: 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24, mass: 0.8 }}
      whileHover={{ scale: isActive ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        position:         'absolute',
        width:            '20rem',
        height:           '27.5rem',
        borderRadius:     '1.375rem',
        background:       bg,
        cursor:           isActive ? 'grab' : 'pointer',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        boxShadow:        '0 18px 40px -22px rgba(20,17,13,0.45)',
        overflow:         'visible',
        padding:          '0.875rem',
        boxSizing:        'border-box',
        display:          'flex',
        flexDirection:    'column',
      }}
    >
      {/* Photo area — fills upper portion of card */}
      <div
        style={{
          flex:         1,
          borderRadius: '0.875rem',
          overflow:     'hidden',
          position:     'relative',
          background:   item.cover_image_url && isActive
            ? undefined
            : TYPE_PLACEHOLDER[item.content_type],
        }}
      >
        {isActive && item.cover_image_url && (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="20rem"
            priority={isActive}
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Content below photo — active card only */}
      {isActive && (
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-start',
            justifyContent: 'space-between',
            marginTop:      '0.75rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, paddingInlineEnd: '0.5rem' }}>
            <div
              style={{
                fontSize:      '0.6875rem',
                fontWeight:    600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         'rgba(20,17,13,0.55)',
              }}
            >
              {timeAgo(item.published_at, locale)} · {typeLabel}
            </div>
            <div
              style={{
                fontFamily:      'var(--font-display), "Barlow Condensed", sans-serif',
                fontSize:        '1.375rem',
                fontWeight:      800,
                textTransform:   'none',
                lineHeight:      1.04,
                letterSpacing:   '-0.01em',
                color:           '#14110D',
                marginTop:       '0.5rem',
                display:         '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow:        'hidden',
              }}
            >
              {item.title}
            </div>
          </div>
          <span
            aria-hidden="true"
            style={{
              width:          '2.25rem',
              height:         '2.25rem',
              borderRadius:   '50%',
              background:     '#14110D',
              color:          '#FFFFFF',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
              marginTop:      '0.625rem',
              fontSize:       '0.875rem',
              pointerEvents:  'none',
            }}
          >
            →
          </span>
        </div>
      )}

      {/* Drag hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            style={{
              position:       'absolute',
              bottom:         '3.75rem',
              insetInlineEnd: '-0.5rem',
              background:     'var(--brand-gold)',
              color:          '#14110D',
              fontSize:       '0.6875rem',
              fontWeight:     600,
              padding:        '0.3125rem 0.875rem',
              borderRadius:   '999rem',
              letterSpacing:  '0.04em',
              pointerEvents:  'none',
              zIndex:         50,
              boxShadow:      '0 0.25rem 0.875rem rgba(0,0,0,0.15)',
            }}
          >
            {hintLabel}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptyStack({ message }: { message: string }) {
  return (
    <div
      style={{
        width:          '17.5rem',
        height:         '25rem',
        borderRadius:   '1.375rem',
        background:     'var(--bg-raised)',
        border:         '0.03125rem solid var(--border-subtle)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem',
        textAlign:      'center',
      }}
    >
      <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.875rem' }}>📚</div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  )
}

function CategoryRow({
  label, isActive, onClick,
}: {
  label:    string
  isActive: boolean
  onClick:  () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position:       'relative',
        background:     'transparent',
        border:         'none',
        cursor:         'pointer',
        padding:        '0',
        fontFamily:     'var(--font-display), "Barlow Condensed", sans-serif',
        fontSize:       'clamp(2.5rem, 4.5vw, 4.25rem)',
        fontWeight:     900,
        textTransform:  'uppercase',
        lineHeight:     0.98,
        letterSpacing:  '-0.012em',
        color:          'color-mix(in srgb, var(--text-primary) 32%, transparent)',
        textAlign:      'right',
        textDecoration: 'none',
      }}
    >
      {isActive ? (
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span
            aria-hidden="true"
            style={{
              position:  'absolute',
              inset:     0,
              color:     'var(--brand-red)',
              transform: 'translate(8px, 6px)',
              zIndex:    0,
              opacity:   0.9,
            }}
          >
            {label}
          </span>
          <span style={{ position: 'relative', color: 'var(--text-primary)', zIndex: 1 }}>
            {label}
          </span>
        </span>
      ) : label}
    </button>
  )
}

function timeAgo(dateString: string, locale: string): string {
  const d    = new Date(dateString)
  const diff = (Date.now() - d.getTime()) / 60000
  if (diff < 60)    return `${Math.max(1, Math.floor(diff))} min ago`
  if (diff < 1440)  return `${Math.floor(diff / 60)} hr ago`
  if (diff < 10080) return `${Math.floor(diff / 1440)} d ago`
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' })
}
