import { createServerFn } from '@tanstack/react-start'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  feelingEmojis,
  feelingSessions,
} from '@/db/schema'

// Create a new feelings session
export const createFeelingSession = createServerFn({ method: 'POST' })
  .handler(async (roomId: string) => {
    const [session] = await db
      .insert(feelingSessions)
      .values({
        roomId,
      })
      .returning()

    return session
  })

// Post an emoji to the session
export const postEmoji = createServerFn({ method: 'POST' })
  .handler(async (data: {
    sessionId: number
    emoji: string
    participantId: string
  }) => {
    const [emojiRecord] = await db
      .insert(feelingEmojis)
      .values(data)
      .returning()

    return emojiRecord
  })

// End feelings session
export const endFeelingSession = createServerFn({ method: 'POST' })
  .handler(async (roomId: string) => {
    const [session] = await db
      .update(feelingSessions)
      .set({
        endedAt: new Date(),
      })
      .where(eq(feelingSessions.roomId, roomId))
      .returning()

    return session
  })

// Get feelings session by room ID
export const getFeelingSession = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const session = await db.query.feelingSessions.findFirst({
      where: eq(feelingSessions.roomId, roomId),
      with: {
        emojis: {
          orderBy: (emojis, { desc }) => [desc(emojis.postedAt)],
        },
      },
    })

    return session
  })

// Get feelings session results
export const getFeelingResults = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const session = await db.query.feelingSessions.findFirst({
      where: eq(feelingSessions.roomId, roomId),
      with: {
        emojis: {
          orderBy: (emojis, { desc }) => [desc(emojis.postedAt)],
        },
      },
    })

    if (!session) {
      throw new Error('Feelings session not found')
    }

    // Calculate statistics
    const totalEmojis = session.emojis.length
    const uniqueParticipants = new Set(
      session.emojis.map(e => e.participantId),
    ).size

    // Emoji frequency distribution
    const emojiCounts = session.emojis.reduce((acc, record) => {
      acc[record.emoji] = (acc[record.emoji] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort by frequency
    const topEmojis = Object.entries(emojiCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }))

    // Timeline of emoji posts (grouped by minute)
    const timeline = session.emojis.reduce((acc, record) => {
      const minute = new Date(record.postedAt).toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
      if (!acc[minute]) {
        acc[minute] = { time: minute, count: 0, emojis: {} as Record<string, number> }
      }
      acc[minute].count++
      acc[minute].emojis[record.emoji] = (acc[minute].emojis[record.emoji] || 0) + 1
      return acc
    }, {} as Record<string, { time: string, count: number, emojis: Record<string, number> }>)

    const timelineData = Object.values(timeline).sort(
      (a, b) => a.time.localeCompare(b.time),
    )

    // Participant activity
    const participantActivity = session.emojis.reduce((acc, record) => {
      if (!acc[record.participantId]) {
        acc[record.participantId] = 0
      }
      acc[record.participantId]++
      return acc
    }, {} as Record<string, number>)

    const mostActiveParticipants = Object.entries(participantActivity)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([participantId, count]) => ({ participantId, count }))

    // Duration of session
    const duration = session.endedAt
      ? new Date(session.endedAt).getTime() - new Date(session.createdAt).getTime()
      : Date.now() - new Date(session.createdAt).getTime()

    const durationMinutes = Math.floor(duration / 1000 / 60)

    return {
      session,
      stats: {
        totalEmojis,
        uniqueParticipants,
        topEmojis,
        timeline: timelineData,
        mostActiveParticipants,
        durationMinutes,
        emojisPerMinute: durationMinutes > 0 ? totalEmojis / durationMinutes : 0,
      },
    }
  })

// Get all feelings sessions (for history)
export const getAllFeelingSessions = createServerFn({ method: 'GET' })
  .handler(async (filters?: {
    limit?: number
    offset?: number
    includeActive?: boolean
  }) => {
    const sessions = await db.query.feelingSessions.findMany({
      where: filters?.includeActive
        ? undefined
        : (sessions, { isNotNull }) => isNotNull(sessions.endedAt),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      with: {
        emojis: true,
      },
    })

    // Add summary stats for each session
    const sessionsWithStats = sessions.map((session) => {
      const totalEmojis = session.emojis.length
      const uniqueParticipants = new Set(
        session.emojis.map(e => e.participantId),
      ).size

      const emojiCounts = session.emojis.reduce((acc, record) => {
        acc[record.emoji] = (acc[record.emoji] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topEmoji = Object.entries(emojiCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      )[0]

      return {
        ...session,
        summary: {
          totalEmojis,
          uniqueParticipants,
          topEmoji: topEmoji ? { emoji: topEmoji[0], count: topEmoji[1] } : null,
        },
      }
    })

    return sessionsWithStats
  })

// Get recent emojis (for live streaming)
export const getRecentEmojis = createServerFn({ method: 'GET' })
  .handler(async (data: {
    sessionId: number
    since?: Date
    limit?: number
  }) => {
    const emojis = await db.query.feelingEmojis.findMany({
      where: (emojis, { and, eq, gt }) => {
        const conditions = [eq(emojis.sessionId, data.sessionId)]
        if (data.since) {
          conditions.push(gt(emojis.postedAt, data.since))
        }
        return and(...conditions)
      },
      limit: data.limit || 100,
      orderBy: (emojis, { desc }) => [desc(emojis.postedAt)],
    })

    return emojis
  })
