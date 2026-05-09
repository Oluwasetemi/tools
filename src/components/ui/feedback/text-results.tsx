import type { TextResponse } from './types'
import { formatRelative } from '@setemiojo/utils'
import { Temporal } from 'temporal-polyfill'

interface TextResultsProps {
  readonly textResponses: readonly TextResponse[]
}

export function TextResults({ textResponses }: TextResultsProps) {
  return (
    <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
      <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-5">
        Text Responses ({textResponses.length})
      </div>

      {textResponses.length === 0
        ? (
            <div className="border-2 border-dashed border-[#1A1008]/15 p-8 text-center">
              <p className="f-mono text-[11px] text-[#1A1008]/35">No responses yet — waiting for feedback...</p>
            </div>
          )
        : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {textResponses.map(response => (
                <div key={response.id} className="border-2 border-[#1A1008]/10 bg-[#F7F3EC] px-4 py-3">
                  <p className="f-mono text-[13px] text-[#1A1008] leading-relaxed">{response.text}</p>
                  <p className="f-mono text-[9px] tracking-[0.1em] uppercase text-[#1A1008]/30 mt-2">
                    {formatRelative(
                      Temporal.Instant.fromEpochMilliseconds(response.timestamp).toZonedDateTimeISO('UTC').toPlainDateTime(),
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}
