import { isTruthy } from '@setemiojo/utils'
import { Plus, Trash2 } from 'lucide-react'
import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

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

interface PollClientProps {
  roomId: string
  host?: string
}

const inputCls = 'w-full border-2 border-[#1A1008] bg-white px-3 py-2.5 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#0C3D6B] transition-shadow'
const pressBtnCls = 'border-2 border-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none'

export function PollClient({ roomId, host = 'localhost:1999' }: PollClientProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  useEffect(() => {
    const ws = new PartySocket({ host, room: roomId, party: 'polls' })
    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)
      switch (data.type) {
        case 'poll_created':
        case 'poll_updated':
          setPoll(data.poll)
          setError(null)
          setShowCreate(false)
          break
        case 'poll_ended': setPoll(data.poll); break
        case 'error': setError(data.message); break
        case 'connection_count': setConnectionCount(data.count); break
      }
    })
    ws.addEventListener('open', () => setError(null))
    ws.addEventListener('error', () => setError('Connection error'))
    setSocket(ws)
    return () => ws.close()
  }, [roomId, host])

  const createPoll = () => {
    if (!socket || !question || options.some(o => !o.trim())) { setError('Please fill in all fields'); return }
    socket.send(JSON.stringify({ type: 'create_poll', question, options: options.map(o => o.trim()).filter(isTruthy) }))
    setQuestion('')
    setOptions(['', ''])
  }

  const vote = (optionId: string) => {
    if (!socket || hasVoted) return
    socket.send(JSON.stringify({ type: 'vote', optionId }))
    setHasVoted(true)
  }

  const endPoll = () => socket?.send(JSON.stringify({ type: 'end_poll' }))
  const addOption = () => setOptions(prev => [...prev, ''])
  const updateOption = (i: number, v: string) => setOptions(prev => prev.map((o, idx) => idx === i ? v : o))
  const removeOption = (i: number) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)) }

  const totalVotes = poll?.options.reduce((s, o) => s + o.votes, 0) ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Status strip */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
          <span className="f-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1008]/40">{connectionCount} online</span>
        </div>
        {poll && !showCreate && (
          <button onClick={() => setShowCreate(true)} className="f-mono text-[9px] tracking-[0.15em] uppercase text-[#0C3D6B] hover:underline">
            + New Poll
          </button>
        )}
        {showCreate && (
          <button onClick={() => setShowCreate(false)} className="f-mono text-[9px] tracking-[0.15em] uppercase text-[#1A1008]/40 hover:underline">
            ← Back
          </button>
        )}
      </div>

      {error && (
        <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-3 mb-5 f-mono text-[12px] text-[#D4380D]">{error}</div>
      )}

      {/* Create form */}
      {(!poll || showCreate) && (
        <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#0C3D6B] mb-4">Create a Poll</div>

          <div className="mb-4">
            <label className="block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-1.5">Question</label>
            <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Enter your question..." className={inputCls} />
          </div>

          <div className="mb-4">
            <label className="block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <span className="f-mono text-[10px] font-black text-[#0C3D6B] self-center w-5">{i + 1}</span>
                  <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className={`${inputCls} flex-1`} />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="border-2 border-[#D4380D]/40 text-[#D4380D] px-2 hover:bg-[#D4380D]/[0.06] transition-colors">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <button type="button" onClick={addOption} className="flex items-center gap-1.5 f-mono text-[9px] tracking-[0.15em] uppercase text-[#0C3D6B] hover:underline">
              <Plus size={10} /> Add Option
            </button>
            <button onClick={createPoll} className={`${pressBtnCls} bg-[#0C3D6B] text-white`}>
              Create Poll →
            </button>
          </div>
        </div>
      )}

      {/* Poll view */}
      {poll && !showCreate && (
        <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
          <div className="mb-1 f-mono text-[9px] tracking-[0.22em] uppercase text-[#0C3D6B]">
            {poll.isActive ? 'Vote now' : 'Poll ended'}
          </div>
          <p className="f-display font-bold text-[20px] text-[#1A1008] mb-5 leading-snug">{poll.question}</p>

          <div className="space-y-2.5 mb-5">
            {poll.options.map((option) => {
              const pct = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
              const voted = hasVoted || !poll.isActive
              return (
                <button
                  key={option.id}
                  onClick={() => vote(option.id)}
                  disabled={voted}
                  className={`w-full text-left relative overflow-hidden border-2 transition-all ${
                    voted
                      ? 'border-[#1A1008]/15 cursor-default'
                      : 'border-[#1A1008] shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'
                  }`}
                >
                  <div className="absolute inset-0 bg-[#0C3D6B]/[0.08] transition-all duration-500" style={{ width: `${pct}%` }} />
                  <div className="relative px-4 py-3 flex justify-between items-center">
                    <span className="f-mono text-[13px] text-[#1A1008]">{option.text}</span>
                    {voted && <span className="f-mono text-[11px] text-[#1A1008]/40 shrink-0 ml-3">{pct.toFixed(0)}%</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#1A1008]/10">
            <span className="f-mono text-[10px] text-[#1A1008]/40">{totalVotes} total votes</span>
            {poll.isActive && (
              <button onClick={endPoll} className={`${pressBtnCls} bg-[#D4380D] text-white`}>End Poll</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
