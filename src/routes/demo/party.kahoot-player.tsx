import { createFileRoute } from '@tanstack/react-router'
import { KahootPlayer } from '@/components/kahoot-player'

export const Route = createFileRoute('/demo/party/kahoot-player')({
  component: KahootPlayerDemo,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      room: (search.room as string) || 'default-room',
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Join Kahoot Game - Player',
        description: 'Join a Kahoot quiz game and compete with others in real-time.',
        property: 'og:title',
        content: 'Join Kahoot Game - Player',
      },
      {
        property: 'og:description',
        content: 'Join a Kahoot quiz game and compete with others in real-time.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/kahoot?title=Join Game`,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Join Kahoot Game - Player',
      },
      {
        name: 'twitter:description',
        content: 'Join a Kahoot quiz game and compete with others in real-time.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/kahoot?title=Join Game`,
      },
    ],
  }),
})

function KahootPlayerDemo() {
  const { room: roomId } = Route.useSearch()

  return (
    <div className="min-h-screen">
      <KahootPlayer
        roomId={roomId}
        host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
      />
    </div>
  )
}
