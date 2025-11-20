import type PartySocket from 'partysocket'
import { isTruthy } from '@setemiojo/utils'
import usePartySocket from 'partysocket/react'
import { useState } from 'react'
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
  const [poll, setPoll] = useState<Poll | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state for creating polls
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'polls',

    onMessage(event: any) {
      if (typeof event.data !== 'string')
        return

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
    },

    onOpen() {
      console.warn('Connected to poll server')
      setError(null)
    },

    onError() {
      setError('Connection error')
    },
  })

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Poll Dashboard</h2>
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
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createPoll()
              }}
              className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6"
            >
              <div className="space-y-12">
                {/* Poll Settings Section */}
                <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                  <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Poll Settings</h2>
                  <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                    Create an engaging poll with a clear question and multiple choice options.
                  </p>

                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <Field>
                        <Label>Question</Label>
                        <Input
                          type="text"
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                          placeholder="Enter your poll question..."
                          required
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Options Section */}
                <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                  <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Poll Options</h2>
                  <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
                    Add at least two options for participants to choose from.
                  </p>

                  <div className="mt-10 space-y-4">
                    {options.map((option, index) => (
                      <div key={index} className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        <div className="sm:col-span-5">
                          <Field>
                            <Label>Option {index + 1}</Label>
                            <Input
                              type="text"
                              value={option}
                              onChange={e => updateOption(index, e.target.value)}
                              placeholder={`Enter option ${index + 1}`}
                              required
                            />
                          </Field>
                        </div>
                        <div className="sm:col-span-1 flex items-end">
                          {options.length > 2 && (
                            <Button
                              type="button"
                              onClick={() => removeOption(index)}
                              outline
                              className="text-red-600! dark:text-red-400! border-red-600! dark:border-red-400! w-full"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button
                      type="button"
                      onClick={addOption}
                      outline
                    >
                      Add Option
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-x-6">
                <Button
                  type="submit"
                  disabled={isCreating}
                  color="blue"
                >
                  {isCreating ? 'Creating...' : 'Create Poll'}
                </Button>
              </div>
            </form>
          )
        : (
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{poll.question}</h3>
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
                        <span className="font-medium text-gray-900 dark:text-white">{option.text}</span>
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
