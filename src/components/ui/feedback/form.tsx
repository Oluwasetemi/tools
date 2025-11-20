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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6"
    >
      <div className="space-y-12">
        {/* Session Settings Section */}
        <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
          <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Feedback Session Settings</h2>
          <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
            Create a feedback session to collect responses from participants in real-time.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <Field>
                <Label htmlFor="title">Title</Label>
                <Input
                  name="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., How was today's session?"
                  required
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Feedback Type Section */}
        <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
          <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Feedback Type</h2>
          <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
            Choose the type of feedback you want to collect from participants.
          </p>

          <div className="mt-10">
            <FeedbackTypeSelector
              selectedType={feedbackType}
              onTypeChange={setFeedbackType}
            />
          </div>

          {feedbackType === 'score' && (
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Field>
                  <Label>Min Score</Label>
                  <Input
                    type="number"
                    value={scoreMin}
                    onChange={e => setScoreMin(Number(e.target.value))}
                    min="0"
                    required
                  />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field>
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    value={scoreMax}
                    onChange={e => setScoreMax(Number(e.target.value))}
                    min={scoreMin + 1}
                    required
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Button
          type="submit"
          color="green"
        >
          Create Feedback Session
        </Button>
      </div>
    </form>
  )
}
