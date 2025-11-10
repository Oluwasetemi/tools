import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

type FeedbackType = 'emoji' | 'text' | 'score'

interface EmojiOption {
  emoji: string
  label: string
  count: number
}

interface FeedbackSession {
  id: string
  title: string
  type: FeedbackType
  isActive: boolean
  emojiOptions?: EmojiOption[]
  scoreRange?: { min: number, max: number }
}

type ServerMessage
  = | { type: 'feedback_created', session: FeedbackSession }
    | { type: 'feedback_updated', session: FeedbackSession }
    | { type: 'feedback_closed', session: FeedbackSession }
    | { type: 'response_submitted' }
    | { type: 'error', message: string }

interface FeedbackClientProps {
  roomId: string
  host?: string
}

export function FeedbackClient({ roomId, host = 'localhost:1999' }: FeedbackClientProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [session, setSession] = useState<FeedbackSession | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [textFeedback, setTextFeedback] = useState('')
  const [selectedScore, setSelectedScore] = useState<number | null>(null)

  useEffect(() => {
    const ws = new PartySocket({
      host,
      room: roomId,
      party: 'feedback',
    })

    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
        case 'feedback_created':
        case 'feedback_updated':
          setSession(data.session)
          setError(null)
          break

        case 'feedback_closed':
          setSession(data.session)
          break

        case 'response_submitted':
          setHasSubmitted(true)
          setError(null)
          break

        case 'error':
          setError(data.message)
          break
      }
    })

    ws.addEventListener('open', () => {
      console.log('Connected to feedback server')
      setError(null)
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [roomId, host])

  const submitEmoji = (emoji: string) => {
    if (!socket || hasSubmitted)
      return

    socket.send(
      JSON.stringify({
        type: 'submit_emoji',
        emoji,
      }),
    )
  }

  const submitText = () => {
    if (!socket || !textFeedback.trim() || hasSubmitted)
      return

    socket.send(
      JSON.stringify({
        type: 'submit_text',
        text: textFeedback.trim(),
      }),
    )
  }

  const submitScore = (score: number) => {
    if (!socket || hasSubmitted)
      return

    socket.send(
      JSON.stringify({
        type: 'submit_score',
        score,
      }),
    )

    setSelectedScore(score)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Waiting for Feedback Session
          </h2>
          <p className="text-gray-600">
            The host will start a feedback session shortly...
          </p>
        </div>
      </div>
    )
  }

  if (!session.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Feedback Session Closed
          </h2>
          <p className="text-gray-600">
            This feedback session is no longer accepting responses.
          </p>
        </div>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Thank You!
          </h2>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully.
          </p>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800">
              You can close this window now.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          {session.title}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Share your feedback below
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Emoji Feedback */}
        {session.type === 'emoji' && session.emojiOptions && (
          <div className="space-y-4">
            <p className="text-center text-gray-700 font-medium mb-6">
              How do you feel about this?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {session.emojiOptions.map(option => (
                <button
                  key={option.emoji}
                  onClick={() => submitEmoji(option.emoji)}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl p-8 transition-all transform hover:scale-110 active:scale-95 border-2 border-transparent hover:border-purple-500"
                >
                  <div className="text-6xl mb-3">{option.emoji}</div>
                  <div className="text-sm font-medium text-gray-700">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Feedback */}
        {session.type === 'text' && (
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Your Feedback
            </label>
            <textarea
              value={textFeedback}
              onChange={e => setTextFeedback(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-32 text-lg"
              placeholder="Type your feedback here..."
            />
            <button
              onClick={submitText}
              disabled={!textFeedback.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium text-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Submit Feedback
            </button>
          </div>
        )}

        {/* Score Feedback */}
        {session.type === 'score' && session.scoreRange && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-2">
                Rate your experience
              </p>
              <p className="text-sm text-gray-600">
                {session.scoreRange.min}
                {' '}
                = Lowest,
                {session.scoreRange.max}
                {' '}
                = Highest
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {Array.from(
                { length: session.scoreRange.max - session.scoreRange.min + 1 },
                (_, i) => i + session.scoreRange.min,
              ).map(score => (
                <button
                  key={score}
                  onClick={() => submitScore(score)}
                  className={`w-16 h-16 rounded-xl font-bold text-xl transition-all transform hover:scale-110 active:scale-95 ${
                    selectedScore === score
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-700 border-2 border-gray-300'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
