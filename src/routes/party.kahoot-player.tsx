import { getPartykitHost } from '@/lib/partykit-host'
import { createFileRoute, Link } from '@tanstack/react-router'
import { KahootPlayer } from '@/components/ui/kahoot-player'

export const Route = createFileRoute('/party/kahoot-player')({
  component: KahootPlayerPage,
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || 'default-room',
  }),
  head: () => ({
    meta: [
      { title: 'Join Kahoot — Player' },
      { name: 'description', content: 'Join a Kahoot quiz game and compete with others in real-time.' },
    ],
  }),
})

function KahootPlayerPage() {
  const { room: roomId } = Route.useSearch()

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      {/* Minimal top bar */}
      <div className="h-1 bg-[#D4380D] shrink-0" />
      <nav className="px-4 h-9 flex items-center justify-between border-b border-[#1A1008]/10 bg-[#F7F3EC] shrink-0 z-10">
        <Link to="/" className="f-display font-black text-[14px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <code className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#1A1008]/35 bg-[#1A1008]/[0.04] px-2 py-0.5">
          {roomId}
        </code>
      </nav>

      {/* Full component */}
      <div className="flex-1">
        <KahootPlayer
          roomId={roomId}
          host={getPartykitHost()}
        />
      </div>
    </div>
  )
}
