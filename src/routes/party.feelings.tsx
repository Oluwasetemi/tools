import { randomStr } from '@setemiojo/utils'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { EmojiStream } from '@/components/ui/emoji-stream'

export const Route = createFileRoute('/party/feelings')({
  component: FeelingsPage,
  head: () => ({
    meta: [
      { title: 'Feeling Stream — Pop & Broadcast Emojis' },
      { name: 'description', content: 'Pop emojis and broadcast your feelings in real-time.' },
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
        host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
        onCopyLink={handleCopyLink}
      />
    </div>
  )
}
