import { useState } from 'react'
import { useFeedbackSocket } from '@/hooks/use-feedback-socket'

interface FeedbackClientProps {
  roomId: string
  host?: string
}

export function FeedbackClient({ roomId, host = 'localhost:1999' }: FeedbackClientProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [textFeedback, setTextFeedback] = useState('')
  const [selectedScore, setSelectedScore] = useState<number | null>(null)

  const { socket, session, error } = useFeedbackSocket(roomId, host)

  const submitEmoji = (emoji: string) => {
    if (!socket || hasSubmitted)
      return
    socket.send(JSON.stringify({ type: 'submit_emoji', emoji }))
    setHasSubmitted(true)
  }

  const submitText = () => {
    if (!socket || !textFeedback.trim() || hasSubmitted)
      return
    socket.send(JSON.stringify({ type: 'submit_text', text: textFeedback.trim() }))
    setHasSubmitted(true)
  }

  const submitScore = (score: number) => {
    if (!socket || hasSubmitted)
      return
    socket.send(JSON.stringify({ type: 'submit_score', score }))
    setSelectedScore(score)
    setHasSubmitted(true)
  }

  // Waiting — no session yet
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 border-2 border-[#1B6B3A] mx-auto mb-6 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="f-display font-black text-[22px] tracking-tight text-[#1A1008] mb-2">
            Waiting for session
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            The host will start a feedback session shortly.
          </p>
        </div>
      </div>
    )
  }

  // Closed
  if (!session.isActive) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1A1008]/30 bg-white p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="f-display font-black text-[22px] tracking-tight text-[#1A1008] mb-2">
            Session Closed
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/40 leading-loose">
            This feedback session is no longer accepting responses.
          </p>
        </div>
      </div>
    )
  }

  // Thank you
  if (hasSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1B6B3A] bg-white shadow-[5px_5px_0_#1B6B3A] p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 border-2 border-[#1B6B3A] bg-[#1B6B3A] mx-auto mb-6 flex items-center justify-center">
            <span className="text-white text-xl font-bold">✓</span>
          </div>
          <h2 className="f-display font-black text-[24px] tracking-tight text-[#1A1008] mb-2">
            Thank You
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            Your feedback has been submitted successfully.
          </p>
          <div className="mt-6 border-t border-[#1A1008]/10 pt-4">
            <p className="f-mono text-[10px] tracking-wider uppercase text-[#1B6B3A]">
              You may close this window
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Active form
  return (
    <div className="flex-1 flex items-start justify-center p-6 pt-8 min-h-[60vh]">
      <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] max-w-lg w-full">
        {/* Session header */}
        <div className="border-b-2 border-[#1A1008] px-6 py-5">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-2">
            {session.type} feedback
          </div>
          <h1 className="f-display font-black text-[22px] sm:text-[26px] tracking-[-0.02em] text-[#1A1008] leading-tight">
            {session.title}
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
            <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
          </div>
        )}

        <div className="p-6">
          {/* Emoji feedback */}
          {session.type === 'emoji' && session.emojiOptions && (
            <div>
              <p className="f-mono text-[11px] tracking-wider uppercase text-[#1A1008]/40 mb-5 text-center">
                How do you feel?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {session.emojiOptions.map(option => (
                  <button
                    key={option.emoji}
                    onClick={() => submitEmoji(option.emoji)}
                    className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 p-6 flex flex-col items-center gap-2 group"
                  >
                    <span className="text-5xl">{option.emoji}</span>
                    <span className="f-mono text-[11px] text-[#1A1008]/60 group-hover:text-[#1A1008] transition-colors">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text feedback */}
          {session.type === 'text' && (
            <div className="space-y-4">
              <label className="f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 block">
                Your Feedback
              </label>
              <textarea
                value={textFeedback}
                onChange={e => setTextFeedback(e.target.value)}
                placeholder="Type your feedback here..."
                rows={5}
                className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#1B6B3A] transition-shadow resize-none"
              />
              <button
                onClick={submitText}
                disabled={!textFeedback.trim()}
                className="w-full border-2 border-[#1A1008] bg-[#1B6B3A] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
              >
                Submit Feedback
              </button>
            </div>
          )}

          {/* Score feedback */}
          {session.type === 'score' && session.scoreRange && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 mb-1">
                  Rate your experience
                </p>
                <p className="f-mono text-[11px] text-[#1A1008]/35">
                  {session.scoreRange.min} = lowest · {session.scoreRange.max} = highest
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {Array.from(
                  { length: session.scoreRange.max - session.scoreRange.min + 1 },
                  (_, i) => i + (session.scoreRange?.min ?? 0),
                ).map(score => (
                  <button
                    key={score}
                    onClick={() => submitScore(score)}
                    className={[
                      'w-12 h-12 border-2 f-mono text-[14px] font-medium transition-all duration-150',
                      selectedScore === score
                        ? 'border-[#1B6B3A] bg-[#1B6B3A] text-white shadow-none'
                        : 'border-[#1A1008] bg-white text-[#1A1008] shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                    ].join(' ')}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
