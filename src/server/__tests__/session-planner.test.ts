import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/db', () => ({
  db: {
    insert: () => ({ values: () => ({ returning: mockInsert }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: mockUpdate }) }) }),
    select: () => ({ from: () => ({ where: () => ({ orderBy: mockSelect }) }) }),
  },
}))
vi.mock('@/db/schema', () => ({
  plannedSessions: {},
}))
vi.mock('@setemiojo/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@setemiojo/utils')>()
  return { ...actual, randomStr: vi.fn().mockReturnValue('abc1234') }
})

describe('createPlannedSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a planned session and returns it', async () => {
    const expected = { id: 1, title: 'Week 3 Quiz', toolType: 'kahoot', status: 'planned' }
    mockInsert.mockResolvedValueOnce([expected])

    const { createPlannedSession } = await import('../session-planner')
    const result = await createPlannedSession({
      ownerId: 'user-1',
      toolType: 'kahoot',
      title: 'Week 3 Quiz',
      config: { questions: [] },
      scheduledFor: null,
    })

    expect(result).toEqual(expected)
  })
})

describe('startPlannedSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws if session not found', async () => {
    mockSelect.mockResolvedValueOnce([])
    const { startPlannedSession } = await import('../session-planner')
    await expect(startPlannedSession({ id: 99, ownerId: 'user-1' })).rejects.toThrow('not found')
  })

  it('throws if caller is not owner', async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1, ownerId: 'user-2', status: 'planned', toolType: 'poll' }])
    const { startPlannedSession } = await import('../session-planner')
    await expect(startPlannedSession({ id: 1, ownerId: 'user-1' })).rejects.toThrow('not owner')
  })

  it('throws if session is already active', async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1, ownerId: 'user-1', status: 'active', toolType: 'poll' }])
    const { startPlannedSession } = await import('../session-planner')
    await expect(startPlannedSession({ id: 1, ownerId: 'user-1' })).rejects.toThrow('already active')
  })

  it('generates roomId and returns redirect URL', async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1, ownerId: 'user-1', status: 'planned', toolType: 'poll' }])
    mockUpdate.mockResolvedValueOnce([{ id: 1, roomId: 'poll-abc1234', status: 'active' }])

    const { startPlannedSession } = await import('../session-planner')
    const result = await startPlannedSession({ id: 1, ownerId: 'user-1' })

    expect(result.roomId).toBe('poll-abc1234')
    expect(result.redirectTo).toBe('/party/polls?room=poll-abc1234')
  })
})
