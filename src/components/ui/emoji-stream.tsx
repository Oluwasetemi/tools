import { at, clamp } from '@setemiojo/utils'
import { Copy } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/button'
import { useFeelingsSocket } from '@/hooks/use-feelings-socket'

interface EmojiStreamProps {
  roomId: string
  host?: string
  onCopyLink?: () => void
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

export function EmojiStream({ roomId, host = 'localhost:1999', onCopyLink }: EmojiStreamProps) {
  const { socket, floatingEmojis, connectionCount } = useFeelingsSocket(roomId, host)
  const [selectedEmoji, setSelectedEmoji] = useState<string>(at(EMOJI_OPTIONS, 0))
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRefs = useRef<(HTMLElement | null)[]>([])

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
    if (e.target === e.currentTarget) {
      popEmoji(selectedEmoji, e.clientX, e.clientY)
    }
  }

  const handleEmojiSelect = useCallback((emoji: string, index: number) => {
    setSelectedEmoji(emoji)
    setFocusedIndex(index)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, index: number) => {
    const cols = window.innerWidth >= 768 ? 10 : 6
    const total = EMOJI_OPTIONS.length
    let newIndex = index

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        newIndex = (index + 1) % total
        break
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = index === 0 ? total - 1 : index - 1
        break
      case 'ArrowDown': {
        e.preventDefault()
        const nextRowIndex = index + cols
        newIndex = nextRowIndex < total ? nextRowIndex : index % cols
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prevRowIndex = index - cols
        if (prevRowIndex >= 0) {
          newIndex = prevRowIndex
        }
        else {
          const currentCol = index % cols
          const lastRowStart = Math.floor((total - 1) / cols) * cols
          const lastRowItemInCol = lastRowStart + currentCol
          newIndex = lastRowItemInCol < total ? lastRowItemInCol : total - 1
        }
        break
      }
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = total - 1
        break
      case ' ':
      case 'Enter':
        e.preventDefault()
        handleEmojiSelect(EMOJI_OPTIONS[index]!, index)
        return
      default:
        return
    }

    setFocusedIndex(newIndex)
    emojiButtonRefs.current[newIndex]?.focus()
  }, [handleEmojiSelect])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 relative overflow-hidden">
      <div className="fixed top-20 right-4 bg-white/90 backdrop-blur rounded-l-lg px-4 py-2 shadow-lg z-30">

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
        <Button
          className="flex items-center gap-2 rounded-r-lg text-black z-30"
          onClick={onCopyLink}
          plain
          style={{ cursor: 'copy' }}
        >
          <Copy className="size-4 text-black" />
          <span className="text-black">Copy Link</span>
        </Button>
      </div>

      <div className="absolute top-4 left-4 z-20">
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          Feeling Stream 💭
        </h1>
        <p className="text-white/90 mt-1 text-sm md:text-base">
          Click anywhere to pop emojis!
        </p>
      </div>

      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur rounded-2xl p-3 shadow-2xl max-w-[90vw]">
        <p className="text-xs text-gray-600 text-center mb-2 font-medium" id="emoji-selector-label">
          Select your feeling
        </p>
        <div
          role="radiogroup"
          aria-labelledby="emoji-selector-label"
          className="grid grid-cols-6 md:grid-cols-10 gap-2"
        >
          {EMOJI_OPTIONS.map((emoji, index) => {
            const isSelected = selectedEmoji === emoji
            const isFocused = focusedIndex === index

            return (
              <Button
                key={emoji}
                ref={(el) => {
                  emojiButtonRefs.current[index] = el
                }}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Select ${emoji} emoji`}
                tabIndex={isFocused ? 0 : -1}
                onClick={() => handleEmojiSelect(emoji, index)}
                onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => handleKeyDown(e, index)}
                onFocus={() => setFocusedIndex(index)}
                {...(isSelected
                  ? { color: 'purple' as const }
                  : { plain: true })}
                className={`text-3xl md:text-4xl transition-all ${
                  isSelected
                    ? 'shadow-lg scale-110 ring-2 ring-purple-500 ring-offset-2'
                    : ''
                } ${
                  isFocused && !isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : ''
                }`}
              >
                {emoji}
              </Button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => popEmoji(selectedEmoji)}
            color="purple"
            className="flex-1"
          >
            Pop
            {' '}
            {selectedEmoji}
          </Button>
          <Button
            onClick={() => {
              for (let i = 0; i < 10; i++) {
                setTimeout(() => popEmoji(selectedEmoji), i * 100)
              }
            }}
            color="orange"
          >
            🎉 Burst! 
          </Button>
        </div>
      </div>

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
