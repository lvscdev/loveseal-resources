import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const { createAdminClient, upsert, resendSend } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  upsert:            vi.fn(),
  resendSend:        vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: resendSend } }
  }),
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest(new Request('http://localhost/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  }))
}

describe('POST /api/subscribe', () => {
  const ORIGINAL_KEY = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'your_resend_api_key'
    upsert.mockResolvedValue({ error: null })
    createAdminClient.mockReturnValue({ from: () => ({ upsert }) })
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = ORIGINAL_KEY
  })

  it('rejects an invalid email address', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ ok: false, error: 'Invalid email address' })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects a missing email address', async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ ok: false, error: 'Invalid email address' })
  })

  it('treats an unparsable body as invalid', async () => {
    const req = new NextRequest(new Request('http://localhost/api/subscribe', {
      method: 'POST',
      body: '{not json',
    }))

    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('normalizes email casing/whitespace and upserts it', async () => {
    const res = await POST(makeRequest({ email: '  Test@Example.com  ', locale: 'fr' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(upsert).toHaveBeenCalledWith(
      { email: 'test@example.com', locale: 'fr' },
      { onConflict: 'email', ignoreDuplicates: true },
    )
  })

  it('defaults locale to "en" when not provided', async () => {
    await POST(makeRequest({ email: 'test@example.com' }))

    expect(upsert).toHaveBeenCalledWith(
      { email: 'test@example.com', locale: 'en' },
      { onConflict: 'email', ignoreDuplicates: true },
    )
  })

  it('returns 500 when the database upsert fails', async () => {
    upsert.mockResolvedValue({ error: { message: 'db exploded' } })

    const res = await POST(makeRequest({ email: 'test@example.com' }))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ ok: false, error: 'Could not save subscription' })
  })

  it('skips sending a welcome email when Resend is not configured', async () => {
    process.env.RESEND_API_KEY = 'your_resend_api_key'

    const res = await POST(makeRequest({ email: 'test@example.com' }))

    expect(res.status).toBe(200)
    expect(resendSend).not.toHaveBeenCalled()
  })

  it('sends a welcome email when Resend is configured', async () => {
    process.env.RESEND_API_KEY = 'real-key-123'
    resendSend.mockResolvedValue({ data: {}, error: null })

    const res = await POST(makeRequest({ email: 'test@example.com' }))

    expect(res.status).toBe(200)
    expect(resendSend).toHaveBeenCalledTimes(1)
    expect(resendSend.mock.calls[0][0]).toMatchObject({ to: 'test@example.com' })
  })

  it('still succeeds even if the welcome email send fails', async () => {
    process.env.RESEND_API_KEY = 'real-key-123'
    resendSend.mockRejectedValue(new Error('resend down'))

    const res = await POST(makeRequest({ email: 'test@example.com' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
