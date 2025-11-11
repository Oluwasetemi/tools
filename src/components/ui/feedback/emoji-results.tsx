import type { EmojiOption } from './types'

interface EmojiResultsProps {
  readonly emojiOptions: readonly EmojiOption[]
}

export function EmojiResults({ emojiOptions }: EmojiResultsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-zinc-950">Emoji Reactions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {emojiOptions.map(option => (
          <div
            key={option.emoji}
            className="bg-gray-50 rounded-lg p-6 text-center border-2 border-gray-200"
          >
            <div className="text-5xl mb-3">{option.emoji}</div>
            <div className="text-sm text-gray-600 mb-1">{option.label}</div>
            <div className="text-3xl font-bold text-blue-600">{option.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
