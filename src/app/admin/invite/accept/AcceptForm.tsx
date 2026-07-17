'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/lib/toast'

export default function AcceptForm() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [userEmail, setUserEmail]     = useState<string | null>(null)

  // On mount: Supabase auto-detects the magic-link tokens from the URL hash
  // and creates a session. We just wait for that session to be ready.
  useEffect(() => {
    const supabase = createClient()

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email ?? null)
        setSessionReady(true)
      } else {
        // Listen for the auth change after Supabase processes the URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUserEmail(session.user.email ?? null)
            setSessionReady(true)
            subscription.unsubscribe()
          }
        })
        // Give it a moment then surface a fatal error if nothing happens
        setTimeout(() => {
          if (!sessionReady) {
            setLinkInvalid(true)
          }
        }, 2500)
      }
    }
    check()
  }, [sessionReady])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password too short', {
        description: 'Must be at least 8 characters.',
      })
      return
    }
    if (password !== confirmPwd) {
      toast.error('Passwords do not match', {
        description: 'Re-type both to be sure.',
      })
      return
    }

    setLoading(true)
    const toastId = toast.loading('Setting up your account…')
    const supabase = createClient()

    // Set the password
    const { error: updateErr, data: { user } } = await supabase.auth.updateUser({ password })
    if (updateErr || !user) {
      toast.error('Failed to set password', {
        id: toastId,
        description: updateErr?.message ?? 'Please try again or ask for a fresh invite.',
      })
      setLoading(false)
      return
    }

    // Mark the admin_users row as accepted
    await (supabase
      .from('admin_users')
      .update({ accepted_at: new Date().toISOString() } as never)
      .eq('id', user.id))

    toast.success('Welcome to the team', {
      id: toastId,
      description: 'You can now use the admin dashboard.',
    })

    router.push('/admin')
    router.refresh()
  }

  /* ── Pre-render states ─────────────────────────────────────────────── */
  if (!sessionReady && !linkInvalid) {
    return (
      <div style={{
        padding: '1.25rem',
        background: 'var(--bg-raised)',
        border: '0.03125rem solid var(--border-subtle)',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <Spinner size="md" />
        <span>Verifying invite link…</span>
      </div>
    )
  }

  if (linkInvalid) {
    return (
      <div style={{
        padding: '0.875rem 1rem',
        background: 'var(--danger-bg)',
        border: '0.03125rem solid var(--danger-border)',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        color: 'var(--danger-fg)',
        lineHeight: 1.5,
      }}>
        This invite link is invalid or has expired. Ask a super-admin to resend it.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {userEmail && (
        <div style={{
          padding: '0.625rem 0.875rem',
          background: 'var(--bg-elevated)',
          border: '0.03125rem solid var(--border-subtle)',
          borderRadius: '0.4375rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
        }}>
          Setting up account for <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
        </div>
      )}

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Confirm password</label>
        <input
          type="password"
          value={confirmPwd}
          onChange={e => setConfirmPwd(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width:        '100%',
          padding:      '0.6875rem',
          background:   loading ? 'var(--bg-elevated)' : 'var(--brand-gold)',
          color:        loading ? 'var(--text-muted)' : 'var(--text-inverse)',
          border:       'none',
          borderRadius: '0.5rem',
          fontSize:     '0.8125rem',
          fontWeight:   500,
          cursor:       loading ? 'not-allowed' : 'pointer',
          fontFamily:   'var(--font-body)',
          display:      'inline-flex',
          alignItems:   'center',
          justifyContent: 'center',
          minHeight:    '2.625rem',
        }}
      >
        {loading ? <ButtonSpinner label="Setting up…" inverse /> : 'Activate account'}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-tertiary)',
  marginBottom: '0.375rem',
  letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'var(--bg-input)',
  border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.4375rem',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}