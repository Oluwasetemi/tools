import { createFileRoute } from '@tanstack/react-router'
import { PollClient } from '@/components/poll-client'

export const Route = createFileRoute('/demo/party/polls')({
  component: PollsDemo,
  head: () => ({
    meta: [
      {
        title: 'Live Poll - Real-time Voting',
        description: 'Create real-time polls and see votes update live. Instant feedback with live results.',
        property: 'og:title',
        content: 'Live Poll - Real-time Voting',
      },
      {
        property: 'og:description',
        content: 'Create real-time polls and see votes update live. Instant feedback with live results.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/polls?title=Live Poll&room=demo-poll-room`,
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
        content: 'Live Poll - Real-time Voting',
      },
      {
        name: 'twitter:description',
        content: 'Create real-time polls and see votes update live. Instant feedback with live results.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/polls?title=Live Poll&room=demo-poll-room`,
      },
    ],
  }),
})

function PollsDemo() {
  // Generate a random room ID or use a fixed one for demo
  const roomId = 'demo-poll-room'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">PartyKit Polls Demo</h1>
          <p className="text-gray-600">
            Create real-time polls and see votes update live across all connected clients.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Room ID:
            {' '}
            <span className="font-mono font-bold">{roomId}</span>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">How it works:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Open this page in multiple browser windows to see real-time updates</li>
            <li>• Create a poll by entering a question and options</li>
            <li>• Vote on polls and see results update in real-time</li>
            <li>• The poll creator can end the poll at any time</li>
          </ul>
        </div>

        <PollClient roomId={roomId} host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'} />
      </div>
    </div>
  )
}
