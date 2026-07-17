import Image from 'next/image'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 0%, rgba(195,33,38,0.18) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(245,174,65,0.08) 0%, transparent 50%), var(--bg-base)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.35,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Card */}
        <div style={{
          background: 'rgba(26,27,30,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Image
              src="/icons/LVSC_logo_dark.png"
              alt="LoveSeal Church"
              width={280}
              height={93}
              priority
              style={{ width: '180px', height: 'auto' }}
            />
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}>
              Admin portal
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
            }}>
              Sign in to manage Lively Resources
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.03em',
        }}>
          Lively Resources · LoveSeal Church
        </p>
      </div>
    </main>
  )
}
