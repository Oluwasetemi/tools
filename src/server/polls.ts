import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  pollOptions,
  polls,
  pollVotes,
} from '@/db/schema'

// Create a new poll
export const createPoll = createServerFn({ method: 'POST' })
  .handler(async (data: {
    roomId: string
    question: string
    options: string[]
    createdBy?: string
  }) => {
    // Create poll
    const [poll] = await db
      .insert(polls)
      .values({
        roomId: data.roomId,
        question: data.question,
        isActive: true,
        createdBy: data.createdBy,
      })
      .returning()

    // Create options
    const options = await db
      .insert(pollOptions)
      .values(
        data.options.map((optionText, index) => ({
          pollId: poll.id,
          optionText,
          optionOrder: index,
          votes: 0,
        })),
      )
      .returning()

    return {
      poll,
      options,
    }
  })

// Vote on a poll
export const voteOnPoll = createServerFn({ method: 'POST' })
  .handler(async (data: {
    pollId: number
    optionId: number
    voterId: string
  }) => {
    // Check if voter already voted
    const existingVote = await db.query.pollVotes.findFirst({
      where: (votes, { and, eq }) =>
        and(
          eq(votes.pollId, data.pollId),
          eq(votes.voterId, data.voterId),
        ),
    })

    if (existingVote) {
      throw new Error('You have already voted on this poll')
    }

    // Record vote
    const [vote] = await db
      .insert(pollVotes)
      .values(data)
      .returning()

    // Increment vote count
    await db
      .update(pollOptions)
      .set({
        votes: db.$increment(pollOptions.votes, 1),
      })
      .where(eq(pollOptions.id, data.optionId))

    return vote
  })

// End poll
export const endPoll = createServerFn({ method: 'POST' })
  .handler(async (roomId: string) => {
    const [poll] = await db
      .update(polls)
      .set({
        isActive: false,
        endedAt: new Date(),
      })
      .where(eq(polls.roomId, roomId))
      .returning()

    return poll
  })

// Get poll by room ID
export const getPoll = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const poll = await db.query.polls.findFirst({
      where: eq(polls.roomId, roomId),
      with: {
        options: {
          orderBy: (options, { asc }) => [asc(options.optionOrder)],
        },
        votes: true,
      },
    })

    return poll
  })

// Get poll results
export const getPollResults = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const poll = await db.query.polls.findFirst({
      where: eq(polls.roomId, roomId),
      with: {
        options: {
          orderBy: (options, { desc }) => [desc(options.votes)],
        },
        votes: true,
      },
    })

    if (!poll) {
      throw new Error('Poll not found')
    }

    // Calculate statistics
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)

    const results = poll.options.map(option => ({
      id: option.id,
      text: option.optionText,
      votes: option.votes,
      percentage: totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0,
    }))

    // Find winner(s)
    const maxVotes = Math.max(...poll.options.map(opt => opt.votes))
    const winners = results.filter(opt => opt.votes === maxVotes)

    return {
      poll,
      results,
      stats: {
        totalVotes,
        totalOptions: poll.options.length,
        winners,
      },
    }
  })

// Get all polls (for history)
export const getAllPolls = createServerFn({ method: 'GET' })
  .handler(async (filters?: {
    createdBy?: string
    isActive?: boolean
    limit?: number
    offset?: number
  }) => {
    const polls = await db.query.polls.findMany({
      where: (polls, { and, eq }) => {
        const conditions = []
        if (filters?.createdBy) {
          conditions.push(eq(polls.createdBy, filters.createdBy))
        }
        if (filters?.isActive !== undefined) {
          conditions.push(eq(polls.isActive, filters.isActive))
        }
        return conditions.length > 0 ? and(...conditions) : undefined
      },
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      orderBy: (polls, { desc }) => [desc(polls.createdAt)],
      with: {
        options: {
          orderBy: (options, { asc }) => [asc(options.optionOrder)],
        },
      },
    })

    return polls
  })

// Check if user has voted
export const hasVoted = createServerFn({ method: 'GET' })
  .handler(async (data: { pollId: number, voterId: string }) => {
    const vote = await db.query.pollVotes.findFirst({
      where: (votes, { and, eq }) =>
        and(
          eq(votes.pollId, data.pollId),
          eq(votes.voterId, data.voterId),
        ),
    })

    return !!vote
  })
