import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/locale-urls'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/admin/login', getBaseUrl()))
}
