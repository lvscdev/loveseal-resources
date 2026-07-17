'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div style={{
      /* Narrow centered block — uses --width-narrow (640px). */
      maxWidth:  'var(--width-narrow)',
      margin:    '0 auto',
      padding:   '5rem var(--page-inline-padding)',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--brand-gold)',
        marginBottom: '12px',
      }}>
        {t('label')}
      </p>
      <h1 style={{
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontSize: 'clamp(36px, 6vw, 56px)',
        fontWeight: 900,
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
        lineHeight: 1.0,
        marginBottom: '16px',
      }}>
        {t('title')}
      </h1>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-tertiary)',
        marginBottom: '32px',
        lineHeight: 1.6,
      }}>
        {t('body')}
      </p>
      <Link href="/content" style={{
        display: 'inline-block',
        padding: '11px 22px',
        background: 'var(--brand-gold)',
        color: 'var(--text-inverse)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        textDecoration: 'none',
      }}>
        {t('browse')}
      </Link>
    </div>
  )
}