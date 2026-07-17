'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { inviteAdmin, removeAdmin, changeAdminRole, resendInvite } from './actions'
import type { AdminRole } from '@/types'
import type { AdminListItem } from './page'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/lib/toast'

interface Props {
  admins:          AdminListItem[]
  currentAdminId:  string
  canManage:       boolean
}

export default function AdminsList({ admins, currentAdminId, canManage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [showInvite, setShowInvite] = useState(false)
  const [busy, setBusy]             = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<AdminListItem | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName]   = useState('')
  const [inviteRole, setInviteRole]   = useState<AdminRole>('admin')

  function handleInvite() {
    const toastId = toast.loading('Sending invite…')
    startTransition(async () => {
      const result = await inviteAdmin(inviteEmail, inviteRole, inviteName)
      if (!result.ok) {
        toast.error('Invite failed', {
          id: toastId,
          description: result.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Invite sent', {
        id: toastId,
        description: `They have 48 hours to accept at ${inviteEmail}.`,
      })
      setShowInvite(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('admin')
      router.refresh()
    })
  }

  function confirmRemove() {
    if (!removeTarget) return
    const admin = removeTarget
    setBusy(admin.id)
    setRemoveTarget(null)
    const toastId = toast.loading(`Removing ${admin.email}…`)
    startTransition(async () => {
      const result = await removeAdmin(admin.id)
      setBusy(null)
      if (!result.ok) {
        toast.error('Remove failed', {
          id: toastId,
          description: result.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Admin removed', {
        id: toastId,
        description: `${admin.email} no longer has access.`,
      })
      router.refresh()
    })
  }

  function handleRoleChange(admin: AdminListItem, newRole: AdminRole) {
    setBusy(admin.id)
    const toastId = toast.loading('Updating role…')
    startTransition(async () => {
      const result = await changeAdminRole(admin.id, newRole)
      setBusy(null)
      if (!result.ok) {
        toast.error('Role change failed', {
          id: toastId,
          description: result.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Role updated', {
        id: toastId,
        description: `${admin.email} is now ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'}.`,
      })
      router.refresh()
    })
  }

  function handleResend(admin: AdminListItem) {
    setBusy(admin.id)
    const toastId = toast.loading(`Resending invite to ${admin.email}…`)
    startTransition(async () => {
      const result = await resendInvite(admin.id)
      setBusy(null)
      if (!result.ok) {
        toast.error('Resend failed', {
          id: toastId,
          description: result.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Invite re-sent', {
        id: toastId,
        description: `Fresh 48-hour link sent to ${admin.email}.`,
      })
    })
  }

  function formatDate(s: string | null) {
    if (!s) return '—'
    const d = new Date(s)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7)   return `${diffDays}d ago`
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  return (
    <>
      {/* Action bar */}
      {canManage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            style={primaryBtn}
          >
            + Invite admin
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--bg-raised)',
        border: '0.03125rem solid var(--border-subtle)',
        borderRadius: '0.625rem',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-table-head)', borderBottom: '0.03125rem solid var(--border-subtle)' }}>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Invited by</th>
              <th style={thStyle}>Joined</th>
              {canManage && <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => {
              const isMe         = admin.id === currentAdminId
              const isBusy       = busy === admin.id
              const isInvitePending = !admin.accepted_at
              return (
                <tr key={admin.id} style={{
                  borderBottom: '0.03125rem solid var(--border-subtle)',
                  opacity: isBusy ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #F5AE41 0%, #C32126 100%)',
                        color: '#212529',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {(admin.display_name ?? admin.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {admin.display_name ?? admin.email.split('@')[0]}
                          {isMe && (
                            <span style={{
                              fontSize: '0.625rem',
                              color: 'var(--brand-gold)',
                              marginLeft: '0.375rem',
                              fontWeight: 400,
                            }}>(you)</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.0625rem' }}>
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {canManage && !isMe ? (
                      <select
                        value={admin.role}
                        onChange={e => handleRoleChange(admin, e.target.value as AdminRole)}
                        disabled={isBusy || isInvitePending}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'var(--bg-input)',
                          border: '0.03125rem solid var(--border-strong)',
                          borderRadius: '0.3125rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-body)',
                          outline: 'none',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <RoleBadge role={admin.role} />
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isInvitePending ? (
                      <span style={pendingPill}>Pending</span>
                    ) : (
                      <span style={activePill}>Active</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                    {admin.invited_by_email ?? '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-tertiary)', fontSize: '0.6875rem' }}>
                    {formatDate(admin.accepted_at ?? admin.created_at)}
                  </td>
                  {canManage && (
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        {isInvitePending && !isMe && (
                          <button
                            type="button"
                            onClick={() => handleResend(admin)}
                            disabled={isBusy}
                            style={textBtn}
                            title="Resend invite"
                          >
                            Resend
                          </button>
                        )}
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(admin)}
                            disabled={isBusy}
                            style={{ ...iconBtn, color: 'var(--danger-fg)' }}
                            title="Remove"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          onClick={() => !isPending && setShowInvite(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-raised)',
              border: '0.03125rem solid var(--border-strong)',
              borderRadius: '0.75rem',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '27.5rem',
              boxShadow: '0 1.25rem 3.75rem rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: '1.375rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              marginBottom: '1.25rem',
            }}>
              Invite admin
            </h2>

            <div style={{ marginBottom: '0.875rem' }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="newadmin@example.com"
                autoFocus
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '0.875rem' }}>
              <label style={labelStyle}>Display name (optional)</label>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="Pastor John"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Role</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['admin', 'super_admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: inviteRole === r ? 'var(--brand-gold)' : 'transparent',
                      color: inviteRole === r ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                      border: `0.03125rem solid ${inviteRole === r ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {r === 'admin' ? 'Admin' : 'Super Admin'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                {inviteRole === 'super_admin'
                  ? 'Can invite/remove admins and manage all content.'
                  : 'Can manage all content but not other admins.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={isPending}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={isPending || !inviteEmail.trim()}
                style={{
                  ...primaryBtn,
                  opacity: isPending || !inviteEmail.trim() ? 0.5 : 1,
                  cursor: isPending || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '2.125rem',
                  minWidth: '7rem',
                }}
              >
                {isPending ? <ButtonSpinner label="Sending…" inverse /> : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!removeTarget}
        title="Remove admin"
        message={`Remove ${removeTarget?.email}? They will lose all access immediately.`}
        confirmLabel="Remove"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  )
}

function RoleBadge({ role }: { role: AdminRole }) {
  const isSuper = role === 'super_admin'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3125rem',
      padding: '0.1875rem 0.5625rem',
      borderRadius: '1.25rem',
      fontSize: '0.625rem',
      fontWeight: 500,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: isSuper ? 'rgba(245,174,65,0.15)' : 'var(--bg-elevated)',
      color: isSuper ? 'var(--brand-gold)' : 'var(--text-secondary)',
    }}>
      {isSuper && <span>★</span>}
      {isSuper ? 'Super Admin' : 'Admin'}
    </span>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'var(--brand-gold)',
  color: 'var(--text-inverse)',
  border: 'none',
  borderRadius: '0.4375rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'transparent',
  border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.4375rem',
  color: 'var(--text-tertiary)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const textBtn: React.CSSProperties = {
  padding: '0.25rem 0.5625rem',
  background: 'transparent',
  border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.3125rem',
  color: 'var(--text-secondary)',
  fontSize: '0.6875rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: '1.5rem',
  background: 'transparent',
  border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.3125rem',
  color: 'var(--text-tertiary)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
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
  padding: '0.5625rem 0.75rem',
  background: 'var(--bg-input)',
  border: '0.03125rem solid var(--border-strong)',
  borderRadius: '0.4375rem',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '0.625rem 0.875rem', textAlign: 'left',
  fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 0.875rem', color: 'var(--text-primary)', verticalAlign: 'middle',
}

const pendingPill: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.1875rem 0.5625rem',
  borderRadius: '1.25rem',
  fontSize: '0.625rem',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'rgba(245,174,65,0.15)',
  color: 'var(--brand-gold)',
}

const activePill: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.1875rem 0.5625rem',
  borderRadius: '1.25rem',
  fontSize: '0.625rem',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'rgba(76,175,80,0.12)',
  color: 'var(--success-fg)',
}