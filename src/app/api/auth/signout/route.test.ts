import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createClient, getBaseUrl, signOut } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getBaseUrl:   vi.fn(),
  signOut:      vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient }))
vi.mock('@/lib/locale-urls', () => ({ getBaseUrl }))

import { POST } from './route'

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClient.mockResolvedValue({ auth: { signOut } })
    getBaseUrl.mockReturnValue('https://resources.lovesealchurch.org')
  })

  it('signs the user out and redirects to the admin login page', async () => {
    const res = await POST()

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://resources.lovesealchurch.org/admin/login')
  })
})
