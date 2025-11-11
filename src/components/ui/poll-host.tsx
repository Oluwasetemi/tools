import { isTruthy } from '@setemiojo/utils'
import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
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

interface PollHostProps {
  roomId: string
  host?: string
}

export function PollHost({ roomId, host = 'localhost:1999' }: PollHostProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [poll, setPoll] = useState<Poll | null>(null)
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
      console.warn('Connected to poll server')
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Poll Dashboard</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {connectionCount}
          {' '}
          {connectionCount === 1 ? 'person' : 'people'}
          {' '}
          connected
        </span>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!poll
        ? (
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Create a New Poll</h3>

              <Field className="mb-4">
                <Label>Question</Label>
                <Input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Enter your question..."
                />
              </Field>

              <Field className="mb-4">
                <Label>Options</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        value={option}
                        onChange={e => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <Button
                          onClick={() => removeOption(index)}
                          outline
                          className="text-red-600! dark:text-red-400! border-red-600! dark:border-red-400!"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Field>

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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{poll.question}</h3>
                {poll.isActive
                  ? (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        Active
                      </span>
                    )
                  : (
                      <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                        Ended
                      </span>
                    )}
              </div>

              <div className="space-y-3 mb-6">
                {poll.options.map((option) => {
                  const percentage
                    = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

                  return (
                    <div
                      key={option.id}
                      className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-zinc-700"
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
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Total votes:
                  {' '}
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
              </div>
            </div>
          )}
    </div>
  )
}
