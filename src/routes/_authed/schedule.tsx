import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'
import { getTeacherSchedule, startPlannedSession } from '@/server/session-planner'

const TOOL_LABELS: Record<string, { name: string; emoji: string; accent: string }> = {
  kahoot: { name: 'Quiz', emoji: '⚡', accent: '#D4380D' },
  poll: { name: 'Live Poll', emoji: '📊', accent: '#0C3D6B' },
  feedback: { name: 'Feedback', emoji: '💬', accent: '#1B6B3A' },
  feelings: { name: 'Feeling Stream', emoji: '✨', accent: '#6D28D9' },
  testimonials: { name: 'Testimonials', emoji: '🗣', accent: '#6D28D9' },
  certificates: { name: 'Certificates', emoji: '🏅', accent: '#B45309' },
}

const TOOL_HOST_ROUTES: Record<string, string> = {
  kahoot: '/party/kahoot-host',
  poll: '/party/polls',
  feedback: '/party/feedback-host',
  feelings: '/party/feelings',
  testimonials: '/testimonials',
  certificates: '/certificates',
}

const getSchedule = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  if (!request) throw new Error('Not authenticated')
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Not authenticated')
  return getTeacherSchedule(session.user.id)
})

const launchSession = createServerFn({ method: 'POST' }).handler(async ({ data: id }: { data: number }) => {
  const request = getRequest()
  if (!request) throw new Error('Not authenticated')
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Not authenticated')
  return startPlannedSession({ id, ownerId: session.user.id })
})

function SchedulePage() {
  const { sessions } = Route.useLoaderData()
  const router = useRouter()

  const planned = sessions.filter(s => s.status === 'planned')
  const active = sessions.filter(s => s.status === 'active')
  const recent = sessions.filter(s => s.status === 'ended').slice(0, 10)

  const handleStart = async (id: number) => {
    const result = await launchSession({ data: id })
    router.navigate({ to: result.redirectTo as any })
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#1A1008]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <Link to="/schedule/new" className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors no-underline">
          + Plan Session
        </Link>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Schedule<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1">
          {planned.length} planned · {active.length} live
        </p>
      </div>

      <div className="px-5 sm:px-8 py-6 max-w-3xl space-y-8">
        {active.length > 0 && (
          <section>
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-3">Live Now</div>
            <div className="space-y-2">
              {active.map(s => {
                const tool = TOOL_LABELS[s.toolType] ?? { name: s.toolType, emoji: '🛠', accent: '#1A1008' }
                return (
                  <div key={s.id} className="border-2 border-[#1B6B3A] bg-white shadow-[3px_3px_0_#1B6B3A] px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="f-display font-bold text-[15px] text-[#1A1008]">{s.title}</p>
                      <p className="f-mono text-[10px] text-[#1A1008]/40 mt-0.5">{tool.emoji} {tool.name}</p>
                    </div>
                    <a
                      href={`${TOOL_HOST_ROUTES[s.toolType] ?? '/'}?room=${s.roomId}`}
                      className="f-mono text-[10px] tracking-[0.15em] uppercase border-2 border-[#1B6B3A] text-[#1B6B3A] px-4 py-1.5 hover:bg-[#1B6B3A] hover:text-white transition-colors no-underline"
                    >
                      Rejoin →
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section>
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-3">Planned</div>
          {planned.length === 0
            ? (
                <div className="border-2 border-dashed border-[#1A1008]/20 p-10 text-center">
                  <p className="f-mono text-[11px] text-[#1A1008]/40 mb-3">No sessions planned yet.</p>
                  <Link to="/schedule/new" className="f-mono text-[10px] tracking-[0.15em] uppercase border-2 border-[#1A1008] text-[#1A1008] px-5 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all no-underline inline-block">
                    Plan a session →
                  </Link>
                </div>
              )
            : (
                <div className="space-y-2">
                  {planned.map(s => {
                    const tool = TOOL_LABELS[s.toolType] ?? { name: s.toolType, emoji: '🛠', accent: '#1A1008' }
                    return (
                      <div key={s.id} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008] px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="f-display font-bold text-[15px] text-[#1A1008] truncate">{s.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="f-mono text-[10px] text-[#1A1008]/40">{tool.emoji} {tool.name}</span>
                            {s.scheduledFor && (
                              <span className="f-mono text-[10px]" style={{ color: tool.accent }}>
                                {new Date(s.scheduledFor).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStart(s.id)}
                          className="shrink-0 border-2 border-[#1A1008] bg-[#1A1008] text-white f-mono text-[10px] tracking-[0.15em] uppercase px-5 py-2 shadow-[3px_3px_0_#D4380D] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
                        >
                          Start →
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
        </section>

        {recent.length > 0 && (
          <section>
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/40 mb-3">Recent</div>
            <div className="space-y-2">
              {recent.map(s => {
                const tool = TOOL_LABELS[s.toolType] ?? { name: s.toolType, emoji: '🛠', accent: '#1A1008' }
                return (
                  <div key={s.id} className="border border-[#1A1008]/15 bg-white px-5 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="f-display font-bold text-[13px] text-[#1A1008]/70">{s.title}</p>
                      <p className="f-mono text-[10px] text-[#1A1008]/30 mt-0.5">
                        {tool.emoji} {tool.name} · {s.endedAt ? new Date(s.endedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authed/schedule')({
  loader: async () => ({ sessions: await getSchedule() }),
  head: () => ({ meta: [{ title: 'Schedule — Tools' }] }),
  component: SchedulePage,
})
