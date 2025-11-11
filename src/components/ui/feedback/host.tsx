import type { EmojiOption, FeedbackType } from './types'
import { useState } from 'react'
import { useFeedbackSocket } from '@/hooks/use-feedback-socket'
import { ConnectionHeader } from './connection-header'
import { EmojiResults } from './emoji-results'
import { ErrorDisplay } from './error-display'
import { FeedbackForm } from './form'
import { ScoreResults } from './score-results'
import { SessionHeader } from './session-header'
import { TextResults } from './text-results'

interface FeedbackHostProps {
  readonly roomId: string
  readonly host?: string
}

export function FeedbackHost({ roomId, host = 'localhost:1999' }: FeedbackHostProps) {
  const { socket, session, connectionCount, error } = useFeedbackSocket(roomId, host)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = error || localError

  const createFeedback = (
    title: string,
    feedbackType: FeedbackType,
    config?: { range: { min: number, max: number } },
  ) => {
    if (!socket) {
      setLocalError('Not connected to server')
      return
    }

    socket.send(
      JSON.stringify({
        type: 'create_feedback',
        title,
        feedbackType,
        config,
      }),
    )
  }

  const closeFeedback = () => {
    if (!socket)
      return
    socket.send(JSON.stringify({ type: 'close_feedback' }))
  }

  const totalResponses = session
    ? session.type === 'emoji'
      ? session.emojiOptions?.reduce((sum: number, opt: EmojiOption) => sum + opt.count, 0) || 0
      : session.type === 'text'
        ? session.textResponses?.length || 0
        : session.scoreData?.count || 0
    : 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ConnectionHeader roomId={roomId} connectionCount={connectionCount} />

      {displayError && <ErrorDisplay error={displayError} />}

      {!session || !session.isActive
        ? (
            <FeedbackForm onSubmit={createFeedback} onError={setLocalError} />
          )
        : (
            <div className="space-y-6">
              <SessionHeader
                session={session}
                totalResponses={totalResponses}
                onClose={closeFeedback}
              />

              {session.type === 'emoji' && session.emojiOptions && (
                <EmojiResults emojiOptions={session.emojiOptions} />
              )}

              {session.type === 'text' && session.textResponses && (
                <TextResults textResponses={session.textResponses} />
              )}

              {session.type === 'score'
                && session.scoreData
                && session.scoreRange && (
                <ScoreResults
                  scoreData={session.scoreData}
                  scoreRange={session.scoreRange}
                />
              )}
            </div>
          )}
    </div>
  )
}
