'use server'
import { createClient } from '@/lib/supabase/server'

export interface DiscoverItem {
  id:              string
  slug:            string | null
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  cover_image_url: string | null
  summary_points:  string[] | null
  theme:           string | null
}

export async function fetchDiscoverItems(): Promise<DiscoverItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select('id, slug, title, content_type, cover_image_url, summary_points, theme')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(7)
  return (data ?? []) as DiscoverItem[]
}
