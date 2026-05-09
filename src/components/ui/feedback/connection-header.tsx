interface ConnectionHeaderProps {
  readonly roomId: string
  readonly connectionCount: number
}

export function ConnectionHeader({ roomId, connectionCount }: ConnectionHeaderProps) {
  return (
    <div className="mb-5">
      <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1B6B3A] mb-1">
        Feedback Host
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <code className="f-mono text-[12px] font-bold text-[#1A1008] bg-[#1B6B3A]/[0.08] border border-[#1B6B3A]/25 px-2 py-0.5">
          {roomId}
        </code>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
          <span className="f-mono text-[10px] tracking-[0.12em] uppercase text-[#1A1008]/40">
            {connectionCount} {connectionCount === 1 ? 'person' : 'people'} connected
          </span>
        </div>
      </div>
    </div>
  )
}
