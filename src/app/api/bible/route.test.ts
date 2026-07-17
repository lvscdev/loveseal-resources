import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'

function makeRequest(url: string) {
  return new NextRequest(new Request(url))
}

describe('GET /api/bible', () => {
  const ORIGINAL_ENV = process.env.BIBLE_API_KEY

  beforeEach(() => {
    process.env.BIBLE_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env.BIBLE_API_KEY = ORIGINAL_ENV
    vi.unstubAllGlobals()
  })

  it('returns 503 when the Bible API key is not configured', async () => {
    delete process.env.BIBLE_API_KEY

    const res = await GET(makeRequest('http://localhost/api/bible?bible=abc&passage=JHN.3.16'))

    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'Bible API not configured' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 400 when bible or passage params are missing', async () => {
    const res = await GET(makeRequest('http://localhost/api/bible?bible=abc'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Missing bible or passage param' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 502 when the upstream fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    const res = await GET(makeRequest('http://localhost/api/bible?bible=abc&passage=JHN.3.16'))

    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'Upstream fetch failed' })
  })

  it('maps a 404 upstream response to verse_not_found', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 404 }) as unknown as Response,
    )

    const res = await GET(makeRequest('http://localhost/api/bible?bible=abc&passage=JHN.3.16'))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'verse_not_found' })
  })

  it('maps a non-404 error upstream response to api_error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 401 }) as unknown as Response,
    )

    const res = await GET(makeRequest('http://localhost/api/bible?bible=abc&passage=JHN.3.16'))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'api_error' })
  })

  it('returns the passage text and reference with a cache header on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ data: { content: '  For God so loved the world...  ', reference: 'John 3:16' } }),
        { status: 200 },
      ) as unknown as Response,
    )

    const res = await GET(makeRequest('http://localhost/api/bible?bible=abc&passage=JHN.3.16'))

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400, s-maxage=86400')
    expect(await res.json()).toEqual({
      text:      'For God so loved the world...',
      reference: 'John 3:16',
    })

    const requestedUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(requestedUrl).toContain('/abc/passages/JHN.3.16')
  })
})
