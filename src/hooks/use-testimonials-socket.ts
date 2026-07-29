import type PartySocket from 'partysocket'
import usePartySocket from 'partysocket/react'
import { useState } from 'react'

export interface TestimonialSession {
  roomId: string
  title: string
  createdBy: string
  isActive: boolean
  createdAt: number
}

export interface Testimonial {
  id: string
  dbId: number | null
  studentName: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: number
  submitterConnectionId: string
}

type ServerMessage
  = | { type: 'session_created', session: TestimonialSession }
    | { type: 'session_state', session: TestimonialSession | null, testimonials: Testimonial[] }
    | { type: 'testimonial_submitted', testimonial: Testimonial }
    | { type: 'testimonial_moderated', testimonial: Testimonial }
    | { type: 'session_closed', session: TestimonialSession }
    | { type: 'connection_count', count: number }
    | { type: 'error', message: string }

interface UseTestimonialsSocketReturn {
  readonly socket: PartySocket | null
  readonly session: TestimonialSession | null
  readonly testimonials: Testimonial[]
  readonly connectionCount: number
  readonly error: string | null
}

export function useTestimonialsSocket(
  roomId: string,
  host: string,
): UseTestimonialsSocketReturn {
  const [session, setSession] = useState<TestimonialSession | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'testimonials',

    onMessage(event: MessageEvent) {
      if (typeof event.data !== 'string') return
      const data: ServerMessage = JSON.parse(event.data)
      console.log(`[DBG-T] ← msg type="${data.type}"`, data)

      switch (data.type) {
        case 'session_created':
          console.log('[DBG-T] session_created → setting session:', data.session)
          setSession(data.session)
          setError(null)
          break

        case 'session_state':
          console.log('[DBG-T] session_state → session:', data.session, 'testimonials:', data.testimonials.length)
          setSession(data.session)
          setTestimonials(data.testimonials)
          break

        case 'testimonial_submitted':
          setTestimonials(prev => {
            if (prev.find(t => t.id === data.testimonial.id)) return prev
            return [...prev, data.testimonial]
          })
          break

        case 'testimonial_moderated':
          setTestimonials(prev =>
            prev.map(t => t.id === data.testimonial.id ? data.testimonial : t),
          )
          break

        case 'session_closed':
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
      console.log(`[DBG-T] WS OPEN — room="${roomId}" host="${host}"`)
    },

    onClose(event: CloseEvent) {
      console.warn(`[DBG-T] WS CLOSED — code=${event.code} reason="${event.reason}"`)
    },

    onError(err: Event) {
      console.error('[DBG-T] WS ERROR:', err)
      setError('Connection error')
    },
  })

  return { socket, session, testimonials, connectionCount, error }
}
