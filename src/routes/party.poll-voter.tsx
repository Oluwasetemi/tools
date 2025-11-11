import { createFileRoute } from '@tanstack/react-router'
import { PollVoter } from '@/components/ui/poll-voter'

export const Route = createFileRoute('/party/poll-voter')({
  component: PollVoterDemo,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      room: (search.room as string) || 'default-room',
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Vote on Live Poll',
        description: 'Cast your vote and see results update in real-time.',
        property: 'og:title',
        content: 'Vote on Live Poll',
      },
      {
        property: 'og:description',
        content: 'Cast your vote and see results update in real-time.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/polls?title=Vote Now`,
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
        content: 'Vote on Live Poll',
      },
      {
        name: 'twitter:description',
        content: 'Cast your vote and see results update in real-time.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/polls?title=Vote Now`,
      },
    ],
  }),
})

function PollVoterDemo() {
  const { room: roomId } = Route.useSearch()

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <PollVoter
          roomId={roomId}
          host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
        />
      </div>
    </div>
  )
}
