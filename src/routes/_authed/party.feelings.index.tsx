import { getPartykitHost } from '@/lib/partykit-host'
import { randomStr } from '@setemiojo/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { EmojiStream } from '@/components/ui/emoji-stream'

export const Route = createFileRoute('/_authed/party/feelings/')({
  component: FeelingsPage,
  head: () => ({
    meta: [
      { title: 'Feeling Stream — Pop & Broadcast Emojis' },
      { name: 'description', content: 'Pop emojis and broadcast your feelings in real-time.' },
      { property: 'og:title', content: 'Feeling Stream — Pop & Broadcast Emojis' },
      { property: 'og:description', content: 'Pop emojis and broadcast your feelings in real-time.' },
      { property: 'og:image', content: '/api/og/feelings' },
    ],
  }),
})

function FeelingsPage() {
  const [roomId] = useState(() => {
    if (typeof window === 'undefined')
      return `feelings-${randomStr(7)}`
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `feelings-${randomStr(7)}`
  })

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/party/feelings?room=${roomId}`
    : ''

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="fixed inset-0">
      <EmojiStream
        roomId={roomId}
        host={getPartykitHost()}
        onCopyLink={handleCopyLink}
      />
      <Link
        to="/party/feelings/history"
        className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1A1008]/40 bg-black/30 backdrop-blur-sm text-white f-mono text-[10px] tracking-[0.1em] uppercase hover:bg-black/50 transition-colors no-underline"
      >
        History
      </Link>
    </div>
  )
}
