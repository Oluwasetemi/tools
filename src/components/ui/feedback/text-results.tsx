import type { TextResponse } from './types'
import { formatRelative } from '@setemiojo/utils'
import { Temporal } from 'temporal-polyfill'

interface TextResultsProps {
  readonly textResponses: readonly TextResponse[]
}

export function TextResults({ textResponses }: TextResultsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-zinc-950">
        Text Responses (
        {textResponses.length}
        )
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {textResponses.length === 0
          ? (
              <p className="text-gray-500 text-center py-8">
                No responses yet. Waiting for feedback...
              </p>
            )
          : (
              textResponses.map(response => (
                <div
                  key={response.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-gray-800">{response.text}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatRelative(
                      Temporal.Instant.fromEpochMilliseconds(response.timestamp).toZonedDateTimeISO('UTC').toPlainDateTime(),
                    )}
                  </p>
                </div>
              ))
            )}
      </div>
    </div>
  )
}
