'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import { toast } from '@/lib/toast'

type View = 'login' | 'reset' | 'reset-sent'

export default function LoginForm() {
  const router = useRouter()
  const [view, setView]         = useState<View>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Sign-in failed', { description: 'Email or password is incorrect.' })
      setLoading(false)
      return
    }

    toast.success('Signed in')
    router.push('/admin')
    router.refresh()
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !email.trim()) return
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/admin/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

    setLoading(false)
    if (error) {
      toast.error('Reset failed', { description: error.message })
      return
    }
    setView('reset-sent')
  }

  if (view === 'reset-sent') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(245,174,65,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--brand-gold)',
        }}>
          <MailIcon />
        </div>
        <p style={{ color: '#F8F9FA', fontWeight: 600, marginBottom: '8px', fontSize: '15px' }}>
          Check your inbox
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px' }}>
          A password reset link was sent to <span style={{ color: '#c0c0c0' }}>{email}</span>.
        </p>
        <button type="button" onClick={() => { setView('login'); setEmail('') }} style={backBtnStyle}>
          ← Back to sign in
        </button>
      </div>
    )
  }

  if (view === 'reset') {
    return (
      <form onSubmit={handleReset}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, marginBottom: '4px' }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <div>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              className="login-input"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,174,65,0.12)' }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              ...submitBtnStyle,
              background: loading || !email.trim() ? 'rgba(245,174,65,0.3)' : 'linear-gradient(135deg, #F5AE41 0%, #e09a2e 100%)',
              color: loading || !email.trim() ? 'rgba(255,255,255,0.4)' : '#1a0f00',
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              boxShadow: loading || !email.trim() ? 'none' : '0 4px 16px rgba(245,174,65,0.3)',
            }}
          >
            {loading ? <ButtonSpinner label="Sending…" inverse /> : 'Send reset link'}
          </button>
          <button type="button" onClick={() => setView('login')} style={backBtnStyle}>
            ← Back to sign in
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSignIn}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div>
          <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="login-input"
            style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,174,65,0.12)' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={labelStyle}>Password</label>
            <button
              type="button"
              onClick={() => setView('reset')}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'var(--brand-gold)', fontSize: '11px',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              Forgot password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="login-input"
              style={{ ...inputStyle, paddingRight: '2.75rem' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,174,65,0.12)' }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...submitBtnStyle,
            marginTop: '4px',
            background: loading ? 'rgba(245,174,65,0.3)' : 'linear-gradient(135deg, #F5AE41 0%, #e09a2e 100%)',
            color: loading ? 'rgba(255,255,255,0.4)' : '#1a0f00',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(245,174,65,0.3)',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {loading ? <ButtonSpinner label="Signing in…" inverse /> : 'Sign in'}
        </button>

      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#c0c0c0',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.08)',
  border: '0.5px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  color: '#F8F9FA',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '46px',
  letterSpacing: '0.02em',
  transition: 'opacity 0.15s',
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  textAlign: 'center' as const,
  width: '100%',
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
