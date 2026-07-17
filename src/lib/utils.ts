import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ContentType, Locale } from '@/types'
import { getBaseUrl } from '@/lib/locale-urls'

/* ── Tailwind class merger ── */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── Content type helpers ── */

export const CONTENT_TYPES: Record<ContentType, { label: string; color: string }> = {
  manual:   { label: 'Manual',   color: 'var(--color-manual)'   },
  prophecy: { label: 'Prophecy', color: 'var(--color-prophecy)' },
  article:  { label: 'Article',  color: 'var(--color-article)'  },
  blog:     { label: 'Blog',     color: 'var(--color-blog)'     },
}

export const CONTENT_TYPE_ORDER: ContentType[] = ['manual', 'prophecy', 'article', 'blog']

export function getContentTypeLabel(type: ContentType): string {
  return CONTENT_TYPES[type]?.label ?? type
}

export function getContentTypeColor(type: ContentType): string {
  return CONTENT_TYPES[type]?.color ?? 'var(--color-dark)'
}

/* ── Locale helpers ── */

export const SUPPORTED_LOCALES: Record<Locale, { label: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',    flag: '🇬🇧', dir: 'ltr' },
  es: { label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  fr: { label: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  pt: { label: 'Português',  flag: '🇧🇷', dir: 'ltr' },
  ar: { label: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
}

export function isRTL(locale: Locale): boolean {
  return SUPPORTED_LOCALES[locale]?.dir === 'rtl'
}

/* ── Date formatting ── */

export function formatDate(dateString: string, locale: Locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

/* ── String helpers ── */

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trim() + '…'
}

/* ── URL helpers ── */

export function getContentUrl(id: string, type: ContentType, locale: Locale = 'en'): string {
  return `/${locale}/content/${type}/${id}`
}

export function getAbsoluteUrl(path: string): string {
  return `${getBaseUrl()}${path}`
}
