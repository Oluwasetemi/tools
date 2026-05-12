import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { p } from '@setemiojo/utils'
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
  type: 'emoji' | 'text' | 'score'
  isActive: boolean
  createdAt: string
  closedAt: string | null
  responseCount: number
  responses: ResponseRow[]
}

const getFeedbackHistory = createServerFn({ method: 'GET' }).handler(async (): Promise<SessionRow[]> => {
  const sessions = await db
    .select()
    .from(feedbackSessions)
    .orderBy(desc(feedbackSessions.createdAt))
    .limit(50)

  return p(sessions, { concurrency: 5 }).map(async (session) => {
    const responses = await db
      .select()
      .from(feedbackResponses)
      .where(eq(feedbackResponses.sessionId, session.id))
      .orderBy(desc(feedbackResponses.submittedAt))

    return {
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
    }
  })
})

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
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left rounded-none hover:bg-[#1B6B3A]/[0.03] transition-colors"
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

export const Route = createFileRoute('/_authed/party/feedback-host/history')({
  loader: async () => ({ sessionHistory: await getFeedbackHistory() }),
  head: () => ({ meta: [{ title: 'Feedback History — Tools' }, { name: 'description', content: 'Browse past feedback sessions, response breakdowns, and participant activity.' }] }),
  component: FeedbackHistoryPage,
})
