import { getPartykitHost } from '@/lib/partykit-host'
import { createFileRoute } from '@tanstack/react-router'
import { KahootProjector } from '@/components/ui/kahoot-projector'

export const Route = createFileRoute('/party/kahoot-projector')({
  component: KahootProjectorPage,
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || 'default-room',
  }),
})

function KahootProjectorPage() {
  const { room: roomId } = Route.useSearch()

  return (
    <div className="min-h-screen">
      <KahootProjector
        roomId={roomId}
        host={getPartykitHost()}
      />
    </div>
  )
}
