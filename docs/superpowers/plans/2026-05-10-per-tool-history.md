# Per-Tool History Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-rendered `/history` sub-route to each of the five interactive tools (Polls, Kahoot, Feedback, Feelings, Testimonials) so past sessions and their results are browsable from the database.

**Architecture:** Each history page is a TanStack Start file-route with a `loader` function (runs server-side) that queries PostgreSQL via Drizzle, identical to the pattern in `src/routes/certificates.tsx`. The page component reads loader data via `Route.useLoaderData()` and uses `useState` for inline accordion expand/collapse — no extra DB calls after page load. Each tool's host page gains a `History →` link in its action bar.

**Tech Stack:** TanStack Start (file-router), Drizzle ORM, PostgreSQL (Neon), Tailwind CSS, React `useState` for accordion, `lucide-react` for icons.

---

## File Map

**Create:**
- `src/routes/party.polls.history.tsx` → `/party/polls/history`
- `src/routes/party.kahoot-host.history.tsx` → `/party/kahoot-host/history`
- `src/routes/party.feedback-host.history.tsx` → `/party/feedback-host/history`
- `src/routes/party.feelings.history.tsx` → `/party/feelings/history`
- `src/routes/testimonials.history.tsx` → `/testimonials/history`

**Modify:**
- `src/routes/party.polls.tsx` — add History link to action bar
- `src/routes/party.kahoot-host.tsx` — add History link to action bar
- `src/routes/party.feedback-host.tsx` — add History link to action bar
- `src/routes/party.feelings.tsx` — add History overlay link
- `src/routes/testimonials.tsx` — add History link to action bar

---

## Task 1: Polls History Page

**Files:**
- Create: `src/routes/party.polls.history.tsx`
- Modify: `src/routes/party.polls.tsx`

- [ ] **Step 1: Create the polls history route**

```tsx
// src/routes/party.polls.history.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { polls, pollOptions } from '@/db/schema'

const ACCENT = '#0C3D6B'

interface PollOption {
  id: number
  text: string
  votes: number
  order: number
}

interface PollRow {
  id: number
  roomId: string
  question: string
  isActive: boolean
  createdAt: string
  endedAt: string | null
  options: PollOption[]
  totalVotes: number
  winnerText: string | null
  winnerPct: number
}

async function getPollsHistory(): Promise<PollRow[]> {
  const pollList = await db
    .select()
    .from(polls)
    .orderBy(desc(polls.createdAt))
    .limit(50)

  const result: PollRow[] = []
  for (const poll of pollList) {
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll.id))
      .orderBy(pollOptions.optionOrder)

    const totalVotes = options.reduce((s, o) => s + o.votes, 0)
    const winner = options.reduce((best, o) => o.votes > best.votes ? o : best, options[0] ?? { votes: -1, optionText: null })

    result.push({
      id: poll.id,
      roomId: poll.roomId,
      question: poll.question,
      isActive: poll.isActive,
      createdAt: poll.createdAt.toISOString(),
      endedAt: poll.endedAt?.toISOString() ?? null,
      options: options.map(o => ({
        id: o.id,
        text: o.optionText,
        votes: o.votes,
        order: o.optionOrder,
      })),
      totalVotes,
      winnerText: winner && winner.votes > 0 ? winner.optionText : null,
      winnerPct: totalVotes > 0 && winner ? Math.round((winner.votes / totalVotes) * 100) : 0,
    })
  }
  return result
}

function PollHistoryPage() {
  const { pollHistory } = Route.useLoaderData()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#0C3D6B]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/party/polls" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          ← Poll Host
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Poll History<span className="text-[#0C3D6B]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">{pollHistory.length} polls</p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl">
        {pollHistory.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">No polls yet. Run your first poll to see history here.</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {pollHistory.map(poll => (
                  <div key={poll.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                    <button
                      onClick={() => setExpanded(expanded === poll.id ? null : poll.id)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#0C3D6B]/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="f-display font-bold text-[15px] text-[#1A1008] leading-snug truncate">{poll.question}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="f-mono text-[10px] text-[#1A1008]/40">
                            {new Date(poll.createdAt).toLocaleDateString()}
                          </span>
                          <span className="f-mono text-[10px] text-[#1A1008]/40">{poll.totalVotes} votes</span>
                          {poll.winnerText && (
                            <span className="f-mono text-[10px] text-[#0C3D6B]">
                              ↑ {poll.winnerText} ({poll.winnerPct}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={[
                          'f-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border',
                          poll.isActive
                            ? 'border-[#1B6B3A] text-[#1B6B3A] bg-[#1B6B3A]/[0.07]'
                            : 'border-[#1A1008]/25 text-[#1A1008]/40',
                        ].join(' ')}>
                          {poll.isActive ? 'Active' : 'Ended'}
                        </span>
                        <span className="f-mono text-[11px] text-[#1A1008]/30">{expanded === poll.id ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expanded === poll.id && (
                      <div className="border-t border-[#1A1008]/10 px-5 py-4 space-y-2">
                        {poll.options.map(opt => {
                          const pct = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0
                          return (
                            <div key={opt.id} className="relative border border-[#1A1008]/15 overflow-hidden">
                              <div
                                className="absolute inset-0 bg-[#0C3D6B]/[0.08] transition-all"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative px-3 py-2 flex justify-between items-center">
                                <span className="f-mono text-[12px] text-[#1A1008]">{opt.text}</span>
                                <span className="f-mono text-[10px] text-[#1A1008]/50 ml-4 shrink-0">
                                  {opt.votes} · {pct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        <p className="f-mono text-[9px] text-[#1A1008]/25 pt-1">Room: {poll.roomId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/party/polls/history')({
  loader: async () => {
    const pollHistory = await getPollsHistory()
    return { pollHistory }
  },
  head: () => ({ meta: [{ title: 'Poll History — Tools' }] }),
  component: PollHistoryPage,
})
```

- [ ] **Step 2: Add History link to polls host action bar**

In `src/routes/party.polls.tsx`, find the action buttons div (line 83) and add a History link as the first button:

```tsx
// Add this import at the top with existing lucide imports:
import { Copy, ExternalLink, History, RefreshCw } from 'lucide-react'

// Inside the flex action bar div (after line 83, before the New Room button):
<Link
  to="/party/polls/history"
  className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-white f-mono text-[10px] tracking-[0.1em] uppercase text-[#1A1008] shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
>
  <History size={11} />
  History
</Link>
```

- [ ] **Step 3: Verify the build compiles cleanly**

```bash
bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/routes/party.polls.history.tsx src/routes/party.polls.tsx
git commit -m "feat: add polls history page"
```

---

## Task 2: Kahoot History Page

**Files:**
- Create: `src/routes/party.kahoot-host.history.tsx`
- Modify: `src/routes/party.kahoot-host.tsx`

- [ ] **Step 1: Create the kahoot history route**

```tsx
// src/routes/party.kahoot-host.history.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { kahootGames, kahootPlayers } from '@/db/schema'

interface PlayerRow {
  id: number
  name: string
  score: number
}

interface GameRow {
  id: number
  roomId: string
  gameName: string
  state: string
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  playerCount: number
  winner: string | null
  winnerScore: number
  topPlayers: PlayerRow[]
}

async function getKahootHistory(): Promise<GameRow[]> {
  const games = await db
    .select()
    .from(kahootGames)
    .orderBy(desc(kahootGames.createdAt))
    .limit(50)

  const result: GameRow[] = []
  for (const game of games) {
    const players = await db
      .select()
      .from(kahootPlayers)
      .where(eq(kahootPlayers.gameId, game.id))
      .orderBy(desc(kahootPlayers.score))
      .limit(10)

    result.push({
      id: game.id,
      roomId: game.roomId,
      gameName: game.gameName,
      state: game.state,
      createdAt: game.createdAt.toISOString(),
      startedAt: game.startedAt?.toISOString() ?? null,
      endedAt: game.endedAt?.toISOString() ?? null,
      playerCount: players.length,
      winner: players[0]?.playerName ?? null,
      winnerScore: players[0]?.score ?? 0,
      topPlayers: players.map(p => ({ id: p.id, name: p.playerName, score: p.score })),
    })
  }
  return result
}

function KahootHistoryPage() {
  const { gameHistory } = Route.useLoaderData()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#D4380D]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/party/kahoot-host" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          ← Kahoot Host
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Quiz History<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">{gameHistory.length} games</p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl">
        {gameHistory.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">No games yet. Host your first quiz to see history here.</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {gameHistory.map(game => (
                  <div key={game.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                    <button
                      onClick={() => setExpanded(expanded === game.id ? null : game.id)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#D4380D]/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="f-display font-bold text-[15px] text-[#1A1008] leading-snug truncate">{game.gameName}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="f-mono text-[10px] text-[#1A1008]/40">
                            {new Date(game.createdAt).toLocaleDateString()}
                          </span>
                          <span className="f-mono text-[10px] text-[#1A1008]/40">{game.playerCount} players</span>
                          {game.winner && (
                            <span className="f-mono text-[10px] text-[#D4380D]">
                              🏆 {game.winner} ({game.winnerScore} pts)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={[
                          'f-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border',
                          game.state === 'ended'
                            ? 'border-[#1A1008]/25 text-[#1A1008]/40'
                            : 'border-[#1B6B3A] text-[#1B6B3A] bg-[#1B6B3A]/[0.07]',
                        ].join(' ')}>
                          {game.state}
                        </span>
                        <span className="f-mono text-[11px] text-[#1A1008]/30">{expanded === game.id ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expanded === game.id && (
                      <div className="border-t border-[#1A1008]/10 px-5 py-4">
                        <div className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#D4380D] mb-3">Leaderboard</div>
                        <div className="space-y-1.5">
                          {game.topPlayers.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-[#1A1008]/[0.06] last:border-0">
                              <span className="f-mono text-[11px] font-bold text-[#1A1008]/30 w-5">{i + 1}</span>
                              <span className="f-mono text-[13px] text-[#1A1008] flex-1">{p.name}</span>
                              <span className="f-mono text-[12px] font-bold text-[#D4380D]">{p.score}</span>
                            </div>
                          ))}
                          {game.topPlayers.length === 0 && (
                            <p className="f-mono text-[11px] text-[#1A1008]/30">No players joined this game.</p>
                          )}
                        </div>
                        <p className="f-mono text-[9px] text-[#1A1008]/25 pt-3">Room: {game.roomId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/party/kahoot-host/history')({
  loader: async () => {
    const gameHistory = await getKahootHistory()
    return { gameHistory }
  },
  head: () => ({ meta: [{ title: 'Quiz History — Tools' }] }),
  component: KahootHistoryPage,
})
```

- [ ] **Step 2: Add History link to kahoot host action bar**

In `src/routes/party.kahoot-host.tsx`, add this import and link:

```tsx
// Add History to existing lucide import:
import { Copy, ExternalLink, History, RefreshCw } from 'lucide-react'

// Add as first button in the action bar flex div:
<Link
  to="/party/kahoot-host/history"
  className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-white f-mono text-[10px] tracking-[0.1em] uppercase text-[#1A1008] shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
>
  <History size={11} />
  History
</Link>
```

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/party.kahoot-host.history.tsx src/routes/party.kahoot-host.tsx
git commit -m "feat: add kahoot quiz history page"
```

---

## Task 3: Feedback History Page

**Files:**
- Create: `src/routes/party.feedback-host.history.tsx`
- Modify: `src/routes/party.feedback-host.tsx`

- [ ] **Step 1: Create the feedback history route**

```tsx
// src/routes/party.feedback-host.history.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { feedbackSessions, feedbackResponses } from '@/db/schema'

interface ResponseRow {
  id: number
  type: string
  emoji: string | null
  text: string | null
  score: number | null
  submittedAt: string
}

interface SessionRow {
  id: number
  roomId: string
  title: string
  type: string
  isActive: boolean
  createdAt: string
  closedAt: string | null
  responseCount: number
  responses: ResponseRow[]
}

async function getFeedbackHistory(): Promise<SessionRow[]> {
  const sessions = await db
    .select()
    .from(feedbackSessions)
    .orderBy(desc(feedbackSessions.createdAt))
    .limit(50)

  const result: SessionRow[] = []
  for (const session of sessions) {
    const responses = await db
      .select()
      .from(feedbackResponses)
      .where(eq(feedbackResponses.sessionId, session.id))
      .orderBy(desc(feedbackResponses.submittedAt))

    result.push({
      id: session.id,
      roomId: session.roomId,
      title: session.title,
      type: session.type,
      isActive: session.isActive,
      createdAt: session.createdAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
      responseCount: responses.length,
      responses: responses.map(r => ({
        id: r.id,
        type: r.responseType,
        emoji: r.emojiResponse ?? null,
        text: r.textResponse ?? null,
        score: r.scoreResponse ?? null,
        submittedAt: r.submittedAt.toISOString(),
      })),
    })
  }
  return result
}

const TYPE_COLORS: Record<string, string> = {
  emoji: '#D4380D',
  text: '#0C3D6B',
  score: '#1B6B3A',
}

function FeedbackHistoryPage() {
  const { sessionHistory } = Route.useLoaderData()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#1B6B3A]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/party/feedback-host" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          ← Feedback Host
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Feedback History<span className="text-[#1B6B3A]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">{sessionHistory.length} sessions</p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl">
        {sessionHistory.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">No feedback sessions yet. Start a session to see history here.</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {sessionHistory.map(session => (
                  <div key={session.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                    <button
                      onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#1B6B3A]/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="f-display font-bold text-[15px] text-[#1A1008] leading-snug truncate">{session.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="f-mono text-[10px] text-[#1A1008]/40">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="f-mono text-[10px] text-[#1A1008]/40">{session.responseCount} responses</span>
                          <span
                            className="f-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border"
                            style={{ borderColor: `${TYPE_COLORS[session.type]}50`, color: TYPE_COLORS[session.type], backgroundColor: `${TYPE_COLORS[session.type]}10` }}
                          >
                            {session.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={[
                          'f-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border',
                          session.isActive
                            ? 'border-[#1B6B3A] text-[#1B6B3A] bg-[#1B6B3A]/[0.07]'
                            : 'border-[#1A1008]/25 text-[#1A1008]/40',
                        ].join(' ')}>
                          {session.isActive ? 'Active' : 'Closed'}
                        </span>
                        <span className="f-mono text-[11px] text-[#1A1008]/30">{expanded === session.id ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expanded === session.id && (
                      <div className="border-t border-[#1A1008]/10 px-5 py-4 space-y-2">
                        {session.responses.length === 0
                          ? <p className="f-mono text-[11px] text-[#1A1008]/30">No responses received.</p>
                          : session.responses.map(r => (
                              <div key={r.id} className="flex items-start gap-3 py-2 border-b border-[#1A1008]/[0.06] last:border-0">
                                {r.type === 'emoji' && (
                                  <span className="text-[22px] leading-none">{r.emoji}</span>
                                )}
                                {r.type === 'text' && (
                                  <p className="f-mono text-[12px] text-[#1A1008]/70 italic">"{r.text}"</p>
                                )}
                                {r.type === 'score' && (
                                  <span className="f-display font-black text-[20px] text-[#1B6B3A]">{r.score}</span>
                                )}
                              </div>
                            ))}
                        <p className="f-mono text-[9px] text-[#1A1008]/25 pt-1">Room: {session.roomId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/party/feedback-host/history')({
  loader: async () => {
    const sessionHistory = await getFeedbackHistory()
    return { sessionHistory }
  },
  head: () => ({ meta: [{ title: 'Feedback History — Tools' }] }),
  component: FeedbackHistoryPage,
})
```

- [ ] **Step 2: Add History link to feedback host action bar**

In `src/routes/party.feedback-host.tsx`, add History to the lucide import and add the link button in the action bar alongside the existing buttons:

```tsx
import { Copy, ExternalLink, History, RefreshCw } from 'lucide-react'

// First button in the action bar div:
<Link
  to="/party/feedback-host/history"
  className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-white f-mono text-[10px] tracking-[0.1em] uppercase text-[#1A1008] shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
>
  <History size={11} />
  History
</Link>
```

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/party.feedback-host.history.tsx src/routes/party.feedback-host.tsx
git commit -m "feat: add feedback history page"
```

---

## Task 4: Feelings History Page

**Files:**
- Create: `src/routes/party.feelings.history.tsx`
- Modify: `src/routes/party.feelings.tsx`

- [ ] **Step 1: Create the feelings history route**

```tsx
// src/routes/party.feelings.history.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { feelingSessions, feelingEmojis } from '@/db/schema'

interface EmojiCount {
  emoji: string
  count: number
}

interface SessionRow {
  id: number
  roomId: string
  createdAt: string
  endedAt: string | null
  totalCount: number
  top3: EmojiCount[]
  allEmojis: EmojiCount[]
}

async function getFeelingsHistory(): Promise<SessionRow[]> {
  const sessions = await db
    .select()
    .from(feelingSessions)
    .orderBy(desc(feelingSessions.createdAt))
    .limit(50)

  const result: SessionRow[] = []
  for (const session of sessions) {
    const emojis = await db
      .select()
      .from(feelingEmojis)
      .where(eq(feelingEmojis.sessionId, session.id))

    const freq: Record<string, number> = {}
    for (const e of emojis) {
      freq[e.emoji] = (freq[e.emoji] ?? 0) + 1
    }
    const sorted: EmojiCount[] = Object.entries(freq)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)

    result.push({
      id: session.id,
      roomId: session.roomId,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      totalCount: emojis.length,
      top3: sorted.slice(0, 3),
      allEmojis: sorted,
    })
  }
  return result
}

function FeelingsHistoryPage() {
  const { sessionHistory } = Route.useLoaderData()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#6D28D9]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/party/feelings" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          ← Feeling Stream
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Feelings History<span className="text-[#6D28D9]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">{sessionHistory.length} sessions</p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl">
        {sessionHistory.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">✨</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">No feeling streams yet. Open a room to see history here.</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {sessionHistory.map(session => (
                  <div key={session.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                    <button
                      onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#6D28D9]/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="f-display font-bold text-[15px] text-[#1A1008]">
                          {new Date(session.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="f-mono text-[10px] text-[#1A1008]/40">{session.totalCount} emojis</span>
                          {session.top3.map(e => (
                            <span key={e.emoji} className="f-mono text-[11px]">
                              {e.emoji} <span className="text-[#1A1008]/40">{e.count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="f-mono text-[11px] text-[#1A1008]/30 shrink-0">{expanded === session.id ? '▲' : '▼'}</span>
                    </button>

                    {expanded === session.id && (
                      <div className="border-t border-[#1A1008]/10 px-5 py-4">
                        <div className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#6D28D9] mb-3">Emoji Breakdown</div>
                        <div className="space-y-1.5">
                          {session.allEmojis.map(e => (
                            <div key={e.emoji} className="flex items-center gap-3">
                              <span className="text-[20px] leading-none w-8">{e.emoji}</span>
                              <div className="flex-1 bg-[#1A1008]/[0.06] h-2 rounded-none overflow-hidden">
                                <div
                                  className="h-full bg-[#6D28D9]/50"
                                  style={{ width: `${session.totalCount > 0 ? (e.count / session.totalCount) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="f-mono text-[11px] text-[#1A1008]/50 w-8 text-right">{e.count}</span>
                            </div>
                          ))}
                        </div>
                        <p className="f-mono text-[9px] text-[#1A1008]/25 pt-3">Room: {session.roomId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
    </div>
  )
}

export const Route = createFileRoute('/party/feelings/history')({
  loader: async () => {
    const sessionHistory = await getFeelingsHistory()
    return { sessionHistory }
  },
  head: () => ({ meta: [{ title: 'Feelings History — Tools' }] }),
  component: FeelingsHistoryPage,
})
```

- [ ] **Step 2: Add History overlay link to feelings page**

The feelings page is fullscreen (`fixed inset-0`). Add a floating History link overlay inside `FeelingsPage` in `src/routes/party.feelings.tsx`. Add the `Link` import from `@tanstack/react-router` (it's not currently imported in that file):

```tsx
// Add Link to the existing import:
import { createFileRoute, Link } from '@tanstack/react-router'

// Inside the return, wrap existing content and add the overlay:
return (
  <div className="fixed inset-0">
    <EmojiStream
      roomId={roomId}
      host={getPartykitHost()}
      onCopyLink={handleCopyLink}
    />
    <Link
      to="/party/feelings/history"
      className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1A1008]/40 bg-black/30 backdrop-blur-sm text-white f-mono text-[10px] tracking-[0.1em] uppercase hover:bg-black/50 transition-colors no-underline"
    >
      History
    </Link>
  </div>
)
```

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/party.feelings.history.tsx src/routes/party.feelings.tsx
git commit -m "feat: add feelings history page"
```

---

## Task 5: Testimonials History Page

**Files:**
- Create: `src/routes/testimonials.history.tsx`
- Modify: `src/routes/testimonials.tsx`

- [ ] **Step 1: Create the testimonials history route**

```tsx
// src/routes/testimonials.history.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { testimonialSessions, testimonials } from '@/db/schema'

interface TestimonialRow {
  id: number
  studentName: string
  content: string
  status: string
  submittedAt: string
}

interface SessionRow {
  id: number
  roomId: string
  title: string
  isActive: boolean
  createdAt: string
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  approved: TestimonialRow[]
}

async function getTestimonialsHistory(): Promise<SessionRow[]> {
  const sessions = await db
    .select()
    .from(testimonialSessions)
    .orderBy(desc(testimonialSessions.createdAt))
    .limit(50)

  const result: SessionRow[] = []
  for (const session of sessions) {
    const items = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.sessionId, session.id))
      .orderBy(desc(testimonials.submittedAt))

    const approved = items.filter(t => t.status === 'approved')
    const pending = items.filter(t => t.status === 'pending')
    const rejected = items.filter(t => t.status === 'rejected')

    result.push({
      id: session.id,
      roomId: session.roomId,
      title: session.title,
      isActive: session.isActive,
      createdAt: session.createdAt.toISOString(),
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      approved: approved.map(t => ({
        id: t.id,
        studentName: t.studentName,
        content: t.content,
        status: t.status,
        submittedAt: t.submittedAt.toISOString(),
      })),
    })
  }
  return result
}

function TestimonialsHistoryPage() {
  const { sessionHistory } = Route.useLoaderData()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#6D28D9]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/testimonials" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          ← Testimonials
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Testimonial History<span className="text-[#6D28D9]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">{sessionHistory.length} campaigns</p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl">
        {sessionHistory.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">No campaigns yet. Create a campaign to see history here.</p>
              </div>
            )
          : (
              <div className="space-y-3">
                {sessionHistory.map(session => (
                  <div key={session.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                    <button
                      onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#6D28D9]/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="f-display font-bold text-[15px] text-[#1A1008] leading-snug truncate">{session.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="f-mono text-[10px] text-[#1A1008]/40">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="f-mono text-[10px] text-[#1B6B3A]">{session.approvedCount} approved</span>
                          {session.pendingCount > 0 && (
                            <span className="f-mono text-[10px] text-[#1A1008]/40">{session.pendingCount} pending</span>
                          )}
                          {session.rejectedCount > 0 && (
                            <span className="f-mono text-[10px] text-[#D4380D]/60">{session.rejectedCount} rejected</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={[
                          'f-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border',
                          session.isActive
                            ? 'border-[#1B6B3A] text-[#1B6B3A] bg-[#1B6B3A]/[0.07]'
                            : 'border-[#1A1008]/25 text-[#1A1008]/40',
                        ].join(' ')}>
                          {session.isActive ? 'Active' : 'Closed'}
                        </span>
                        <span className="f-mono text-[11px] text-[#1A1008]/30">{expanded === session.id ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {expanded === session.id && (
                      <div className="border-t border-[#1A1008]/10 px-5 py-4">
                        {session.approved.length === 0
                          ? <p className="f-mono text-[11px] text-[#1A1008]/30">No approved testimonials yet.</p>
                          : (
                              <div className="space-y-3">
                                {session.approved.map(t => (
                                  <div key={t.id} className="border-l-2 border-[#6D28D9] pl-4 py-1">
                                    <p className="f-display font-bold text-[13px] text-[#1A1008] mb-1">{t.studentName}</p>
                                    <p className="f-mono text-[12px] text-[#1A1008]/65 leading-relaxed">"{t.content}"</p>
                                  </div>
                                ))}
                              </div>
                            )}
                        <p className="f-mono text-[9px] text-[#1A1008]/25 pt-3">Room: {session.roomId}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
    </div>
  )
}

export const Route = createFileRoute('/testimonials/history')({
  loader: async () => {
    const sessionHistory = await getTestimonialsHistory()
    return { sessionHistory }
  },
  head: () => ({ meta: [{ title: 'Testimonial History — Tools' }] }),
  component: TestimonialsHistoryPage,
})
```

- [ ] **Step 2: Add History link to testimonials dashboard**

In `src/routes/testimonials.tsx`, add a History link button next to the existing `+ New Campaign` button in the `TestimonialsDashboard` header:

```tsx
// The existing button is inside a flex div in the header. Add History link before it:
<Link
  to="/testimonials/history"
  className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
>
  History
</Link>
```

Make sure `Link` is already imported from `@tanstack/react-router` (it is, on line 2 of `testimonials.tsx`).

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/testimonials.history.tsx src/routes/testimonials.tsx
git commit -m "feat: add testimonials history page"
```

---

## Self-Review

**Spec coverage check:**
- ✅ All 5 history routes created with correct paths
- ✅ All 5 host pages get a History link
- ✅ Each page has a loader querying correct tables with `desc` ordering
- ✅ Each page has list view + inline accordion expand
- ✅ Each page has empty state with correct emoji and message
- ✅ Each page uses the tool's accent color
- ✅ Back navigation link on every history page
- ✅ Error handling: DB errors in loaders surface as TanStack Start error boundaries (framework handles this — no extra code needed)

**Placeholder scan:** None found — all code blocks are complete.

**Type consistency:** `Route.useLoaderData()` return types match the loader return types in all 5 tasks. `PollRow`, `GameRow`, `SessionRow` etc. are defined before use.
