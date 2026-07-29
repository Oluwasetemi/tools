import { useState } from 'react'
import { useTestimonialsSocket } from '@/hooks/use-testimonials-socket'

interface TestimonialSubmitProps {
  roomId: string
  host?: string
}

export function TestimonialSubmit({ roomId, host = 'localhost:1999' }: TestimonialSubmitProps) {
  const { socket, session, error } = useTestimonialsSocket(roomId, host)
  const [studentName, setStudentName] = useState('')
  const [content, setContent] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!socket || !session?.isActive) return
    if (content.trim().length < 20) {
      setSubmitError('Testimonial must be at least 20 characters')
      return
    }
    socket.send(JSON.stringify({ type: 'submit_testimonial', studentName: studentName.trim(), content: content.trim() }))
    setSubmittedName(studentName.trim())
    setHasSubmitted(true)
    setSubmitError(null)
  }

  if (!session) {
    const isConnError = error === 'Connection error'
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className={`border-2 ${isConnError ? 'border-[#D4380D]' : 'border-[#1A1008]'} bg-white shadow-[5px_5px_0_${isConnError ? '#D4380D' : '#1A1008'}] p-10 max-w-sm w-full text-center`}>
          <div className={`w-12 h-12 border-2 ${isConnError ? 'border-[#D4380D]' : 'border-[#6D28D9]'} mx-auto mb-6 flex items-center justify-center`}>
            {isConnError
              ? <span className="text-[#D4380D] text-xl font-bold">!</span>
              : <div className="w-5 h-5 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />}
          </div>
          <h2 className="f-display font-black text-[22px] tracking-tight text-[#1A1008] mb-2">
            {isConnError ? 'Connection failed' : 'Session not started yet'}
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            {isConnError
              ? 'Cannot reach the session server. Check that the host server is running.'
              : 'The host will open the session shortly.'}
          </p>
          <button
            onClick={() => socket?.send(JSON.stringify({ type: 'get_state' }))}
            className="mt-6 border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[10px] tracking-[0.15em] uppercase px-4 py-2 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  if (!session.isActive) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1A1008]/30 bg-white p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="f-display font-black text-[22px] tracking-tight text-[#1A1008] mb-2">
            Session Closed
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/40 leading-loose">
            This session is no longer accepting testimonials.
          </p>
        </div>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="border-2 border-[#1B6B3A] bg-white shadow-[5px_5px_0_#1B6B3A] p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 border-2 border-[#1B6B3A] bg-[#1B6B3A] mx-auto mb-6 flex items-center justify-center">
            <span className="text-white text-xl font-bold">✓</span>
          </div>
          <h2 className="f-display font-black text-[24px] tracking-tight text-[#1A1008] mb-2">
            Thank you, {submittedName}!
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 leading-loose">
            Your testimonial has been submitted for review.
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

  return (
    <div className="flex-1 flex items-start justify-center p-6 pt-8 min-h-[60vh]">
      <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] max-w-lg w-full">
        <div className="border-b-2 border-[#1A1008] px-6 py-5">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-2">
            Share your experience
          </div>
          <h1 className="f-display font-black text-[22px] sm:text-[26px] tracking-[-0.02em] text-[#1A1008] leading-tight">
            {session.title}
          </h1>
        </div>

        {(error || submitError) && (
          <div className="mx-6 mt-4 border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
            <span className="f-mono text-[11px] text-[#D4380D]">{error || submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow"
            />
          </div>

          <div>
            <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/40 mb-1.5">
              Your Testimonial
            </label>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setSubmitError(null) }}
              placeholder="Share your experience (at least 20 characters)..."
              required
              rows={5}
              className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow resize-none"
            />
            <div className="f-mono text-[9px] text-[#1A1008]/30 text-right mt-1">
              {content.length} chars {content.length < 20 ? `(${20 - content.length} more needed)` : '✓'}
            </div>
          </div>

          <button
            type="submit"
            disabled={!studentName.trim() || content.trim().length < 20}
            className="w-full border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
          >
            Submit Testimonial
          </button>
        </form>
      </div>
    </div>
  )
}
