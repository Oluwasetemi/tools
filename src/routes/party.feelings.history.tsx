import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { groupBy, p } from '@setemiojo/utils'
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

const getFeelingsHistory = createServerFn({ method: 'GET' }).handler(async (): Promise<SessionRow[]> => {
  const sessions = await db
    .select()
    .from(feelingSessions)
    .orderBy(desc(feelingSessions.createdAt))
    .limit(50)

  return p(sessions, { concurrency: 5 }).map(async (session) => {
    const emojis = await db
      .select()
      .from(feelingEmojis)
      .where(eq(feelingEmojis.sessionId, session.id))

    const grouped = groupBy(emojis, e => e.emoji)
    const sorted: EmojiCount[] = Object.entries(grouped)
      .map(([emoji, records]) => ({ emoji, count: records.length }))
      .sort((a, b) => b.count - a.count)

    return {
      id: session.id,
      roomId: session.roomId,
      createdAt: session.createdAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      totalCount: emojis.length,
      top3: sorted.slice(0, 3),
      allEmojis: sorted,
    }
  })
})

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
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left rounded-none hover:bg-[#6D28D9]/[0.03] transition-colors"
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
    </div>
  )
}

export const Route = createFileRoute('/party/feelings/history')({
  loader: async () => ({ sessionHistory: await getFeelingsHistory() }),
  head: () => ({ meta: [{ title: 'Feelings History — Tools' }, { name: 'description', content: 'Browse past emoji stream sessions and see which emojis resonated most.' }] }),
  component: FeelingsHistoryPage,
})
