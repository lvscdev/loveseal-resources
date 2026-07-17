'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAdmin } from '@/lib/admin-user'
import { logAudit } from '@/lib/audit'
import { getBaseUrl } from '@/lib/locale-urls'
import type { AdminRole } from '@/types'

interface ActionResult {
  ok:    boolean
  error?: string
}

/**
 * Invite a new admin via Supabase auth. The user receives a magic-link email.
 * Creates the admin_users row with invited_at set, accepted_at null.
 * Only super_admins can call this.
 */
export async function inviteAdmin(
  email: string,
  role: AdminRole = 'admin',
  displayName?: string,
): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }
  if (me.role !== 'super_admin') return { ok: false, error: 'Only super-admins can invite' }

  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return { ok: false, error: 'Invalid email address' }
  }

  const supabase = createAdminClient()

  // 1. Send Supabase invite email — creates the auth user
  const redirectTo = `${getBaseUrl()}/admin/invite/accept`
  const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    cleanEmail,
    { redirectTo }
  )

  if (inviteErr || !invited.user) {
    if (inviteErr?.message.includes('already been registered')) {
      return { ok: false, error: 'A user with this email already exists' }
    }
    return { ok: false, error: inviteErr?.message ?? 'Invite failed' }
  }

  // 2. Insert the admin_users row
  const { error: insertErr } = await (supabase.from('admin_users').insert({
    id:           invited.user.id,
    email:        cleanEmail,
    display_name: displayName?.trim() || null,
    role,
    invited_by:   me.id,
    invited_at:   new Date().toISOString(),
    accepted_at:  null,
  } as never))

  if (insertErr) {
    // Roll back the auth user if the admin_users row failed
    await supabase.auth.admin.deleteUser(invited.user.id)
    return { ok: false, error: `Failed to create admin record: ${insertErr.message}` }
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'admin.invited',
    resourceType:  'admin',
    resourceId:    invited.user.id,
    resourceLabel: cleanEmail,
    metadata:      { role, invited_by: me.email },
  })

  revalidatePath('/admin/admins')
  return { ok: true }
}

/**
 * Remove an admin user. Deletes both the admin_users row and the auth user.
 * Only super_admins can call this. Cannot remove yourself.
 */
export async function removeAdmin(adminId: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }
  if (me.role !== 'super_admin') return { ok: false, error: 'Only super-admins can remove admins' }
  if (me.id === adminId) return { ok: false, error: 'You cannot remove yourself' }

  const supabase = createAdminClient()

  // Get the email + role first for the audit log
  const { data: target } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('id', adminId)
    .single()

  const targetTyped = target as { email: string; role: AdminRole } | null
  if (!targetTyped) return { ok: false, error: 'Admin not found' }

  // Don't allow removing the last super_admin
  if (targetTyped.role === 'super_admin') {
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'super_admin')

    if ((count ?? 0) <= 1) {
      return { ok: false, error: 'Cannot remove the last super-admin' }
    }
  }

  // Delete the admin_users row first (cascade-deletes audit log entries via FK)
  const { error: deleteErr } = await supabase.from('admin_users').delete().eq('id', adminId)
  if (deleteErr) return { ok: false, error: deleteErr.message }

  // Delete the auth user
  await supabase.auth.admin.deleteUser(adminId)

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'admin.removed',
    resourceType:  'admin',
    resourceId:    adminId,
    resourceLabel: targetTyped.email,
  })

  revalidatePath('/admin/admins')
  return { ok: true }
}

/**
 * Change an admin's role between admin and super_admin.
 * Only super_admins can call this. Cannot demote yourself if you're the last super_admin.
 */
export async function changeAdminRole(
  adminId: string,
  newRole: AdminRole,
): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }
  if (me.role !== 'super_admin') return { ok: false, error: 'Only super-admins can change roles' }

  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('id', adminId)
    .single()

  const targetTyped = target as { email: string; role: AdminRole } | null
  if (!targetTyped) return { ok: false, error: 'Admin not found' }
  if (targetTyped.role === newRole) return { ok: true }  // no-op

  // If demoting a super_admin, make sure they're not the last one
  if (targetTyped.role === 'super_admin' && newRole === 'admin') {
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'super_admin')
    if ((count ?? 0) <= 1) {
      return { ok: false, error: 'Cannot demote the last super-admin' }
    }
  }

  const { error: updateErr } = await (supabase
    .from('admin_users')
    .update({ role: newRole } as never)
    .eq('id', adminId))

  if (updateErr) return { ok: false, error: updateErr.message }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'admin.role_changed',
    resourceType:  'admin',
    resourceId:    adminId,
    resourceLabel: targetTyped.email,
    metadata:      { from: targetTyped.role, to: newRole },
  })

  revalidatePath('/admin/admins')
  return { ok: true }
}

/**
 * Re-send the invite email for a pending (un-accepted) admin.
 */
export async function resendInvite(adminId: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }
  if (me.role !== 'super_admin') return { ok: false, error: 'Only super-admins can resend invites' }

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('admin_users')
    .select('email, accepted_at')
    .eq('id', adminId)
    .single()

  const t = target as { email: string; accepted_at: string | null } | null
  if (!t) return { ok: false, error: 'Admin not found' }
  if (t.accepted_at) return { ok: false, error: 'Admin has already accepted' }

  const redirectTo = `${getBaseUrl()}/admin/invite/accept`
  const { error } = await supabase.auth.admin.inviteUserByEmail(t.email, { redirectTo })
  if (error) return { ok: false, error: error.message }

  await (supabase
    .from('admin_users')
    .update({ invited_at: new Date().toISOString() } as never)
    .eq('id', adminId))

  return { ok: true }
}
