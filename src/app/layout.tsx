import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Barlow_Condensed, Urbanist } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { themeScript } from '@/lib/theme-script'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import Toaster from '@/components/ui/Toaster'
import RouteProgressBar from '@/components/ui/RouteProgressBar'
import { GoogleAnalytics } from '@next/third-parties/google'
import { getBaseUrl } from '@/lib/locale-urls'
import '@/styles/globals.css'

/* Barlow Condensed is the display font: hero headline, all H1s, all H2s, all
   ContentCard titles, all section eyebrows. It IS the LCP-eligible text on
   most pages, so preloading it is a real LCP win. The body font (Urbanist) is
   used for everything else and isn't on the LCP path — leave it unpreloaded. */
const barlowCondensed = Barlow_Condensed({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
  preload: true,
})

const urbanist = Urbanist({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title:        { default: 'Lively Resources', template: '%s | Lively Resources' },
  description:  'Manuals, Prophecies, Articles, and Blog from LoveSeal Church — Lively Resources for the Body of Christ.',
  manifest:     '/manifest.webmanifest',
  applicationName: 'Lively Resources',
  appleWebApp: {
    capable:       true,
    statusBarStyle: 'black-translucent',
    title:         'Lively Resources',
  },
  icons: {
    icon:  [
      { url: '/icons/LVSC_fav_icon_color.png', type: 'image/png' },
      { url: '/icons/icon.svg',  type: 'image/svg+xml' },
      { url: '/icons/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/icons/LVSC_fav_icon_color.png', sizes: '180x180' }],
  },
  openGraph: {
    type:        'website',
    url:         getBaseUrl(),
    siteName:    'Lively Resources',
    title:       'Lively Resources',
    description: 'Manuals, Prophecies, Articles, and Blog from LoveSeal Church — Lively Resources for the Body of Christ.',
  },
  twitter: {
    card:  'summary_large_image',
    title: 'Lively Resources',
    description: 'Manuals, Prophecies, Articles, and Blog from LoveSeal Church — Lively Resources for the Body of Christ.',
  },
  formatDetection: {
    /* Stop iOS Safari auto-linking phone numbers in article text. */
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor:    [
    { media: '(prefers-color-scheme: light)', color: '#F8F9FA' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f1012' },
  ],
  width:         'device-width',
  initialScale:  1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale   = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${barlowCondensed.variable} ${urbanist.variable}`}
      style={{ fontFamily: 'var(--font-urbanist), Urbanist, sans-serif' }}
      suppressHydrationWarning
    >
      <head>
        {/* Apply theme before hydration to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>

        {/* Global UI primitives — mounted once at the root so they're
            available on every page (public + admin). Toaster surfaces
            toasts triggered from anywhere via the `toast.*` API in
            `lib/toast.ts`. RouteProgressBar intercepts link clicks and
            renders a thin red progress bar at the top during route
            transitions. Both must mount client-side. */}
        <Toaster />
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>

        {/* Registers /sw.js in production only. Renders nothing. */}
        <ServiceWorkerRegister />

        {/* GA4 — loads after hydration, skipped when env var is absent */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}