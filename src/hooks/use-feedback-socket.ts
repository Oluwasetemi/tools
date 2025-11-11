import type { FeedbackSession, ServerMessage } from '@/components/ui/feedback/types'
import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

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
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [session, setSession] = useState<FeedbackSession | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
      console.warn('Connected to feedback server')
      setError(null)
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [roomId, host])

  return { socket, session, connectionCount, error }
}
