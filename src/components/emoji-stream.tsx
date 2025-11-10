import PartySocket from 'partysocket'
import { useEffect, useRef, useState } from 'react'
import { at, clamp, sleep } from '@setemiojo/utils'

interface FloatingEmoji {
  id: string
  emoji: string
  x: number
  y: number
  timestamp: number
}

type ServerMessage
  = | { type: 'emoji_pop', emoji: string, userId: string, timestamp: number, x: number, y: number }
    | { type: 'connection_count', count: number }

interface EmojiStreamProps {
  roomId: string
  host?: string
}

const EMOJI_OPTIONS = [
  '❤️',
  '💙',
  '💚',
  '💛',
  '💜',
  '🧡',
  '😊',
  '😂',
  '🥳',
  '😍',
  '🤩',
  '😎',
  '🔥',
  '⭐',
  '✨',
  '💫',
  '🌟',
  '💥',
  '👍',
  '👏',
  '🙌',
  '💪',
  '✌️',
  '🤘',
  '🎉',
  '🎊',
  '🎈',
  '🎁',
  '🏆',
  '🌈',
]

export function EmojiStream({ roomId, host = 'localhost:1999' }: EmojiStreamProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const [connectionCount, setConnectionCount] = useState(0)
  const [selectedEmoji, setSelectedEmoji] = useState<string>(at(EMOJI_OPTIONS, 0))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = new PartySocket({
      host,
      room: roomId,
      party: 'feelings',
    })

    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
        case 'emoji_pop': {
          const newEmoji: FloatingEmoji = {
            id: `${data.userId}-${data.timestamp}`,
            emoji: data.emoji,
            x: data.x,
            y: data.y,
            timestamp: data.timestamp,
          }

          setFloatingEmojis(prev => [...prev, newEmoji])

          // Remove emoji after animation completes (3 seconds)
          sleep(3000, () => {
            setFloatingEmojis(prev =>
              prev.filter(e => e.id !== newEmoji.id),
            )
          })
          break
        }

        case 'connection_count':
          setConnectionCount(data.count)
          break
      }
    })

    ws.addEventListener('open', () => {
      console.log('Connected to feelings server')
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [roomId, host])

  const popEmoji = (emoji: string, clientX?: number, clientY?: number) => {
    if (!socket)
      return

    let x = clamp(Math.random() * 100, 10, 90) // 10-90%
    let y = clamp(Math.random() * 100, 10, 90) // 10-90%

    // If click position is provided, use it
    if (clientX !== undefined && clientY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
      y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
    }

    socket.send(
      JSON.stringify({
        type: 'emoji_pop',
        emoji,
        x,
        y,
      }),
    )
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only pop emoji if clicking on the background, not on buttons
    if (e.target === e.currentTarget) {
      popEmoji(selectedEmoji, e.clientX, e.clientY)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 relative overflow-hidden">
      {/* Connection counter */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-semibold text-gray-800">
            {connectionCount}
            {' '}
            {connectionCount === 1 ? 'person' : 'people'}
            {' '}
            online
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4 z-20">
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          Feeling Stream 💭
        </h1>
        <p className="text-white/90 mt-1 text-sm md:text-base">
          Click anywhere to pop emojis!
        </p>
      </div>

      {/* Emoji selector */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur rounded-2xl p-3 shadow-2xl max-w-[90vw]">
        <p className="text-xs text-gray-600 text-center mb-2 font-medium">
          Select your feeling
        </p>
        <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
          {EMOJI_OPTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`text-3xl md:text-4xl p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95 ${
                selectedEmoji === emoji
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg scale-110'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => popEmoji(selectedEmoji)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Pop
            {' '}
            {selectedEmoji}
          </button>
          <button
            onClick={() => {
              for (let i = 0; i < 10; i++) {
                setTimeout(() => popEmoji(selectedEmoji), i * 100)
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            🎉 Burst!
          </button>
        </div>
      </div>

      {/* Floating emojis container */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="absolute inset-0 cursor-pointer"
      >
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            className="absolute text-6xl md:text-8xl animate-float-up pointer-events-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animation: 'float-up 3s ease-out forwards',
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* CSS animation */}
      <style>
        {`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) scale(1) rotate(5deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-100px) scale(1.2) rotate(-5deg);
          }
          100% {
            transform: translateY(-200px) scale(0.8) rotate(10deg);
            opacity: 0;
          }
        }
      `}
      </style>
    </div>
  )
}
