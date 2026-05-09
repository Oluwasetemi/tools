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

interface PollVoterProps {
  roomId: string
  host?: string
}

export function PollVoter({ roomId, host = 'localhost:1999' }: PollVoterProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)

  useEffect(() => {
    const ws = new PartySocket({ host, room: roomId, party: 'polls' })

    ws.addEventListener('message', (event) => {
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
    })

    ws.addEventListener('error', () => setError('Connection error'))
    setSocket(ws)
    return () => ws.close()
  }, [roomId, host])

  const vote = (optionId: string) => {
    if (!socket || hasVoted)
      return
    socket.send(JSON.stringify({ type: 'vote', optionId }))
    setVotedOptionId(optionId)
    setHasVoted(true)
  }

  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0

  // Waiting state
  if (!poll) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10 text-center">
          <div className="w-14 h-14 border-2 border-[#0C3D6B] mx-auto mb-6 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#0C3D6B] border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="f-display font-black text-[24px] tracking-tight text-[#1A1008] mb-2">
            Waiting for poll
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            The host will launch a poll shortly.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0C3D6B] animate-pulse" />
            <span className="f-mono text-[10px] tracking-wider uppercase text-[#1A1008]/40">
              {connectionCount} connected
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Connection count + status */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${poll.isActive ? 'bg-[#1B6B3A] animate-pulse' : 'bg-[#1A1008]/30'}`} />
          <span className="f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40">
            {poll.isActive ? 'Live' : 'Ended'}
          </span>
        </div>
        <span className="f-mono text-[10px] tracking-wider text-[#1A1008]/35">
          {connectionCount} connected
        </span>
      </div>

      {/* Poll card */}
      <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008]">
        {/* Question header */}
        <div className="border-b-2 border-[#1A1008] px-6 py-5">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#0C3D6B] mb-2">
            {hasVoted ? 'Your vote is in — live results' : 'Cast your vote'}
          </div>
          <h2 className="f-display font-bold text-[20px] sm:text-[24px] tracking-[-0.02em] text-[#1A1008] leading-tight">
            {poll.question}
          </h2>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
            <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
          </div>
        )}

        {/* Thank you banner */}
        {hasVoted && (
          <div className="mx-6 mt-4 border-2 border-[#1B6B3A] bg-[#1B6B3A]/[0.06] px-4 py-2.5 flex items-center gap-2">
            <span className="text-[#1B6B3A] text-base">✓</span>
            <span className="f-mono text-[11px] text-[#1B6B3A]">
              Vote submitted. Watch results update live.
            </span>
          </div>
        )}

        {/* Options */}
        <div className="p-6 space-y-3">
          {poll.options.map((option) => {
            const pct = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
            const isMyVote = votedOptionId === option.id
            const isWinning = hasVoted && option.votes === Math.max(...poll.options.map(o => o.votes)) && option.votes > 0

            return (
              <button
                key={option.id}
                onClick={() => vote(option.id)}
                disabled={hasVoted || !poll.isActive}
                className={[
                  'relative w-full text-left overflow-hidden border-2 transition-all duration-150',
                  !hasVoted && poll.isActive
                    ? 'border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] cursor-pointer'
                    : isMyVote
                      ? 'border-[#0C3D6B] bg-[#0C3D6B]/[0.04] cursor-default'
                      : 'border-[#1A1008]/20 bg-white cursor-default',
                ].join(' ')}
              >
                {/* Vote bar fill */}
                {hasVoted && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ${isMyVote ? 'bg-[#0C3D6B]/[0.12]' : 'bg-[#1A1008]/[0.04]'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    {isMyVote && (
                      <span className="text-[#0C3D6B] text-sm shrink-0">✓</span>
                    )}
                    <span className={`f-mono text-[13px] font-medium ${isMyVote ? 'text-[#0C3D6B]' : 'text-[#1A1008]'}`}>
                      {option.text}
                    </span>
                  </div>
                  {hasVoted && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isWinning && (
                        <span className="f-mono text-[9px] tracking-wider uppercase text-[#D4380D]">Leading</span>
                      )}
                      <span className="f-mono text-[12px] text-[#1A1008]/50">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1A1008]/10 px-6 py-3 flex items-center justify-between bg-[#1A1008]/[0.015]">
          <span className="f-mono text-[10px] text-[#1A1008]/35 uppercase tracking-wider">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          </span>
          {!poll.isActive && (
            <span className="f-mono text-[10px] tracking-wider uppercase text-[#D4380D]">
              Poll ended
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
