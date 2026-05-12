import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import { useState } from 'react'
import { auth } from '@/lib/auth'
import { createPlannedSession } from '@/server/session-planner'

const TOOLS = [
  { value: 'kahoot', label: 'Quiz Battle', emoji: '⚡', description: 'Competitive quiz with live leaderboard', accent: '#D4380D' },
  { value: 'poll', label: 'Live Poll', emoji: '📊', description: 'Real-time vote with instant results', accent: '#0C3D6B' },
  { value: 'feedback', label: 'Feedback', emoji: '💬', description: 'Emoji, text, or score responses', accent: '#1B6B3A' },
  { value: 'feelings', label: 'Feeling Stream', emoji: '✨', description: 'Emoji broadcast from students', accent: '#6D28D9' },
  { value: 'testimonials', label: 'Testimonials', emoji: '🗣', description: 'Collect and display student quotes', accent: '#B45309' },
  { value: 'certificates', label: 'Certificates', emoji: '🏅', description: 'Issue completion certificates', accent: '#B45309' },
] as const

type ToolValue = typeof TOOLS[number]['value']

const savePlannedSession = createServerFn({ method: 'POST' }).handler(async (input: {
  toolType: ToolValue
  title: string
  scheduledFor: string | null
}) => {
  const request = getRequest()
  if (!request) throw new Error('Not authenticated')
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Not authenticated')

  return createPlannedSession({
    ownerId: session.user.id,
    toolType: input.toolType,
    title: input.title,
    config: {},
    scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
  })
})

function NewSessionPage() {
  const navigate = useNavigate()
  const [toolType, setToolType] = useState<ToolValue>('kahoot')
  const [title, setTitle] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTool = TOOLS.find(t => t.value === toolType)!

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    try {
      await savePlannedSession({ data: { toolType, title: title.trim(), scheduledFor: scheduledFor || null } })
      navigate({ to: '/schedule', replace: true })
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1" style={{ background: selectedTool.accent }} />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/schedule" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          ← Schedule<span className="text-[#D4380D]">.</span>
        </Link>
        <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">New Session</span>
      </nav>

      <div className="px-5 sm:px-8 pt-8 pb-6 border-b-2 border-[#1A1008]">
        <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
          Plan a Session<span style={{ color: selectedTool.accent }}>.</span>
        </h1>
      </div>

      <div className="px-5 sm:px-8 pt-8 pb-12 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Tool type picker */}
          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-2">Tool</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TOOLS.map(tool => (
                <button
                  key={tool.value}
                  type="button"
                  onClick={() => setToolType(tool.value)}
                  className={[
                    'border-2 p-3 text-left transition-all duration-100',
                    toolType === tool.value
                      ? 'border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]'
                      : 'border-[#1A1008]/20 bg-white hover:border-[#1A1008]/50',
                  ].join(' ')}
                >
                  <div className="text-[20px] mb-1">{tool.emoji}</div>
                  <div className="f-display font-bold text-[12px] text-[#1A1008]">{tool.label}</div>
                  <div className="f-mono text-[9px] text-[#1A1008]/40 mt-0.5 leading-tight">{tool.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
              Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Week 3 — React Hooks Quiz"
              required
              className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#1A1008] transition-shadow"
            />
          </div>

          {/* Scheduled for */}
          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
              Scheduled For <span className="normal-case">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)}
              className="border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] outline-none focus:shadow-[3px_3px_0_#1A1008] transition-shadow"
            />
            <p className="f-mono text-[9px] text-[#1A1008]/30 mt-1">For planning only — you still start it manually from the schedule.</p>
          </div>

          {error && (
            <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
              <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="border-2 border-[#1A1008] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-8 py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
            style={{ background: selectedTool.accent }}
          >
            {saving ? 'Saving...' : 'Add to Schedule →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authed/schedule/new')({
  head: () => ({ meta: [{ title: 'New Session — Schedule' }] }),
  component: NewSessionPage,
})
