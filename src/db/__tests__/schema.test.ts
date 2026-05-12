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
    expect(cols).toContain('createdAt')
    expect(cols).toContain('startedAt')
    expect(cols).toContain('endedAt')
  })

  it('toolTypeEnum has correct values', () => {
    expect(toolTypeEnum.enumValues).toEqual(['kahoot', 'poll', 'feedback', 'feelings', 'testimonials', 'certificates'])
  })

  it('sessionStatusEnum has correct values', () => {
    expect(sessionStatusEnum.enumValues).toEqual(['planned', 'active', 'ended'])
  })
})
