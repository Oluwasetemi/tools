# Testimonial Gathering Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a host to open a real-time testimonial collection campaign, share a submission link with students, moderate submissions in a live queue, and display approved testimonials on a public wall — all via PartyKit WebSockets with Drizzle/Neon persistence.

**Architecture:** PartyKit-based (same pattern as polls, feedback, feelings). One PartyKit room per campaign. In-memory state + `room.storage` for bootstrap. DB persistence via `callInternalApi('testimonials', ...)` — fire-and-forget for submissions/moderation, awaited for session creation. Routes under `/testimonials/*` bypass StackedLayout.

**Tech Stack:** PartyKit (`party/testimonials.ts`), `usePartySocket` hook, TanStack Start file-based routing, Drizzle ORM + Neon PostgreSQL, Broadsheet design system (purple `#6D28D9` accent, `#F7F3EC` background, Playfair Display + JetBrains Mono).

---

## File Structure

**New files:**
- `src/db/schema.ts` — add 2 tables (modify existing)
- `party/testimonials.ts` — PartyKit server
- `party/lib/db-client.ts` — add `'testimonials'` to domain union (modify existing)
- `partykit.json` — register `testimonials` party (modify existing)
- `src/routes/api/internal/testimonials.ts` — internal API for DB operations
- `src/hooks/use-testimonials-socket.ts` — `usePartySocket` hook
- `src/components/ui/testimonial-submit.tsx` — student submission form component
- `src/components/ui/testimonial-host.tsx` — host moderation queue component
- `src/components/ui/testimonial-wall.tsx` — public approved testimonials wall component
- `src/routes/testimonials.tsx` — host dashboard (list campaigns, create room, copy links)
- `src/routes/testimonials.host.tsx` — moderation queue route wrapper
- `src/routes/testimonials.submit.tsx` — student submission route wrapper
- `src/routes/testimonials.wall.tsx` — public wall route wrapper
- `src/routes/__root.tsx` — add `/testimonials` to bypass condition (modify existing)

---

### Task 1: Add testimonials DB schema tables

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add two tables to schema.ts**

Open `src/db/schema.ts`. After the existing certificate tables (or after `feelingEmojis` if certificates task not done yet), append:

```ts
// Testimonials Tables
export const testimonialSessions = pgTable('testimonial_sessions', {
  id: serial('id').primaryKey(),
  roomId: text('room_id').notNull().unique(),
  title: text('title').notNull(),
  createdBy: text('created_by').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => testimonialSessions.id),
  roomId: text('room_id').notNull(),
  studentName: text('student_name').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('pending'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  moderatedAt: timestamp('moderated_at'),
})
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Generate and apply migration**

```bash
bun run db:generate
bun run db:migrate
```

Expected: new migration files in `drizzle/`, tables created in Neon DB.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add testimonial_sessions and testimonials DB tables"
```

---

### Task 2: Create the internal testimonials API route

**Files:**
- Create: `src/routes/api/internal/testimonials.ts`

- [ ] **Step 1: Create src/routes/api/internal/testimonials.ts**

```ts
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
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/internal/testimonials.ts
git commit -m "feat: add internal testimonials API route (create/submit/moderate/close)"
```

---

### Task 3: Update db-client and partykit.json, create PartyKit server

**Files:**
- Modify: `party/lib/db-client.ts`
- Modify: `partykit.json`
- Create: `party/testimonials.ts`

- [ ] **Step 1: Add 'testimonials' to the db-client domain union**

In `party/lib/db-client.ts`, find:

```ts
domain: 'kahoot' | 'polls' | 'feedback' | 'feelings',
```

Change to:

```ts
domain: 'kahoot' | 'polls' | 'feedback' | 'feelings' | 'testimonials',
```

- [ ] **Step 2: Register testimonials in partykit.json**

In `partykit.json`, add `"testimonials": "party/testimonials.ts"` to the `parties` object:

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "tools",
  "main": "party/index.ts",
  "compatibilityDate": "2025-09-02",
  "parties": {
    "polls": "party/polls.ts",
    "kahoot": "party/kahoot.ts",
    "feedback": "party/feedback.ts",
    "feelings": "party/feelings.ts",
    "testimonials": "party/testimonials.ts"
  },
  "vars": {
    "APP_URL": "",
    "INTERNAL_API_SECRET": ""
  }
}
```

- [ ] **Step 3: Create party/testimonials.ts**

```ts
import type * as Party from 'partykit/server'
import { callInternalApi } from './lib/db-client'

interface TestimonialSession {
  roomId: string
  title: string
  createdBy: string
  isActive: boolean
  createdAt: number
}

interface Testimonial {
  id: string
  dbId: number | null
  studentName: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: number
  submitterConnectionId: string
}

type ClientMessage
  = | { type: 'create_session', title: string }
    | { type: 'submit_testimonial', studentName: string, content: string }
    | { type: 'moderate_testimonial', id: string, action: 'approve' | 'reject' }
    | { type: 'close_session' }
    | { type: 'get_state' }

type ServerMessage
  = | { type: 'session_created', session: TestimonialSession }
    | { type: 'session_state', session: TestimonialSession | null, testimonials: Testimonial[] }
    | { type: 'testimonial_submitted', testimonial: Testimonial }
    | { type: 'testimonial_moderated', testimonial: Testimonial }
    | { type: 'session_closed', session: TestimonialSession }
    | { type: 'connection_count', count: number }
    | { type: 'error', message: string }

export default class TestimonialsServer implements Party.Server {
  private session: TestimonialSession | null = null
  private testimonials: Map<string, Testimonial> = new Map()
  private hostId: string | null = null
  private dbSessionId: number | null = null
  // One submission per WebSocket connection
  private submittedConnections: Set<string> = new Set()

  constructor(readonly room: Party.Room) {}

  async onStart() {
    this.session = await this.room.storage.get<TestimonialSession>('session') ?? null
    const stored = await this.room.storage.get<[string, Testimonial][]>('testimonials') ?? []
    this.testimonials = new Map(stored)
    this.hostId = await this.room.storage.get<string>('hostId') ?? null
    this.dbSessionId = await this.room.storage.get<number>('dbSessionId') ?? null
  }

  onConnect(conn: Party.Connection) {
    // Send current state to new connection
    conn.send(JSON.stringify({
      type: 'session_state',
      session: this.session,
      testimonials: Array.from(this.testimonials.values()),
    } as ServerMessage))

    this.broadcastConnectionCount()
  }

  onClose(_conn: Party.Connection) {
    this.broadcastConnectionCount()
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== 'string') return

    try {
      const data: ClientMessage = JSON.parse(message)

      switch (data.type) {
        case 'create_session':
          await this.handleCreateSession(data.title, sender)
          break
        case 'submit_testimonial':
          await this.handleSubmitTestimonial(data.studentName, data.content, sender)
          break
        case 'moderate_testimonial':
          await this.handleModerateTestimonial(data.id, data.action, sender)
          break
        case 'close_session':
          await this.handleCloseSession(sender)
          break
        case 'get_state':
          sender.send(JSON.stringify({
            type: 'session_state',
            session: this.session,
            testimonials: Array.from(this.testimonials.values()),
          } as ServerMessage))
          break
      }
    }
    catch {
      sender.send(JSON.stringify({ type: 'error', message: 'Invalid message format' } as ServerMessage))
    }
  }

  private async handleCreateSession(title: string, sender: Party.Connection) {
    if (this.session && this.session.isActive) {
      sender.send(JSON.stringify({ type: 'error', message: 'Session already active' } as ServerMessage))
      return
    }

    this.session = {
      roomId: this.room.id,
      title,
      createdBy: sender.id,
      isActive: true,
      createdAt: Date.now(),
    }
    this.hostId = sender.id

    await this.room.storage.put('session', this.session)
    await this.room.storage.put('hostId', this.hostId)

    // Awaited — must have dbSessionId before submissions arrive
    try {
      const result = await callInternalApi('testimonials', {
        type: 'create_session',
        roomId: this.room.id,
        title,
        createdBy: sender.id,
      })
      if (result?.ok) {
        this.dbSessionId = (result.data as { id: number }).id
        await this.room.storage.put('dbSessionId', this.dbSessionId)
      }
    }
    catch (err) {
      console.error('[testimonials] DB create_session failed:', err)
    }

    this.room.broadcast(JSON.stringify({ type: 'session_created', session: this.session } as ServerMessage))
  }

  private async handleSubmitTestimonial(studentName: string, content: string, sender: Party.Connection) {
    if (!this.session || !this.session.isActive) {
      sender.send(JSON.stringify({ type: 'error', message: 'No active session' } as ServerMessage))
      return
    }

    if (this.submittedConnections.has(sender.id)) {
      sender.send(JSON.stringify({ type: 'error', message: 'You have already submitted a testimonial' } as ServerMessage))
      return
    }

    const id = crypto.randomUUID()
    const testimonial: Testimonial = {
      id,
      dbId: null,
      studentName,
      content,
      status: 'pending',
      submittedAt: Date.now(),
      submitterConnectionId: sender.id,
    }

    this.testimonials.set(id, testimonial)
    this.submittedConnections.add(sender.id)
    await this.room.storage.put('testimonials', Array.from(this.testimonials.entries()))

    // Broadcast immediately — DB is fire-and-forget
    this.room.broadcast(JSON.stringify({ type: 'testimonial_submitted', testimonial } as ServerMessage))

    // Persist to DB (fire-and-forget)
    ;(async () => {
      try {
        if (this.dbSessionId) {
          const result = await callInternalApi('testimonials', {
            type: 'submit_testimonial',
            sessionId: this.dbSessionId,
            roomId: this.room.id,
            studentName,
            content,
          })
          if (result?.ok) {
            const dbId = (result.data as { id: number }).id
            const t = this.testimonials.get(id)
            if (t) {
              t.dbId = dbId
              this.testimonials.set(id, t)
              await this.room.storage.put('testimonials', Array.from(this.testimonials.entries()))
            }
          }
        }
      }
      catch (err) {
        console.error('[testimonials] DB submit_testimonial failed:', err)
      }
    })()
  }

  private async handleModerateTestimonial(id: string, action: 'approve' | 'reject', sender: Party.Connection) {
    if (sender.id !== this.hostId) {
      sender.send(JSON.stringify({ type: 'error', message: 'Only the host can moderate testimonials' } as ServerMessage))
      return
    }

    const testimonial = this.testimonials.get(id)
    if (!testimonial) {
      sender.send(JSON.stringify({ type: 'error', message: 'Testimonial not found' } as ServerMessage))
      return
    }

    testimonial.status = action
    this.testimonials.set(id, testimonial)
    await this.room.storage.put('testimonials', Array.from(this.testimonials.entries()))

    this.room.broadcast(JSON.stringify({ type: 'testimonial_moderated', testimonial } as ServerMessage))

    // Fire-and-forget DB update
    ;(async () => {
      try {
        if (testimonial.dbId) {
          await callInternalApi('testimonials', {
            type: 'moderate_testimonial',
            id: testimonial.dbId,
            roomId: this.room.id,
            action,
          })
        }
      }
      catch (err) {
        console.error('[testimonials] DB moderate_testimonial failed:', err)
      }
    })()
  }

  private async handleCloseSession(sender: Party.Connection) {
    if (sender.id !== this.hostId) {
      sender.send(JSON.stringify({ type: 'error', message: 'Only the host can close the session' } as ServerMessage))
      return
    }

    if (!this.session) return

    this.session.isActive = false
    await this.room.storage.put('session', this.session)

    this.room.broadcast(JSON.stringify({ type: 'session_closed', session: this.session } as ServerMessage))

    // Fire-and-forget
    ;(async () => {
      try {
        await callInternalApi('testimonials', { type: 'close_session', roomId: this.room.id })
      }
      catch (err) {
        console.error('[testimonials] DB close_session failed:', err)
      }
    })()
  }

  private broadcastConnectionCount() {
    const count = [...this.room.getConnections()].length
    this.room.broadcast(JSON.stringify({ type: 'connection_count', count } as ServerMessage))
  }
}

TestimonialsServer satisfies Party.Worker
```

- [ ] **Step 4: Commit**

```bash
git add party/testimonials.ts party/lib/db-client.ts partykit.json
git commit -m "feat: add testimonials PartyKit server with moderation and persistence"
```

---

### Task 4: Create the testimonials socket hook

**Files:**
- Create: `src/hooks/use-testimonials-socket.ts`

- [ ] **Step 1: Create src/hooks/use-testimonials-socket.ts**

```ts
import type PartySocket from 'partysocket'
import usePartySocket from 'partysocket/react'
import { useState } from 'react'

export interface TestimonialSession {
  roomId: string
  title: string
  createdBy: string
  isActive: boolean
  createdAt: number
}

export interface Testimonial {
  id: string
  dbId: number | null
  studentName: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: number
  submitterConnectionId: string
}

type ServerMessage
  = | { type: 'session_created', session: TestimonialSession }
    | { type: 'session_state', session: TestimonialSession | null, testimonials: Testimonial[] }
    | { type: 'testimonial_submitted', testimonial: Testimonial }
    | { type: 'testimonial_moderated', testimonial: Testimonial }
    | { type: 'session_closed', session: TestimonialSession }
    | { type: 'connection_count', count: number }
    | { type: 'error', message: string }

interface UseTestimonialsSocketReturn {
  readonly socket: PartySocket | null
  readonly session: TestimonialSession | null
  readonly testimonials: Testimonial[]
  readonly connectionCount: number
  readonly error: string | null
}

export function useTestimonialsSocket(
  roomId: string,
  host: string = 'localhost:1999',
): UseTestimonialsSocketReturn {
  const [session, setSession] = useState<TestimonialSession | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'testimonials',

    onMessage(event: MessageEvent) {
      if (typeof event.data !== 'string') return
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
        case 'session_created':
          setSession(data.session)
          setError(null)
          break

        case 'session_state':
          setSession(data.session)
          setTestimonials(data.testimonials)
          break

        case 'testimonial_submitted':
          setTestimonials(prev => {
            if (prev.find(t => t.id === data.testimonial.id)) return prev
            return [...prev, data.testimonial]
          })
          break

        case 'testimonial_moderated':
          setTestimonials(prev =>
            prev.map(t => t.id === data.testimonial.id ? data.testimonial : t),
          )
          break

        case 'session_closed':
          setSession(data.session)
          break

        case 'connection_count':
          setConnectionCount(data.count)
          break

        case 'error':
          setError(data.message)
          break
      }
    },
  })

  return { socket, session, testimonials, connectionCount, error }
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-testimonials-socket.ts
git commit -m "feat: add useTestimonialsSocket hook"
```

---

### Task 5: Create student submission form component

**Files:**
- Create: `src/components/ui/testimonial-submit.tsx`

- [ ] **Step 1: Create src/components/ui/testimonial-submit.tsx**

```tsx
import { useState } from 'react'
import { useTestimonialsSocket } from '@/hooks/use-testimonials-socket'

interface TestimonialSubmitProps {
  roomId: string
  host?: string
}

export function TestimonialSubmit({ roomId, host = 'localhost:1999' }: TestimonialSubmitProps) {
  const { socket, session, error } = useTestimonialsSocket(roomId, host)
  const [studentName, setStudentName] = useState('')
  const [content, setContent] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!socket || !session?.isActive) return
    if (content.trim().length < 20) {
      setSubmitError('Testimonial must be at least 20 characters')
      return
    }
    socket.send(JSON.stringify({ type: 'submit_testimonial', studentName: studentName.trim(), content: content.trim() }))
    setSubmittedName(studentName.trim())
    setHasSubmitted(true)
    setSubmitError(null)
  }

  // Waiting — no session yet
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 border-2 border-[#6D28D9] mx-auto mb-6 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="f-display font-black text-[22px] tracking-tight text-[#1A1008] mb-2">
            Session not started yet
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            The host will open the session shortly.
          </p>
        </div>
      </div>
    )
  }

  // Closed
  if (!session.isActive) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1A1008]/30 bg-white p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="f-display font-black text-[22px] tracking-tight text-[#1A1008] mb-2">
            Session Closed
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/40 leading-loose">
            This session is no longer accepting testimonials.
          </p>
        </div>
      </div>
    )
  }

  // Thank you
  if (hasSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1B6B3A] bg-white shadow-[5px_5px_0_#1B6B3A] p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 border-2 border-[#1B6B3A] bg-[#1B6B3A] mx-auto mb-6 flex items-center justify-center">
            <span className="text-white text-xl font-bold">✓</span>
          </div>
          <h2 className="f-display font-black text-[24px] tracking-tight text-[#1A1008] mb-2">
            Thank you, {submittedName}!
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            Your testimonial has been submitted for review.
          </p>
          <div className="mt-6 border-t border-[#1A1008]/10 pt-4">
            <p className="f-mono text-[10px] tracking-wider uppercase text-[#1B6B3A]">
              You may close this window
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Active form
  return (
    <div className="flex-1 flex items-start justify-center p-6 pt-8 min-h-[60vh]">
      <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] max-w-lg w-full">
        {/* Header */}
        <div className="border-b-2 border-[#1A1008] px-6 py-5">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-2">
            Share your experience
          </div>
          <h1 className="f-display font-black text-[22px] sm:text-[26px] tracking-[-0.02em] text-[#1A1008] leading-tight">
            {session.title}
          </h1>
        </div>

        {/* Error */}
        {(error || submitError) && (
          <div className="mx-6 mt-4 border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
            <span className="f-mono text-[11px] text-[#D4380D]">{error || submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow"
            />
          </div>

          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 mb-1.5">
              Your Testimonial
            </label>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setSubmitError(null) }}
              placeholder="Share your experience (at least 20 characters)..."
              required
              rows={5}
              className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow resize-none"
            />
            <div className="f-mono text-[9px] text-[#1A1008]/30 text-right mt-1">
              {content.length} chars {content.length < 20 ? `(${20 - content.length} more needed)` : '✓'}
            </div>
          </div>

          <button
            type="submit"
            disabled={!studentName.trim() || content.trim().length < 20}
            className="w-full border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
          >
            Submit Testimonial
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/testimonial-submit.tsx
git commit -m "feat: add testimonial student submission form component"
```

---

### Task 6: Create host moderation queue component

**Files:**
- Create: `src/components/ui/testimonial-host.tsx`

- [ ] **Step 1: Create src/components/ui/testimonial-host.tsx**

```tsx
import { useState } from 'react'
import { useTestimonialsSocket } from '@/hooks/use-testimonials-socket'
import type { Testimonial } from '@/hooks/use-testimonials-socket'

interface TestimonialHostProps {
  roomId: string
  host?: string
}

export function TestimonialHost({ roomId, host = 'localhost:1999' }: TestimonialHostProps) {
  const { socket, session, testimonials, connectionCount, error } = useTestimonialsSocket(roomId, host)
  const [showTitle, setShowTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [showApproved, setShowApproved] = useState(false)
  const [showRejected, setShowRejected] = useState(false)

  const pending = testimonials.filter(t => t.status === 'pending')
  const approved = testimonials.filter(t => t.status === 'approved')
  const rejected = testimonials.filter(t => t.status === 'rejected')

  const createSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (!socket || !showTitle.trim()) return
    socket.send(JSON.stringify({ type: 'create_session', title: showTitle.trim() }))
    setCreating(false)
  }

  const moderate = (id: string, action: 'approve' | 'reject') => {
    socket?.send(JSON.stringify({ type: 'moderate_testimonial', id, action }))
  }

  const closeSession = () => {
    if (!socket || !session?.isActive) return
    if (!confirm('Close this session? Students will no longer be able to submit testimonials.')) return
    socket.send(JSON.stringify({ type: 'close_session' }))
  }

  const TestimonialCard = ({ t, showActions }: { t: Testimonial; showActions: boolean }) => (
    <div className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008] p-5">
      <div className="f-display font-black text-[16px] text-[#1A1008] mb-2">{t.studentName}</div>
      <p className="f-mono text-[12px] text-[#1A1008]/70 leading-relaxed mb-4">{t.content}</p>
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={() => moderate(t.id, 'approve')}
            className="flex-1 border-2 border-[#1B6B3A] bg-[#1B6B3A] text-white f-mono text-[10px] tracking-[0.12em] uppercase py-2 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => moderate(t.id, 'reject')}
            className="flex-1 border-2 border-[#D4380D] bg-[#D4380D] text-white f-mono text-[10px] tracking-[0.12em] uppercase py-2 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  )

  // No session — create form
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10 max-w-md w-full">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-2">Host Controls</div>
          <h2 className="f-display font-black text-[24px] text-[#1A1008] mb-6">
            Start Campaign<span className="text-[#6D28D9]">.</span>
          </h2>
          <form onSubmit={createSession} className="space-y-4">
            <div>
              <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 mb-1.5">
                Campaign Title
              </label>
              <input
                type="text"
                value={showTitle}
                onChange={e => setShowTitle(e.target.value)}
                placeholder="e.g. React Workshop — May 2026"
                required
                autoFocus
                className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow"
              />
            </div>
            <button
              type="submit"
              disabled={!showTitle.trim()}
              className="w-full border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
            >
              Open Campaign
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
      {/* Session header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-1">Active Campaign</div>
          <h2 className="f-display font-black text-[24px] text-[#1A1008]">{session.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
            <span className="f-mono text-[10px] tracking-wider text-[#1A1008]/40">{connectionCount} online</span>
          </div>
        </div>
        {session.isActive && (
          <button
            onClick={closeSession}
            className="border-2 border-[#D4380D] text-[#D4380D] f-mono text-[10px] tracking-[0.12em] uppercase px-4 py-2 hover:bg-[#D4380D] hover:text-white transition-colors shrink-0"
          >
            Close Session
          </button>
        )}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 border-2 border-[#1A1008] mb-6">
        {[
          { label: 'Pending', count: pending.length, color: '#6D28D9' },
          { label: 'Approved', count: approved.length, color: '#1B6B3A' },
          { label: 'Rejected', count: rejected.length, color: '#D4380D' },
        ].map((stat, i) => (
          <div key={stat.label} className={`px-4 py-3 text-center ${i < 2 ? 'border-r-2 border-[#1A1008]' : ''}`}>
            <div className="f-display font-black text-[28px]" style={{ color: stat.color }}>{stat.count}</div>
            <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40">{stat.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2 mb-4">
          <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
        </div>
      )}

      {!session.isActive && (
        <div className="border-2 border-[#1A1008]/20 bg-[#1A1008]/[0.04] px-4 py-3 mb-6 text-center">
          <span className="f-mono text-[11px] text-[#1A1008]/50">Session closed — no new submissions accepted</span>
        </div>
      )}

      {/* Pending section */}
      <div className="mb-8">
        <div className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#6D28D9] mb-3">
          Pending Review ({pending.length})
        </div>
        {pending.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-6 text-center">
                <p className="f-mono text-[11px] text-[#1A1008]/30">No pending submissions</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {pending.map(t => <TestimonialCard key={t.id} t={t} showActions={true} />)}
              </div>
            )}
      </div>

      {/* Approved section */}
      <div className="mb-6">
        <button
          onClick={() => setShowApproved(!showApproved)}
          className="flex items-center gap-2 f-mono text-[10px] tracking-[0.2em] uppercase text-[#1B6B3A] mb-3"
        >
          <span>{showApproved ? '▼' : '▶'}</span>
          Approved ({approved.length})
        </button>
        {showApproved && (
          <div className="space-y-3">
            {approved.map(t => <TestimonialCard key={t.id} t={t} showActions={false} />)}
          </div>
        )}
      </div>

      {/* Rejected section */}
      <div>
        <button
          onClick={() => setShowRejected(!showRejected)}
          className="flex items-center gap-2 f-mono text-[10px] tracking-[0.2em] uppercase text-[#D4380D] mb-3"
        >
          <span>{showRejected ? '▼' : '▶'}</span>
          Rejected ({rejected.length})
        </button>
        {showRejected && (
          <div className="space-y-3">
            {rejected.map(t => <TestimonialCard key={t.id} t={t} showActions={false} />)}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/testimonial-host.tsx
git commit -m "feat: add testimonial host moderation queue component"
```

---

### Task 7: Create public testimonials wall component

**Files:**
- Create: `src/components/ui/testimonial-wall.tsx`

- [ ] **Step 1: Create src/components/ui/testimonial-wall.tsx**

```tsx
import { useTestimonialsSocket } from '@/hooks/use-testimonials-socket'

interface TestimonialWallProps {
  roomId: string
  host?: string
}

export function TestimonialWall({ roomId, host = 'localhost:1999' }: TestimonialWallProps) {
  const { session, testimonials, connectionCount } = useTestimonialsSocket(roomId, host)

  const approved = testimonials.filter(t => t.status === 'approved')

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Header */}
      <div className="border-b-2 border-[#1A1008] px-6 py-8 text-center relative">
        <div className="h-1 bg-[#6D28D9] absolute top-0 left-0 right-0" />
        <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-3">
          Testimonials Wall
        </div>
        <h1 className="f-display font-black text-[36px] sm:text-[48px] tracking-tight text-[#1A1008]">
          {session?.title || 'Testimonials'}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
          <span className="f-mono text-[10px] tracking-wider text-[#1A1008]/40">{connectionCount} viewing</span>
        </div>
      </div>

      {/* Wall content */}
      <div className="p-6">
        {approved.length === 0
          ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center">
                  <div className="f-display italic text-[80px] text-[#1A1008]/10 leading-none mb-4">"</div>
                  <p className="f-mono text-[12px] text-[#1A1008]/30">Be the first to share your experience</p>
                </div>
              </div>
            )
          : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 max-w-6xl mx-auto">
                {approved.map(t => (
                  <div
                    key={t.id}
                    className="break-inside-avoid mb-5 border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6"
                    style={{
                      animation: 'slide-in-up 0.4s ease-out',
                    }}
                  >
                    <div className="f-display text-[64px] text-[#6D28D9]/20 leading-none -mb-2">"</div>
                    <p className="f-display italic text-[16px] text-[#1A1008] leading-relaxed mb-4">
                      {t.content}
                    </p>
                    <div className="border-t border-[#1A1008]/10 pt-3">
                      <span className="f-mono text-[11px] text-[#1A1008]/60">— {t.studentName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>

      <style>{`
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/testimonial-wall.tsx
git commit -m "feat: add testimonials wall component with masonry layout"
```

---

### Task 8: Create routes and update bypass condition

**Files:**
- Create: `src/routes/testimonials.tsx`
- Create: `src/routes/testimonials.host.tsx`
- Create: `src/routes/testimonials.submit.tsx`
- Create: `src/routes/testimonials.wall.tsx`
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Update __root.tsx bypass condition to include /testimonials**

In `src/routes/__root.tsx`, find the `bypassLayout` line and change it to:

```ts
const bypassLayout = location.pathname === '/'
  || location.pathname.startsWith('/party/')
  || location.pathname.startsWith('/certificates/verify/')
  || location.pathname.startsWith('/testimonials')
```

- [ ] **Step 2: Create src/routes/testimonials.host.tsx**

```tsx
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { TestimonialHost } from '@/components/ui/testimonial-host'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'

function TestimonialsHostPage() {
  const { room } = useSearch({ from: '/testimonials/host' })
  const [copied, setCopied] = useState(false)

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="f-mono text-[12px] text-[#D4380D]">Missing ?room= parameter</div>
      </div>
    )
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitUrl = `${window.location.origin}/testimonials/submit?room=${room}`
  const wallUrl = `${window.location.origin}/testimonials/wall?room=${room}`

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      <div className="h-1 bg-[#6D28D9] shrink-0" />

      {/* Top nav */}
      <nav className="border-b-2 border-[#1A1008] px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-0">
          <a href="/" className="bg-[#F7F3EC] border-r-2 border-[#1A1008] px-3 py-1.5 f-display font-black text-[13px] tracking-tight text-[#1A1008]">
            TOOLS<span className="text-[#D4380D]">.</span>
          </a>
          <div className="bg-[#6D28D9] border-r-2 border-[#1A1008] px-3 py-1.5">
            <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-white/70">Host</span>
          </div>
          <code className="px-3 py-1.5 f-mono text-[9px] text-[#1A1008]/40">{room}</code>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyLink(submitUrl)}
            className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-1.5"
          >
            <Copy size={10} />
            {copied ? 'Copied!' : 'Submit Link'}
          </button>
          <button
            onClick={() => copyLink(wallUrl)}
            className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-1.5"
          >
            <Copy size={10} />
            Wall Link
          </button>
        </div>
      </nav>

      <TestimonialHost roomId={room} host={PARTYKIT_HOST} />
    </div>
  )
}

export const Route = createFileRoute('/testimonials/host')({
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || '',
  }),
  component: TestimonialsHostPage,
})
```

- [ ] **Step 3: Create src/routes/testimonials.submit.tsx**

```tsx
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { TestimonialSubmit } from '@/components/ui/testimonial-submit'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'

function TestimonialsSubmitPage() {
  const { room } = useSearch({ from: '/testimonials/submit' })

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="f-mono text-[12px] text-[#D4380D]">Missing ?room= parameter</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      <div className="h-1 bg-[#6D28D9] shrink-0" />
      <nav className="px-4 h-9 flex items-center justify-between border-b border-[#1A1008]/10 shrink-0">
        <a href="/" className="f-display font-black text-[13px] tracking-tight text-[#1A1008]">
          TOOLS<span className="text-[#D4380D]">.</span>
        </a>
        <code className="f-mono text-[9px] text-[#1A1008]/30">{room}</code>
      </nav>
      <TestimonialSubmit roomId={room} host={PARTYKIT_HOST} />
    </div>
  )
}

export const Route = createFileRoute('/testimonials/submit')({
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || '',
  }),
  component: TestimonialsSubmitPage,
})
```

- [ ] **Step 4: Create src/routes/testimonials.wall.tsx**

```tsx
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { TestimonialWall } from '@/components/ui/testimonial-wall'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'

function TestimonialsWallPage() {
  const { room } = useSearch({ from: '/testimonials/wall' })

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="f-mono text-[12px] text-[#D4380D]">Missing ?room= parameter</div>
      </div>
    )
  }

  return <TestimonialWall roomId={room} host={PARTYKIT_HOST} />
}

export const Route = createFileRoute('/testimonials/wall')({
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || '',
  }),
  component: TestimonialsWallPage,
})
```

- [ ] **Step 5: Create src/routes/testimonials.tsx — host dashboard**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Copy } from 'lucide-react'

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

interface Campaign {
  roomId: string
  title: string
  createdAt: number
}

function TestimonialsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('testimonial-campaigns') || '[]')
    }
    catch { return [] }
  })
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const createCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const roomId = generateRoomId()
    const campaign: Campaign = { roomId, title: newTitle.trim(), createdAt: Date.now() }
    const updated = [campaign, ...campaigns]
    setCampaigns(updated)
    localStorage.setItem('testimonial-campaigns', JSON.stringify(updated))
    setNewTitle('')
    setCreating(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#6D28D9]" />

      {/* Top nav */}
      <nav className="border-b-2 border-[#1A1008] px-6 py-3 flex items-center gap-4">
        <a href="/" className="f-display font-black text-[13px] text-[#1A1008]">
          ← TOOLS<span className="text-[#D4380D]">.</span>
        </a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-2">
              Real-time collection
            </div>
            <h1 className="f-display font-black text-[48px] tracking-tight text-[#1A1008]">
              Testimonials<span className="text-[#6D28D9]">.</span>
            </h1>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            + New Campaign
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-6 mb-8">
            <div className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#6D28D9] mb-4">New Campaign</div>
            <form onSubmit={createCampaign} className="flex gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Campaign title, e.g. React Workshop — May 2026"
                autoFocus
                required
                className="flex-1 border-2 border-[#1A1008] bg-white px-4 py-2.5 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2.5"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Campaign list */}
        {campaigns.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">
                  No campaigns yet. Create one to get started.
                </p>
              </div>
            )
          : (
              <div className="space-y-4">
                {campaigns.map(campaign => {
                  const hostUrl = `${origin}/testimonials/host?room=${campaign.roomId}`
                  const submitUrl = `${origin}/testimonials/submit?room=${campaign.roomId}`
                  const wallUrl = `${origin}/testimonials/wall?room=${campaign.roomId}`

                  return (
                    <div key={campaign.roomId} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                      {/* Campaign header */}
                      <div className="border-b-2 border-[#1A1008] px-5 py-3 flex items-center justify-between">
                        <div>
                          <span className="f-display font-bold text-[16px] text-[#1A1008]">{campaign.title}</span>
                          <code className="f-mono text-[9px] text-[#1A1008]/30 ml-3">{campaign.roomId}</code>
                        </div>
                        <span className="f-mono text-[10px] text-[#1A1008]/30">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="px-5 py-3 flex flex-wrap gap-2">
                        <a
                          href={`/testimonials/host?room=${campaign.roomId}`}
                          className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                        >
                          Host Queue →
                        </a>
                        <a
                          href={`/testimonials/wall?room=${campaign.roomId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                        >
                          Wall ↗
                        </a>
                        <button
                          onClick={() => copy(`${campaign.roomId}-submit`, submitUrl)}
                          className="border-2 border-[#1A1008]/30 bg-[#F7F3EC] text-[#1A1008]/60 f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 hover:border-[#1A1008] hover:text-[#1A1008] transition-colors flex items-center gap-1.5"
                        >
                          <Copy size={10} />
                          {copiedKey === `${campaign.roomId}-submit` ? 'Copied!' : 'Copy Submit Link'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/testimonials')({
  component: TestimonialsDashboard,
})
```

- [ ] **Step 6: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/routes/__root.tsx src/routes/testimonials.tsx src/routes/testimonials.host.tsx src/routes/testimonials.submit.tsx src/routes/testimonials.wall.tsx
git commit -m "feat: add testimonials routes — dashboard, host queue, submit form, public wall"
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
git commit -m "feat: complete testimonials gathering tool — PartyKit server, moderation queue, public wall"
```
