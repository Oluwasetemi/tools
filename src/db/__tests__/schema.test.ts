import { describe, it, expect } from 'vitest'
import { plannedSessions, toolTypeEnum, sessionStatusEnum } from '../schema'

describe('plannedSessions schema', () => {
  it('has expected columns', () => {
    const cols = Object.keys(plannedSessions)
    expect(cols).toContain('id')
    expect(cols).toContain('ownerId')
    expect(cols).toContain('toolType')
    expect(cols).toContain('title')
    expect(cols).toContain('config')
    expect(cols).toContain('status')
    expect(cols).toContain('scheduledFor')
    expect(cols).toContain('roomId')
  })
})
