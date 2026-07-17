import PageLoader from '@/components/ui/PageLoader'

/**
 * Default loading fallback for any admin dashboard route. The admin shell
 * (sidebar + topbar) is rendered by the dashboard layout, so this only
 * fills the content area — meaning the user sees the chrome immediately
 * and only the inner content shows the spinner.
 */
export default function AdminDashboardLoading() {
  return <PageLoader />
}