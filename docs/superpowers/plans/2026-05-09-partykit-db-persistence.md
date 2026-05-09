# PartyKit → PostgreSQL Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the four PartyKit party servers to persist data to Neon PostgreSQL at key lifecycle events via internal HTTP API routes.

**Architecture:** PartyKit servers call `POST /api/internal/{domain}` with a shared `x-internal-secret` header. Each API route validates the secret, routes by a `type` discriminator, and writes to the DB using Drizzle. DB integer IDs returned from creation calls are stored in `room.storage` alongside the existing in-memory state so that subsequent calls (answers, votes) can reference them.

**Tech Stack:** TanStack Start (file-based API routes), Drizzle ORM, Neon PostgreSQL, PartyKit, Vitest

---

## File Map

**Create:**
- `party/lib/db-client.ts` — shared `callInternalApi` helper for party servers
- `src/routes/api/internal/kahoot.ts` — internal API route: game, player, answer, state
- `src/routes/api/internal/polls.ts` — internal API route: poll, vote, end
- `src/routes/api/internal/feedback.ts` — internal API route: session, response, close
- `src/routes/api/internal/feelings.ts` — internal API route: session, emoji
- `src/routes/api/internal/__tests__/auth.test.ts` — auth validation tests for all routes

**Modify:**
- `.env.example` — add `INTERNAL_API_SECRET`, `APP_URL`
- `partykit.json` — document new env vars
- `party/kahoot.ts` — add `dbGameId`, `dbQuestionIdMap`, `dbPlayerIdMap`; call DB at lifecycle points
- `party/polls.ts` — add `dbPollId`, `dbOptionIdMap`; call DB at lifecycle points
- `party/feedback.ts` — add `dbSessionId`; call DB at lifecycle points
- `party/feelings.ts` — add `dbSessionId`; call DB on `onStart` and `emoji_pop`

---

### Task 1: Env vars and shared DB client helper

**Files:**
- Modify: `.env.example`
- Modify: `partykit.json`
- Create: `party/lib/db-client.ts`

- [ ] **Step 1: Add env vars to `.env.example`**

Open `.env.example` and append:

```
# Internal API secret — shared between app and PartyKit for machine-to-machine calls
INTERNAL_API_SECRET=

# App base URL — used by PartyKit to call internal API routes
# Local: http://localhost:3000
# Production: https://your-app.netlify.app
APP_URL=
```

- [ ] **Step 2: Document env vars in `partykit.json`**

Replace the entire content of `partykit.json` with:

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
    "feelings": "party/feelings.ts"
  },
  "vars": {
    "APP_URL": "",
    "INTERNAL_API_SECRET": ""
  }
}
```

- [ ] **Step 3: Create `party/lib/db-client.ts`**

```ts
export async function callInternalApi(
  domain: 'kahoot' | 'polls' | 'feedback' | 'feelings',
  body: unknown,
): Promise<{ ok: true; data: unknown } | null> {
  const appUrl = process.env.APP_URL
  const secret = process.env.INTERNAL_API_SECRET

  if (!appUrl || !secret) {
    console.error('[db-client] APP_URL or INTERNAL_API_SECRET not set')
    return null
  }

  const res = await fetch(`${appUrl}/api/internal/${domain}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': secret,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[db-client] ${domain} ${res.status}:`, text)
    return null
  }

  return res.json()
}
```

- [ ] **Step 4: Commit**

```bash
git add .env.example partykit.json party/lib/db-client.ts
git commit -m "feat: add internal API env vars and shared db-client helper"
```

---

### Task 2: Internal API route — kahoot

**Files:**
- Create: `src/routes/api/internal/kahoot.ts`

- [ ] **Step 1: Write the failing test**

Create `src/routes/api/internal/__tests__/auth.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

// Helper: build a mock Request with the given headers and body
function makeRequest(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['x-internal-secret'] = secret

  return new Request('http://localhost/api/internal/kahoot', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

async function callHandler(req: Request): Promise<Response> {
  // Dynamically import so env is set before module evaluation
  const { POST } = await import('../kahoot')
  return POST({ request: req } as any)
}

describe('POST /api/internal/kahoot auth', () => {
  const goodSecret = 'test-secret'

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = goodSecret
  })

  it('returns 401 when secret is missing', async () => {
    const res = await callHandler(makeRequest({ type: 'end_game', roomId: 'r1' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await callHandler(makeRequest({ type: 'end_game', roomId: 'r1' }, 'wrong'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for unknown type', async () => {
    const res = await callHandler(makeRequest({ type: 'unknown_op' }, goodSecret))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bun run test src/routes/api/internal/__tests__/auth.test.ts
```

Expected: import fails — `kahoot.ts` does not exist yet.

- [ ] **Step 3: Create `src/routes/api/internal/kahoot.ts`**

```ts
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

export const POST = async ({ request }: { request: Request }) => {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) return unauthorized()

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/routes/api/internal/__tests__/auth.test.ts
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/internal/kahoot.ts src/routes/api/internal/__tests__/auth.test.ts
git commit -m "feat: add /api/internal/kahoot route with auth and CRUD handlers"
```

---

### Task 3: Internal API route — polls

**Files:**
- Create: `src/routes/api/internal/polls.ts`

- [ ] **Step 1: Create `src/routes/api/internal/polls.ts`**

```ts
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
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

Fix any type errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/internal/polls.ts
git commit -m "feat: add /api/internal/polls route"
```

---

### Task 4: Internal API route — feedback

**Files:**
- Create: `src/routes/api/internal/feedback.ts`

- [ ] **Step 1: Create `src/routes/api/internal/feedback.ts`**

```ts
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
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/internal/feedback.ts
git commit -m "feat: add /api/internal/feedback route"
```

---

### Task 5: Internal API route — feelings

**Files:**
- Create: `src/routes/api/internal/feelings.ts`

- [ ] **Step 1: Create `src/routes/api/internal/feelings.ts`**

```ts
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
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
        // Upsert: if room already has a session (worker restart), return existing
        const [session] = await db
          .insert(feelingSessions)
          .values({ roomId: body.roomId as string })
          .onConflictDoUpdate({
            target: feelingSessions.roomId,
            set: { roomId: body.roomId as string },
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
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/internal/feelings.ts
git commit -m "feat: add /api/internal/feelings route"
```

---

### Task 6: Wire `party/kahoot.ts`

**Files:**
- Modify: `party/kahoot.ts`

The in-memory game uses string IDs (`q-0`, connection IDs) while the DB uses integer IDs. We store the mapping in `room.storage` under the key `dbState`.

- [ ] **Step 1: Add DB state fields and restore in `onStart`**

At the top of the `KahootServer` class, after `private answeredPlayers`, add three new fields:

```ts
private dbGameId: number | null = null
private dbQuestionIdMap: Map<string, number> = new Map() // party 'q-0' → db integer id
private dbPlayerIdMap: Map<string, number> = new Map()   // connId → db integer id
```

Replace the entire `async onStart()` method with:

```ts
async onStart() {
  const storedGame = await this.room.storage.get<{
    id: string
    name: string
    questions: Question[]
    currentQuestionIndex: number
    state: GameState
    players: Array<[string, Player]>
    createdBy: string
    createdAt: number
  }>('game')

  if (storedGame) {
    this.game = {
      ...storedGame,
      players: new Map(storedGame.players),
    }
  }

  const storedHostId = await this.room.storage.get<string>('hostId')
  if (storedHostId) {
    this.hostId = storedHostId
  }

  const storedDbState = await this.room.storage.get<{
    gameId: number
    questionIds: [string, number][]
    playerIds: [string, number][]
  }>('dbState')

  if (storedDbState) {
    this.dbGameId = storedDbState.gameId
    this.dbQuestionIdMap = new Map(storedDbState.questionIds)
    this.dbPlayerIdMap = new Map(storedDbState.playerIds || [])
  }
}
```

- [ ] **Step 2: Add `import { callInternalApi }` at the top of `party/kahoot.ts`**

After the existing imports, add:

```ts
import { callInternalApi } from './lib/db-client'
```

- [ ] **Step 3: Persist game creation in `handleHostCreate`**

In `handleHostCreate`, after the line `await this.room.storage.put('hostId', this.hostId)` and before the `sender.send(...)` call, add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    const result = await callInternalApi('kahoot', {
      type: 'create_game',
      roomId: this.room.id,
      gameName: data.name,
      questions: data.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        timeLimit: q.timeLimit,
        points: q.points,
      })),
      createdBy: sender.id,
    })
    if (result?.ok && this.game) {
      const { game: dbGame, questions: dbQuestions } = result.data as any
      this.dbGameId = dbGame.id
      this.game.questions.forEach((q, i) => {
        this.dbQuestionIdMap.set(q.id, dbQuestions[i].id)
      })
      await this.room.storage.put('dbState', {
        gameId: this.dbGameId,
        questionIds: Array.from(this.dbQuestionIdMap.entries()),
        playerIds: [],
      })
    }
  }
  catch (err) {
    console.error('[kahoot] DB create_game failed:', err)
  }
})()
```

- [ ] **Step 4: Persist player join in `handlePlayerJoin`**

In `handlePlayerJoin`, after the line `await this.saveGameState()` (the one inside `handlePlayerJoin`), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    if (this.dbGameId) {
      const result = await callInternalApi('kahoot', {
        type: 'add_player',
        gameId: this.dbGameId,
        playerName: data.name,
      })
      if (result?.ok) {
        const dbPlayer = result.data as any
        this.dbPlayerIdMap.set(sender.id, dbPlayer.id)
        await this.room.storage.put('dbState', {
          gameId: this.dbGameId,
          questionIds: Array.from(this.dbQuestionIdMap.entries()),
          playerIds: Array.from(this.dbPlayerIdMap.entries()),
        })
      }
    }
  }
  catch (err) {
    console.error('[kahoot] DB add_player failed:', err)
  }
})()
```

- [ ] **Step 5: Persist answer in `handlePlayerAnswer`**

In `handlePlayerAnswer`, after `await this.saveGameState()` (the one at the end of `handlePlayerAnswer`), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    const dbQuestionId = this.dbQuestionIdMap.get(question.id)
    const dbPlayerId = this.dbPlayerIdMap.get(sender.id)
    if (this.dbGameId && dbQuestionId && dbPlayerId) {
      const timeToAnswer = this.game?.questionStartTime
        ? Date.now() - this.game.questionStartTime
        : 0
      await callInternalApi('kahoot', {
        type: 'submit_answer',
        gameId: this.dbGameId,
        questionId: dbQuestionId,
        playerId: dbPlayerId,
        selectedAnswer: data.answerIndex,
        isCorrect: correct,
        timeToAnswer,
        pointsEarned: points,
      })
    }
  }
  catch (err) {
    console.error('[kahoot] DB submit_answer failed:', err)
  }
})()
```

- [ ] **Step 6: Persist state changes in `handleHostStart` and `handleHostNextQuestion`**

In `handleHostStart`, after `await this.saveGameState()`, add:

```ts
;(async () => {
  try {
    if (this.dbGameId) {
      await callInternalApi('kahoot', {
        type: 'update_state',
        roomId: this.room.id,
        state: 'question',
        currentQuestionIndex: 0,
      })
    }
  }
  catch (err) {
    console.error('[kahoot] DB update_state failed:', err)
  }
})()
```

In `handleHostNextQuestion`, after `await this.saveGameState()`, add:

```ts
;(async () => {
  try {
    if (this.dbGameId && this.game) {
      await callInternalApi('kahoot', {
        type: 'update_state',
        roomId: this.room.id,
        state: this.game.state,
        currentQuestionIndex: this.game.currentQuestionIndex,
      })
    }
  }
  catch (err) {
    console.error('[kahoot] DB update_state failed:', err)
  }
})()
```

- [ ] **Step 7: Persist game end in `endGame`**

In the `endGame` private method, after `await this.saveGameState()`, add:

```ts
;(async () => {
  try {
    if (this.dbGameId) {
      await callInternalApi('kahoot', {
        type: 'end_game',
        roomId: this.room.id,
      })
    }
  }
  catch (err) {
    console.error('[kahoot] DB end_game failed:', err)
  }
})()
```

- [ ] **Step 8: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 9: Commit**

```bash
git add party/kahoot.ts party/lib/db-client.ts
git commit -m "feat: wire party/kahoot.ts to persist to PostgreSQL via internal API"
```

---

### Task 7: Wire `party/polls.ts`

**Files:**
- Modify: `party/polls.ts`

- [ ] **Step 1: Add DB state fields**

After the line `private voters = new Set<string>()`, add:

```ts
private dbPollId: number | null = null
private dbOptionIdMap: Map<string, number> = new Map() // 'option-0' → db integer id
```

- [ ] **Step 2: Add import**

After the existing imports add:

```ts
import { callInternalApi } from './lib/db-client'
```

- [ ] **Step 3: Restore DB state in `onStart`**

Replace the entire `async onStart()` method with:

```ts
async onStart() {
  const storedPoll = await this.room.storage.get<Poll>('poll')
  if (storedPoll) {
    this.poll = storedPoll
  }

  const storedVoters = await this.room.storage.get<string[]>('voters')
  if (storedVoters) {
    this.voters = new Set(storedVoters)
  }

  const storedDbState = await this.room.storage.get<{
    pollId: number
    optionIds: [string, number][]
  }>('dbState')

  if (storedDbState) {
    this.dbPollId = storedDbState.pollId
    this.dbOptionIdMap = new Map(storedDbState.optionIds)
  }
}
```

- [ ] **Step 4: Persist poll creation in `handleCreatePoll`**

In `handleCreatePoll`, after the `this.room.broadcast(...)` call, add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    const result = await callInternalApi('polls', {
      type: 'create_poll',
      roomId: this.room.id,
      question: data.question,
      options: data.options,
      createdBy: sender.id,
    })
    if (result?.ok && this.poll) {
      const { poll: dbPoll, options: dbOptions } = result.data as any
      this.dbPollId = dbPoll.id
      this.poll.options.forEach((opt, i) => {
        this.dbOptionIdMap.set(opt.id, dbOptions[i].id)
      })
      await this.room.storage.put('dbState', {
        pollId: this.dbPollId,
        optionIds: Array.from(this.dbOptionIdMap.entries()),
      })
    }
  }
  catch (err) {
    console.error('[polls] DB create_poll failed:', err)
  }
})()
```

- [ ] **Step 5: Persist vote in `handleVote`**

In `handleVote`, after the second `this.room.broadcast(...)` call (the `poll_updated` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    const dbOptionId = this.dbOptionIdMap.get(data.optionId)
    if (this.dbPollId && dbOptionId) {
      await callInternalApi('polls', {
        type: 'vote',
        pollId: this.dbPollId,
        optionId: dbOptionId,
        voterId: sender.id,
      })
    }
  }
  catch (err) {
    console.error('[polls] DB vote failed:', err)
  }
})()
```

- [ ] **Step 6: Persist poll end in `handleEndPoll`**

In `handleEndPoll`, after the `this.room.broadcast(...)` call (the `poll_ended` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    await callInternalApi('polls', {
      type: 'end_poll',
      roomId: this.room.id,
    })
  }
  catch (err) {
    console.error('[polls] DB end_poll failed:', err)
  }
})()
```

- [ ] **Step 7: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add party/polls.ts
git commit -m "feat: wire party/polls.ts to persist to PostgreSQL via internal API"
```

---

### Task 8: Wire `party/feedback.ts`

**Files:**
- Modify: `party/feedback.ts`

- [ ] **Step 1: Add DB session ID field**

After the line `private hostId: string | null = null`, add:

```ts
private dbSessionId: number | null = null
```

- [ ] **Step 2: Add import**

After the existing imports add:

```ts
import { callInternalApi } from './lib/db-client'
```

- [ ] **Step 3: Restore DB session ID in `onStart`**

Replace the entire `async onStart()` method with:

```ts
async onStart() {
  const storedSession = await this.room.storage.get<FeedbackSession>('session')
  if (storedSession) {
    this.session = storedSession
  }

  const storedResponders = await this.room.storage.get<Array<[string, Responder]>>('responders')
  if (storedResponders) {
    this.responders = new Map(storedResponders)
  }

  const storedHostId = await this.room.storage.get<string>('hostId')
  if (storedHostId) {
    this.hostId = storedHostId
  }

  const storedDbSessionId = await this.room.storage.get<number>('dbSessionId')
  if (storedDbSessionId) {
    this.dbSessionId = storedDbSessionId
  }
}
```

- [ ] **Step 4: Persist session creation in `handleCreateFeedback`**

In `handleCreateFeedback`, after the `this.room.broadcast(...)` call (the `feedback_created` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    if (!this.session) return
    const result = await callInternalApi('feedback', {
      type: 'create_session',
      roomId: this.room.id,
      title: this.session.title,
      feedbackType: this.session.type,
      config: data.config,
      createdBy: sender.id,
    })
    if (result?.ok) {
      const dbSession = result.data as any
      this.dbSessionId = dbSession.id
      await this.room.storage.put('dbSessionId', this.dbSessionId)
    }
  }
  catch (err) {
    console.error('[feedback] DB create_session failed:', err)
  }
})()
```

- [ ] **Step 5: Persist emoji response in `handleSubmitEmoji`**

In `handleSubmitEmoji`, after the `this.room.broadcast(...)` call (the `feedback_updated` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    if (this.dbSessionId) {
      await callInternalApi('feedback', {
        type: 'submit_response',
        sessionId: this.dbSessionId,
        respondentId: sender.id,
        responseType: 'emoji',
        emojiResponse: data.emoji,
      })
    }
  }
  catch (err) {
    console.error('[feedback] DB submit_response(emoji) failed:', err)
  }
})()
```

- [ ] **Step 6: Persist text response in `handleSubmitText`**

In `handleSubmitText`, after the `this.room.broadcast(...)` call (the `feedback_updated` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    if (this.dbSessionId) {
      await callInternalApi('feedback', {
        type: 'submit_response',
        sessionId: this.dbSessionId,
        respondentId: sender.id,
        responseType: 'text',
        textResponse: data.text,
      })
    }
  }
  catch (err) {
    console.error('[feedback] DB submit_response(text) failed:', err)
  }
})()
```

- [ ] **Step 7: Persist score response in `handleSubmitScore`**

In `handleSubmitScore`, after the `this.room.broadcast(...)` call (the `feedback_updated` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    if (this.dbSessionId) {
      await callInternalApi('feedback', {
        type: 'submit_response',
        sessionId: this.dbSessionId,
        respondentId: sender.id,
        responseType: 'score',
        scoreResponse: data.score,
      })
    }
  }
  catch (err) {
    console.error('[feedback] DB submit_response(score) failed:', err)
  }
})()
```

- [ ] **Step 8: Persist session close in `handleCloseFeedback`**

In `handleCloseFeedback`, after the `this.room.broadcast(...)` call (the `feedback_closed` broadcast), add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    await callInternalApi('feedback', {
      type: 'close_session',
      roomId: this.room.id,
    })
  }
  catch (err) {
    console.error('[feedback] DB close_session failed:', err)
  }
})()
```

- [ ] **Step 9: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 10: Commit**

```bash
git add party/feedback.ts
git commit -m "feat: wire party/feedback.ts to persist to PostgreSQL via internal API"
```

---

### Task 9: Wire `party/feelings.ts`

**Files:**
- Modify: `party/feelings.ts`

The feelings server has no explicit session lifecycle — it's a pure stream. We create a DB session on `onStart` (upsert so worker restarts are safe) and persist each emoji.

- [ ] **Step 1: Add DB session ID field and import**

At the top of `FeelingsServer` class, before `constructor`, add:

```ts
private dbSessionId: number | null = null
```

After the existing imports, add:

```ts
import { callInternalApi } from './lib/db-client'
```

- [ ] **Step 2: Add `onStart` to create/restore DB session**

After the `constructor(readonly room: Party.Room) {}` line, add:

```ts
async onStart() {
  // Restore from storage on worker restart
  const stored = await this.room.storage.get<number>('dbSessionId')
  if (stored) {
    this.dbSessionId = stored
    return
  }

  // Create new session (upsert: safe if room already exists in DB)
  try {
    const result = await callInternalApi('feelings', {
      type: 'create_session',
      roomId: this.room.id,
    })
    if (result?.ok) {
      const dbSession = result.data as any
      this.dbSessionId = dbSession.id
      await this.room.storage.put('dbSessionId', this.dbSessionId)
    }
  }
  catch (err) {
    console.error('[feelings] DB create_session failed:', err)
  }
}
```

- [ ] **Step 3: Persist emoji in `onMessage`**

In the `case 'emoji_pop':` block, after `this.room.broadcast(JSON.stringify(emojiMessage))`, add:

```ts
// Persist to DB (fire-and-forget)
;(async () => {
  try {
    if (this.dbSessionId) {
      await callInternalApi('feelings', {
        type: 'add_emoji',
        sessionId: this.dbSessionId,
        emoji: data.emoji,
        participantId: sender.id,
      })
    }
  }
  catch (err) {
    console.error('[feelings] DB add_emoji failed:', err)
  }
})()
```

- [ ] **Step 4: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add party/feelings.ts
git commit -m "feat: wire party/feelings.ts to persist to PostgreSQL via internal API"
```

---

### Task 10: Build verification

- [ ] **Step 1: Run full build**

```bash
bun run build
```

Expected: build succeeds with no errors.

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: no type errors.

- [ ] **Step 3: Run lint**

```bash
bun run lint
```

Fix any lint errors.

- [ ] **Step 4: Run tests**

```bash
bun run test
```

Expected: auth tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify build and tests pass for PartyKit DB persistence"
```

---

## Verification Checklist

After implementation, verify end-to-end manually:

1. Set `INTERNAL_API_SECRET` and `APP_URL` in both `.env` (app) and PartyKit env
2. Run `bun run db:push` to apply schema to Neon if not done already
3. Start the app: trigger a kahoot game, submit answers, end game
4. Query the DB: `SELECT * FROM kahoot_games; SELECT * FROM kahoot_answers;`
5. Confirm rows exist with correct data

## Out of Scope

- Reading state back from DB into `room.storage` on reconnect
- Auth beyond the shared secret
- Backfilling historical data
