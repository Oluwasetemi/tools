import { createServerFn } from '@tanstack/react-start'
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

const getTestimonialsHistory = createServerFn({ method: 'GET' }).handler(async (): Promise<SessionRow[]> => {
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
})

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
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left rounded-none hover:bg-[#6D28D9]/[0.03] transition-colors"
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
    </div>
  )
}

export const Route = createFileRoute('/testimonials/history')({
  loader: async () => ({ sessionHistory: await getTestimonialsHistory() }),
  head: () => ({ meta: [{ title: 'Testimonial History — Tools' }] }),
  component: TestimonialsHistoryPage,
})
