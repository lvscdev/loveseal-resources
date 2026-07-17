import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { getCurrentAdmin, fetchAnalytics } = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  fetchAnalytics:  vi.fn(),
}))

vi.mock('@/lib/admin-user', () => ({ getCurrentAdmin }))
vi.mock('@/lib/analytics-ga', () => ({ fetchAnalytics }))

import { GET } from './route'

function makeRequest(url: string) {
  return new NextRequest(new Request(url))
}

describe('GET /api/admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    getCurrentAdmin.mockResolvedValue(null)

    const res = await GET(makeRequest('http://localhost/api/admin/analytics'))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(fetchAnalytics).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid range', async () => {
    getCurrentAdmin.mockResolvedValue({ id: '1', role: 'admin' })

    const res = await GET(makeRequest('http://localhost/api/admin/analytics?range=bogus'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid range' })
    expect(fetchAnalytics).not.toHaveBeenCalled()
  })

  it('defaults to a 28d range when none is provided', async () => {
    getCurrentAdmin.mockResolvedValue({ id: '1', role: 'admin' })
    fetchAnalytics.mockResolvedValue({ summary: {} })

    await GET(makeRequest('http://localhost/api/admin/analytics'))

    expect(fetchAnalytics).toHaveBeenCalledWith('28d')
  })

  it('returns analytics data with a cache header on success', async () => {
    getCurrentAdmin.mockResolvedValue({ id: '1', role: 'admin' })
    fetchAnalytics.mockResolvedValue({ summary: { visitors: 42 } })

    const res = await GET(makeRequest('http://localhost/api/admin/analytics?range=7d'))

    expect(fetchAnalytics).toHaveBeenCalledWith('7d')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=300')
    expect(await res.json()).toEqual({ summary: { visitors: 42 } })
  })

  it('returns 500 with the error message when fetchAnalytics throws', async () => {
    getCurrentAdmin.mockResolvedValue({ id: '1', role: 'admin' })
    fetchAnalytics.mockRejectedValue(new Error('GA quota exceeded'))

    const res = await GET(makeRequest('http://localhost/api/admin/analytics'))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'GA quota exceeded' })
  })

  it('returns a generic 500 message for non-Error throws', async () => {
    getCurrentAdmin.mockResolvedValue({ id: '1', role: 'admin' })
    fetchAnalytics.mockRejectedValue('boom')

    const res = await GET(makeRequest('http://localhost/api/admin/analytics'))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Unknown error' })
  })
})
