import { randomStr } from '@setemiojo/utils'
import { createFileRoute } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/button'
import { EmojiStream } from '@/components/ui/emoji-stream'

export const Route = createFileRoute('/party/feelings')({
  component: FeelingsDemo,
  head: () => ({
    meta: [
      {
        title: 'Feeling Stream - Pop & Broadcast Emojis',
        description: 'Pop emojis and broadcast your feelings in real-time. Connect with others through emoji reactions.',
        property: 'og:title',
        content: 'Feeling Stream - Pop & Broadcast Emojis',
      },
      {
        property: 'og:description',
        content: 'Pop emojis and broadcast your feelings in real-time. Connect with others through emoji reactions.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/feelings`,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Feeling Stream - Pop & Broadcast Emojis',
      },
      {
        name: 'twitter:description',
        content: 'Pop emojis and broadcast your feelings in real-time. Connect with others through emoji reactions.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/feelings`,
      },
    ],
  }),
})

function FeelingsDemo() {
  const [roomId] = useState(() => {
    if (typeof window === 'undefined') {
      return `feelings-${randomStr(7)}`
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `feelings-${randomStr(7)}`
  })

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/party/feelings?room=${roomId}`
    : ''

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="fixed inset-0 top-[3.75rem]">
      <EmojiStream
        roomId={roomId}
        host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
        onCopyLink={handleCopyLink}
      />
    </div>
  )
}
