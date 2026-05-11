import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { notNullish } from '@setemiojo/utils'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { certificateBatches, certificateIssuers, certificates } from '@/db/schema'

interface SendResult {
  total: number
  sent: number
  failed: number
  skipped: string[]
  batchId: number
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function parseCSV(text: string): Array<{ name: string; email: string }> {
  const lines = text.split('\n').map(l => l.trim()).filter(notNullish)
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
  const orgName = escapeHtml(params.orgName)
  const studentName = escapeHtml(params.studentName)
  const courseName = escapeHtml(params.courseName)
  const certificateId = escapeHtml(params.certificateId)
  // certificateUrl is server-generated; logoUrl is validated before this call
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Certificate</title></head>
<body style="font-family: Georgia, serif; background: #F7F3EC; padding: 40px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #1A1008; padding: 48px;">
    <img src="${params.logoUrl}" alt="${orgName}" style="height: 60px; margin-bottom: 32px;" />
    <h1 style="font-size: 28px; color: #1A1008; margin: 0 0 8px;">Congratulations, ${studentName}!</h1>
    <p style="color: #555; font-size: 16px;">You have successfully completed:</p>
    <h2 style="font-size: 22px; color: #D4380D; margin: 16px 0 32px;">${courseName}</h2>
    <a href="${params.certificateUrl}"
       style="display: inline-block; background: #D4380D; color: #fff; padding: 14px 32px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; font-family: monospace;">
      View Your Certificate →
    </a>
    <p style="margin-top: 40px; font-family: monospace; font-size: 11px; color: #999;">
      Certificate ID: ${certificateId}
    </p>
  </div>
</body>
</html>`
}

const sendCertificates = createServerFn({ method: 'POST' })
  .handler(async (data: {
    csvText: string
    courseName: string
    description: string
    expiresAt?: string
  }): Promise<SendResult> => {
    if (!data.csvText || !data.courseName || !data.description) {
      throw new Error('csvText, courseName, and description are required')
    }

    const students = parseCSV(data.csvText)
    if (students.length === 0) throw new Error('No valid student rows found in CSV')
    if (students.length > 500) throw new Error('Maximum 500 students per batch')

    const [issuer] = await db.select().from(certificateIssuers).limit(1)
    if (!issuer) throw new Error('No issuer profile found — set up settings first')

    // Validate logoUrl is a safe https:// URL before using it in emails
    if (!issuer.logoUrl.startsWith('https://')) {
      throw new Error('Issuer logo URL must use https://. Please update settings.')
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const resendApiKey = process.env.RESEND_API_KEY
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    const [batch] = await db
      .insert(certificateBatches)
      .values({
        issuerId: issuer.id,
        courseName: data.courseName,
        description: data.description,
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
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        })
        .returning()

      const certificateUrl = `${appUrl}/certificates/verify/${cert.id}`

      if (resend) {
        try {
          await resend.emails.send({
            from: `${issuer.orgName} <onboarding@resend.dev>`,
            replyTo: issuer.replyToEmail,
            to: student.email,
            subject: `Your ${data.courseName} Certificate — ${issuer.orgName}`,
            html: buildEmailHtml({
              orgName: issuer.orgName,
              logoUrl: issuer.logoUrl,
              studentName: student.name,
              courseName: data.courseName,
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

    return { total: students.length, sent: successCount, failed: skipped.length, skipped, batchId: batch.id }
  })

function CertificateSendPage() {
  const [csvText, setCsvText] = useState('')
  const [courseName, setCourseName] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvText.trim()) {
      setError('Upload a CSV file first')
      return
    }
    setSending(true)
    setError(null)
    setResult(null)

    try {
      const data = await sendCertificates({ data: { csvText, courseName, description, expiresAt: expiresAt || undefined } })
      setResult(data)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    }
    finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Tool accent stripe — amber */}
      <div className="h-1 bg-[#B45309]" />

      {/* Top nav */}
      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link
          to="/certificates"
          className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline"
        >
          ← Certificates<span className="text-[#B45309]">.</span>
        </Link>
        <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">
          06 · New Batch
        </span>
      </nav>

      {result
        ? (
            <div className="px-5 sm:px-8 pt-12">
              <div className="max-w-2xl mx-auto border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10 text-center">
                <div className="w-14 h-14 border-2 border-[#B45309] bg-[#B45309] mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
                <h2 className="f-display font-black text-[28px] tracking-tight text-[#1A1008] mb-2">
                  Batch Complete
                </h2>
                <p className="f-mono text-[12px] text-[#1A1008]/50 mb-6">
                  {result.sent} of {result.total} emails sent successfully.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Total', value: result.total, color: '#1A1008' },
                    { label: 'Sent', value: result.sent, color: '#B45309' },
                    { label: 'Failed', value: result.failed, color: '#D4380D' },
                  ].map(stat => (
                    <div key={stat.label} className="border-2 border-[#1A1008]/10 p-4">
                      <div className="f-display font-black text-[28px]" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 justify-center">
                  <Link
                    to="/certificates"
                    className="border-2 border-[#1A1008] bg-[#B45309] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
                  >
                    View Dashboard
                  </Link>
                  <button
                    onClick={() => { setResult(null); setCsvText(''); setCourseName(''); setDescription('') }}
                    className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
                  >
                    New Batch
                  </button>
                </div>
              </div>
            </div>
          )
        : (
            <>
              {/* Page header */}
              <div className="px-5 sm:px-8 pt-8 pb-0 border-b-2 border-[#1A1008]">
                <div className="pb-6">
                  <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#B45309] mb-2">
                    Send Certificates
                  </div>
                  <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
                    New Batch<span className="text-[#B45309]">.</span>
                  </h1>
                  <p className="f-mono text-[12px] text-[#1A1008]/50 mt-2">
                    Upload a CSV and configure the course. Max 500 students per batch.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="px-5 sm:px-8 pt-8 pb-12">
                <div className="max-w-2xl">
                  <form onSubmit={handleSend} className="space-y-5">
                    {/* CSV Upload */}
                    <div>
                      <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                        Student CSV
                      </label>
                      <div className="border-2 border-dashed border-[#1A1008]/30 bg-white p-6 text-center">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleFileChange}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <div className="f-mono text-[11px] text-[#1A1008]/50 mb-2">
                            {csvText ? `✓ CSV loaded (${csvText.split('\n').filter(Boolean).length - 1} rows)` : 'Click to upload CSV'}
                          </div>
                          <div className="f-mono text-[9px] tracking-wider text-[#1A1008]/30">
                            Columns: student_name, student_email
                          </div>
                        </label>
                      </div>
                      {csvText && (
                        <button
                          type="button"
                          onClick={() => setCsvText('')}
                          className="mt-1 f-mono text-[10px] text-[#D4380D] hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Course Name */}
                    <div>
                      <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                        Course Name
                      </label>
                      <input
                        type="text"
                        value={courseName}
                        onChange={e => setCourseName(e.target.value)}
                        placeholder="e.g. React Workshop — May 2026"
                        required
                        className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                        Achievement Description
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. For successfully completing 8 hours of React training"
                        required
                        className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
                      />
                    </div>

                    {/* Optional expiry */}
                    <div>
                      <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                        Expiry Date <span className="normal-case">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        className="border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
                      />
                    </div>

                    {error && (
                      <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
                        <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending || !csvText}
                      className="w-full border-2 border-[#1A1008] bg-[#B45309] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
                    >
                      {sending ? 'Sending certificates...' : 'Generate & Send Certificates'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
    </div>
  )
}

export const Route = createFileRoute('/certificates/send')({
  head: () => ({
    meta: [
      { title: 'Send Certificates — New Batch' },
      { name: 'description', content: 'Upload a CSV of students and send personalised course completion certificates by email in bulk.' },
    ],
  }),
  component: CertificateSendPage,
})
