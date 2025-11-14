import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { randomStr } from '@setemiojo/utils'
import { toast } from 'sonner'
import { KahootHost } from '@/components/ui/kahoot-host'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MoreVertical, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex items-center justify-between gap-x-8 lg:mx-0">
          <div className="flex items-center gap-x-6">
            <div className="size-16 flex-none rounded-full bg-purple-500 flex items-center justify-center outline outline-gray-900/10 dark:outline-white/10">
              <Sparkles className="size-8 text-white" />
            </div>
            <h1>
              <div className="text-sm/6 text-gray-500 dark:text-gray-400">
                Room Code:
                {' '}
                <span className="text-gray-700 dark:text-gray-300 font-mono">{roomId}</span>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900 dark:text-white">Kahoot Quiz Game</div>
            </h1>
          </div>
          <div className="flex items-center gap-x-4 sm:gap-x-6">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(playerUrl)
                toast.success('Player link copied!')
              }}
              className="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={generateNewRoom}
              className="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
            >
              New Room
            </button>
            <a
              href={playerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:bg-purple-500 dark:shadow-none dark:hover:bg-purple-400 dark:focus-visible:outline-purple-500"
            >
              Open Player View
            </a>

            <Menu as="div" className="relative sm:hidden">
              <MenuButton className="relative block">
                <span className="absolute -inset-3" />
                <span className="sr-only">More</span>
                <MoreVertical aria-hidden="true" className="size-5 text-gray-500 dark:text-gray-400" />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
              >
                <MenuItem>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(playerUrl)
                      toast.success('Player link copied!')
                    }}
                    className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                  >
                    Copy URL
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    type="button"
                    onClick={generateNewRoom}
                    className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden dark:text-white dark:data-focus:bg-white/5"
                  >
                    New Room
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Host Instructions:</h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Create questions with 4 answer options each</li>
            <li>• Set the correct answer, time limit, and points for each question</li>
            <li>• Share the player link above for players to join</li>
            <li>• Start the game when ready and advance through questions</li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8">
        <KahootHost roomId={roomId} host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'} />
      </div>
    </div>
  )
}
