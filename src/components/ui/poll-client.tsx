import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'
import { isTruthy } from '@setemiojo/utils'
import { Button } from '@/components/button'
import { Input } from '@/components/input'

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
  const [showCreateForm, setShowCreateForm] = useState(false)

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
        options: options.map(opt => opt.trim()).filter(isTruthy),
      }),
    )

    setQuestion('')
    setOptions(['', ''])
    setShowCreateForm(false)
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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {connectionCount}
            {' '}
            {connectionCount === 1 ? 'person' : 'people'}
            {' '}
            connected
          </span>
          {poll && !showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              color="blue"
              outline
            >
              Create New Poll
            </Button>
          )}
          {showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(false)}
              outline
            >
              View Current Poll
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!poll || showCreateForm
        ? (
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Create a New Poll</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question
                </label>
                <Input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Enter your question..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Options
                </label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={option}
                      onChange={e => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        onClick={() => removeOption(index)}
                        color="red"
                        plain
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addOption}
                  outline
                >
                  Add Option
                </Button>
                <Button
                  onClick={createPoll}
                  disabled={isCreating}
                  color="blue"
                >
                  {isCreating ? 'Creating...' : 'Create Poll'}
                </Button>
              </div>
            </div>
          )
        : (
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
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
                      className="w-full text-left relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:cursor-not-allowed"
                    >
                      <div
                        className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative px-4 py-3 flex justify-between items-center">
                        <span className="font-medium">{option.text}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
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

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Total votes:
                  {totalVotes}
                </span>
                {poll.isActive && (
                  <Button
                    onClick={endPoll}
                    color="red"
                  >
                    End Poll
                  </Button>
                )}
                {!poll.isActive && (
                  <span className="text-red-600 dark:text-red-400 font-medium">Poll Ended</span>
                )}
              </div>
            </div>
          )}
    </div>
  )
}
