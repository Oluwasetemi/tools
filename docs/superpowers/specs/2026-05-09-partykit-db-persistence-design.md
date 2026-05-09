# PartyKit → PostgreSQL Persistence Design

**Date:** 2026-05-09
**Status:** Approved

## Problem

PartyKit party servers (`party/kahoot.ts`, `party/polls.ts`, `party/feedback.ts`, `party/feelings.ts`) currently persist state only to `room.storage` — Cloudflare's ephemeral durable object storage. When a room closes, all data is lost. The Drizzle schema and server functions in `src/server/` are fully written but never called.

## Goal

Wire the four party servers to persist data to Neon PostgreSQL at key lifecycle events, so game history, poll results, feedback, and emoji streams survive room closure.

## Architecture

```
PartyKit Server (Cloudflare Workers)
    │  POST { type, ...payload }
    │  Header: x-internal-secret: <INTERNAL_API_SECRET>
    ▼
TanStack Start Internal API Routes
    /api/internal/kahoot
    /api/internal/polls
    /api/internal/feedback
    /api/internal/feelings
    │
    ▼
Drizzle ORM → Neon PostgreSQL
```

## Security

- Each API route validates `x-internal-secret` header against `process.env.INTERNAL_API_SECRET`
- Missing or invalid secret → 401
- Machine-to-machine only — no JWT, no session cookies

### Env Vars

| Var | Where | Purpose |
|-----|-------|---------|
| `INTERNAL_API_SECRET` | App + PartyKit | Shared secret for internal API auth |
| `APP_URL` | PartyKit | Base URL of the deployed TanStack Start app |

## API Route Contracts

All routes accept `POST`. All return `{ ok: true, data }` or `{ ok: false, error }`.

### `POST /api/internal/kahoot`

```ts
{ type: 'create_game',   roomId: string, gameName: string, questions: Array<{ question: string, options: string[], correctAnswer: number, timeLimit: number, points: number }>, createdBy?: string }
{ type: 'add_player',    gameId: number, playerName: string }
{ type: 'submit_answer', gameId: number, questionId: number, playerId: number, selectedAnswer: number, isCorrect: boolean, timeToAnswer: number, pointsEarned: number }
{ type: 'update_state',  roomId: string, state: 'waiting' | 'question' | 'results' | 'leaderboard' | 'ended', currentQuestionIndex?: number }
{ type: 'end_game',      roomId: string }
```

### `POST /api/internal/polls`

```ts
{ type: 'create_poll', roomId: string, question: string, options: string[], createdBy?: string }
{ type: 'vote',        pollId: number, optionId: number, voterId: string }
{ type: 'end_poll',    roomId: string }
```

### `POST /api/internal/feedback`

```ts
{ type: 'create_session',   roomId: string, title: string, feedbackType: 'emoji' | 'text' | 'score', config?: unknown, createdBy?: string }
{ type: 'submit_response',  sessionId: number, respondentId: string, responseType: 'emoji' | 'text' | 'score', emojiResponse?: string, textResponse?: string, scoreResponse?: number }
{ type: 'close_session',    roomId: string }
```

### `POST /api/internal/feelings`

```ts
{ type: 'create_session', roomId: string }
{ type: 'add_emoji',      sessionId: number, emoji: string, participantId: string }
{ type: 'end_session',    roomId: string }
```

## PartyKit Integration Points

DB calls are **fire-and-forget** — wrapped in `try/catch`, a DB failure logs but never kills the WebSocket connection. Real-time always wins over persistence.

### `party/kahoot.ts`

| Trigger | API call |
|---------|----------|
| Host sends `create_game` | `create_game` |
| Player sends `join_game` | `add_player` |
| Player sends `submit_answer` | `submit_answer` |
| `startGame()`, `nextQuestion()`, `showResults()` called | `update_state` |
| Host sends `end_game` | `end_game` |

### `party/polls.ts`

| Trigger | API call |
|---------|----------|
| Host creates poll | `create_poll` |
| Participant votes | `vote` |
| Host ends poll | `end_poll` |

### `party/feedback.ts`

| Trigger | API call |
|---------|----------|
| Host creates session | `create_session` |
| Participant submits response | `submit_response` |
| Host closes session | `close_session` |

### `party/feelings.ts`

| Trigger | API call |
|---------|----------|
| Room initializes | `create_session` |
| Participant sends emoji | `add_emoji` |
| Host ends session | `end_session` |

## Files to Create

- `src/routes/api/internal/kahoot.ts`
- `src/routes/api/internal/polls.ts`
- `src/routes/api/internal/feedback.ts`
- `src/routes/api/internal/feelings.ts`

## Files to Modify

- `party/kahoot.ts` — add DB calls at lifecycle points
- `party/polls.ts` — add DB calls at lifecycle points
- `party/feedback.ts` — add DB calls at lifecycle points
- `party/feelings.ts` — add DB calls at lifecycle points
- `.env.example` — add `INTERNAL_API_SECRET` and `APP_URL`
- `partykit.json` — document new env vars

## Out of Scope

- Reading from DB on room reconnect (restoring state from DB into `room.storage`) — future work
- Auth/rate limiting beyond the shared secret
- Backfilling historical data
