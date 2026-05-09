import type { FeedbackType } from './types'
import { useState } from 'react'
import { FeedbackTypeSelector } from './type-selector'

interface FeedbackFormProps {
  readonly onSubmit: (title: string, type: FeedbackType, config?: { range: { min: number, max: number } }) => void
  readonly onError: (error: string) => void
}

const inputCls = 'w-full border-2 border-[#1A1008] bg-white px-3 py-2.5 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#1B6B3A] transition-shadow'
const labelCls = 'block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-1.5'

export function FeedbackForm({ onSubmit, onError }: FeedbackFormProps) {
  const [title, setTitle] = useState('')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('emoji')
  const [scoreMin, setScoreMin] = useState(1)
  const [scoreMax, setScoreMax] = useState(10)

  const handleSubmit = () => {
    if (!title.trim()) { onError('Please enter a title'); return }
    const config = feedbackType === 'score' ? { range: { min: scoreMin, max: scoreMax } } : undefined
    onSubmit(title.trim(), feedbackType, config)
    setTitle('')
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6 mb-4">
        <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-5">Session Settings</div>

        <div className="mb-6">
          <label className={labelCls}>Title</label>
          <input
            name="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., How was today's session?"
            required
            className={inputCls}
          />
        </div>

        <FeedbackTypeSelector selectedType={feedbackType} onTypeChange={setFeedbackType} />

        {feedbackType === 'score' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Min Score</label>
              <input type="number" value={scoreMin} onChange={e => setScoreMin(Number(e.target.value))} min="0" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Score</label>
              <input type="number" value={scoreMax} onChange={e => setScoreMax(Number(e.target.value))} min={scoreMin + 1} required className={inputCls} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="border-2 border-[#1A1008] bg-[#1B6B3A] text-white f-mono text-[10px] tracking-[0.12em] uppercase px-5 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
        >
          Create Session →
        </button>
      </div>
    </form>
  )
}
