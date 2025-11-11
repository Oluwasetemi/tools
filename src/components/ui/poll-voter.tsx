import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'
import { Button } from '@/components/button'

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

interface PollVoterProps {
  roomId: string
  host?: string
}

export function PollVoter({ roomId, host = 'localhost:1999' }: PollVoterProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

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

  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Poll</h2>
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
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 text-center">
              <div className="py-12">
                <div className="animate-pulse mb-4">
                  <div className="w-16 h-16 bg-blue-200 dark:bg-blue-900 rounded-full mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Waiting for poll...</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  The host will create a poll shortly
                </p>
              </div>
            </div>
          )
        : (
            <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{poll.question}</h3>
                {!poll.isActive && (
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    Poll Ended
                  </span>
                )}
              </div>

              {hasVoted && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
                  Thank you for voting! Watch the results update live.
                </div>
              )}

              <div className="space-y-3 mb-6">
                {poll.options.map((option) => {
                  const percentage
                    = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

                  return (
                    <Button
                      key={option.id}
                      onClick={() => vote(option.id)}
                      disabled={hasVoted || !poll.isActive}
                      plain
                      className="w-full text-left relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-100"
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
                    </Button>
                  )
                })}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Total votes:
                  {' '}
                  {totalVotes}
                </span>
              </div>
            </div>
          )}
    </div>
  )
}
