import type PartySocket from 'partysocket'
import { isTruthy } from '@setemiojo/utils'
import { Plus, Trash2 } from 'lucide-react'
import usePartySocket from 'partysocket/react'
import { useState } from 'react'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: string
  question: string
  options: PollOption[]
  isActive: boolean
  createdBy: string
  createdAt: number
}

type ServerMessage
  = | { type: 'poll_created', poll: Poll }
    | { type: 'poll_updated', poll: Poll }
    | { type: 'poll_ended', poll: Poll }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }

interface PollHostProps {
  roomId: string
  host?: string
}

const ACCENT = '#0C3D6B'
const inputCls = 'w-full border-2 border-[#1A1008] bg-white px-3 py-2.5 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#0C3D6B] transition-shadow'
const pressBtnCls = 'border-2 border-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none'

export function PollHost({ roomId, host = 'localhost:1999' }: PollHostProps) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'polls',
    onMessage(event: MessageEvent) {
      if (typeof event.data !== 'string') return
      const data: ServerMessage = JSON.parse(event.data)
      switch (data.type) {
        case 'poll_created':
        case 'poll_updated':
          setPoll(data.poll)
          setError(null)
          break
        case 'poll_ended':
          setPoll(data.poll)
          break
        case 'error':
          setError(data.message)
          break
        case 'connection_count':
          setConnectionCount(data.count)
          break
      }
    },
    onOpen() { setError(null) },
    onError() { setError('Connection error') },
  })

  const createPoll = () => {
    if (!socket || !question || options.some(o => !o.trim())) {
      setError('Please fill in all fields')
      return
    }
    socket.send(JSON.stringify({ type: 'create_poll', question, options: options.map(o => o.trim()).filter(isTruthy) }))
    setQuestion('')
    setOptions(['', ''])
  }

  const endPoll = () => socket?.send(JSON.stringify({ type: 'end_poll' }))
  const addOption = () => setOptions(prev => [...prev, ''])
  const updateOption = (i: number, v: string) => setOptions(prev => prev.map((o, idx) => idx === i ? v : o))
  const removeOption = (i: number) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)) }

  const totalVotes = poll?.options.reduce((s, o) => s + o.votes, 0) ?? 0

  const ErrorBanner = error
    ? <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-3 mb-5 f-mono text-[12px] text-[#D4380D]">{error}</div>
    : null

  // ── Status strip ──────────────────────────────────────────────────────────
  const StatusStrip = (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
        <span className="f-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1008]/50">
          {connectionCount} connected
        </span>
      </div>
    </div>
  )

  // ── Poll creation form ─────────────────────────────────────────────────────
  if (!poll) {
    return (
      <div>
        {StatusStrip}
        {ErrorBanner}
        <form onSubmit={(e) => { e.preventDefault(); createPoll() }}>
          <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6 mb-4">
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#0C3D6B] mb-4">Poll Settings</div>

            <div className="mb-5">
              <label className="block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-1.5">Question</label>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g., Which framework do you prefer?"
                required
                className={inputCls}
              />
            </div>

            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-3">Options</div>
            <div className="space-y-2.5 mb-4">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <span className="f-mono text-[10px] font-black text-[#0C3D6B] self-center w-5">{i + 1}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    required
                    className={`${inputCls} flex-1`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="border-2 border-[#D4380D]/40 text-[#D4380D] px-2 hover:bg-[#D4380D]/[0.06] transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1.5 f-mono text-[9px] tracking-[0.15em] uppercase text-[#0C3D6B] hover:underline"
            >
              <Plus size={10} />
              Add Option
            </button>
          </div>

          <div className="flex justify-end">
            <button type="submit" className={`${pressBtnCls} bg-[#0C3D6B] text-white`}>
              Create Poll →
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Active / ended poll ────────────────────────────────────────────────────
  return (
    <div>
      {StatusStrip}
      {ErrorBanner}

      <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
        {/* Poll header */}
        <div className="flex items-start justify-between mb-5 pb-5 border-b border-[#1A1008]/10">
          <div>
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#0C3D6B] mb-1">
              {poll.isActive ? 'Live' : 'Ended'}
            </div>
            <p className="f-display font-bold text-[18px] text-[#1A1008] leading-snug">{poll.question}</p>
          </div>
          <span className="f-mono text-[11px] text-[#1A1008]/40">{totalVotes} votes</span>
        </div>

        {/* Options with vote bars */}
        <div className="space-y-3 mb-6">
          {poll.options.map((option) => {
            const pct = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
            return (
              <div key={option.id} className="relative border-2 border-[#1A1008]/15 overflow-hidden">
                <div
                  className="absolute inset-0 bg-[#0C3D6B]/[0.08] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative px-4 py-3 flex justify-between items-center">
                  <span className="f-mono text-[13px] text-[#1A1008]">{option.text}</span>
                  <span className="f-mono text-[11px] text-[#1A1008]/50 shrink-0 ml-4">
                    {option.votes} · {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {poll.isActive && (
          <div className="flex justify-end">
            <button onClick={endPoll} className={`${pressBtnCls} bg-[#D4380D] text-white`}>
              End Poll
            </button>
          </div>
        )}
        {!poll.isActive && (
          <div className="f-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1008]/40 text-right">Poll closed</div>
        )}
      </div>
    </div>
  )
}
