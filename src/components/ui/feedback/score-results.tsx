import type { ScoreData } from './types'

interface ScoreResultsProps {
  readonly scoreData: ScoreData
  readonly scoreRange: { readonly min: number, readonly max: number }
}

export function ScoreResults({ scoreData, scoreRange }: ScoreResultsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-zinc-950">Score Results</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Average</div>
          <div className="text-4xl font-bold text-blue-600">
            {scoreData.average.toFixed(1)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Total Votes</div>
          <div className="text-4xl font-bold text-green-600">
            {scoreData.count}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Range</div>
          <div className="text-4xl font-bold text-purple-600">
            {scoreRange.min}
            -
            {scoreRange.max}
          </div>
        </div>
      </div>

      <h4 className="font-semibold mb-3 text-zinc-950">Distribution</h4>
      <div className="space-y-2">
        {Array.from(
          { length: scoreRange.max - scoreRange.min + 1 },
          (_, i) => i + scoreRange.min,
        ).map((score) => {
          const count = scoreData.distribution[score] || 0
          const percentage
            = scoreData.count > 0
              ? (count / scoreData.count) * 100
              : 0

          return (
            <div key={score} className="flex items-center gap-3">
              <div className="w-8 text-right font-medium text-zinc-950">{score}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-zinc-950">
                  {count}
                  {' '}
                  (
                  {percentage.toFixed(0)}
                  %)
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
