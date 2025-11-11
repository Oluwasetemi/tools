import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, MessageCircle } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: PartyHome,
})

function PartyHome() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tools use for education</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            by
            {' '}
            <a
              href="https://oluwasetemi.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              @oluwasetemi
            </a>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Polls Demo */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-800">
            <div className="bg-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Real-time Polls
              </h2>
              <p className="text-blue-100">
                Create and vote on polls in real-time
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Check className="size-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  Host dashboard to create polls
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  Share voter link with participants
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  Real-time vote updates
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  Live results dashboard
                </li>
              </ul>
              <Link
                to="/party/polls"
                className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Start as Host
              </Link>
            </div>
          </div>

          {/* Kahoot Demo */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-800">
            <div className="bg-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Kahoot Quiz Game
              </h2>
              <p className="text-purple-100">
                Interactive quiz game with live gameplay
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Check className="size-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                  Host and player modes
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                  Time-based scoring
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                  Live leaderboards
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                  Multiple players support
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/party/kahoot-host"
                  className="block w-full text-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  Start as Host
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Players will join using the link provided by the host
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Demo */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-800">
            <div className="bg-green-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Live Feedback
              </h2>
              <p className="text-green-100">
                Collect real-time feedback with emoji, text, or scores
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Check className="size-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  Emoji reactions
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  Text responses
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  Score ratings
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  Real-time results
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/party/feedback-host"
                  className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Start Feedback Session
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Participants join using the shared link
                </p>
              </div>
            </div>
          </div>

          {/* Feeling Stream Demo */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-800">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                Feeling Stream
                {' '}
                <MessageCircle className="size-6" />
              </h2>
              <p className="text-pink-100">
                Pop and broadcast emojis in real-time
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <Check className="size-4 text-pink-400 mr-2 mt-0.5 flex-shrink-0" />
                  30+ emoji options
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-pink-400 mr-2 mt-0.5 flex-shrink-0" />
                  Click anywhere to pop
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-pink-400 mr-2 mt-0.5 flex-shrink-0" />
                  Burst mode for celebrations
                </li>
                <li className="flex items-start">
                  <Check className="size-4 text-pink-400 mr-2 mt-0.5 flex-shrink-0" />
                  Live connection count
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/party/feelings"
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 font-medium transition-colors"
                >
                  Start Emoji Stream
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Share the room link with friends to pop together
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
