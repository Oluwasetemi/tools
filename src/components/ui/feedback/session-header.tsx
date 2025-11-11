import type { FeedbackSession } from './types'
import { Button } from '@/components/button'

interface SessionHeaderProps {
  readonly session: FeedbackSession
  readonly totalResponses: number
  readonly onClose: () => void
}

export function SessionHeader({ session, totalResponses, onClose }: SessionHeaderProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-zinc-950">{session.title}</h2>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
            {' '}
            Feedback
          </span>
        </div>
        <Button
          onClick={onClose}
          color="red"
        >
          Close Session
        </Button>
      </div>
      <p className="text-gray-600">
        Total Responses:
        {' '}
        <span className="font-bold text-2xl text-zinc-950">{totalResponses}</span>
      </p>
    </div>
  )
}
