import { eq } from 'drizzle-orm'
import { randomStr } from '@setemiojo/utils'
import { db } from '@/db'
import { plannedSessions } from '@/db/schema'

const TOOL_HOST_ROUTES: Record<string, string> = {
  kahoot: '/party/kahoot-host',
  poll: '/party/polls',
  feedback: '/party/feedback-host',
  feelings: '/party/feelings',
  testimonials: '/testimonials',
  certificates: '/certificates',
}

const ROOM_PREFIXES: Record<string, string> = {
  kahoot: 'game',
  poll: 'poll',
  feedback: 'feedback',
  feelings: 'feelings',
  testimonials: 'testimonials',
  certificates: 'certs',
}

export async function createPlannedSession(input: {
  ownerId: string
  toolType: 'kahoot' | 'poll' | 'feedback' | 'feelings' | 'testimonials' | 'certificates'
  title: string
  config: Record<string, unknown>
  scheduledFor: Date | null
}) {
  const [session] = await db
    .insert(plannedSessions)
    .values({
      ownerId: input.ownerId,
      toolType: input.toolType,
      title: input.title,
      config: input.config,
      status: 'planned',
      scheduledFor: input.scheduledFor,
    })
    .returning()
  return session
}

export async function startPlannedSession(input: { id: number; ownerId: string }) {
  const rows = await db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.id, input.id))
    .orderBy(plannedSessions.id)

  const session = rows[0]
  if (!session) throw new Error('Planned session not found')
  if (session.ownerId !== input.ownerId) throw new Error('You are not owner of this session')
  if (session.status === 'active') throw new Error('Session is already active')
  if (session.status === 'ended') throw new Error('Session has already ended')

  const prefix = ROOM_PREFIXES[session.toolType] ?? session.toolType
  const roomId = `${prefix}-${randomStr(7)}`

  const [updated] = await db
    .update(plannedSessions)
    .set({ status: 'active', roomId, startedAt: new Date() })
    .where(eq(plannedSessions.id, input.id))
    .returning()

  const hostRoute = TOOL_HOST_ROUTES[session.toolType] ?? '/'
  return {
    roomId: updated.roomId!,
    redirectTo: `${hostRoute}?room=${updated.roomId}`,
    session: updated,
  }
}

export async function getTeacherSchedule(ownerId: string) {
  return db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.ownerId, ownerId))
    .orderBy(plannedSessions.scheduledFor, plannedSessions.createdAt)
}
