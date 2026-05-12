import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/auth-session', () => ({
  getAuthSession: vi.fn().mockResolvedValue(null),
}))

describe('_authed layout', () => {
  it('exports a Route with beforeLoad', async () => {
    const mod = await import('../_authed')
    expect(mod.Route.options.beforeLoad).toBeDefined()
  })
})
