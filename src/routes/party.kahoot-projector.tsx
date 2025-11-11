import { createFileRoute } from '@tanstack/react-router'
import { KahootProjector } from '@/components/ui/kahoot-projector'

export const Route = createFileRoute('/party/kahoot-projector')({
  component: KahootProjectorDemo,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      room: (search.room as string) || 'default-room',
    }
  },
})

function KahootProjectorDemo() {
  const { room: roomId } = Route.useSearch()

  return (
    <KahootProjector
      roomId={roomId}
      host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
    />
  )
}
