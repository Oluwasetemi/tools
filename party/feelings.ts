import type * as Party from 'partykit/server'
import { timestamp } from '@setemiojo/utils'
import { callInternalApi } from './lib/db-client'

interface EmojiMessage {
  type: 'emoji_pop'
  emoji: string
  userId: string
  timestamp: number
  x: number // X position as percentage
  y: number // Y position as percentage
}

export default class FeelingsServer implements Party.Server {
  private dbSessionId: number | null = null

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Restore from storage on worker restart
    const stored = await this.room.storage.get<number>('dbSessionId')
    if (stored) {
      this.dbSessionId = stored
      return
    }

    // Create new session (upsert: safe if room already exists in DB)
    try {
      const result = await callInternalApi('feelings', {
        type: 'create_session',
        roomId: this.room.id,
      })
      if (result?.ok) {
        const dbSession = result.data as { id: number }
        this.dbSessionId = dbSession.id
        await this.room.storage.put('dbSessionId', this.dbSessionId)
      }
    }
    catch (err) {
      console.error('[feelings] DB create_session failed:', err)
    }
  }

  async onConnect(conn: Party.Connection) {
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

          // Persist to DB (fire-and-forget)
          ;(async () => {
            try {
              if (this.dbSessionId) {
                await callInternalApi('feelings', {
                  type: 'add_emoji',
                  sessionId: this.dbSessionId,
                  emoji: data.emoji,
                  participantId: sender.id,
                })
              }
            }
            catch (err) {
              console.error('[feelings] DB add_emoji failed:', err)
            }
          })()
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
