import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import { fetchAnalytics, type DateRange } from '@/lib/analytics-ga'

export const dynamic = 'force-dynamic'

const VALID_RANGES: DateRange[] = ['7d', '28d', '90d']

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = (req.nextUrl.searchParams.get('range') ?? '28d') as DateRange
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
  }

  try {
    const data = await fetchAnalytics(range)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  } catch (err) {
    console.error('[analytics-api]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
