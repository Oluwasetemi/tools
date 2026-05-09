import { useTestimonialsSocket } from '@/hooks/use-testimonials-socket'

interface TestimonialWallProps {
  roomId: string
  host?: string
}

export function TestimonialWall({ roomId, host = 'localhost:1999' }: TestimonialWallProps) {
  const { session, testimonials, connectionCount } = useTestimonialsSocket(roomId, host)

  const approved = testimonials.filter(t => t.status === 'approved')

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Header */}
      <div className="border-b-2 border-[#1A1008] px-6 py-8 text-center relative">
        <div className="h-1 bg-[#6D28D9] absolute top-0 left-0 right-0" />
        <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-3">
          Testimonials Wall
        </div>
        <h1 className="f-display font-black text-[36px] sm:text-[48px] tracking-tight text-[#1A1008]">
          {session?.title || 'Testimonials'}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
          <span className="f-mono text-[10px] tracking-wider text-[#1A1008]/40">{connectionCount} viewing</span>
        </div>
      </div>

      {/* Wall content */}
      <div className="p-6">
        {approved.length === 0
          ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center">
                  <div className="f-display italic text-[80px] text-[#1A1008]/10 leading-none mb-4">"</div>
                  <p className="f-mono text-[12px] text-[#1A1008]/30">Be the first to share your experience</p>
                </div>
              </div>
            )
          : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 max-w-6xl mx-auto">
                {approved.map(t => (
                  <div
                    key={t.id}
                    className="break-inside-avoid mb-5 border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6"
                    style={{ animation: 'slide-in-up 0.4s ease-out' }}
                  >
                    <div className="f-display text-[64px] text-[#6D28D9]/20 leading-none -mb-2">"</div>
                    <p className="f-display italic text-[16px] text-[#1A1008] leading-relaxed mb-4">
                      {t.content}
                    </p>
                    <div className="border-t border-[#1A1008]/10 pt-3">
                      <span className="f-mono text-[11px] text-[#1A1008]/60">— {t.studentName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>

      <style>{`
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
