import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditAction } from '@/types'

interface LogParams {
  actorId:        string | null
  actorEmail:     string
  action:         AuditAction
  resourceType:   'content' | 'category' | 'admin' | 'attachment' | 'author' | 'editorial_tag'
  resourceId?:    string | null
  resourceLabel?: string | null
  metadata?:      Record<string, unknown> | null
}

/**
 * Append a row to the audit_log. Uses service role to bypass RLS.
 * Errors are swallowed because audit failures should never block the actual action.
 */
export async function logAudit(p: LogParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    await (supabase.from('audit_log').insert({
      actor_id:       p.actorId,
      actor_email:    p.actorEmail,
      action:         p.action,
      resource_type:  p.resourceType,
      resource_id:    p.resourceId   ?? null,
      resource_label: p.resourceLabel ?? null,
      metadata:       (p.metadata as never) ?? null,
    } as never))
  } catch (err) {
    console.error('[audit] failed to log:', err)
  }
}