import { Trophy, Users } from 'lucide-react'
import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

interface Question {
  id: string
  question: string
  options: string[]
  timeLimit: number
  points: number
}

interface Player {
  id: string
  name: string
  score: number
}

type GameState = 'waiting' | 'question' | 'results' | 'leaderboard' | 'ended'

type ServerMessage
  = | { type: 'player_joined', player: Player }
    | { type: 'game_started' }
    | { type: 'question_started', question: Question, timeRemaining: number }
    | { type: 'question_ended', correctAnswer: number, rankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'game_ended', finalRankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'player_answered', playerId: string }
    | { type: 'game_state', state: GameState, players: Player[] }
    | { type: 'connection_count', count: number }

interface KahootProjectorProps {
  roomId: string
  host?: string
}

const OPTION_COLORS = [
  { bg: 'bg-[#D4380D]', label: 'A' },
  { bg: 'bg-[#1B6B3A]', label: 'B' },
  { bg: 'bg-[#0C3D6B]', label: 'C' },
  { bg: 'bg-[#6D28D9]', label: 'D' },
]

export function KahootProjector({ roomId, host = 'localhost:1999' }: KahootProjectorProps) {
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [players, setPlayers] = useState<Player[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [rankings, setRankings] = useState<Array<{ playerId: string, name: string, score: number }>>([])
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [connectionCount, setConnectionCount] = useState(0)

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen') }
      catch {}
    }
    requestWakeLock()

    const ws = new PartySocket({ host, room: roomId, party: 'kahoot' })
    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)
      switch (data.type) {
        case 'player_joined': setPlayers(prev => [...prev, data.player]); break
        case 'game_started': setGameState('question'); break
        case 'question_started':
          setCurrentQuestion(data.question)
          setCorrectAnswer(null)
          setAnsweredPlayers(new Set())
          setGameState('question')
          break
        case 'player_answered': setAnsweredPlayers(prev => new Set([...prev, data.playerId])); break
        case 'question_ended':
          setCorrectAnswer(data.correctAnswer)
          setRankings(data.rankings)
          setGameState('results')
          break
        case 'game_ended':
          setRankings(data.finalRankings)
          setGameState('ended')
          break
        case 'game_state': setGameState(data.state); setPlayers(data.players); break
        case 'connection_count': setConnectionCount(data.count); break
      }
    })
    return () => { ws.close(); wakeLock?.release() }
  }, [roomId, host])

  return (
    <div className="min-h-screen bg-[#1A1008] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b-2 border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="f-display font-black text-[18px] tracking-tight text-white">
            TOOLS<span className="text-[#D4380D]">.</span>
          </span>
          <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-white/30">Kahoot · Projector</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-white/30" />
            <span className="f-mono text-[11px] text-white/40">{players.length} players · {connectionCount} online</span>
          </div>
          <code className="f-mono text-[10px] text-white/25 border border-white/10 px-2 py-0.5">{roomId}</code>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">

        {/* Waiting */}
        {gameState === 'waiting' && (
          <div className="text-center max-w-3xl w-full">
            <div className="f-mono text-[11px] tracking-[0.3em] uppercase text-[#D4380D] mb-6 animate-pulse">Waiting for host to start</div>
            <h1 className="f-display font-black text-[64px] text-white leading-none mb-12">
              Kahoot<span className="text-[#D4380D]">.</span>
            </h1>
            {players.length > 0
              ? (
                  <div className="border-2 border-white/10 bg-white/5 p-6">
                    <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-white/30 mb-4">{players.length} players joined</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {players.map(p => (
                        <span key={p.id} className="border border-white/15 bg-white/5 f-mono text-[14px] text-white px-4 py-2">{p.name}</span>
                      ))}
                    </div>
                  </div>
                )
              : (
                  <p className="f-mono text-[14px] text-white/25 tracking-[0.1em]">Share the player link — players will appear here</p>
                )}
          </div>
        )}

        {/* Question */}
        {gameState === 'question' && currentQuestion && (
          <div className="w-full max-w-5xl">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Users size={16} className="text-white/40" />
                <span className="f-mono text-[14px] text-white/40">{answeredPlayers.size} / {players.length} answered</span>
              </div>
              <h2 className="f-display font-black text-[48px] md:text-[56px] text-white leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => {
                const col = OPTION_COLORS[i]!
                return (
                  <div key={i} className={`${col.bg} border-2 border-white/20 p-8 flex items-center gap-6`}>
                    <span className="f-mono text-[24px] font-black text-white/60">{col.label}</span>
                    <p className="f-display font-bold text-[28px] text-white leading-tight">{option}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {gameState === 'results' && currentQuestion && correctAnswer !== null && (
          <div className="w-full max-w-4xl">
            <h2 className="f-display font-black text-[48px] text-white text-center mb-10">Results</h2>

            <div className={`${OPTION_COLORS[correctAnswer]?.bg} border-2 border-white/20 p-8 text-center mb-8`}>
              <p className="f-mono text-[11px] tracking-[0.25em] uppercase text-white/60 mb-3">Correct Answer</p>
              <p className="f-display font-black text-[40px] text-white">{currentQuestion.options[correctAnswer]}</p>
            </div>

            <div className="border-2 border-white/10 bg-white/5 p-6">
              <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-white/30 mb-4">Top 5</div>
              <div className="space-y-3">
                {rankings.slice(0, 5).map((p, i) => (
                  <div key={p.playerId} className="flex items-center gap-4 border border-white/10 bg-white/5 px-6 py-4">
                    <span className="f-mono text-[20px] font-black text-white/30 w-10">#{i + 1}</span>
                    <span className="f-mono text-[22px] text-white flex-1">{p.name}</span>
                    <span className="f-display font-black text-[24px] text-[#D4380D]">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game ended */}
        {gameState === 'ended' && (
          <div className="w-full max-w-4xl">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-4 text-[#D4380D] mb-4">
                <Trophy size={40} />
                <h2 className="f-display font-black text-[56px] text-white">
                  Game Over<span className="text-[#D4380D]">.</span>
                </h2>
                <Trophy size={40} />
              </div>
              <p className="f-mono text-[11px] tracking-[0.25em] uppercase text-white/30">Final Rankings</p>
            </div>

            <div className="space-y-3">
              {rankings.map((p, i) => {
                const MEDALS = ['🥇', '🥈', '🥉']
                const isTop = i < 3
                return (
                  <div
                    key={p.playerId}
                    className={`flex items-center gap-4 border-2 px-6 py-5 ${isTop ? 'border-[#D4380D]/50 bg-[#D4380D]/[0.08]' : 'border-white/10 bg-white/5'}`}
                  >
                    <span className="text-[32px] w-12">{MEDALS[i] ?? `#${i + 1}`}</span>
                    <span className="f-mono text-[24px] text-white flex-1">{p.name}</span>
                    <span className="f-display font-black text-[28px] text-[#D4380D]">{p.score}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
