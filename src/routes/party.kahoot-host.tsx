import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { randomStr } from '@setemiojo/utils'
import { toast } from 'sonner'
import { KahootHost } from '@/components/ui/kahoot-host'
import { Copy, ExternalLink, RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/party/kahoot-host')({
  component: KahootHostPage,
  head: () => ({
    meta: [
      { title: 'Kahoot Quiz — Host Dashboard' },
      { name: 'description', content: 'Create and host Kahoot-style quiz games with real-time scoring and live leaderboards.' },
      { property: 'og:title', content: 'Kahoot Quiz — Host Dashboard' },
      { property: 'og:description', content: 'Create and host Kahoot-style quiz games with real-time scoring and live leaderboards.' },
    ],
  }),
})

function KahootHostPage() {
  const [roomId, setRoomId] = useState(() => {
    if (typeof window === 'undefined') return `game-${randomStr(7)}`
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `game-${randomStr(7)}`
  })
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const playerUrl = `${origin}/party/kahoot-player?room=${roomId}`

  const copyUrl = () => {
    navigator.clipboard.writeText(playerUrl)
    setCopied(true)
    toast.success('Player link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const generateNewRoom = () => {
    const newRoomId = `game-${randomStr(7)}`
    setRoomId(newRoomId)
    window.history.pushState({}, '', `?room=${newRoomId}`)
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Tool accent stripe */}
      <div className="h-1 bg-[#D4380D]" />

      {/* Top nav */}
      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link
          to="/"
          className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline"
        >
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">
            01 · Quiz Host
          </span>
        </div>
      </nav>

      {/* Page header */}
      <div className="px-5 sm:px-8 pt-8 pb-0 border-b-2 border-[#1A1008]">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
          {/* Identity */}
          <div>
            <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
              Kahoot Quiz<span className="text-[#D4380D]">.</span>
            </h1>
            <button
              onClick={copyUrl}
              className="flex items-center gap-2 mt-2 group"
              title="Click to copy player URL"
            >
              <span className="f-mono text-[10px] tracking-wider uppercase text-[#1A1008]/35">Room</span>
              <code className="f-mono text-[12px] font-medium text-[#D4380D] bg-[#D4380D]/[0.08] px-2 py-0.5 border border-[#D4380D]/25 group-hover:bg-[#D4380D]/[0.14] transition-colors">
                {roomId}
              </code>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={generateNewRoom}
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-white f-mono text-[10px] tracking-[0.1em] uppercase text-[#1A1008] shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              <RefreshCw size={11} />
              New Room
            </button>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-white f-mono text-[10px] tracking-[0.1em] uppercase text-[#1A1008] shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              <Copy size={11} />
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            <a
              href={playerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[10px] tracking-[0.1em] uppercase shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
            >
              <ExternalLink size={11} />
              Open Player ↗
            </a>
          </div>
        </div>

        {/* Share URL bar */}
        <div className="pb-5">
          <div className="flex items-stretch border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
            <div className="px-3 py-2.5 border-r border-[#1A1008]/15 bg-[#1A1008]/[0.02] shrink-0 flex items-center">
              <span className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/35">Share</span>
            </div>
            <code className="px-3 py-2.5 f-mono text-[11px] text-[#1A1008]/60 flex-1 min-w-0 truncate flex items-center">
              {playerUrl}
            </code>
            <button
              onClick={copyUrl}
              className="px-4 py-2.5 bg-[#D4380D] text-white f-mono text-[10px] tracking-[0.12em] uppercase shrink-0 border-l-2 border-[#1A1008] hover:bg-[#b83309] transition-colors"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick steps */}
      <div className="px-5 sm:px-8 py-4 border-b border-[#1A1008]/10 bg-[#1A1008]/[0.015]">
        <div className="flex gap-8 flex-wrap">
          {[
            { n: '01', text: 'Add questions with 4 options' },
            { n: '02', text: 'Share the player link above' },
            { n: '03', text: 'Start when players are ready' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <span className="f-mono text-[10px] tracking-wider text-[#D4380D]">{s.n}</span>
              <span className="f-mono text-[11px] text-[#1A1008]/50">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main component */}
      <div className="px-5 sm:px-8 py-6">
        <KahootHost
          roomId={roomId}
          host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
        />
      </div>
    </div>
  )
}
