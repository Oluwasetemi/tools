import { getPartykitHost } from '@/lib/partykit-host'
import { createFileRoute, Link } from '@tanstack/react-router'
import { FeedbackClient } from '@/components/ui/feedback-client'

export const Route = createFileRoute('/party/feedback-client')({
  component: FeedbackClientPage,
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || 'default-room',
  }),
  head: () => ({
    meta: [
      { title: 'Submit Feedback' },
      { name: 'description', content: 'Share your feedback with emoji reactions, text responses, or score ratings.' },
    ],
  }),
})

function FeedbackClientPage() {
  const { room: roomId } = Route.useSearch()

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      <div className="h-1 bg-[#1B6B3A] shrink-0" />
      <nav className="px-4 h-9 flex items-center justify-between border-b border-[#1A1008]/10 bg-[#F7F3EC] shrink-0">
        <Link to="/" className="f-display font-black text-[14px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <code className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#1A1008]/35 bg-[#1A1008]/[0.04] px-2 py-0.5">
          {roomId}
        </code>
      </nav>
      <div className="flex-1">
        <FeedbackClient
          roomId={roomId}
          host={getPartykitHost()}
        />
      </div>
    </div>
  )
}
