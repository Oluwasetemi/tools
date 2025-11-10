import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: string
  question: string
  options: PollOption[]
  isActive: boolean
  createdBy: string
  createdAt: number
}

type ServerMessage
  = | { type: 'poll_created', poll: Poll }
    | { type: 'poll_updated', poll: Poll }
    | { type: 'poll_ended', poll: Poll }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }

interface PollClientProps {
  roomId: string
  host?: string
}

export function PollClient({ roomId, host = 'localhost:1999' }: PollClientProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state for creating polls
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  useEffect(() => {
    const ws = new PartySocket({
      host,
      room: roomId,
      party: 'polls',
    })

    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
        case 'poll_created':
        case 'poll_updated':
          setPoll(data.poll)
          setError(null)
          if (data.type === 'poll_created') {
            setIsCreating(false)
          }
          break

        case 'poll_ended':
          setPoll(data.poll)
          break

        case 'error':
          setError(data.message)
          break

        case 'connection_count':
          setConnectionCount(data.count)
          break
      }
    })

    ws.addEventListener('open', () => {
      console.log('Connected to poll server')
      setError(null)
    })

    ws.addEventListener('error', () => {
      setError('Connection error')
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [roomId, host])

  const createPoll = () => {
    if (!socket || !question || options.some(opt => !opt.trim())) {
      setError('Please fill in all fields')
      return
    }

    socket.send(
      JSON.stringify({
        type: 'create_poll',
        question,
        options: options.filter(opt => opt.trim()),
      }),
    )

    setQuestion('')
    setOptions(['', ''])
  }

  const vote = (optionId: string) => {
    if (!socket || hasVoted)
      return

    socket.send(
      JSON.stringify({
        type: 'vote',
        optionId,
      }),
    )

    setHasVoted(true)
  }

  const endPoll = () => {
    if (!socket)
      return

    socket.send(
      JSON.stringify({
        type: 'end_poll',
      }),
    )
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length <= 2)
      return
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
  }

  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Live Poll</h1>
        <span className="text-sm text-gray-600">
          {connectionCount}
          {' '}
          {connectionCount === 1 ? 'person' : 'people'}
          {' '}
          connected
        </span>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!poll
        ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Create a New Poll</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={e => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addOption}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-600"
                >
                  Add Option
                </button>
                <button
                  onClick={createPoll}
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isCreating ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </div>
          )
        : (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{poll.question}</h2>

              <div className="space-y-3 mb-6">
                {poll.options.map((option) => {
                  const percentage
                    = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

                  return (
                    <button
                      key={option.id}
                      onClick={() => vote(option.id)}
                      disabled={hasVoted || !poll.isActive}
                      className="w-full text-left relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors disabled:cursor-not-allowed"
                    >
                      <div
                        className="absolute inset-0 bg-blue-100 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative px-4 py-3 flex justify-between items-center">
                        <span className="font-medium">{option.text}</span>
                        <span className="text-sm text-gray-600">
                          {option.votes}
                          {' '}
                          votes (
                          {percentage.toFixed(1)}
                          %)
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Total votes:
                  {totalVotes}
                </span>
                {poll.isActive && (
                  <button
                    onClick={endPoll}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    End Poll
                  </button>
                )}
                {!poll.isActive && (
                  <span className="text-red-600 font-medium">Poll Ended</span>
                )}
              </div>
            </div>
          )}
    </div>
  )
}
