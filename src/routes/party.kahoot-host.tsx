import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { randomStr } from '@setemiojo/utils'
import { toast } from 'sonner'
import { KahootHost } from '@/components/ui/kahoot-host'
import { Button } from '@/components/button'
import { RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/party/kahoot-host')({
  component: KahootHostDemo,
  head: () => ({
    meta: [
      {
        title: 'Kahoot Game - Quiz Host Dashboard',
        description: 'Create and host Kahoot-style quiz games with real-time scoring and live leaderboards.',
        property: 'og:title',
        content: 'Kahoot Game - Quiz Host Dashboard',
      },
      {
        property: 'og:description',
        content: 'Create and host Kahoot-style quiz games with real-time scoring and live leaderboards.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/kahoot?title=Kahoot Game`,
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
        content: 'Kahoot Game - Quiz Host Dashboard',
      },
      {
        name: 'twitter:description',
        content: 'Create and host Kahoot-style quiz games with real-time scoring and live leaderboards.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/kahoot?title=Kahoot Game`,
      },
    ],
  }),
})

function KahootHostDemo() {
  const [roomId, setRoomId] = useState(() => {
    // Generate a random room ID or get from URL
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `game-${randomStr(7)}`
  })

  const playerUrl = `${window.location.origin}/party/kahoot-player?room=${roomId}`

  const generateNewRoom = () => {
    const newRoomId = `game-${randomStr(7)}`
    setRoomId(newRoomId)
    // Update URL without page reload
    window.history.pushState({}, '', `?room=${newRoomId}`)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Kahoot Game - Host</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a Kahoot-style quiz game and manage it in real-time.
          </p>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-green-900 dark:text-green-100">Player Link:</h2>
              <Button
                onClick={generateNewRoom}
                color="blue"
                className="text-xs"
                title="Create a new room with a fresh link"
              >
                <RefreshCw className="size-3 mr-1" />
                New Room
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={playerUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(playerUrl)
                  toast.success('Link copied!')
                }}
                color="green"
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mt-2">
              Share this link with players to join the game
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Host Instructions:</h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Create questions with 4 answer options each</li>
            <li>• Set the correct answer, time limit, and points for each question</li>
            <li>• Wait for players to join using the player link above</li>
            <li>• Start the game when ready</li>
            <li>• Advance through questions and see live results</li>
          </ul>
        </div>

        <KahootHost roomId={roomId} host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'} />
      </div>
    </div>
  )
}
