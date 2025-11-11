import { randomStr } from '@setemiojo/utils'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/button'
import { FeedbackHost } from '@/components/ui/feedback'

export const Route = createFileRoute('/party/feedback-host')({
  component: FeedbackHostDemo,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      room: (search.room as string) || `feedback-${randomStr(7)}`,
    }
  },
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
  const { room: roomId } = Route.useSearch()

  const clientUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/party/feedback-client?room=${roomId}`
    : ''

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feedback Session - Host</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create and manage live feedback sessions
          </p>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h2 className="font-semibold text-green-900 dark:text-green-100 mb-2">Participant Link:</h2>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={clientUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(clientUrl)
                  toast.success('Link copied!')
                }}
                color="green"
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mt-2">
              Share this link with participants to collect feedback
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Feedback Types:</h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
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
