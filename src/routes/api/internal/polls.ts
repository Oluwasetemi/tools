import { createFileRoute } from '@tanstack/react-router'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { pollOptions, polls, pollVotes } from '@/db/schema'

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

export const POST = async ({ request }: { request: Request }) => {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) return unauthorized()

  const body = await request.json() as { type: string } & Record<string, unknown>

  try {
    switch (body.type) {
      case 'create_poll': {
        const [poll] = await db
          .insert(polls)
          .values({
            roomId: body.roomId as string,
            question: body.question as string,
            isActive: true,
            createdBy: body.createdBy as string | undefined,
          })
          .returning()

        const options = await db
          .insert(pollOptions)
          .values(
            (body.options as string[]).map((optionText, index) => ({
              pollId: poll.id,
              optionText,
              optionOrder: index,
              votes: 0,
            })),
          )
          .returning()

        return ok({ poll, options })
      }

      case 'vote': {
        const [vote] = await db
          .insert(pollVotes)
          .values({
            pollId: body.pollId as number,
            optionId: body.optionId as number,
            voterId: body.voterId as string,
          })
          .returning()

        await db
          .update(pollOptions)
          .set({ votes: sql`${pollOptions.votes} + 1` })
          .where(eq(pollOptions.id, body.optionId as number))

        return ok(vote)
      }

      case 'end_poll': {
        const [poll] = await db
          .update(polls)
          .set({ isActive: false, endedAt: new Date() })
          .where(eq(polls.roomId, body.roomId as string))
          .returning()
        return ok(poll)
      }

      default:
        return badRequest(`Unknown type: ${body.type}`)
    }
  }
  catch (err) {
    console.error('[/api/internal/polls]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/internal/polls')({
  server: { handlers: { POST } },
})
