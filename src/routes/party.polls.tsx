import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { randomStr } from '@setemiojo/utils'
import { toast } from 'sonner'
import { Button } from '@/components/button'
import { PollHost } from '@/components/ui/poll-host'

export const Route = createFileRoute('/party/polls')({
  component: PollsDemo,
  head: () => ({
    meta: [
      {
        title: 'Live Poll - Host Dashboard',
        description: 'Create real-time polls and see votes update live. Instant feedback with live results.',
        property: 'og:title',
        content: 'Live Poll - Host Dashboard',
      },
      {
        property: 'og:description',
        content: 'Create real-time polls and see votes update live. Instant feedback with live results.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/polls?title=Live Poll`,
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
        content: 'Live Poll - Host Dashboard',
      },
      {
        name: 'twitter:description',
        content: 'Create real-time polls and see votes update live. Instant feedback with live results.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/polls?title=Live Poll`,
      },
    ],
  }),
})

function PollsDemo() {
  const [roomId] = useState(() => {
    if (typeof window === 'undefined') {
      return `poll-${randomStr(7)}`
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `poll-${randomStr(7)}`
  })

  const voterUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/party/poll-voter?room=${roomId}`
    : ''

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && voterUrl) {
      navigator.clipboard.writeText(voterUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Poll - Host</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create real-time polls and see votes update live
          </p>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h2 className="font-semibold text-green-900 dark:text-green-100 mb-2">Voter Link:</h2>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={voterUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                color="green"
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mt-2">
              Share this link with voters to participate in the poll
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Create a poll by entering a question and options below</li>
            <li>• Share the voter link with participants</li>
            <li>• Watch votes come in real-time on this dashboard</li>
            <li>• End the poll at any time to stop accepting votes</li>
          </ul>
        </div>

        <PollHost roomId={roomId} host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'} />
      </div>
    </div>
  )
}
