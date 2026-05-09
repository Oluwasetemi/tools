import type { ScoreData } from './types'

interface ScoreResultsProps {
  readonly scoreData: ScoreData
  readonly scoreRange: { readonly min: number, readonly max: number }
}

export function ScoreResults({ scoreData, scoreRange }: ScoreResultsProps) {
  return (
    <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
      <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-5">Score Results</div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border-2 border-[#1A1008]/15 bg-[#F7F3EC] p-4 text-center">
          <div className="f-mono text-[9px] tracking-[0.15em] uppercase text-[#1A1008]/40 mb-1">Average</div>
          <div className="f-display font-black text-[32px] text-[#1B6B3A] leading-none">{scoreData.average.toFixed(1)}</div>
        </div>
        <div className="border-2 border-[#1A1008]/15 bg-[#F7F3EC] p-4 text-center">
          <div className="f-mono text-[9px] tracking-[0.15em] uppercase text-[#1A1008]/40 mb-1">Responses</div>
          <div className="f-display font-black text-[32px] text-[#1A1008] leading-none">{scoreData.count}</div>
        </div>
        <div className="border-2 border-[#1A1008]/15 bg-[#F7F3EC] p-4 text-center">
          <div className="f-mono text-[9px] tracking-[0.15em] uppercase text-[#1A1008]/40 mb-1">Range</div>
          <div className="f-display font-black text-[28px] text-[#0C3D6B] leading-none">{scoreRange.min}–{scoreRange.max}</div>
        </div>
      </div>

      {/* Distribution */}
      <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/40 mb-3">Distribution</div>
      <div className="space-y-2">
        {Array.from({ length: scoreRange.max - scoreRange.min + 1 }, (_, i) => i + scoreRange.min).map((score) => {
          const count = scoreData.distribution[score] ?? 0
          const pct = scoreData.count > 0 ? (count / scoreData.count) * 100 : 0
          return (
            <div key={score} className="flex items-center gap-3">
              <span className="f-mono text-[11px] font-black text-[#1A1008] w-6 text-right">{score}</span>
              <div className="flex-1 h-7 border-2 border-[#1A1008]/10 bg-[#F7F3EC] relative overflow-hidden">
                <div className="absolute inset-0 bg-[#1B6B3A] transition-all duration-500" style={{ width: `${pct}%` }} />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="f-mono text-[10px] text-white relative z-10 mix-blend-difference">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
