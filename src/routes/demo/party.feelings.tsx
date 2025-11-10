import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { EmojiStream } from '@/components/emoji-stream'

export const Route = createFileRoute('/demo/party/feelings')({
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
    const params = new URLSearchParams(window.location.search)
    return params.get('room') || `feelings-${Math.random().toString(36).substring(7)}`
  })

  const shareUrl = `${window.location.origin}/demo/party/feelings?room=${roomId}`

  const [showShareLink, setShowShareLink] = useState(false)

  return (
    <div className="relative min-h-screen">
      {/* Share link overlay */}
      {showShareLink && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Share This Room</h2>
            <p className="text-gray-600 mb-4">
              Send this link to friends so they can join and pop emojis together!
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  alert('Link copied!')
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareLink(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Share button */}
      <button
        onClick={() => setShowShareLink(true)}
        className="absolute top-20 right-4 z-20 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-medium"
      >
        <span>🔗</span>
        <span>Share Room</span>
      </button>

      <EmojiStream
        roomId={roomId}
        host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
      />
    </div>
  )
}
