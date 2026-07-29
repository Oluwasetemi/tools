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
    setCreating(true)
    const msg = { type: 'create_session', title: showTitle.trim() }
    console.log('[DBG-T] HOST → sending create_session:', msg, 'socket.readyState:', socket.readyState)
    socket.send(JSON.stringify(msg))
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

  if (!session) {
    const isConnError = error === 'Connection error'
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10 max-w-md w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9]">Host Controls</div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnError ? 'bg-[#D4380D]' : 'bg-[#1B6B3A] animate-pulse'}`} />
              <span className="f-mono text-[9px] text-[#1A1008]/40">{isConnError ? 'disconnected' : 'connected'}</span>
            </div>
          </div>
          <h2 className="f-display font-black text-[24px] text-[#1A1008] mb-6">
            Start Campaign<span className="text-[#6D28D9]">.</span>
          </h2>
          {isConnError && (
            <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-3 mb-4">
              <p className="f-mono text-[11px] text-[#D4380D]">Cannot connect to PartyKit. Make sure the dev server is running (<code>bun run dev</code>).</p>
            </div>
          )}
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
              disabled={!showTitle.trim() || isConnError || creating}
              className="w-full border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
            >
              {creating ? 'Opening…' : 'Open Campaign'}
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
