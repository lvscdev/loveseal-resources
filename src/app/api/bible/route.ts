import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.scripture.api.bible/v1/bibles'

const VERSE_PARAMS = new URLSearchParams({
  'content-type':            'text',
  'include-notes':           'false',
  'include-titles':          'false',
  'include-chapter-numbers': 'false',
  'include-verse-numbers':   'false',
  'include-verse-spans':     'false',
}).toString()

export async function GET(req: NextRequest) {
  const apiKey = process.env.BIBLE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Bible API not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const bibleId   = searchParams.get('bible')
  const passageId = searchParams.get('passage')

  if (!bibleId || !passageId) {
    return NextResponse.json({ error: 'Missing bible or passage param' }, { status: 400 })
  }

  // Use /passages/ for all refs (handles single verse + ranges equally)
  const url = `${BASE}/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(passageId)}?${VERSE_PARAMS}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'api-key': apiKey },
      // Next.js ISR cache — Bible text is immutable, 24-hr is conservative
      next: { revalidate: 86400 },
    })
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }

  if (!res.ok) {
    // 404 = passage not found for this version, 401 = bad key / no license
    return NextResponse.json(
      { error: res.status === 404 ? 'verse_not_found' : 'api_error' },
      { status: res.status },
    )
  }

  const json   = await res.json()
  const text   = (json.data?.content as string | undefined)?.trim() ?? ''
  const reference = (json.data?.reference as string | undefined) ?? ''

  return NextResponse.json(
    { text, reference },
    { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
  )
}
