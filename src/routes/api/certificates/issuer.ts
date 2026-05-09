import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { certificateIssuers, certificates } from '@/db/schema'

function ok(data: unknown) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function badRequest(error: string) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json() as Record<string, unknown>

    // Handle revoke operation
    if (body.type === 'revoke') {
      const certId = body.certId as string
      if (!certId) return badRequest('certId required for revoke')
      const [updated] = await db
        .update(certificates)
        .set({ isValid: false })
        .where(eq(certificates.id, certId))
        .returning()
      return ok({ revoked: true, cert: updated })
    }

    // Upsert issuer profile
    const { orgName, logoUrl, instructorName, replyToEmail } = body as {
      orgName: string; logoUrl: string; instructorName: string; replyToEmail: string
    }
    if (!orgName || !logoUrl || !instructorName || !replyToEmail) {
      return badRequest('All fields required: orgName, logoUrl, instructorName, replyToEmail')
    }

    const existing = await db.select().from(certificateIssuers).limit(1)
    let issuer
    if (existing.length > 0) {
      const [updated] = await db
        .update(certificateIssuers)
        .set({ orgName, logoUrl, instructorName, replyToEmail })
        .where(eq(certificateIssuers.id, existing[0].id))
        .returning()
      issuer = updated
    }
    else {
      const [created] = await db
        .insert(certificateIssuers)
        .values({ orgName, logoUrl, instructorName, replyToEmail })
        .returning()
      issuer = created
    }
    return ok({ issuer })
  }
  catch (err) {
    console.error('[/api/certificates/issuer]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/certificates/issuer')({
  server: { handlers: { POST } },
})
