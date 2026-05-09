import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  kahootAnswers,
  kahootGames,
  kahootPlayers,
  kahootQuestions,
} from '@/db/schema'

// Create a new Kahoot game
export const createKahootGame = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    roomId: string
    gameName: string
    questions: Array<{
      question: string
      options: string[]
      correctAnswer: number
      timeLimit: number
      points: number
    }>
    createdBy?: string
  }) => data)
  .handler(async ({ data }) => {
    // Create game
    const [game] = await db
      .insert(kahootGames)
      .values({
        roomId: data.roomId,
        gameName: data.gameName,
        state: 'waiting',
        createdBy: data.createdBy,
      })
      .returning()

    // Create questions
    const questions = await db
      .insert(kahootQuestions)
      .values(
        data.questions.map((q, index) => ({
          gameId: game.id,
          questionOrder: index,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          timeLimit: q.timeLimit,
          points: q.points,
        })),
      )
      .returning()

    return {
      game,
      questions,
    }
  })

// Add player to game
export const addKahootPlayer = createServerFn({ method: 'POST' })
  .handler(async (data: {
    gameId: number
    playerName: string
  }) => {
    const [player] = await db
      .insert(kahootPlayers)
      .values({
        gameId: data.gameId,
        playerName: data.playerName,
        score: 0,
      })
      .returning()

    return player
  })

// Update game state
export const updateKahootGameState = createServerFn({ method: 'POST' })
  .handler(async (data: {
    roomId: string
    state: 'waiting' | 'question' | 'results' | 'leaderboard' | 'ended'
    currentQuestionIndex?: number
    startedAt?: Date
    endedAt?: Date
  }) => {
    const [game] = await db
      .update(kahootGames)
      .set({
        state: data.state,
        currentQuestionIndex: data.currentQuestionIndex,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
      })
      .where(eq(kahootGames.roomId, data.roomId))
      .returning()

    return game
  })

// Record player answer
export const recordKahootAnswer = createServerFn({ method: 'POST' })
  .handler(async (data: {
    gameId: number
    questionId: number
    playerId: number
    selectedAnswer: number
    isCorrect: boolean
    timeToAnswer: number
    pointsEarned: number
  }) => {
    const [answer] = await db
      .insert(kahootAnswers)
      .values(data)
      .returning()

    // Update player score
    await db
      .update(kahootPlayers)
      .set({
        score: db.$increment(kahootPlayers.score, data.pointsEarned),
      })
      .where(eq(kahootPlayers.id, data.playerId))

    return answer
  })

// Get game by room ID
export const getKahootGame = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const game = await db.query.kahootGames.findFirst({
      where: eq(kahootGames.roomId, roomId),
      with: {
        questions: {
          orderBy: (questions, { asc }) => [asc(questions.questionOrder)],
        },
        players: {
          orderBy: (players, { desc }) => [desc(players.score)],
        },
      },
    })

    return game
  })

// Get game results/history
export const getKahootGameResults = createServerFn({ method: 'GET' })
  .handler(async (roomId: string) => {
    const game = await db.query.kahootGames.findFirst({
      where: eq(kahootGames.roomId, roomId),
      with: {
        questions: true,
        players: {
          orderBy: (players, { desc }) => [desc(players.score)],
        },
        answers: {
          with: {
            player: true,
            question: true,
          },
        },
      },
    })

    if (!game) {
      throw new Error('Game not found')
    }

    // Calculate statistics
    const totalQuestions = game.questions.length
    const totalPlayers = game.players.length
    const averageScore = totalPlayers > 0
      ? game.players.reduce((sum, p) => sum + p.score, 0) / totalPlayers
      : 0

    // Question statistics
    const questionStats = game.questions.map((question) => {
      const questionAnswers = game.answers.filter(
        a => a.questionId === question.id,
      )
      const correctAnswers = questionAnswers.filter(a => a.isCorrect).length
      const totalAnswers = questionAnswers.length

      return {
        question: question.question,
        correctAnswers,
        totalAnswers,
        accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      }
    })

    return {
      game,
      stats: {
        totalQuestions,
        totalPlayers,
        averageScore,
        questionStats,
      },
    }
  })

// Get all games (for history)
export const getAllKahootGames = createServerFn({ method: 'GET' })
  .handler(async (filters?: {
    createdBy?: string
    limit?: number
    offset?: number
  }) => {
    const games = await db.query.kahootGames.findMany({
      where: filters?.createdBy
        ? eq(kahootGames.createdBy, filters.createdBy)
        : undefined,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      orderBy: (games, { desc }) => [desc(games.createdAt)],
      with: {
        players: true,
      },
    })

    return games
  })
