import type * as Party from 'partykit/server'
import { timestamp } from '@setemiojo/utils'

// Types for poll messages
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

type ClientMessage
  = | { type: 'create_poll', question: string, options: string[] }
    | { type: 'vote', optionId: string }
    | { type: 'end_poll' }
    | { type: 'get_results' }

type ServerMessage
  = | { type: 'poll_created', poll: Poll }
    | { type: 'poll_updated', poll: Poll }
    | { type: 'poll_ended', poll: Poll }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }

export default class PollsServer implements Party.Server {
  private poll: Poll | null = null
  private voters: Set<string> = new Set()

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load poll state from storage
    const storedPoll = await this.room.storage.get<Poll>('poll')
    if (storedPoll) {
      this.poll = storedPoll
    }

    const storedVoters = await this.room.storage.get<string[]>('voters')
    if (storedVoters) {
      this.voters = new Set(storedVoters)
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected to poll room:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`,
    )

    // Send current poll state to new connection
    if (this.poll) {
      conn.send(
        JSON.stringify({
          type: 'poll_updated',
          poll: this.poll,
        } as ServerMessage),
      )
    }

    // Send connection count to all
    this.broadcastConnectionCount()
  }

  onClose(conn: Party.Connection) {
    this.broadcastConnectionCount()
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== 'string')
      return

    try {
      const data: ClientMessage = JSON.parse(message)

      switch (data.type) {
        case 'create_poll':
          await this.handleCreatePoll(data, sender)
          break

        case 'vote':
          await this.handleVote(data, sender)
          break

        case 'end_poll':
          await this.handleEndPoll(sender)
          break

        case 'get_results':
          this.sendPollState(sender)
          break
      }
    }
    catch (error) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        } as ServerMessage),
      )
    }
  }

  private async handleCreatePoll(
    data: { question: string, options: string[] },
    sender: Party.Connection,
  ) {
    // Only allow creating a new poll if none exists or the current one is ended
    if (this.poll && this.poll.isActive) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'A poll is already active',
        } as ServerMessage),
      )
      return
    }

    // Create new poll
    this.poll = {
      id: crypto.randomUUID(),
      question: data.question,
      options: data.options.map((text, index) => ({
        id: `option-${index}`,
        text,
        votes: 0,
      })),
      isActive: true,
      createdBy: sender.id,
      createdAt: timestamp(),
    }

    // Reset voters
    this.voters.clear()

    // Save to storage
    await this.room.storage.put('poll', this.poll)
    await this.room.storage.put('voters', Array.from(this.voters))

    // Broadcast to all connections
    this.room.broadcast(
      JSON.stringify({
        type: 'poll_created',
        poll: this.poll,
      } as ServerMessage),
    )
  }

  private async handleVote(
    data: { optionId: string },
    sender: Party.Connection,
  ) {
    if (!this.poll) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No active poll',
        } as ServerMessage),
      )
      return
    }

    if (!this.poll.isActive) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Poll has ended',
        } as ServerMessage),
      )
      return
    }

    // Check if user already voted
    if (this.voters.has(sender.id)) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'You have already voted',
        } as ServerMessage),
      )
      return
    }

    // Find the option and increment vote
    const option = this.poll.options.find(opt => opt.id === data.optionId)
    if (!option) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid option',
        } as ServerMessage),
      )
      return
    }

    option.votes++
    this.voters.add(sender.id)

    // Save to storage
    await this.room.storage.put('poll', this.poll)
    await this.room.storage.put('voters', Array.from(this.voters))

    // Broadcast updated poll to all connections
    this.room.broadcast(
      JSON.stringify({
        type: 'poll_updated',
        poll: this.poll,
      } as ServerMessage),
    )
  }

  private async handleEndPoll(sender: Party.Connection) {
    if (!this.poll) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No active poll',
        } as ServerMessage),
      )
      return
    }

    // Only the creator can end the poll
    if (this.poll.createdBy !== sender.id) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Only the poll creator can end the poll',
        } as ServerMessage),
      )
      return
    }

    this.poll.isActive = false
    await this.room.storage.put('poll', this.poll)

    // Broadcast poll ended
    this.room.broadcast(
      JSON.stringify({
        type: 'poll_ended',
        poll: this.poll,
      } as ServerMessage),
    )
  }

  private sendPollState(conn: Party.Connection) {
    if (this.poll) {
      conn.send(
        JSON.stringify({
          type: 'poll_updated',
          poll: this.poll,
        } as ServerMessage),
      )
    }
  }

  private broadcastConnectionCount() {
    const count = [...this.room.getConnections()].length
    this.room.broadcast(
      JSON.stringify({
        type: 'connection_count',
        count,
      } as ServerMessage),
    )
  }
}

PollsServer satisfies Party.Worker
