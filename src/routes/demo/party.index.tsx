import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/party/')({
  component: PartyDemoIndex,
})

function PartyDemoIndex() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">PartyKit Demos</h1>
          <p className="text-lg text-gray-600">
            Real-time multiplayer features powered by PartyKit
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-yellow-900 mb-2">
            ⚠️ Before You Start
          </h2>
          <p className="text-sm text-yellow-800 mb-3">
            Make sure the PartyKit server is running before trying these demos:
          </p>
          <pre className="bg-yellow-100 text-yellow-900 px-3 py-2 rounded text-sm">
            bunx partykit dev
          </pre>
          <p className="text-xs text-yellow-700 mt-2">
            Or use the npm script:
            {' '}
            <code>bun run party:dev</code>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Polls Demo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Real-time Polls
              </h2>
              <p className="text-blue-100">
                Create and vote on polls in real-time
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Create polls with multiple options
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Real-time vote updates
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  One vote per user
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Live connection count
                </li>
              </ul>
              <Link
                to="/demo/party/polls"
                className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Try Polls Demo
              </Link>
            </div>
          </div>

          {/* Kahoot Demo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Kahoot Quiz Game
              </h2>
              <p className="text-purple-100">
                Interactive quiz game with live gameplay
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Host and player modes
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Time-based scoring
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Live leaderboards
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Multiple players support
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/demo/party/kahoot-host"
                  className="block w-full text-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  Start as Host
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Players will join using the link provided by the host
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Demo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-green-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Live Feedback
              </h2>
              <p className="text-green-100">
                Collect real-time feedback with emoji, text, or scores
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Emoji reactions
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Text responses
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Score ratings
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Real-time results
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/demo/party/feedback-host"
                  className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Start Feedback Session
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Participants join using the shared link
                </p>
              </div>
            </div>
          </div>

          {/* Feeling Stream Demo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Feeling Stream 💭
              </h2>
              <p className="text-pink-100">
                Pop and broadcast emojis in real-time
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">✓</span>
                  30+ emoji options
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">✓</span>
                  Click anywhere to pop
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">✓</span>
                  Burst mode for celebrations
                </li>
                <li className="flex items-start">
                  <span className="text-pink-600 mr-2">✓</span>
                  Live connection count
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/demo/party/feelings"
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 font-medium transition-colors"
                >
                  Start Emoji Stream
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Share the room link with friends to pop together
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How to Test</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">For Polls:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open the polls demo in multiple browser windows</li>
                <li>Create a poll in one window</li>
                <li>Vote from different windows</li>
                <li>Watch votes update in real-time across all windows</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">For Kahoot:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open the host dashboard</li>
                <li>Create a game with questions</li>
                <li>Copy the player link and open it in other windows/devices</li>
                <li>Join as players with different names</li>
                <li>Start the game from the host dashboard</li>
                <li>Answer questions and see live scoring</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
