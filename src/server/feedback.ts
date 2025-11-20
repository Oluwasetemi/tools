import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  feedbackResponses,
  feedbackSessions,
} from '@/db/schema'

// Create a new feedback session
export const createFeedbackSession = createServerFn({ method: 'POST' })
  .handler(async (data: {
    roomId: string
    title: string
    type: 'emoji' | 'text' | 'score'
    config?: Record<string, any>
    createdBy?: string
  }) => {
    const [session] = await db
      .insert(feedbackSessions)
      .values({
        roomId: data.roomId,
        title: data.title,
        type: data.type,
        isActive: true,
        config: data.config,
        createdBy: data.createdBy,
      })
      .returning()

    return session
  })

// Submit feedback response
export const submitFeedbackResponse = createServerFn({ method: 'POST' })
  .handler(async (data: {
    sessionId: number
    respondentId: string
    responseType: 'emoji' | 'text' | 'score'
    emojiResponse?: string
    textResponse?: string
    scoreResponse?: number
  }) => {
    // Check if respondent already submitted feedback
    const existingResponse = await db.query.feedbackResponses.findFirst({
      where: (responses, { and, eq }) =>
        and(
          eq(responses.sessionId, data.sessionId),
          eq(responses.respondentId, data.respondentId),
        ),
    })

    if (existingResponse) {
      throw new Error('You have already submitted feedback for this session')
    }

    const [response] = await db
      .insert(feedbackResponses)
      .values(data)
      .returning()

    return response
  })

// Close feedback session
export const closeFeedbackSession = createServerFn({ method: 'POST' })
  .handler(async (roomId: string) => {
    const [session] = await db
      .update(feedbackSessions)
      .set({
        isActive: false,
        closedAt: new Date(),
      })
      .where(eq(feedbackSessions.roomId, roomId))
      .returning()

    return session
  })

// Get feedback session by room ID
export const getFeedbackSession = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const session = await db.query.feedbackSessions.findFirst({
      where: eq(feedbackSessions.roomId, roomId),
      with: {
        responses: {
          orderBy: (responses, { desc }) => [desc(responses.submittedAt)],
        },
      },
    })

    return session
  })

// Get feedback session results
export const getFeedbackResults = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const session = await db.query.feedbackSessions.findFirst({
      where: eq(feedbackSessions.roomId, roomId),
      with: {
        responses: true,
      },
    })

    if (!session) {
      throw new Error('Feedback session not found')
    }

    const totalResponses = session.responses.length

    let stats: any = {
      totalResponses,
      sessionType: session.type,
    }

    // Type-specific statistics
    if (session.type === 'emoji') {
      const emojiCounts = session.responses.reduce((acc, response) => {
        if (response.emojiResponse) {
          acc[response.emojiResponse] = (acc[response.emojiResponse] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      stats.emojiCounts = emojiCounts
      stats.topEmoji = Object.entries(emojiCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      )[0]
    }
    else if (session.type === 'text') {
      stats.textResponses = session.responses
        .filter(r => r.textResponse)
        .map(r => ({
          text: r.textResponse,
          submittedAt: r.submittedAt,
        }))
    }
    else if (session.type === 'score') {
      const scores = session.responses
        .filter(r => r.scoreResponse !== null)
        .map(r => r.scoreResponse as number)

      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0

      const minScore = Math.min(...scores)
      const maxScore = Math.max(...scores)

      // Score distribution
      const config = session.config as { range?: { min: number, max: number } } | null
      const range = config?.range || { min: 1, max: 10 }
      const distribution: Record<number, number> = {}

      for (let i = range.min; i <= range.max; i++) {
        distribution[i] = scores.filter(s => s === i).length
      }

      stats = {
        ...stats,
        averageScore,
        minScore,
        maxScore,
        distribution,
      }
    }

    return {
      session,
      stats,
    }
  })

// Get all feedback sessions (for history)
export const getAllFeedbackSessions = createServerFn({ method: 'GET' })
  .handler(async (filters?: {
    createdBy?: string
    type?: 'emoji' | 'text' | 'score'
    isActive?: boolean
    limit?: number
    offset?: number
  }) => {
    const sessions = await db.query.feedbackSessions.findMany({
      where: (sessions, { and, eq }) => {
        const conditions = []
        if (filters?.createdBy) {
          conditions.push(eq(sessions.createdBy, filters.createdBy))
        }
        if (filters?.type) {
          conditions.push(eq(sessions.type, filters.type))
        }
        if (filters?.isActive !== undefined) {
          conditions.push(eq(sessions.isActive, filters.isActive))
        }
        return conditions.length > 0 ? and(...conditions) : undefined
      },
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      with: {
        responses: true,
      },
    })

    return sessions
  })

// Check if respondent has submitted feedback
export const hasSubmittedFeedback = createServerFn({ method: 'GET' })
  .handler(async (data: { sessionId: number, respondentId: string }) => {
    const response = await db.query.feedbackResponses.findFirst({
      where: (responses, { and, eq }) =>
        and(
          eq(responses.sessionId, data.sessionId),
          eq(responses.respondentId, data.respondentId),
        ),
    })

    return !!response
  })
