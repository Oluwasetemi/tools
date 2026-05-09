import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { randomStr } from '@setemiojo/utils'
import { toast } from 'sonner'
import { FeedbackHost } from '@/components/ui/feedback'
import { Copy, ExternalLink, RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/party/feedback-host')({
  component: FeedbackHostPage,
  head: () => ({
    meta: [
      { title: 'Live Feedback — Host Dashboard' },
      { name: 'description', content: 'Collect real-time feedback with emoji reactions, text responses, and score ratings.' },
      { property: 'og:title', content: 'Live Feedback — Host Dashboard' },
      { property: 'og:description', content: 'Collect real-time feedback with emoji reactions, text responses, and score ratings.' },
    ],
  }),
})

function FeedbackHostPage() {
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `feedback-${randomStr(7)}`
  })
  const [copied, setCopied] = useState(false)

  const clientUrl = `${window.location.origin}/party/feedback-client?room=${roomId}`

  const copyUrl = () => {
    navigator.clipboard.writeText(clientUrl)
    setCopied(true)
    toast.success('Client link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const generateNewRoom = () => {
    const newRoomId = `feedback-${randomStr(7)}`
    setRoomId(newRoomId)
    window.history.pushState({}, '', `?room=${newRoomId}`)
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Tool accent stripe — forest green */}
      <div className="h-1 bg-[#1B6B3A]" />

      {/* Top nav */}
      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link
          to="/"
          className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline"
        >
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">
          03 · Feedback Host
        </span>
      </nav>

      {/* Page header */}
      <div className="px-5 sm:px-8 pt-8 pb-0 border-b-2 border-[#1A1008]">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
          <div>
            <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
              Live Feedback<span className="text-[#1B6B3A]">.</span>
            </h1>
            <button
              onClick={copyUrl}
              className="flex items-center gap-2 mt-2 group"
              title="Click to copy client URL"
            >
              <span className="f-mono text-[10px] tracking-wider uppercase text-[#1A1008]/35">Room</span>
              <code className="f-mono text-[12px] font-medium text-[#1B6B3A] bg-[#1B6B3A]/[0.08] px-2 py-0.5 border border-[#1B6B3A]/25 group-hover:bg-[#1B6B3A]/[0.14] transition-colors">
                {roomId}
              </code>
            </button>
          </div>

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
              href={clientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#1A1008] bg-[#1B6B3A] text-white f-mono text-[10px] tracking-[0.1em] uppercase shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
            >
              <ExternalLink size={11} />
              Open Client ↗
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
              {clientUrl}
            </code>
            <button
              onClick={copyUrl}
              className="px-4 py-2.5 bg-[#1B6B3A] text-white f-mono text-[10px] tracking-[0.12em] uppercase shrink-0 border-l-2 border-[#1A1008] hover:bg-[#155b30] transition-colors"
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
            { n: 'Emoji', text: 'Quick reactions with predefined emojis' },
            { n: 'Text', text: 'Open-ended written responses' },
            { n: 'Score', text: 'Numeric rating on a custom scale' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <span className="f-mono text-[10px] tracking-wider text-[#1B6B3A] font-medium">{s.n}</span>
              <span className="f-mono text-[11px] text-[#1A1008]/50">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main component */}
      <div className="px-5 sm:px-8 py-6">
        <FeedbackHost
          roomId={roomId}
          host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
        />
      </div>
    </div>
  )
}
