import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { randomStr } from '@setemiojo/utils'
import { toast } from 'sonner'
import { PollHost } from '@/components/ui/poll-host'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { BarChart, MoreVertical } from 'lucide-react'

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
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `poll-${randomStr(7)}`
  })

  const voterUrl = `${window.location.origin}/party/poll-voter?room=${roomId}`

  const generateNewRoom = () => {
    const newRoomId = `poll-${randomStr(7)}`
    setRoomId(newRoomId)
    window.history.pushState({}, '', `?room=${newRoomId}`)
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex items-center justify-between gap-x-8 lg:mx-0">
          <div className="flex items-center gap-x-6">
            <div className="size-16 flex-none rounded-full bg-blue-500 flex items-center justify-center outline outline-gray-900/10 dark:outline-white/10">
              <BarChart className="size-8 text-white" />
            </div>
            <h1>
              <div className="text-sm/6 text-gray-500 dark:text-gray-400">
                Room Code:
                {' '}
                <span className="text-gray-700 dark:text-gray-300 font-mono">{roomId}</span>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900 dark:text-white">Live Poll</div>
            </h1>
          </div>
          <div className="flex items-center gap-x-4 sm:gap-x-6">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(voterUrl)
                toast.success('Voter link copied!')
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
              href={voterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:shadow-none dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500"
            >
              Open Voter View
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
                      navigator.clipboard.writeText(voterUrl)
                      toast.success('Voter link copied!')
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
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Create a poll by entering a question and options below</li>
            <li>• Share the voter link with participants</li>
            <li>• Watch votes come in real-time on this dashboard</li>
            <li>• End the poll at any time to stop accepting votes</li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8">
        <PollHost roomId={roomId} host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'} />
      </div>
    </div>
  )
}
