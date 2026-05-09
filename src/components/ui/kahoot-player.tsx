import { Trophy } from 'lucide-react'
import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

interface Question {
  id: string
  question: string
  options: string[]
  timeLimit: number
  points: number
}

type GameState = 'waiting' | 'question' | 'results' | 'leaderboard' | 'ended'

type ServerMessage
  = | { type: 'game_started' }
    | { type: 'question_started', question: Question, timeRemaining: number }
    | { type: 'question_ended', correctAnswer: number, rankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'game_ended', finalRankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'game_state', state: GameState }
    | { type: 'error', message: string }

interface KahootPlayerProps {
  roomId: string
  playerName?: string
  host?: string
}

const OPTION_COLORS = [
  { bg: 'bg-[#D4380D]', border: 'border-[#D4380D]', label: 'A' },
  { bg: 'bg-[#1B6B3A]', border: 'border-[#1B6B3A]', label: 'B' },
  { bg: 'bg-[#0C3D6B]', border: 'border-[#0C3D6B]', label: 'C' },
  { bg: 'bg-[#6D28D9]', border: 'border-[#6D28D9]', label: 'D' },
]

export function KahootPlayer({ roomId, playerName: initialPlayerName, host = 'localhost:1999' }: KahootPlayerProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [playerName, setPlayerName] = useState(initialPlayerName || '')
  const [hasJoined, setHasJoined] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [myRank, setMyRank] = useState<{ rank: number, score: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen') } }
      catch {}
    }
    requestWakeLock()
    const onVisible = () => { if (document.visibilityState === 'visible' && !wakeLock) requestWakeLock() }
    document.addEventListener('visibilitychange', onVisible)

    const ws = new PartySocket({ host, room: roomId, party: 'kahoot' })
    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)
      switch (data.type) {
        case 'game_started': setGameState('question'); break
        case 'question_started':
          setCurrentQuestion(data.question)
          setSelectedAnswer(null)
          setHasAnswered(false)
          setCorrectAnswer(null)
          setGameState('question')
          break
        case 'question_ended':
          setCorrectAnswer(data.correctAnswer)
          setGameState('results')
          const myIdx = data.rankings.findIndex(r => r.playerId === ws.id)
          if (myIdx !== -1) setMyRank({ rank: myIdx + 1, score: data.rankings[myIdx]!.score })
          break
        case 'game_ended':
          const finalIdx = data.finalRankings.findIndex(r => r.playerId === ws.id)
          if (finalIdx !== -1) setMyRank({ rank: finalIdx + 1, score: data.finalRankings[finalIdx]!.score })
          setGameState('ended')
          break
        case 'game_state': setGameState(data.state); break
        case 'error': setError(data.message); break
      }
    })
    ws.addEventListener('open', () => {
      setError(null)
      if (initialPlayerName) {
        ws.send(JSON.stringify({ type: 'player_join', name: initialPlayerName }))
        setHasJoined(true)
      }
    })
    setSocket(ws)
    return () => {
      ws.close()
      document.removeEventListener('visibilitychange', onVisible)
      wakeLock?.release()
    }
  }, [roomId, host, initialPlayerName])

  const joinGame = () => {
    if (!socket || !playerName.trim()) { setError('Please enter your name'); return }
    socket.send(JSON.stringify({ type: 'player_join', name: playerName.trim() }))
    setHasJoined(true)
  }

  const submitAnswer = (index: number) => {
    if (!socket || !currentQuestion || hasAnswered) return
    setSelectedAnswer(index)
    setHasAnswered(true)
    socket.send(JSON.stringify({ type: 'player_answer', questionId: currentQuestion.id, answerIndex: index }))
  }

  // ── Join screen ───────────────────────────────────────────────────────────
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="h-1 bg-[#D4380D] mb-0" />
          <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-8">
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-2">Join Game</div>
            <h1 className="f-display font-black text-[28px] text-[#1A1008] mb-1 leading-tight">
              Kahoot<span className="text-[#D4380D]">.</span>
            </h1>
            <code className="f-mono text-[10px] text-[#1A1008]/35 tracking-[0.15em]">{roomId}</code>

            {error && (
              <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-3 py-2 mt-4 f-mono text-[11px] text-[#D4380D]">{error}</div>
            )}

            <div className="mt-6">
              <label className="block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-1.5">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinGame()}
                placeholder="Enter your name..."
                autoFocus
                className="w-full border-2 border-[#1A1008] bg-white px-3 py-2.5 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
              />
            </div>

            <button
              onClick={joinGame}
              className="mt-5 w-full border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[11px] tracking-[0.12em] uppercase py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              Join Game →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Waiting ───────────────────────────────────────────────────────────────
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-8 text-center">
            <div className="w-16 h-16 border-2 border-[#D4380D] bg-[#D4380D]/[0.08] mx-auto mb-5 flex items-center justify-center">
              <span className="f-display font-black text-[24px] text-[#D4380D]">{playerName.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="f-display font-black text-[22px] text-[#1A1008] mb-2">You're in!</h2>
            <p className="f-mono text-[12px] text-[#1A1008]/50 mb-6">{playerName}</p>
            <div className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1008]/30 animate-pulse">
              Waiting for host to start...
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Question ──────────────────────────────────────────────────────────────
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col p-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 pt-6">
          <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-5">
            <p className="f-display font-bold text-[18px] text-[#1A1008] text-center">{currentQuestion.question}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, i) => {
              const col = OPTION_COLORS[i]!
              const isSelected = selectedAnswer === i
              return (
                <button
                  key={i}
                  onClick={() => submitAnswer(i)}
                  disabled={hasAnswered}
                  className={`border-2 border-[#1A1008] p-5 text-center transition-all duration-150 ${
                    hasAnswered
                      ? isSelected ? `${col.bg} text-white` : 'bg-white text-[#1A1008]/30 cursor-default'
                      : `${col.bg} text-white shadow-[4px_4px_0_#1A1008] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]`
                  }`}
                >
                  <div className="f-mono text-[10px] tracking-[0.2em] uppercase opacity-70 mb-1">{col.label}</div>
                  <div className="f-mono text-[14px] font-bold">{option}</div>
                </button>
              )
            })}
          </div>

          {hasAnswered && (
            <div className="border-2 border-[#1A1008] bg-white p-4 text-center">
              <p className="f-mono text-[11px] tracking-[0.15em] uppercase text-[#1A1008]/40">Answer submitted — waiting for others...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (gameState === 'results' && currentQuestion && correctAnswer !== null) {
    const wasCorrect = selectedAnswer === correctAnswer
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-8 text-center">
            <div className={`text-5xl mb-4`}>{wasCorrect ? '✓' : '✗'}</div>
            <h2 className={`f-display font-black text-[28px] mb-3 ${wasCorrect ? 'text-[#1B6B3A]' : 'text-[#D4380D]'}`}>
              {wasCorrect ? 'Correct!' : 'Wrong!'}
            </h2>
            <p className="f-mono text-[11px] text-[#1A1008]/50 mb-1">Correct answer</p>
            <p className="f-mono text-[14px] text-[#1A1008] font-bold mb-6">{currentQuestion.options[correctAnswer]}</p>

            {myRank && (
              <div className="border-2 border-[#1A1008]/15 bg-[#F7F3EC] p-5">
                <p className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 mb-2">Your rank</p>
                <p className="f-display font-black text-[36px] text-[#D4380D]">#{myRank.rank}</p>
                <p className="f-mono text-[13px] text-[#1A1008]/60">{myRank.score} pts</p>
              </div>
            )}

            <p className="f-mono text-[10px] tracking-[0.15em] uppercase text-[#1A1008]/30 mt-5 animate-pulse">
              Next question coming...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Game ended ────────────────────────────────────────────────────────────
  if (gameState === 'ended') {
    const MEDALS = ['🥇', '🥈', '🥉']
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-8 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="f-display font-black text-[28px] text-[#1A1008] mb-6">
              Game Over<span className="text-[#D4380D]">.</span>
            </h2>

            {myRank && (
              <div className={`border-2 p-6 mb-6 ${myRank.rank <= 3 ? 'border-[#D4380D] bg-[#D4380D]/[0.06]' : 'border-[#1A1008]/15 bg-[#F7F3EC]'}`}>
                <p className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 mb-2">Your final rank</p>
                <p className="text-4xl mb-1">{MEDALS[myRank.rank - 1] ?? `#${myRank.rank}`}</p>
                <p className="f-display font-black text-[32px] text-[#D4380D]">#{myRank.rank}</p>
                <p className="f-mono text-[14px] text-[#1A1008]/60 mt-1">{myRank.score} points</p>
                {myRank.rank === 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Trophy size={16} className="text-[#D4380D]" />
                    <span className="f-mono text-[10px] tracking-[0.15em] uppercase text-[#D4380D]">You won!</span>
                    <Trophy size={16} className="text-[#D4380D]" />
                  </div>
                )}
              </div>
            )}

            <p className="f-mono text-[11px] text-[#1A1008]/40">Thanks for playing!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <div className="f-mono text-[11px] tracking-[0.15em] uppercase text-[#1A1008]/30 animate-pulse">Loading...</div>
    </div>
  )
}
