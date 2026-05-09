import { createFileRoute } from '@tanstack/react-router'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { feelingEmojis, feelingSessions } from '@/db/schema'

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
        // Upsert: safe on worker restarts — roomId is UNIQUE
        const [session] = await db
          .insert(feelingSessions)
          .values({ roomId: body.roomId as string })
          .onConflictDoUpdate({
            target: feelingSessions.roomId,
            set: { roomId: sql`EXCLUDED."room_id"` },
          })
          .returning()
        return ok(session)
      }

      case 'add_emoji': {
        const [emoji] = await db
          .insert(feelingEmojis)
          .values({
            sessionId: body.sessionId as number,
            emoji: body.emoji as string,
            participantId: body.participantId as string,
          })
          .returning()
        return ok(emoji)
      }

      case 'end_session': {
        const [session] = await db
          .update(feelingSessions)
          .set({ endedAt: new Date() })
          .where(eq(feelingSessions.roomId, body.roomId as string))
          .returning()
        return ok(session)
      }

      default:
        return badRequest(`Unknown type: ${body.type}`)
    }
  }
  catch (err) {
    console.error('[/api/internal/feelings]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/internal/feelings')({
  server: { handlers: { POST } },
})
