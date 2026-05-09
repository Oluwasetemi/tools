import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/db/schema', () => ({
  kahootGames: {}, kahootQuestions: {}, kahootPlayers: {}, kahootAnswers: {},
}))

function makeRequest(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['x-internal-secret'] = secret
  return new Request('http://localhost/api/internal/kahoot', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/internal/kahoot auth', () => {
  const goodSecret = 'test-secret'

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = goodSecret
  })

  it('returns 401 when secret is missing', async () => {
    const { POST } = await import('../kahoot')
    const res = await POST({ request: makeRequest({ type: 'end_game', roomId: 'r1' }) } as any)
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const { POST } = await import('../kahoot')
    const res = await POST({ request: makeRequest({ type: 'end_game', roomId: 'r1' }, 'wrong') } as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 for unknown type', async () => {
    const { POST } = await import('../kahoot')
    const res = await POST({ request: makeRequest({ type: 'unknown_op' }, goodSecret) } as any)
    expect(res.status).toBe(400)
  })
})
