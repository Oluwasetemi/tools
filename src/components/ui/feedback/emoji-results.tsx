import type { EmojiOption } from './types'

interface EmojiResultsProps {
  readonly emojiOptions: readonly EmojiOption[]
}

export function EmojiResults({ emojiOptions }: EmojiResultsProps) {
  const total = emojiOptions.reduce((s, o) => s + o.count, 0)

  return (
    <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
      <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-5">
        Emoji Reactions · {total} total
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {emojiOptions.map(option => {
          const pct = total > 0 ? (option.count / total) * 100 : 0
          return (
            <div key={option.emoji} className="border-2 border-[#1A1008]/15 bg-[#F7F3EC] p-4 text-center">
              <div className="text-4xl mb-2">{option.emoji}</div>
              <div className="f-mono text-[9px] tracking-[0.1em] uppercase text-[#1A1008]/40 mb-1">{option.label}</div>
              <div className="f-display font-black text-[28px] text-[#1A1008] leading-none">{option.count}</div>
              {total > 0 && (
                <div className="f-mono text-[9px] text-[#1B6B3A] mt-1">{pct.toFixed(0)}%</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
