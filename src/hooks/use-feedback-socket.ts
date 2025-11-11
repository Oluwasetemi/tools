import type PartySocket from 'partysocket'
import type { FeedbackSession, ServerMessage } from '@/components/ui/feedback/types'
import usePartySocket from 'partysocket/react'
import { useState } from 'react'
import { toast } from 'sonner'

interface UseFeedbackSocketReturn {
  readonly socket: PartySocket | null
  readonly session: FeedbackSession | null
  readonly connectionCount: number
  readonly error: string | null
}

export function useFeedbackSocket(
  roomId: string,
  host: string = 'localhost:1999',
): UseFeedbackSocketReturn {
  const [session, setSession] = useState<FeedbackSession | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'feedback',

    onMessage(event: any) {
      if (typeof event.data !== 'string')
        return

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
    },

    onOpen() {
      console.warn('Connected to feedback server')
      setError(null)
    },

    onError(error) {
      console.error('Feedback socket error:', error)
      const errorMessage = 'Failed to connect to feedback server'
      setError(errorMessage)
      toast.error(errorMessage)
    },
  })

  return { socket, session, connectionCount, error }
}
