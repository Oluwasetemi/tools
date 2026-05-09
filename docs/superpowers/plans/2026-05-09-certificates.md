# Certificate Generation & Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a host to upload a CSV of student names/emails, configure course details, batch-generate UUID-based certificates, email each student a verification link via Resend, and serve a public hosted certificate page that doubles as verification proof.

**Architecture:** HTTP-only — no PartyKit. All DB operations run directly in TanStack Start API route handlers (`src/routes/api/certificates/`). The `/certificates/verify/$id` route is a public page that bypasses StackedLayout. Three Drizzle tables: `certificate_issuers`, `certificate_batches`, `certificates`.

**Tech Stack:** TanStack Start (file-based routing, `server: { handlers }` API routes), Drizzle ORM + Neon PostgreSQL, Resend npm package, Zod validation, Broadsheet design system (Playfair Display + JetBrains Mono, `#F7F3EC` background, `#D4380D` accent).

---

## File Structure

**New files:**
- `src/db/schema.ts` — add 3 tables (modify existing file)
- `src/routes/api/certificates/send.ts` — POST handler: parse CSV → DB → email via Resend
- `src/routes/api/certificates/issuer.ts` — POST handler: upsert issuer profile
- `src/routes/certificates.tsx` — host dashboard (list batches + rows, filter, revoke, resend)
- `src/routes/certificates.settings.tsx` — issuer profile form + preview
- `src/routes/certificates.send.tsx` — CSV upload form + course config + fire batch
- `src/routes/certificates.verify.$id.tsx` — public verification page (bypasses StackedLayout)
- `src/routes/__root.tsx` — modify bypass condition to include `/certificates/verify/`

---

### Task 1: Install Resend and add environment variable

**Files:**
- Modify: `package.json` (via bun add)
- Modify: `.env.example`

- [ ] **Step 1: Install the resend package**

```bash
bun add resend
```

Expected output: `resend` added to `package.json` dependencies.

- [ ] **Step 2: Add RESEND_API_KEY to .env.example**

In `.env.example`, add after the existing entries:

```
RESEND_API_KEY=re_your_api_key_here
APP_URL=http://localhost:3000
```

(APP_URL may already exist — only add if missing.)

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock .env.example
git commit -m "feat: add resend package for certificate emails"
```

---

### Task 2: Add certificate DB schema tables

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add three new tables to schema.ts**

Open `src/db/schema.ts`. After the existing `feelingEmojis` table, append:

```ts
// Certificate Tables
export const certificateIssuers = pgTable('certificate_issuers', {
  id: serial('id').primaryKey(),
  orgName: text('org_name').notNull(),
  logoUrl: text('logo_url').notNull(),
  instructorName: text('instructor_name').notNull(),
  replyToEmail: text('reply_to_email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const certificateBatches = pgTable('certificate_batches', {
  id: serial('id').primaryKey(),
  issuerId: integer('issuer_id').notNull().references(() => certificateIssuers.id),
  courseName: text('course_name').notNull(),
  description: text('description').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  totalCount: integer('total_count').notNull(),
  successCount: integer('success_count').notNull().default(0),
})

export const certificates = pgTable('certificates', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: integer('batch_id').notNull().references(() => certificateBatches.id),
  issuerId: integer('issuer_id').notNull().references(() => certificateIssuers.id),
  studentName: text('student_name').notNull(),
  studentEmail: text('student_email').notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  isValid: boolean('is_valid').notNull().default(true),
  emailSentAt: timestamp('email_sent_at'),
})
```

- [ ] **Step 2: Run typecheck to verify no schema errors**

```bash
bun run typecheck
```

Expected: no TypeScript errors in schema.ts.

- [ ] **Step 3: Generate and apply migration**

```bash
bun run db:generate
bun run db:migrate
```

Expected: new migration file created in `drizzle/`, tables created in Neon DB.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add certificate_issuers, certificate_batches, certificates DB tables"
```

---

### Task 3: Create the internal certificates API route

**Files:**
- Create: `src/routes/api/certificates/send.ts`
- Create: `src/routes/api/certificates/issuer.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/routes/api/certificates
```

- [ ] **Step 2: Create src/routes/api/certificates/issuer.ts**

```ts
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { certificateIssuers } from '@/db/schema'

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
    const body = await request.json() as {
      orgName: string
      logoUrl: string
      instructorName: string
      replyToEmail: string
    }

    if (!body.orgName || !body.logoUrl || !body.instructorName || !body.replyToEmail) {
      return badRequest('All fields required: orgName, logoUrl, instructorName, replyToEmail')
    }

    // Upsert: always update the first issuer record (single-issuer model)
    const existing = await db.select().from(certificateIssuers).limit(1)

    let issuer
    if (existing.length > 0) {
      const [updated] = await db
        .update(certificateIssuers)
        .set({
          orgName: body.orgName,
          logoUrl: body.logoUrl,
          instructorName: body.instructorName,
          replyToEmail: body.replyToEmail,
        })
        .where(eq(certificateIssuers.id, existing[0].id))
        .returning()
      issuer = updated
    }
    else {
      const [created] = await db
        .insert(certificateIssuers)
        .values({
          orgName: body.orgName,
          logoUrl: body.logoUrl,
          instructorName: body.instructorName,
          replyToEmail: body.replyToEmail,
        })
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
```

- [ ] **Step 3: Create src/routes/api/certificates/send.ts**

```ts
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
    // Skip header row
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

    // Load issuer
    const [issuer] = await db.select().from(certificateIssuers).limit(1)
    if (!issuer) return badRequest('No issuer profile found — set up settings first')

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const resendApiKey = process.env.RESEND_API_KEY
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    // Create batch
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
      // Insert certificate record
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

      // Send email
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
        // No Resend configured — mark as no email sent
        skipped.push(student.email)
      }
    }

    // Update batch success count
    await db
      .update(certificateBatches)
      .set({ successCount })
      .where(eq(certificateBatches.id, batch.id))

    return ok({
      total: students.length,
      sent: successCount,
      failed: skipped.length,
      skipped,
      batchId: batch.id,
    })
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
```

- [ ] **Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors in the new API files.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/certificates/
git commit -m "feat: add certificate API routes for issuer upsert and batch send"
```

---

### Task 4: Update StackedLayout bypass for certificate verify page

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Update the bypassLayout condition in HTMLWrapper**

In `src/routes/__root.tsx`, find the `HTMLWrapper` function. Change:

```ts
const bypassLayout = location.pathname === '/' || location.pathname.startsWith('/party/')
```

To:

```ts
const bypassLayout = location.pathname === '/'
  || location.pathname.startsWith('/party/')
  || location.pathname.startsWith('/certificates/verify/')
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: bypass StackedLayout for certificate verify page"
```

---

### Task 5: Create certificate settings page

**Files:**
- Create: `src/routes/certificates.settings.tsx`

- [ ] **Step 1: Create the settings route**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

interface Issuer {
  id: number
  orgName: string
  logoUrl: string
  instructorName: string
  replyToEmail: string
}

function CertificateSettingsPage() {
  const [orgName, setOrgName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [instructorName, setInstructorName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/certificates/issuer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, logoUrl, instructorName, replyToEmail }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-2">
          Certificate Settings
        </div>
        <h1 className="f-display font-black text-[32px] tracking-tight text-[#1A1008]">
          Issuer Profile<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[12px] text-[#1A1008]/50 mt-2">
          This information appears on every certificate you generate.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Org Name */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="e.g. React Academy"
            required
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Logo URL
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            required
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {/* Instructor Name */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Instructor Name
          </label>
          <input
            type="text"
            value={instructorName}
            onChange={e => setInstructorName(e.target.value)}
            placeholder="e.g. Jane Smith"
            required
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {/* Reply-to Email */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Reply-To Email
          </label>
          <input
            type="email"
            value={replyToEmail}
            onChange={e => setReplyToEmail(e.target.value)}
            placeholder="certificates@example.com"
            required
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {error && (
          <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
            <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-8 py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Profile'}
        </button>
      </form>

      {/* Preview */}
      {(orgName || logoUrl) && (
        <div className="mt-10">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/40 mb-3">
            Certificate Header Preview
          </div>
          <div className="border-2 border-[#1A1008] bg-[#F7F3EC] p-8 text-center shadow-[5px_5px_0_#1A1008]">
            {logoUrl && (
              <img src={logoUrl} alt={orgName} className="h-12 mx-auto mb-4 object-contain" />
            )}
            <div className="f-display font-black text-[20px] text-[#1A1008]">{orgName || 'Organization Name'}</div>
            {instructorName && (
              <div className="f-mono text-[11px] text-[#1A1008]/50 mt-1">{instructorName}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/certificates/settings')({
  component: CertificateSettingsPage,
})
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/certificates.settings.tsx
git commit -m "feat: add certificate settings page for issuer profile"
```

---

### Task 6: Create certificate send page

**Files:**
- Create: `src/routes/certificates.send.tsx`

- [ ] **Step 1: Create the send route**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

interface SendResult {
  total: number
  sent: number
  failed: number
  skipped: string[]
  batchId: number
}

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
      const res = await fetch('/api/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText,
          courseName,
          description,
          expiresAt: expiresAt || undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setResult(data.data as SendResult)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    }
    finally {
      setSending(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="border-2 border-[#1B6B3A] bg-white shadow-[5px_5px_0_#1B6B3A] p-10 text-center">
          <div className="w-14 h-14 border-2 border-[#1B6B3A] bg-[#1B6B3A] mx-auto mb-6 flex items-center justify-center">
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
              { label: 'Sent', value: result.sent, color: '#1B6B3A' },
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
              className="border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
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
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="mb-8">
        <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-2">
          Send Certificates
        </div>
        <h1 className="f-display font-black text-[32px] tracking-tight text-[#1A1008]">
          New Batch<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[12px] text-[#1A1008]/50 mt-2">
          Upload a CSV and configure the course. Max 500 students per batch.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        {/* CSV Upload */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Student CSV
          </label>
          <div className="border-2 border-dashed border-[#1A1008]/30 bg-[#F7F3EC] p-6 text-center">
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
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
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
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
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
            className="border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
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
          className="w-full border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
        >
          {sending ? 'Sending certificates...' : `Generate & Send Certificates`}
        </button>
      </form>
    </div>
  )
}

export const Route = createFileRoute('/certificates/send')({
  component: CertificateSendPage,
})
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/certificates.send.tsx
git commit -m "feat: add certificate send page with CSV upload and batch form"
```

---

### Task 7: Create the public certificate verification page

**Files:**
- Create: `src/routes/certificates.verify.$id.tsx`

- [ ] **Step 1: Create the verification route**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { certificateBatches, certificateIssuers, certificates } from '@/db/schema'

interface CertData {
  id: string
  studentName: string
  studentEmail: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  courseName: string
  description: string
  orgName: string
  logoUrl: string
  instructorName: string
}

const getCertData = async (id: string): Promise<CertData | null> => {
  const [cert] = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1)
  if (!cert) return null

  const [batch] = await db.select().from(certificateBatches).where(eq(certificateBatches.id, cert.batchId)).limit(1)
  const [issuer] = await db.select().from(certificateIssuers).where(eq(certificateIssuers.id, cert.issuerId)).limit(1)

  if (!batch || !issuer) return null

  return {
    id: cert.id,
    studentName: cert.studentName,
    studentEmail: cert.studentEmail,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt?.toISOString() ?? null,
    isValid: cert.isValid,
    courseName: batch.courseName,
    description: batch.description,
    orgName: issuer.orgName,
    logoUrl: issuer.logoUrl,
    instructorName: issuer.instructorName,
  }
}

function CertificateVerifyPage() {
  const { cert } = Route.useLoaderData()

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-6">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-12 max-w-md w-full text-center">
          <div className="text-5xl mb-6">🔍</div>
          <h1 className="f-display font-black text-[24px] text-[#1A1008] mb-2">Certificate Not Found</h1>
          <p className="f-mono text-[12px] text-[#1A1008]/50">
            This certificate ID does not exist or may have been removed.
          </p>
        </div>
      </div>
    )
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const expiresDate = cert.expiresAt
    ? new Date(cert.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Revoked banner */}
        {!cert.isValid && (
          <div className="border-2 border-[#D4380D] bg-[#D4380D] text-white px-6 py-3 mb-4 text-center">
            <span className="f-mono text-[12px] tracking-wider uppercase">⚠ This certificate has been revoked</span>
          </div>
        )}

        {/* Certificate card */}
        <div className="border-4 border-[#1A1008] bg-white shadow-[8px_8px_0_#1A1008] p-12 text-center relative overflow-hidden">
          {/* Decorative double rule */}
          <div className="border-2 border-[#1A1008] absolute inset-3 pointer-events-none" />

          <div className="relative">
            {/* Logo */}
            <img src={cert.logoUrl} alt={cert.orgName} className="h-14 mx-auto mb-8 object-contain" />

            {/* Certificate label */}
            <div className="f-display italic text-[14px] text-[#1A1008]/50 tracking-widest mb-6">
              Certificate of Completion
            </div>

            {/* Student name */}
            <h1 className="f-display font-black text-[42px] tracking-tight text-[#1A1008] leading-none mb-2">
              {cert.studentName}
            </h1>

            <div className="f-mono text-[11px] tracking-[0.2em] uppercase text-[#1A1008]/40 mb-6">
              For successfully completing
            </div>

            {/* Course name */}
            <h2 className="f-display font-bold text-[24px] text-[#D4380D] mb-4">
              {cert.courseName}
            </h2>

            {/* Description */}
            <p className="f-mono text-[12px] text-[#1A1008]/60 max-w-md mx-auto mb-8 leading-relaxed">
              {cert.description}
            </p>

            {/* Dates */}
            <div className="border-t-2 border-[#1A1008]/10 pt-6 mb-6">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div>
                  <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30 mb-1">Issued</div>
                  <div className="f-mono text-[12px] text-[#1A1008]">{issuedDate}</div>
                </div>
                {expiresDate && (
                  <div>
                    <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30 mb-1">Expires</div>
                    <div className="f-mono text-[12px] text-[#1A1008]">{expiresDate}</div>
                  </div>
                )}
                <div>
                  <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30 mb-1">Instructor</div>
                  <div className="f-mono text-[12px] text-[#1A1008]">{cert.instructorName}</div>
                </div>
              </div>
            </div>

            {/* Certificate ID + verified badge */}
            <div className="border-t-2 border-[#1A1008]/10 pt-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-left">
                <div className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#1A1008]/30 mb-1">Certificate ID</div>
                <div className="f-mono text-[10px] text-[#1A1008]/50">{cert.id}</div>
              </div>
              {cert.isValid && (
                <div className="border-2 border-[#1B6B3A] bg-[#1B6B3A] px-4 py-2 flex items-center gap-2">
                  <span className="text-white text-sm">✓</span>
                  <span className="f-mono text-[10px] tracking-wider uppercase text-white">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/certificates/verify/$id')({
  loader: async ({ params }) => {
    const cert = await getCertData(params.id)
    return { cert }
  },
  component: CertificateVerifyPage,
})
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/certificates.verify.\$id.tsx
git commit -m "feat: add public certificate verification page"
```

---

### Task 8: Create the certificates dashboard

**Files:**
- Create: `src/routes/certificates.tsx`

- [ ] **Step 1: Create the dashboard route**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { certificateBatches, certificateIssuers, certificates } from '@/db/schema'

type CertStatus = 'all' | 'sent' | 'failed' | 'revoked'

interface BatchWithCerts {
  id: number
  courseName: string
  sentAt: string
  totalCount: number
  successCount: number
  certs: Array<{
    id: string
    studentName: string
    studentEmail: string
    issuedAt: string
    expiresAt: string | null
    isValid: boolean
    emailSentAt: string | null
  }>
}

const getDashboardData = async () => {
  const batches = await db
    .select()
    .from(certificateBatches)
    .orderBy(desc(certificateBatches.sentAt))
    .limit(20)

  const result: BatchWithCerts[] = []
  for (const batch of batches) {
    const certs = await db
      .select()
      .from(certificates)
      .where(eq(certificates.batchId, batch.id))
      .orderBy(certificates.studentName)

    result.push({
      id: batch.id,
      courseName: batch.courseName,
      sentAt: batch.sentAt.toISOString(),
      totalCount: batch.totalCount,
      successCount: batch.successCount,
      certs: certs.map(c => ({
        id: c.id,
        studentName: c.studentName,
        studentEmail: c.studentEmail,
        issuedAt: c.issuedAt.toISOString(),
        expiresAt: c.expiresAt?.toISOString() ?? null,
        isValid: c.isValid,
        emailSentAt: c.emailSentAt?.toISOString() ?? null,
      })),
    })
  }

  return result
}

function CertStatus({ cert }: { cert: BatchWithCerts['certs'][number] }) {
  if (!cert.isValid) {
    return (
      <span className="border border-[#D4380D] bg-[#D4380D]/[0.08] px-2 py-0.5 f-mono text-[9px] tracking-wider uppercase text-[#D4380D]">
        Revoked
      </span>
    )
  }
  if (!cert.emailSentAt) {
    return (
      <span className="border border-[#1A1008]/30 bg-[#1A1008]/[0.05] px-2 py-0.5 f-mono text-[9px] tracking-wider uppercase text-[#1A1008]/50">
        Failed
      </span>
    )
  }
  return (
    <span className="border border-[#1B6B3A] bg-[#1B6B3A]/[0.08] px-2 py-0.5 f-mono text-[9px] tracking-wider uppercase text-[#1B6B3A]">
      Sent
    </span>
  )
}

function CertificatesDashboard() {
  const { batches } = Route.useLoaderData()
  const [filter, setFilter] = useState<CertStatus>('all')
  const [revoking, setRevoking] = useState<string | null>(null)

  const revoke = async (certId: string) => {
    setRevoking(certId)
    try {
      await fetch('/api/certificates/issuer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'revoke', certId }),
      })
      // Reload to reflect change
      window.location.reload()
    }
    finally {
      setRevoking(null)
    }
  }

  const filterCert = (cert: BatchWithCerts['certs'][number]) => {
    if (filter === 'all') return true
    if (filter === 'sent') return !!cert.emailSentAt && cert.isValid
    if (filter === 'failed') return !cert.emailSentAt
    if (filter === 'revoked') return !cert.isValid
    return true
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-2">
            Certificates
          </div>
          <h1 className="f-display font-black text-[36px] tracking-tight text-[#1A1008]">
            Dashboard<span className="text-[#D4380D]">.</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/certificates/settings"
            className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            Settings
          </Link>
          <Link
            to="/certificates/send"
            className="border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            New Batch
          </Link>
        </div>
      </div>

      {/* Filter strip */}
      <div className="flex gap-2 mb-6 border-b-2 border-[#1A1008]/10 pb-4">
        {(['all', 'sent', 'failed', 'revoked'] as CertStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'f-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border-2 transition-all duration-100',
              filter === f
                ? 'border-[#D4380D] bg-[#D4380D] text-white'
                : 'border-[#1A1008]/20 bg-white text-[#1A1008]/50 hover:border-[#1A1008]/40',
            ].join(' ')}
          >
            {f}
          </button>
        ))}
      </div>

      {batches.length === 0
        ? (
            <div className="border-2 border-[#1A1008]/20 bg-white p-12 text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h2 className="f-display font-black text-[22px] text-[#1A1008] mb-2">No certificates yet</h2>
              <p className="f-mono text-[12px] text-[#1A1008]/40">
                Start by{' '}
                <Link to="/certificates/settings" className="text-[#D4380D] underline">setting up your issuer profile</Link>
                {' '}then{' '}
                <Link to="/certificates/send" className="text-[#D4380D] underline">sending a batch</Link>.
              </p>
            </div>
          )
        : (
            <div className="space-y-8">
              {batches.map(batch => {
                const filteredCerts = batch.certs.filter(filterCert)
                if (filteredCerts.length === 0) return null

                return (
                  <div key={batch.id}>
                    {/* Batch header */}
                    <div className="border-2 border-[#1A1008] bg-[#1A1008] px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="f-display font-bold text-[16px] text-white">{batch.courseName}</span>
                        <span className="f-mono text-[10px] text-white/40 ml-4">
                          {new Date(batch.sentAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="f-mono text-[10px] text-white/50">
                        {batch.successCount} of {batch.totalCount} delivered
                      </span>
                    </div>

                    {/* Rows */}
                    <div className="border-2 border-t-0 border-[#1A1008]/20 bg-white divide-y divide-[#1A1008]/10">
                      {filteredCerts.map(cert => (
                        <div key={cert.id} className="px-5 py-3 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="f-mono text-[13px] font-medium text-[#1A1008]">{cert.studentName}</div>
                            <div className="f-mono text-[10px] text-[#1A1008]/40">{cert.studentEmail}</div>
                          </div>
                          <CertStatus cert={cert} />
                          <a
                            href={`/certificates/verify/${cert.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="f-mono text-[10px] text-[#D4380D] hover:underline"
                          >
                            View ↗
                          </a>
                          {cert.isValid && (
                            <button
                              onClick={() => revoke(cert.id)}
                              disabled={revoking === cert.id}
                              className="f-mono text-[10px] text-[#1A1008]/30 hover:text-[#D4380D] transition-colors disabled:opacity-50"
                            >
                              {revoking === cert.id ? 'Revoking...' : 'Revoke'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}

export const Route = createFileRoute('/certificates')({
  loader: async () => {
    const batches = await getDashboardData()
    return { batches }
  },
  component: CertificatesDashboard,
})
```

- [ ] **Step 2: Add revoke support to the issuer API**

In `src/routes/api/certificates/issuer.ts`, add a `revoke` case to the POST handler, inside the try block before the upsert logic:

```ts
// Handle revoke operation
if ('type' in body && body.type === 'revoke') {
  const certId = (body as { type: string; certId: string }).certId
  if (!certId) return badRequest('certId required for revoke')
  
  const [updated] = await db
    .update(certificates)
    .set({ isValid: false })
    .where(eq(certificates.id, certId))
    .returning()
  
  return ok({ revoked: true, cert: updated })
}
```

Add the `certificates` import at the top of the issuer.ts file:
```ts
import { certificateIssuers, certificates } from '@/db/schema'
```

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/certificates.tsx src/routes/api/certificates/issuer.ts
git commit -m "feat: add certificates dashboard with batch view, filter, and revoke"
```

---

### Task 9: Run build and verify

- [ ] **Step 1: Run full build**

```bash
bun run build
```

Expected: build succeeds with no errors.

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete certificate generation tool — settings, send, verify, dashboard"
```
