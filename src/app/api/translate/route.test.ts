import { describe, it, expect, vi, beforeEach } from 'vitest'

const { translateContent } = vi.hoisted(() => ({
  translateContent: vi.fn(),
}))

vi.mock('@/app/admin/(dashboard)/content/translate-actions', () => ({ translateContent }))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/translate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when contentId is missing', async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ ok: false, error: 'contentId required' })
    expect(translateContent).not.toHaveBeenCalled()
  })

  it('delegates to translateContent and returns its result', async () => {
    translateContent.mockResolvedValue({ ok: true, succeeded: ['fr', 'es'], failed: [] })

    const res = await POST(makeRequest({ contentId: 'abc-123' }))

    expect(translateContent).toHaveBeenCalledWith('abc-123')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, succeeded: ['fr', 'es'], failed: [] })
  })

  it('surfaces a failed result from translateContent without throwing', async () => {
    translateContent.mockResolvedValue({ ok: false, succeeded: [], failed: ['fr'], error: 'Not authenticated' })

    const res = await POST(makeRequest({ contentId: 'abc-123' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: false, succeeded: [], failed: ['fr'], error: 'Not authenticated' })
  })

  it('returns 500 with the error message when translateContent throws', async () => {
    translateContent.mockRejectedValue(new Error('translation service down'))

    const res = await POST(makeRequest({ contentId: 'abc-123' }))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ ok: false, error: 'translation service down' })
  })

  it('returns 500 with a generic message when the body is unparsable JSON', async () => {
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: '{not json',
    })

    const res = await POST(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(translateContent).not.toHaveBeenCalled()
  })
})
