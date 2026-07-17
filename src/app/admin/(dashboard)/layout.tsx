import { getCurrentAdmin } from '@/lib/admin-user'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = await getCurrentAdmin()
  const isSuperAdmin = me?.role === 'super_admin'

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
    }}>
      <AdminSidebar isSuperAdmin={isSuperAdmin} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        <AdminTopbar userEmail={me?.email ?? ''} />

        <main className="admin-main-pad" style={{
          flex: 1,
          padding: '32px 32px 64px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
