'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import { logAudit } from '@/lib/audit'

interface ActionResult {
  ok:    boolean
  error?: string
}

/* ── CREATE ─────────────────────────────────────────────────────────────── */
export async function createEditorialTag(tag: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const trimmed = tag.trim()
  if (!trimmed) return { ok: false, error: 'Tag is required' }
  if (trimmed.length > 60) return { ok: false, error: 'Tag is too long (max 60 chars)' }

  const supabase = await createClient()

  /* Determine next position — max + 1 so new tags append to the bottom. */
  const { data: maxRow } = await supabase
    .from('editorial_tags')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = ((maxRow as { position: number } | null)?.position ?? -1) + 1

  const { data: inserted, error } = await (supabase
    .from('editorial_tags')
    .insert({
      tag:       trimmed,
      position:  nextPosition,
      is_active: true,
    } as never)
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null }

  if (error || !inserted) {
    if (error?.message?.toLowerCase().includes('duplicate')) {
      return { ok: false, error: 'A tag with this name already exists' }
    }
    return { ok: false, error: error?.message ?? 'Create failed' }
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'editorial_tag.created',
    resourceType:  'editorial_tag',
    resourceId:    inserted.id,
    resourceLabel: trimmed,
    metadata:      { position: nextPosition },
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ── UPDATE (text, active, position) ────────────────────────────────────── */
export async function updateEditorialTag(
  id: string,
  patch: { tag?: string; is_active?: boolean; position?: number },
): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {}
  if (patch.tag !== undefined) {
    const t = patch.tag.trim()
    if (!t) return { ok: false, error: 'Tag is required' }
    if (t.length > 60) return { ok: false, error: 'Tag is too long (max 60 chars)' }
    updatePayload.tag = t
  }
  if (patch.is_active !== undefined) updatePayload.is_active = patch.is_active
  if (patch.position !== undefined)  updatePayload.position  = patch.position

  if (Object.keys(updatePayload).length === 0) return { ok: true }

  const { error } = await (supabase
    .from('editorial_tags')
    .update(updatePayload as never)
    .eq('id', id)) as { error: { message: string } | null }

  if (error) {
    if (error.message?.toLowerCase().includes('duplicate')) {
      return { ok: false, error: 'A tag with this name already exists' }
    }
    return { ok: false, error: error.message }
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'editorial_tag.updated',
    resourceType:  'editorial_tag',
    resourceId:    id,
    resourceLabel: updatePayload.tag as string | undefined ?? null,
    metadata:      updatePayload,
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ── DELETE ─────────────────────────────────────────────────────────────── */
export async function deleteEditorialTag(id: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()

  /* Fetch label for the audit trail BEFORE deletion. */
  const { data: row } = await supabase
    .from('editorial_tags')
    .select('tag')
    .eq('id', id)
    .maybeSingle()

  const label = (row as { tag: string } | null)?.tag ?? null

  const { error } = await supabase
    .from('editorial_tags')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'editorial_tag.deleted',
    resourceType:  'editorial_tag',
    resourceId:    id,
    resourceLabel: label,
    metadata:      null,
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ── REORDER ────────────────────────────────────────────────────────────────
   Takes an ordered list of ids and rewrites positions to match. Used by the
   drag-and-drop reorder UI. Position values are 0, 1, 2, ... in array order.
   Single call per drag-end. */
export async function reorderEditorialTags(orderedIds: string[]): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()

  /* Issue updates in parallel — Supabase queues these. For typical lists
     (<20 items) this is fast enough; if the list ever grows larger we can
     swap to a single bulk RPC. */
  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      (supabase
        .from('editorial_tags')
        .update({ position: idx } as never)
        .eq('id', id)) as unknown as Promise<{ error: { message: string } | null }>,
    ),
  )

  const firstError = results.find(r => r.error)
  if (firstError?.error) return { ok: false, error: firstError.error.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}