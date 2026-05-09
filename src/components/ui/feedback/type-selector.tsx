import type { FeedbackType } from './types'

interface FeedbackTypeSelectorProps {
  readonly selectedType: FeedbackType
  readonly onTypeChange: (type: FeedbackType) => void
}

export function FeedbackTypeSelector({
  selectedType,
  onTypeChange,
}: FeedbackTypeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Feedback Type
      </label>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onTypeChange('emoji')}
          className={`p-4 border-2 rounded-lg transition-all ${
            selectedType === 'emoji'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className="text-3xl mb-2">😊</div>
          <div className="font-medium">Emoji</div>
          <div className="text-xs text-gray-600">Quick reactions</div>
        </button>

        <button
          onClick={() => onTypeChange('text')}
          className={`p-4 border-2 rounded-lg transition-all ${
            selectedType === 'text'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className="text-3xl mb-2">💬</div>
          <div className="font-medium">Text</div>
          <div className="text-xs text-gray-600">Open feedback</div>
        </button>

        <button
          onClick={() => onTypeChange('score')}
          className={`p-4 border-2 rounded-lg transition-all ${
            selectedType === 'score'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className="text-3xl mb-2">⭐</div>
          <div className="font-medium">Score</div>
          <div className="text-xs text-gray-600">Rate on scale</div>
        </button>
      </div>
    </div>
  )
}
