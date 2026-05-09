import { createFileRoute, useSearch } from '@tanstack/react-router'
import { TestimonialSubmit } from '@/components/ui/testimonial-submit'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'

function TestimonialsSubmitPage() {
  const { room } = useSearch({ from: '/testimonials/submit' })

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="f-mono text-[12px] text-[#D4380D]">Missing ?room= parameter</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      <div className="h-1 bg-[#6D28D9] shrink-0" />
      <nav className="px-4 h-9 flex items-center justify-between border-b border-[#1A1008]/10 shrink-0">
        <a href="/" className="f-display font-black text-[13px] tracking-tight text-[#1A1008]">
          TOOLS<span className="text-[#D4380D]">.</span>
        </a>
        <code className="f-mono text-[9px] text-[#1A1008]/30">{room}</code>
      </nav>
      <TestimonialSubmit roomId={room} host={PARTYKIT_HOST} />
    </div>
  )
}

export const Route = createFileRoute('/testimonials/submit')({
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || '',
  }),
  component: TestimonialsSubmitPage,
})
