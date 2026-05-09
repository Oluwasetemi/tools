import type { FeedbackSession } from './types'

interface SessionHeaderProps {
  readonly session: FeedbackSession
  readonly totalResponses: number
  readonly onClose: () => void
}

export function SessionHeader({ session, totalResponses, onClose }: SessionHeaderProps) {
  return (
    <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-5 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-1">
            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Feedback · Active
          </div>
          <h2 className="f-display font-black text-[20px] text-[#1A1008] leading-tight mb-3">{session.title}</h2>
          <div className="flex items-baseline gap-1.5">
            <span className="f-display font-black text-[32px] text-[#1A1008] leading-none">{totalResponses}</span>
            <span className="f-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1008]/40">responses</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="border-2 border-[#D4380D] text-[#D4380D] f-mono text-[10px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#D4380D] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 shrink-0"
        >
          Close Session
        </button>
      </div>
    </div>
  )
}
