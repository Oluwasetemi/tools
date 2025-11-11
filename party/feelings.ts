import type * as Party from 'partykit/server'
import { timestamp } from '@setemiojo/utils'

interface EmojiMessage {
  type: 'emoji_pop'
  emoji: string
  userId: string
  timestamp: number
  x: number // X position as percentage
  y: number // Y position as percentage
}

export default class FeelingsServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:`,
      conn.id,
      'Current connections:',
      [...this.room.getConnections()].length,
    )

    // Send current connection count to all clients
    this.broadcastConnectionCount()
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message)

      switch (data.type) {
        case 'emoji_pop': {
          // Broadcast emoji to all connected clients
          const emojiMessage: EmojiMessage = {
            type: 'emoji_pop',
            emoji: data.emoji,
            userId: sender.id,
            timestamp: timestamp(),
            x: data.x || Math.random() * 100,
            y: data.y || Math.random() * 100,
          }

          this.room.broadcast(JSON.stringify(emojiMessage))
          break
        }

        default:
          console.log('Unknown message type:', data.type)
      }
    }
    catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  async onClose(connection: Party.Connection) {
    console.log('Connection closed:', connection.id)
    this.broadcastConnectionCount()
  }

  broadcastConnectionCount() {
    const count = [...this.room.getConnections()].length
    this.room.broadcast(
      JSON.stringify({
        type: 'connection_count',
        count,
      }),
    )
  }
}

FeelingsServer satisfies Party.Worker
