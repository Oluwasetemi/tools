import type { FeedbackType } from './types'

interface FeedbackTypeSelectorProps {
  readonly selectedType: FeedbackType
  readonly onTypeChange: (type: FeedbackType) => void
}

const TYPES: { type: FeedbackType, emoji: string, label: string, sub: string }[] = [
  { type: 'emoji', emoji: '😊', label: 'Emoji', sub: 'Quick reactions' },
  { type: 'text', emoji: '💬', label: 'Text', sub: 'Open feedback' },
  { type: 'score', emoji: '⭐', label: 'Score', sub: 'Rate on scale' },
]

export function FeedbackTypeSelector({ selectedType, onTypeChange }: FeedbackTypeSelectorProps) {
  return (
    <div>
      <label className="block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-2">Feedback Type</label>
      <div className="grid grid-cols-3 gap-3">
        {TYPES.map(({ type, emoji, label, sub }) => {
          const isSelected = selectedType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={`p-4 border-2 text-center transition-all duration-100 ${
                isSelected
                  ? 'border-[#1B6B3A] bg-[#1B6B3A]/[0.06] shadow-[3px_3px_0_#1B6B3A]'
                  : 'border-[#1A1008]/20 bg-white hover:border-[#1A1008]/50'
              }`}
            >
              <div className="text-2xl mb-1.5">{emoji}</div>
              <div className="f-mono text-[11px] font-bold text-[#1A1008]">{label}</div>
              <div className="f-mono text-[9px] text-[#1A1008]/40 mt-0.5">{sub}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
