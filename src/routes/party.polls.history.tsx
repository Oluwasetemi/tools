import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { p } from '@setemiojo/utils'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { polls, pollOptions } from '@/db/schema'

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

const getPollsHistory = createServerFn({ method: 'GET' }).handler(async (): Promise<PollRow[]> => {
  const pollList = await db
    .select()
    .from(polls)
    .orderBy(desc(polls.createdAt))
    .limit(50)

  return p(pollList, { concurrency: 5 }).map(async (poll) => {
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll.id))
      .orderBy(pollOptions.optionOrder)

    const totalVotes = options.reduce((s, o) => s + o.votes, 0)
    const winner = options.length > 0
      ? options.reduce((best, o) => o.votes > best.votes ? o : best)
      : null

    return {
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
    }
  })
})

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
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left rounded-none hover:bg-[#0C3D6B]/[0.03] transition-colors"
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
  loader: async () => ({ pollHistory: await getPollsHistory() }),
  head: () => ({ meta: [{ title: 'Poll History — Tools' }] }),
  component: PollHistoryPage,
})
