import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { testimonialSessions, testimonials } from '@/db/schema'

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
          .insert(testimonialSessions)
          .values({
            roomId: body.roomId as string,
            title: body.title as string,
            createdBy: body.createdBy as string,
            isActive: true,
          })
          .returning()
        return ok({ id: session.id })
      }

      case 'submit_testimonial': {
        const [testimonial] = await db
          .insert(testimonials)
          .values({
            sessionId: body.sessionId as number,
            roomId: body.roomId as string,
            studentName: body.studentName as string,
            content: body.content as string,
            status: 'pending',
          })
          .returning()
        return ok({ id: testimonial.id })
      }

      case 'moderate_testimonial': {
        const [testimonial] = await db
          .update(testimonials)
          .set({
            status: body.action as string,
            moderatedAt: new Date(),
          })
          .where(
            and(
              eq(testimonials.id, body.id as number),
              eq(testimonials.roomId, body.roomId as string),
            ),
          )
          .returning()
        return ok({ ok: true, testimonial })
      }

      case 'close_session': {
        await db
          .update(testimonialSessions)
          .set({ isActive: false })
          .where(eq(testimonialSessions.roomId, body.roomId as string))
        return ok({ ok: true })
      }

      default:
        return badRequest(`Unknown type: ${body.type}`)
    }
  }
  catch (err) {
    console.error('[/api/internal/testimonials]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/internal/testimonials')({
  server: { handlers: { POST } },
})
