import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

type FeedbackType = 'emoji' | 'text' | 'score'

interface EmojiOption {
  emoji: string
  label: string
  count: number
}

interface TextResponse {
  id: string
  text: string
  timestamp: number
}

interface ScoreData {
  total: number
  count: number
  average: number
  distribution: { [key: number]: number }
}

interface FeedbackSession {
  id: string
  title: string
  type: FeedbackType
  createdBy: string
  createdAt: number
  isActive: boolean
  emojiOptions?: EmojiOption[]
  textResponses?: TextResponse[]
  scoreData?: ScoreData
  scoreRange?: { min: number, max: number }
}

type ServerMessage
  = | { type: 'feedback_created', session: FeedbackSession }
    | { type: 'feedback_updated', session: FeedbackSession }
    | { type: 'feedback_closed', session: FeedbackSession }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }

interface FeedbackHostProps {
  roomId: string
  host?: string
}

export function FeedbackHost({ roomId, host = 'localhost:1999' }: FeedbackHostProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [session, setSession] = useState<FeedbackSession | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('emoji')
  const [scoreMin, setScoreMin] = useState(1)
  const [scoreMax, setScoreMax] = useState(10)

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

        case 'connection_count':
          setConnectionCount(data.count)
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

  const createFeedback = () => {
    if (!socket || !title.trim()) {
      setError('Please enter a title')
      return
    }

    const config: any = {}

    if (feedbackType === 'score') {
      config.range = { min: scoreMin, max: scoreMax }
    }

    socket.send(
      JSON.stringify({
        type: 'create_feedback',
        title: title.trim(),
        feedbackType,
        config,
      }),
    )

    setTitle('')
  }

  const closeFeedback = () => {
    if (!socket)
      return
    socket.send(JSON.stringify({ type: 'close_feedback' }))
  }

  const totalResponses = session
    ? session.type === 'emoji'
      ? session.emojiOptions?.reduce((sum, opt) => sum + opt.count, 0) || 0
      : session.type === 'text'
        ? session.textResponses?.length || 0
        : session.scoreData?.count || 0
    : 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Feedback Host</h1>
        <p className="text-gray-600">
          Room Code:
          {' '}
          <span className="font-mono font-bold text-lg">{roomId}</span>
        </p>
        <p className="text-sm text-gray-500">
          {connectionCount}
          {' '}
          {connectionCount === 1 ? 'person' : 'people'}
          {' '}
          connected
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!session || !session.isActive ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Create Feedback Session</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., How was today's session?"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Feedback Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setFeedbackType('emoji')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  feedbackType === 'emoji'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">😊</div>
                <div className="font-medium">Emoji</div>
                <div className="text-xs text-gray-600">Quick reactions</div>
              </button>

              <button
                onClick={() => setFeedbackType('text')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  feedbackType === 'text'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">💬</div>
                <div className="font-medium">Text</div>
                <div className="text-xs text-gray-600">Open feedback</div>
              </button>

              <button
                onClick={() => setFeedbackType('score')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  feedbackType === 'score'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">⭐</div>
                <div className="font-medium">Score</div>
                <div className="text-xs text-gray-600">Rate on scale</div>
              </button>
            </div>
          </div>

          {feedbackType === 'score' && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Score
                </label>
                <input
                  type="number"
                  value={scoreMin}
                  onChange={e => setScoreMin(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Score
                </label>
                <input
                  type="number"
                  value={scoreMax}
                  onChange={e => setScoreMax(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={scoreMin + 1}
                />
              </div>
            </div>
          )}

          <button
            onClick={createFeedback}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Feedback Session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{session.title}</h2>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                  {' '}
                  Feedback
                </span>
              </div>
              <button
                onClick={closeFeedback}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Close Session
              </button>
            </div>
            <p className="text-gray-600">
              Total Responses:
              {' '}
              <span className="font-bold text-2xl">{totalResponses}</span>
            </p>
          </div>

          {/* Results Display */}
          {session.type === 'emoji' && session.emojiOptions && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Emoji Reactions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {session.emojiOptions.map(option => (
                  <div
                    key={option.emoji}
                    className="bg-gray-50 rounded-lg p-6 text-center border-2 border-gray-200"
                  >
                    <div className="text-5xl mb-3">{option.emoji}</div>
                    <div className="text-sm text-gray-600 mb-1">{option.label}</div>
                    <div className="text-3xl font-bold text-blue-600">{option.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.type === 'text' && session.textResponses && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Text Responses (
                {session.textResponses.length}
                )
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {session.textResponses.length === 0
                  ? (
                      <p className="text-gray-500 text-center py-8">
                        No responses yet. Waiting for feedback...
                      </p>
                    )
                  : (
                      session.textResponses.map(response => (
                        <div
                          key={response.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <p className="text-gray-800">{response.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(response.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
              </div>
            </div>
          )}

          {session.type === 'score' && session.scoreData && session.scoreRange && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Score Results</h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Average</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {session.scoreData.average.toFixed(1)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Votes</div>
                  <div className="text-4xl font-bold text-green-600">
                    {session.scoreData.count}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Range</div>
                  <div className="text-4xl font-bold text-purple-600">
                    {session.scoreRange.min}
                    -
                    {session.scoreRange.max}
                  </div>
                </div>
              </div>

              <h4 className="font-semibold mb-3">Distribution</h4>
              <div className="space-y-2">
                {Array.from(
                  { length: session.scoreRange.max - session.scoreRange.min + 1 },
                  (_, i) => i + session.scoreRange.min,
                ).map((score) => {
                  const count = session.scoreData!.distribution[score] || 0
                  const percentage
                    = session.scoreData!.count > 0
                      ? (count / session.scoreData!.count) * 100
                      : 0

                  return (
                    <div key={score} className="flex items-center gap-3">
                      <div className="w-8 text-right font-medium">{score}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                          {count}
                          {' '}
                          (
                          {percentage.toFixed(0)}
                          %)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
