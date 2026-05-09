import { at, clamp } from '@setemiojo/utils'
import { Copy, Home } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useFeelingsSocket } from '@/hooks/use-feelings-socket'

interface EmojiStreamProps {
  roomId: string
  host?: string
  onCopyLink?: () => void
}

const EMOJI_OPTIONS = [
  '❤️', '💙', '💚', '💛', '💜', '🧡',
  '😊', '😂', '🥳', '😍', '🤩', '😎',
  '🔥', '⭐', '✨', '💫', '🌟', '💥',
  '👍', '👏', '🙌', '💪', '✌️', '🤘',
  '🎉', '🎊', '🎈', '🎁', '🏆', '🌈',
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

    let x = clamp(Math.random() * 100, 10, 90)
    let y = clamp(Math.random() * 100, 10, 90)

    if (clientX !== undefined && clientY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
      y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
    }

    socket.send(JSON.stringify({ type: 'emoji_pop', emoji, x, y }))
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget)
      popEmoji(selectedEmoji, e.clientX, e.clientY)
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
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#0A0A12]">
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) scale(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; transform: translateY(-20px) scale(1) rotate(5deg); }
          50%  { opacity: 1; transform: translateY(-100px) scale(1.2) rotate(-5deg); }
          100% { transform: translateY(-220px) scale(0.8) rotate(10deg); opacity: 0; }
        }
      `}</style>

      {/* Stage — click to pop */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="absolute inset-0 cursor-crosshair"
        aria-label="Click anywhere to pop emojis"
      >
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            className="absolute text-6xl md:text-7xl pointer-events-none select-none"
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

      {/* Top-left: brand + room */}
      <div className="absolute top-0 left-0 z-20 flex items-center gap-0">
        <div className="bg-[#F7F3EC] border-b-2 border-r-2 border-[#1A1008] px-3 py-2 flex items-center gap-2">
          <span className="f-display font-black text-[13px] tracking-tight text-[#1A1008]">
            TOOLS<span className="text-[#D4380D]">.</span>
          </span>
        </div>
        <div className="bg-[#6D28D9] border-b-2 border-r-2 border-[#1A1008] px-3 py-2">
          <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-white/70">Feeling Stream</span>
        </div>
      </div>

      {/* Top-right: connection count + copy */}
      <div className="absolute top-0 right-0 z-20 flex items-center gap-0">
        <div className="bg-[#F7F3EC] border-b-2 border-l-2 border-[#1A1008] px-3 py-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B3A] animate-pulse" />
          <span className="f-mono text-[10px] tracking-wider text-[#1A1008]/60">
            {connectionCount} online
          </span>
        </div>
        {onCopyLink && (
          <button
            onClick={onCopyLink}
            className="bg-[#F7F3EC] border-b-2 border-l-2 border-[#1A1008] px-3 py-2 flex items-center gap-1.5 hover:bg-[#1A1008] hover:text-white transition-colors group"
            title="Copy share link"
          >
            <Copy size={11} className="text-[#1A1008]/60 group-hover:text-white transition-colors" />
            <span className="f-mono text-[10px] tracking-wider text-[#1A1008]/60 group-hover:text-white transition-colors">
              Share
            </span>
          </button>
        )}
        <a
          href="/"
          className="bg-[#F7F3EC] border-b-2 border-l-2 border-[#1A1008] px-3 py-2 flex items-center hover:bg-[#1A1008] hover:text-white transition-colors group"
          title="Back to home"
        >
          <Home size={11} className="text-[#1A1008]/60 group-hover:text-white transition-colors" />
        </a>
      </div>

      {/* Center hint (fades after first interaction) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="text-center">
          <p className="f-mono text-[11px] tracking-[0.2em] uppercase text-white/20">
            Click anywhere to pop
          </p>
          <p className="f-mono text-[9px] tracking-wider text-white/10 mt-1">
            {selectedEmoji} selected
          </p>
        </div>
      </div>

      {/* Bottom control panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-[#F7F3EC] border-t-2 border-[#1A1008] p-4">
          {/* Emoji grid */}
          <p
            id="emoji-selector-label"
            className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 text-center mb-3"
          >
            Select feeling
          </p>
          <div
            role="radiogroup"
            aria-labelledby="emoji-selector-label"
            className="grid grid-cols-6 md:grid-cols-10 gap-1.5 mb-4"
          >
            {EMOJI_OPTIONS.map((emoji, index) => {
              const isSelected = selectedEmoji === emoji
              const isFocused = focusedIndex === index

              return (
                <button
                  key={emoji}
                  ref={(el) => { emojiButtonRefs.current[index] = el }}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Select ${emoji}`}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => handleEmojiSelect(emoji, index)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => handleKeyDown(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  className={[
                    'text-2xl md:text-3xl p-1 transition-all duration-100 border-2',
                    isSelected
                      ? 'border-[#6D28D9] bg-[#6D28D9]/[0.08] scale-110 shadow-[2px_2px_0_#6D28D9]'
                      : isFocused
                        ? 'border-[#0C3D6B] bg-white'
                        : 'border-transparent bg-transparent hover:border-[#1A1008]/20 hover:bg-white',
                  ].join(' ')}
                >
                  {emoji}
                </button>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => popEmoji(selectedEmoji)}
              className="flex-1 border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[11px] tracking-[0.12em] uppercase py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              Pop {selectedEmoji}
            </button>
            <button
              onClick={() => {
                for (let i = 0; i < 10; i++)
                  setTimeout(() => popEmoji(selectedEmoji), i * 80)
              }}
              className="border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              Burst!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
