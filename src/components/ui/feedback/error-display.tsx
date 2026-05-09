interface ErrorDisplayProps {
  readonly error: string
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-3 mb-5 f-mono text-[12px] text-[#D4380D]">
      {error}
    </div>
  )
}
