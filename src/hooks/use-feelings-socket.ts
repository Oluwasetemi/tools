import type PartySocket from 'partysocket'
import { sleep } from '@setemiojo/utils'
import usePartySocket from 'partysocket/react'
import { useState } from 'react'

export interface FloatingEmoji {
  readonly id: string
  readonly emoji: string
  readonly x: number
  readonly y: number
  readonly timestamp: number
}

type ServerMessage
  = | { type: 'emoji_pop', emoji: string, userId: string, timestamp: number, x: number, y: number }
    | { type: 'connection_count', count: number }

interface UseFeelingsSocketReturn {
  readonly socket: PartySocket | null
  readonly floatingEmojis: FloatingEmoji[]
  readonly connectionCount: number
}

export function useFeelingsSocket(
  roomId: string,
  host: string,
): UseFeelingsSocketReturn {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const [connectionCount, setConnectionCount] = useState(0)

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'feelings',

    onMessage(event: any) {
      if (typeof event.data !== 'string')
        return

      console.log('[feelings-socket] message:', event.data.slice(0, 200))
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
        case 'emoji_pop': {
          const newEmoji: FloatingEmoji = {
            id: `${data.userId}-${data.timestamp}`,
            emoji: data.emoji,
            x: data.x,
            y: data.y,
            timestamp: data.timestamp,
          }

          setFloatingEmojis(prev => [...prev, newEmoji])

          // Remove emoji after animation completes (3 seconds)
          sleep(3000, () => {
            setFloatingEmojis(prev =>
              prev.filter(e => e.id !== newEmoji.id),
            )
          })
          break
        }

        case 'connection_count':
          setConnectionCount(data.count)
          break
      }
    },

    onOpen() {
      console.log('[feelings-socket] connected — room:', roomId, 'host:', host)
    },

    onClose(event: any) {
      console.log('[feelings-socket] closed — code:', event.code, 'reason:', event.reason)
    },

    onError(error: any) {
      console.error('[feelings-socket] error:', error)
    },
  })

  return { socket, floatingEmojis, connectionCount }
}
