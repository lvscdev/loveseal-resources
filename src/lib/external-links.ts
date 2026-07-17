/**
 * External links to the parent LoveSeal Church web presence.
 *
 * Each URL uses a static `process.env.NEXT_PUBLIC_*` literal so Next.js can
 * inline the value at build time for both server and client bundles. Dynamic
 * `process.env[key]` access only works server-side and causes hydration
 * mismatches when the client falls back to the uninlined `undefined`.
 */

export const EXTERNAL_LINKS = {
  loveseal: process.env.NEXT_PUBLIC_LOVESEAL_HOME?.trim()    || '#',
  story:    process.env.NEXT_PUBLIC_LOVESEAL_STORY?.trim()   || '#',
  contact:  process.env.NEXT_PUBLIC_LOVESEAL_CONTACT?.trim() || '#',
  give:     process.env.NEXT_PUBLIC_LOVESEAL_GIVE?.trim()    || '#',
} as const

export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS