/**
 * Social link configuration for the public footer.
 *
 * Each URL uses a static `process.env.NEXT_PUBLIC_*` literal so Next.js can
 * inline the value at build time for both server and client bundles. Dynamic
 * `process.env[key]` access only works server-side and causes hydration
 * mismatches when the client falls back to the uninlined `undefined`.
 */

export type SocialIconName = 'youtube' | 'tiktok' | 'x' | 'instagram'

export interface SocialLink {
  name:       string
  url:        string
  background?: string
  gradient?:  string
  icon:       SocialIconName
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    name:       'YouTube',
    url:        process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() || '#',
    background: '#FF0000',
    icon:       'youtube',
  },
  {
    name:       'TikTok',
    url:        process.env.NEXT_PUBLIC_SOCIAL_TIKTOK?.trim() || '#',
    background: '#000000',
    icon:       'tiktok',
  },
  {
    name:  'X',
    url:   process.env.NEXT_PUBLIC_SOCIAL_X?.trim() || '#',
    background: '#0F1419',
    icon:  'x',
  },
  {
    name:     'Instagram',
    url:      process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || '#',
    gradient: 'radial-gradient(circle at 30% 110%, #FFD75E 0%, #F95B3D 35%, #D6249F 65%, #4F5BD5 100%)',
    icon:     'instagram',
  },
] as const
