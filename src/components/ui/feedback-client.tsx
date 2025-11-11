import { useState } from 'react'
import { Button } from '@/components/button'
import { Textarea } from '@/components/textarea'
import { useFeedbackSocket } from '@/hooks/use-feedback-socket'

interface FeedbackClientProps {
  roomId: string
  host?: string
}

export function FeedbackClient({ roomId, host = 'localhost:1999' }: FeedbackClientProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Form state
  const [textFeedback, setTextFeedback] = useState('')
  const [selectedScore, setSelectedScore] = useState<number | null>(null)

  const { socket, session, error } = useFeedbackSocket(roomId, host)

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

    setHasSubmitted(true)
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
    setHasSubmitted(true)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Waiting for Feedback Session
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The host will start a feedback session shortly...
          </p>
        </div>
      </div>
    )
  }

  if (!session.isActive) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-500 to-gray-700 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Feedback Session Closed
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This feedback session is no longer accepting responses.
          </p>
        </div>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Thank You!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
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
    <div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
          {session.title}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
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
            <p className="text-center text-gray-700 dark:text-gray-300 font-medium mb-6">
              How do you feel about this?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {session.emojiOptions.map(option => (
                <button
                  key={option.emoji}
                  onClick={() => submitEmoji(option.emoji)}
                  className="bg-linear-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl p-8 transition-all transform hover:scale-110 active:scale-95 border-2 border-transparent hover:border-purple-500"
                >
                  <div className="text-6xl mb-3">{option.emoji}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              Your Feedback
            </label>
            <Textarea
              value={textFeedback}
              onChange={e => setTextFeedback(e.target.value)}
              placeholder="Type your feedback here..."
              rows={6}
            />
            <Button
              onClick={submitText}
              disabled={!textFeedback.trim()}
              color="purple"
              className="w-full text-lg"
            >
              Submit Feedback
            </Button>
          </div>
        )}

        {/* Score Feedback */}
        {session.type === 'score' && session.scoreRange && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate your experience
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
                (_, i) => i + (session?.scoreRange?.min ?? 0),
              ).map(score => (
                <button
                  key={score}
                  onClick={() => submitScore(score)}
                  className={`w-16 h-16 rounded-xl font-bold text-xl transition-all transform hover:scale-110 active:scale-95 ${
                    selectedScore === score
                      ? 'bg-linear-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-linear-to-br from-blue-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-700 hover:from-blue-100 hover:to-purple-100 dark:hover:from-zinc-700 dark:hover:to-zinc-600 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-zinc-600'
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
