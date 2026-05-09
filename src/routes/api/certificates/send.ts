import { createFileRoute } from '@tanstack/react-router'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { certificateBatches, certificateIssuers, certificates } from '@/db/schema'

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

function parseCSV(text: string): Array<{ name: string; email: string }> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const results: Array<{ name: string; email: string }> = []
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim())
    const [name, email] = parts
    if (name?.toLowerCase() === 'student_name' || name?.toLowerCase() === 'name') continue
    if (!name || !email || !email.includes('@')) continue
    results.push({ name, email })
  }
  return results
}

function buildEmailHtml(params: {
  orgName: string
  logoUrl: string
  studentName: string
  courseName: string
  certificateUrl: string
  certificateId: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Certificate</title></head>
<body style="font-family: Georgia, serif; background: #F7F3EC; padding: 40px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #1A1008; padding: 48px;">
    <img src="${params.logoUrl}" alt="${params.orgName}" style="height: 60px; margin-bottom: 32px;" />
    <h1 style="font-size: 28px; color: #1A1008; margin: 0 0 8px;">Congratulations, ${params.studentName}!</h1>
    <p style="color: #555; font-size: 16px;">You have successfully completed:</p>
    <h2 style="font-size: 22px; color: #D4380D; margin: 16px 0 32px;">${params.courseName}</h2>
    <a href="${params.certificateUrl}"
       style="display: inline-block; background: #D4380D; color: #fff; padding: 14px 32px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; font-family: monospace;">
      View Your Certificate →
    </a>
    <p style="margin-top: 40px; font-family: monospace; font-size: 11px; color: #999;">
      Certificate ID: ${params.certificateId}
    </p>
  </div>
</body>
</html>`
}

export const POST = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json() as {
      csvText: string
      courseName: string
      description: string
      expiresAt?: string
    }

    if (!body.csvText || !body.courseName || !body.description) {
      return badRequest('csvText, courseName, and description are required')
    }

    const students = parseCSV(body.csvText)
    if (students.length === 0) return badRequest('No valid student rows found in CSV')
    if (students.length > 500) return badRequest('Maximum 500 students per batch')

    const [issuer] = await db.select().from(certificateIssuers).limit(1)
    if (!issuer) return badRequest('No issuer profile found — set up settings first')

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const resendApiKey = process.env.RESEND_API_KEY
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    const [batch] = await db
      .insert(certificateBatches)
      .values({
        issuerId: issuer.id,
        courseName: body.courseName,
        description: body.description,
        totalCount: students.length,
        successCount: 0,
      })
      .returning()

    let successCount = 0
    const skipped: string[] = []

    for (const student of students) {
      const [cert] = await db
        .insert(certificates)
        .values({
          batchId: batch.id,
          issuerId: issuer.id,
          studentName: student.name,
          studentEmail: student.email,
          isValid: true,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        })
        .returning()

      const certificateUrl = `${appUrl}/certificates/verify/${cert.id}`

      if (resend) {
        try {
          await resend.emails.send({
            from: issuer.replyToEmail,
            to: student.email,
            subject: `Your ${body.courseName} Certificate — ${issuer.orgName}`,
            html: buildEmailHtml({
              orgName: issuer.orgName,
              logoUrl: issuer.logoUrl,
              studentName: student.name,
              courseName: body.courseName,
              certificateUrl,
              certificateId: cert.id,
            }),
          })
          await db
            .update(certificates)
            .set({ emailSentAt: new Date() })
            .where(eq(certificates.id, cert.id))
          successCount++
        }
        catch (emailErr) {
          console.error(`[certificates/send] Email failed for ${student.email}:`, emailErr)
          skipped.push(student.email)
        }
      }
      else {
        skipped.push(student.email)
      }
    }

    await db
      .update(certificateBatches)
      .set({ successCount })
      .where(eq(certificateBatches.id, batch.id))

    return ok({ total: students.length, sent: successCount, failed: skipped.length, skipped, batchId: batch.id })
  }
  catch (err) {
    console.error('[/api/certificates/send]', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const Route = createFileRoute('/api/certificates/send')({
  server: { handlers: { POST } },
})
