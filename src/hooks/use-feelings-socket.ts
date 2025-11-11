import { sleep } from '@setemiojo/utils'
import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

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


export function useFeelingsSocket(roomId: string, host: string = 'localhost:1999') {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const [connectionCount, setConnectionCount] = useState(0)

  useEffect(() => {
    const ws = new PartySocket({
      host,
      room: roomId,
      party: 'feelings',
    })

    ws.addEventListener('message', (event) => {
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
    })

    ws.addEventListener('open', () => {
      console.warn('Connected to feelings server')
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [roomId, host])

  return { socket, floatingEmojis, connectionCount }
}
