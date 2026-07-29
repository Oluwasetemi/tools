import type * as Party from 'partykit/server'
import { callInternalApi } from './lib/db-client'

interface TestimonialSession {
  roomId: string
  title: string
  createdBy: string
  isActive: boolean
  createdAt: number
}

interface Testimonial {
  id: string
  dbId: number | null
  studentName: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: number
  submitterConnectionId: string
}

type ClientMessage
  = | { type: 'create_session', title: string }
    | { type: 'submit_testimonial', studentName: string, content: string }
    | { type: 'moderate_testimonial', id: string, action: 'approve' | 'reject' }
    | { type: 'close_session' }
    | { type: 'get_state' }

type ServerMessage
  = | { type: 'session_created', session: TestimonialSession }
    | { type: 'session_state', session: TestimonialSession | null, testimonials: Testimonial[] }
    | { type: 'testimonial_submitted', testimonial: Testimonial }
    | { type: 'testimonial_moderated', testimonial: Testimonial }
    | { type: 'session_closed', session: TestimonialSession }
    | { type: 'connection_count', count: number }
    | { type: 'error', message: string }

export default class TestimonialsServer implements Party.Server {
  private session: TestimonialSession | null = null
  private testimonials: Map<string, Testimonial> = new Map()
  private hostId: string | null = null
  private dbSessionId: number | null = null
  private submittedConnections: Set<string> = new Set()

  constructor(readonly room: Party.Room) {}

  async onStart() {
    this.session = await this.room.storage.get<TestimonialSession>('session') ?? null
    const stored = await this.room.storage.get<[string, Testimonial][]>('testimonials') ?? []
    this.testimonials = new Map(stored)
    this.hostId = await this.room.storage.get<string>('hostId') ?? null
    this.dbSessionId = await this.room.storage.get<number>('dbSessionId') ?? null
    console.log(`[DBG-T] onStart room="${this.room.id}" session=${this.session ? `"${this.session.title}"` : 'null'} testimonials=${this.testimonials.size}`)
  }

  onConnect(conn: Party.Connection) {
    console.log(`[DBG-T] onConnect conn="${conn.id}" room="${this.room.id}" session=${this.session ? `"${this.session.title}"` : 'null'}`)
    conn.send(JSON.stringify({
      type: 'session_state',
      session: this.session,
      testimonials: Array.from(this.testimonials.values()),
    } as ServerMessage))
    this.broadcastConnectionCount()
  }

  onClose(_conn: Party.Connection) {
    this.broadcastConnectionCount()
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== 'string') return

    try {
      const data: ClientMessage = JSON.parse(message)
      console.log(`[DBG-T] onMessage type="${data.type}" from="${sender.id}"`)
      switch (data.type) {
        case 'create_session':
          await this.handleCreateSession(data.title, sender)
          break
        case 'submit_testimonial':
          await this.handleSubmitTestimonial(data.studentName, data.content, sender)
          break
        case 'moderate_testimonial':
          await this.handleModerateTestimonial(data.id, data.action, sender)
          break
        case 'close_session':
          await this.handleCloseSession(sender)
          break
        case 'get_state':
          sender.send(JSON.stringify({
            type: 'session_state',
            session: this.session,
            testimonials: Array.from(this.testimonials.values()),
          } as ServerMessage))
          break
      }
    }
    catch {
      sender.send(JSON.stringify({ type: 'error', message: 'Invalid message format' } as ServerMessage))
    }
  }

  private async handleCreateSession(title: string, sender: Party.Connection) {
    console.log(`[DBG-T] handleCreateSession title="${title}" existingSession=${this.session ? `"${this.session.title}" active=${this.session.isActive}` : 'null'}`)
    if (this.session && this.session.isActive) {
      console.log('[DBG-T] handleCreateSession → already active, rejecting')
      sender.send(JSON.stringify({ type: 'error', message: 'Session already active' } as ServerMessage))
      return
    }

    this.session = {
      roomId: this.room.id,
      title,
      createdBy: sender.id,
      isActive: true,
      createdAt: Date.now(),
    }
    this.hostId = sender.id

    await this.room.storage.put('session', this.session)
    await this.room.storage.put('hostId', this.hostId)
    console.log(`[DBG-T] handleCreateSession → session created, broadcasting to ${[...this.room.getConnections()].length} connections`)

    try {
      const result = await callInternalApi('testimonials', {
        type: 'create_session',
        roomId: this.room.id,
        title,
        createdBy: sender.id,
      })
      if (result?.ok) {
        this.dbSessionId = (result.data as { id: number }).id
        await this.room.storage.put('dbSessionId', this.dbSessionId)
      }
    }
    catch (err) {
      console.error('[testimonials] DB create_session failed:', err)
    }

    this.room.broadcast(JSON.stringify({ type: 'session_created', session: this.session } as ServerMessage))
  }

  private async handleSubmitTestimonial(studentName: string, content: string, sender: Party.Connection) {
    if (!this.session || !this.session.isActive) {
      sender.send(JSON.stringify({ type: 'error', message: 'No active session' } as ServerMessage))
      return
    }

    if (this.submittedConnections.has(sender.id)) {
      sender.send(JSON.stringify({ type: 'error', message: 'You have already submitted a testimonial' } as ServerMessage))
      return
    }

    const id = crypto.randomUUID()
    const testimonial: Testimonial = {
      id,
      dbId: null,
      studentName,
      content,
      status: 'pending',
      submittedAt: Date.now(),
      submitterConnectionId: sender.id,
    }

    this.testimonials.set(id, testimonial)
    this.submittedConnections.add(sender.id)
    await this.room.storage.put('testimonials', Array.from(this.testimonials.entries()))

    this.room.broadcast(JSON.stringify({ type: 'testimonial_submitted', testimonial } as ServerMessage))

    ;(async () => {
      try {
        if (this.dbSessionId) {
          const result = await callInternalApi('testimonials', {
            type: 'submit_testimonial',
            sessionId: this.dbSessionId,
            roomId: this.room.id,
            studentName,
            content,
          })
          if (result?.ok) {
            const dbId = (result.data as { id: number }).id
            const t = this.testimonials.get(id)
            if (t) {
              t.dbId = dbId
              this.testimonials.set(id, t)
              await this.room.storage.put('testimonials', Array.from(this.testimonials.entries()))
            }
          }
        }
      }
      catch (err) {
        console.error('[testimonials] DB submit_testimonial failed:', err)
      }
    })()
  }

  private async handleModerateTestimonial(id: string, action: 'approve' | 'reject', sender: Party.Connection) {
    if (sender.id !== this.hostId) {
      sender.send(JSON.stringify({ type: 'error', message: 'Only the host can moderate testimonials' } as ServerMessage))
      return
    }

    const testimonial = this.testimonials.get(id)
    if (!testimonial) {
      sender.send(JSON.stringify({ type: 'error', message: 'Testimonial not found' } as ServerMessage))
      return
    }

    testimonial.status = action === 'approve' ? 'approved' : 'rejected'
    this.testimonials.set(id, testimonial)
    await this.room.storage.put('testimonials', Array.from(this.testimonials.entries()))

    this.room.broadcast(JSON.stringify({ type: 'testimonial_moderated', testimonial } as ServerMessage))

    ;(async () => {
      try {
        if (testimonial.dbId) {
          await callInternalApi('testimonials', {
            type: 'moderate_testimonial',
            id: testimonial.dbId,
            roomId: this.room.id,
            action,
          })
        }
      }
      catch (err) {
        console.error('[testimonials] DB moderate_testimonial failed:', err)
      }
    })()
  }

  private async handleCloseSession(sender: Party.Connection) {
    if (sender.id !== this.hostId) {
      sender.send(JSON.stringify({ type: 'error', message: 'Only the host can close the session' } as ServerMessage))
      return
    }

    if (!this.session) return

    this.session.isActive = false
    await this.room.storage.put('session', this.session)

    this.room.broadcast(JSON.stringify({ type: 'session_closed', session: this.session } as ServerMessage))

    ;(async () => {
      try {
        await callInternalApi('testimonials', { type: 'close_session', roomId: this.room.id })
      }
      catch (err) {
        console.error('[testimonials] DB close_session failed:', err)
      }
    })()
  }

  private broadcastConnectionCount() {
    const count = [...this.room.getConnections()].length
    this.room.broadcast(JSON.stringify({ type: 'connection_count', count } as ServerMessage))
  }
}

TestimonialsServer satisfies Party.Worker
