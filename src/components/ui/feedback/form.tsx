import type { FeedbackType } from './types'
import { useState } from 'react'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Input } from '@/components/input'
import { FeedbackTypeSelector } from './type-selector'

interface FeedbackFormProps {
  readonly onSubmit: (title: string, type: FeedbackType, config?: { range: { min: number, max: number } }) => void
  readonly onError: (error: string) => void
}

export function FeedbackForm({ onSubmit, onError }: FeedbackFormProps) {
  const [title, setTitle] = useState('')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('emoji')
  const [scoreMin, setScoreMin] = useState(1)
  const [scoreMax, setScoreMax] = useState(10)

  const handleSubmit = () => {
    if (!title.trim()) {
      onError('Please enter a title')
      return
    }

    const config = feedbackType === 'score'
      ? { range: { min: scoreMin, max: scoreMax } }
      : undefined

    onSubmit(title.trim(), feedbackType, config)
    setTitle('')
  }

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 text-zinc-950 dark:text-gray-100">Create Feedback Session</h2>

      <Field className="mb-6">
        <Label htmlFor="title">
          Title
        </Label>
        <Input
          name="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., How was today's session?"
        />
      </Field>

      <FeedbackTypeSelector
        selectedType={feedbackType}
        onTypeChange={setFeedbackType}
      />

      {feedbackType === 'score' && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Score
            </label>
            <Input
              type="number"
              value={scoreMin}
              onChange={e => setScoreMin(Number(e.target.value))}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Score
            </label>
            <Input
              type="number"
              value={scoreMax}
              onChange={e => setScoreMax(Number(e.target.value))}
              min={scoreMin + 1}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        color="blue"
        className="w-full"
      >
        Create Feedback Session
      </Button>
    </div>
  )
}
