import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FeedbackHost } from '@/components/feedback-host'

export const Route = createFileRoute('/demo/party/feedback-host')({
  component: FeedbackHostDemo,
  head: () => ({
    meta: [
      {
        title: 'Live Feedback - Host Dashboard',
        description: 'Collect real-time feedback with emoji reactions, text responses, and score ratings.',
        property: 'og:title',
        content: 'Live Feedback - Host Dashboard',
      },
      {
        property: 'og:description',
        content: 'Collect real-time feedback with emoji reactions, text responses, and score ratings.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/feedback?title=Live Feedback`,
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
        content: 'Live Feedback - Host Dashboard',
      },
      {
        name: 'twitter:description',
        content: 'Collect real-time feedback with emoji reactions, text responses, and score ratings.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/feedback?title=Live Feedback`,
      },
    ],
  }),
})

function FeedbackHostDemo() {
  const [roomId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `feedback-${Math.random().toString(36).substring(7)}`
  })

  const clientUrl = `${window.location.origin}/demo/party/feedback-client?room=${roomId}`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feedback Session - Host</h1>
          <p className="text-gray-600 mb-4">
            Create and manage live feedback sessions
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-semibold text-green-900 mb-2">Participant Link:</h2>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={clientUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(clientUrl)
                  alert('Link copied!')
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-green-800 mt-2">
              Share this link with participants to collect feedback
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Feedback Types:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              •
              <strong>Emoji:</strong>
              {' '}
              Quick reactions with predefined emojis
            </li>
            <li>
              •
              <strong>Text:</strong>
              {' '}
              Open-ended text responses
            </li>
            <li>
              •
              <strong>Score:</strong>
              {' '}
              Numeric rating on a custom scale
            </li>
          </ul>
        </div>

        <FeedbackHost roomId={roomId} host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'} />
      </div>
    </div>
  )
}
