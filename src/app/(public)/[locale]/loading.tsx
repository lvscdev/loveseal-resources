import PageLoader from '@/components/ui/PageLoader'

/**
 * Default loading fallback for any route under `[locale]` that doesn't
 * declare its own. Covers the home page (`/`) and `/content` index, plus
 * any future pages that don't ship a bespoke loading.tsx.
 */
export default function PublicLoading() {
  return <PageLoader />
}