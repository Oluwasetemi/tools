import { timingSafeEqual } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  kahootAnswers,
  kahootGames,
  kahootPlayers,
  kahootQuestions,
} from '@/db/schema'

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

function badRequest(error: string) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}

function ok(data: unknown) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}


function checkSecret(provided: string | null): boolean {
  const expected = process.env.INTERNAL_API_SECRET ?? ''
  if (!provided || provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}
export const POST = async ({ request }: { request: Request }) => {
  if (!checkSecret(request.headers.get('x-internal-secret'))) return unauthorized()

  const body = await request.json() as { type: string } & Record<string, unknown>

  try {
    switch (body.type) {
      case 'create_game': {
        const [game] = await db
          .insert(kahootGames)
          .values({
            roomId: body.roomId as string,
            gameName: body.gameName as string,
            state: 'waiting',
            createdBy: body.createdBy as string | undefined,
          })
          .returning()

        const questions = await db
          .insert(kahootQuestions)
          .values(
            (body.questions as Array<{
              question: string
              options: string[]
              correctAnswer: number
              timeLimit: number
              points: number
            }>).map((q, index) => ({
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

        return ok({ game, questions })
      }

      case 'add_player': {
        const [player] = await db
          .insert(kahootPlayers)
          .values({
            gameId: body.gameId as number,
            playerName: body.playerName as string,
            score: 0,
          })
          .returning()
        return ok(player)
      }

      case 'submit_answer': {
        const [answer] = await db
          .insert(kahootAnswers)
          .values({
            gameId: body.gameId as number,
            questionId: body.questionId as number,
            playerId: body.playerId as number,
            selectedAnswer: body.selectedAnswer as number,
            isCorrect: body.isCorrect as boolean,
            timeToAnswer: body.timeToAnswer as number,
            pointsEarned: body.pointsEarned as number,
          })
          .returning()

        await db
          .update(kahootPlayers)
          .set({ score: sql`${kahootPlayers.score} + ${body.pointsEarned as number}` })
          .where(eq(kahootPlayers.id, body.playerId as number))

        return ok(answer)
      }

      case 'update_state': {
        const [game] = await db
          .update(kahootGames)
          .set({
            state: body.state as 'waiting' | 'question' | 'results' | 'leaderboard' | 'ended',
            currentQuestionIndex: body.currentQuestionIndex as number | undefined,
          })
          .where(eq(kahootGames.roomId, body.roomId as string))
          .returning()
        return ok(game)
      }

      case 'end_game': {
        const [game] = await db
          .update(kahootGames)
          .set({ state: 'ended', endedAt: new Date() })
          .where(eq(kahootGames.roomId, body.roomId as string))
          .returning()
        return ok(game)
      }

      default:
        return badRequest(`Unknown type: ${body.type}`)
    }
  }
  catch (err) {
    console.error('[/api/internal/kahoot]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/internal/kahoot')({
  server: { handlers: { POST } },
})
