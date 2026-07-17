import { createClient } from '@/lib/supabase/server'
import EditorialTagsManager from './EditorialTagsManager'

export const metadata = { title: 'In-focus tags' }

export interface EditorialTagRow {
  id:        string
  tag:       string
  position:  number
  is_active: boolean
}

/**
 * Admin page for the home-page "In focus this week" tag strip.
 *
 * The strip uses these tags as the primary source. When the table is empty,
 * the strip falls back to top recent search terms, then to content.tags[]
 * aggregation. Editorial control here lets the team pin a curated set of
 * tags regardless of what readers have been searching for — the "what we
 * want to surface" lever.
 */
export default async function EditorialTagsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('editorial_tags')
    .select('id, tag, position, is_active')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  const tags = (data ?? []) as EditorialTagRow[]

  return <EditorialTagsManager initialTags={tags} />
}