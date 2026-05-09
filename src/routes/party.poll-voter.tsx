import { createFileRoute, Link } from '@tanstack/react-router'
import { PollVoter } from '@/components/ui/poll-voter'

export const Route = createFileRoute('/party/poll-voter')({
  component: PollVoterPage,
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || 'default-room',
  }),
  head: () => ({
    meta: [
      { title: 'Vote on Live Poll' },
      { name: 'description', content: 'Cast your vote and see results update in real-time.' },
    ],
  }),
})

function PollVoterPage() {
  const { room: roomId } = Route.useSearch()

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      <div className="h-1 bg-[#0C3D6B] shrink-0" />
      <nav className="px-4 h-9 flex items-center justify-between border-b border-[#1A1008]/10 bg-[#F7F3EC] shrink-0">
        <Link to="/" className="f-display font-black text-[14px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <code className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#1A1008]/35 bg-[#1A1008]/[0.04] px-2 py-0.5">
          {roomId}
        </code>
      </nav>
      <div className="flex-1 py-8 px-4">
        <PollVoter
          roomId={roomId}
          host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
        />
      </div>
    </div>
  )
}
