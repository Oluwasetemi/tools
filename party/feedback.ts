import type * as Party from 'partykit/server'

// Types for Feedback
type FeedbackType = 'emoji' | 'text' | 'score'

interface EmojiOption {
  emoji: string
  label: string
  count: number
}

interface TextResponse {
  id: string
  text: string
  timestamp: number
}

interface ScoreData {
  total: number
  count: number
  average: number
  distribution: { [key: number]: number } // score -> count
}

interface FeedbackSession {
  id: string
  title: string
  type: FeedbackType
  createdBy: string
  createdAt: number
  isActive: boolean

  // Type-specific data
  emojiOptions?: EmojiOption[]
  textResponses?: TextResponse[]
  scoreData?: ScoreData
  scoreRange?: { min: number, max: number }
}

interface Responder {
  id: string
  hasResponded: boolean
}

type ClientMessage
  = | { type: 'create_feedback', title: string, feedbackType: FeedbackType, config?: any }
    | { type: 'submit_emoji', emoji: string }
    | { type: 'submit_text', text: string }
    | { type: 'submit_score', score: number }
    | { type: 'close_feedback' }
    | { type: 'get_state' }

type ServerMessage
  = | { type: 'feedback_created', session: FeedbackSession }
    | { type: 'feedback_updated', session: FeedbackSession }
    | { type: 'feedback_closed', session: FeedbackSession }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }
    | { type: 'response_submitted' }

export default class FeedbackServer implements Party.Server {
  private session: FeedbackSession | null = null
  private responders: Map<string, Responder> = new Map()
  private hostId: string | null = null

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load session state from storage
    const storedSession = await this.room.storage.get<FeedbackSession>('session')
    if (storedSession) {
      this.session = storedSession
    }

    const storedResponders = await this.room.storage.get<Array<[string, Responder]>>('responders')
    if (storedResponders) {
      this.responders = new Map(storedResponders)
    }

    const storedHostId = await this.room.storage.get<string>('hostId')
    if (storedHostId) {
      this.hostId = storedHostId
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected to feedback room:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`,
    )

    // Send current session state to new connection
    if (this.session) {
      conn.send(
        JSON.stringify({
          type: 'feedback_updated',
          session: this.session,
        } as ServerMessage),
      )
    }

    // Track responder
    if (!this.responders.has(conn.id)) {
      this.responders.set(conn.id, { id: conn.id, hasResponded: false })
    }

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
        case 'create_feedback':
          await this.handleCreateFeedback(data, sender)
          break

        case 'submit_emoji':
          await this.handleSubmitEmoji(data, sender)
          break

        case 'submit_text':
          await this.handleSubmitText(data, sender)
          break

        case 'submit_score':
          await this.handleSubmitScore(data, sender)
          break

        case 'close_feedback':
          await this.handleCloseFeedback(sender)
          break

        case 'get_state':
          this.sendSessionState(sender)
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

  private async handleCreateFeedback(
    data: { title: string, feedbackType: FeedbackType, config?: any },
    sender: Party.Connection,
  ) {
    if (this.session && this.session.isActive) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'A feedback session is already active',
        } as ServerMessage),
      )
      return
    }

    this.hostId = sender.id

    // Create new session based on type
    this.session = {
      id: crypto.randomUUID(),
      title: data.title,
      type: data.feedbackType,
      createdBy: sender.id,
      createdAt: Date.now(),
      isActive: true,
    }

    // Initialize type-specific data
    switch (data.feedbackType) {
      case 'emoji':
        this.session.emojiOptions = data.config?.emojis || [
          { emoji: '😍', label: 'Love it', count: 0 },
          { emoji: '😊', label: 'Good', count: 0 },
          { emoji: '😐', label: 'Okay', count: 0 },
          { emoji: '😞', label: 'Not good', count: 0 },
        ]
        break

      case 'text':
        this.session.textResponses = []
        break

      case 'score':
        this.session.scoreRange = data.config?.range || { min: 1, max: 10 }
        this.session.scoreData = {
          total: 0,
          count: 0,
          average: 0,
          distribution: {},
        }
        break
    }

    // Reset responders
    this.responders.clear()
    for (const conn of this.room.getConnections()) {
      this.responders.set(conn.id, { id: conn.id, hasResponded: false })
    }

    await this.saveSessionState()
    await this.room.storage.put('hostId', this.hostId)

    // Broadcast to all connections
    this.room.broadcast(
      JSON.stringify({
        type: 'feedback_created',
        session: this.session,
      } as ServerMessage),
    )
  }

  private async handleSubmitEmoji(
    data: { emoji: string },
    sender: Party.Connection,
  ) {
    if (!this.session || this.session.type !== 'emoji') {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No active emoji feedback session',
        } as ServerMessage),
      )
      return
    }

    if (!this.session.isActive) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Feedback session is closed',
        } as ServerMessage),
      )
      return
    }

    const responder = this.responders.get(sender.id)
    if (responder?.hasResponded) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'You have already submitted feedback',
        } as ServerMessage),
      )
      return
    }

    // Find and increment emoji count
    const emojiOption = this.session.emojiOptions?.find(
      opt => opt.emoji === data.emoji,
    )

    if (!emojiOption) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid emoji option',
        } as ServerMessage),
      )
      return
    }

    emojiOption.count++

    // Mark responder as responded
    if (responder) {
      responder.hasResponded = true
    }

    await this.saveSessionState()

    sender.send(
      JSON.stringify({
        type: 'response_submitted',
      } as ServerMessage),
    )

    // Broadcast updated session
    this.room.broadcast(
      JSON.stringify({
        type: 'feedback_updated',
        session: this.session,
      } as ServerMessage),
    )
  }

  private async handleSubmitText(
    data: { text: string },
    sender: Party.Connection,
  ) {
    if (!this.session || this.session.type !== 'text') {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No active text feedback session',
        } as ServerMessage),
      )
      return
    }

    if (!this.session.isActive) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Feedback session is closed',
        } as ServerMessage),
      )
      return
    }

    const responder = this.responders.get(sender.id)
    if (responder?.hasResponded) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'You have already submitted feedback',
        } as ServerMessage),
      )
      return
    }

    // Add text response
    const textResponse: TextResponse = {
      id: crypto.randomUUID(),
      text: data.text.trim(),
      timestamp: Date.now(),
    }

    this.session.textResponses?.push(textResponse)

    // Mark responder as responded
    if (responder) {
      responder.hasResponded = true
    }

    await this.saveSessionState()

    sender.send(
      JSON.stringify({
        type: 'response_submitted',
      } as ServerMessage),
    )

    // Broadcast updated session
    this.room.broadcast(
      JSON.stringify({
        type: 'feedback_updated',
        session: this.session,
      } as ServerMessage),
    )
  }

  private async handleSubmitScore(
    data: { score: number },
    sender: Party.Connection,
  ) {
    if (!this.session || this.session.type !== 'score') {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No active score feedback session',
        } as ServerMessage),
      )
      return
    }

    if (!this.session.isActive) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Feedback session is closed',
        } as ServerMessage),
      )
      return
    }

    const responder = this.responders.get(sender.id)
    if (responder?.hasResponded) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'You have already submitted feedback',
        } as ServerMessage),
      )
      return
    }

    // Validate score is in range
    const { min, max } = this.session.scoreRange!
    if (data.score < min || data.score > max) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: `Score must be between ${min} and ${max}`,
        } as ServerMessage),
      )
      return
    }

    // Update score data
    const scoreData = this.session.scoreData!
    scoreData.total += data.score
    scoreData.count++
    scoreData.average = scoreData.total / scoreData.count
    scoreData.distribution[data.score] = (scoreData.distribution[data.score] || 0) + 1

    // Mark responder as responded
    if (responder) {
      responder.hasResponded = true
    }

    await this.saveSessionState()

    sender.send(
      JSON.stringify({
        type: 'response_submitted',
      } as ServerMessage),
    )

    // Broadcast updated session
    this.room.broadcast(
      JSON.stringify({
        type: 'feedback_updated',
        session: this.session,
      } as ServerMessage),
    )
  }

  private async handleCloseFeedback(sender: Party.Connection) {
    if (!this.session) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No active feedback session',
        } as ServerMessage),
      )
      return
    }

    if (sender.id !== this.hostId) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Only the host can close the feedback session',
        } as ServerMessage),
      )
      return
    }

    this.session.isActive = false
    await this.saveSessionState()

    this.room.broadcast(
      JSON.stringify({
        type: 'feedback_closed',
        session: this.session,
      } as ServerMessage),
    )
  }

  private sendSessionState(conn: Party.Connection) {
    if (this.session) {
      conn.send(
        JSON.stringify({
          type: 'feedback_updated',
          session: this.session,
        } as ServerMessage),
      )
    }
  }

  private async saveSessionState() {
    if (this.session) {
      await this.room.storage.put('session', this.session)
    }
    await this.room.storage.put('responders', Array.from(this.responders.entries()))
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

FeedbackServer satisfies Party.Worker
