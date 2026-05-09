import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { feedbackResponses, feedbackSessions } from '@/db/schema'

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
      case 'create_session': {
        const [session] = await db
          .insert(feedbackSessions)
          .values({
            roomId: body.roomId as string,
            title: body.title as string,
            type: body.feedbackType as 'emoji' | 'text' | 'score',
            isActive: true,
            config: body.config as Record<string, unknown> | undefined,
            createdBy: body.createdBy as string | undefined,
          })
          .returning()
        return ok(session)
      }

      case 'submit_response': {
        const [response] = await db
          .insert(feedbackResponses)
          .values({
            sessionId: body.sessionId as number,
            respondentId: body.respondentId as string,
            responseType: body.responseType as 'emoji' | 'text' | 'score',
            emojiResponse: body.emojiResponse as string | undefined,
            textResponse: body.textResponse as string | undefined,
            scoreResponse: body.scoreResponse as number | undefined,
          })
          .returning()
        return ok(response)
      }

      case 'close_session': {
        const [session] = await db
          .update(feedbackSessions)
          .set({ isActive: false, closedAt: new Date() })
          .where(eq(feedbackSessions.roomId, body.roomId as string))
          .returning()
        return ok(session)
      }

      default:
        return badRequest(`Unknown type: ${body.type}`)
    }
  }
  catch (err) {
    console.error('[/api/internal/feedback]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/internal/feedback')({
  server: { handlers: { POST } },
})
