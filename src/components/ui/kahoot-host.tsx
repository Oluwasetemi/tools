import { Check, Monitor, Plus, Trash2 } from 'lucide-react'
import usePartySocket from 'partysocket/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createKahootGame } from '@/server/kahoot'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
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
  = | { type: 'game_created', gameId: string }
    | { type: 'player_joined', player: Player }
    | { type: 'game_started' }
    | { type: 'question_started', question: Omit<Question, 'correctAnswer'>, timeRemaining: number }
    | { type: 'question_ended', correctAnswer: number, rankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'game_ended', finalRankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'player_answered', playerId: string }
    | { type: 'game_state', state: GameState, players: Player[] }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }

interface KahootHostProps {
  roomId: string
  host?: string
}

const OPTION_COLORS = [
  { bg: 'bg-[#D4380D]/10', border: 'border-[#D4380D]', label: 'A' },
  { bg: 'bg-[#1B6B3A]/10', border: 'border-[#1B6B3A]', label: 'B' },
  { bg: 'bg-[#0C3D6B]/10', border: 'border-[#0C3D6B]', label: 'C' },
  { bg: 'bg-[#6D28D9]/10', border: 'border-[#6D28D9]', label: 'D' },
]

const inputCls = 'w-full border-2 border-[#1A1008] bg-white px-3 py-2 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow'
const labelCls = 'block f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/50 mb-1.5'
const pressBtnCls = 'border-2 border-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none'

export function KahootHost({ roomId, host = 'localhost:1999' }: KahootHostProps) {
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [players, setPlayers] = useState<Player[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<Question, 'correctAnswer'> | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [rankings, setRankings] = useState<Array<{ playerId: string, name: string, score: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [gameCreated, setGameCreated] = useState(false)
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const [gameName, setGameName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30, points: 1000 },
  ])

  const lastQuestionCount = useRef(questions.length)

  const socket = usePartySocket({
    host,
    room: roomId,
    party: 'kahoot',
    onMessage(event: MessageEvent) {
      if (typeof event.data !== 'string') return
      const data: ServerMessage = JSON.parse(event.data)
      switch (data.type) {
        case 'game_created':
          setGameCreated(true)
          setGameState('waiting')
          setError(null)
          break
        case 'player_joined':
          setPlayers(prev => [...prev, data.player])
          break
        case 'game_started':
          setGameState('question')
          break
        case 'question_started':
          setCurrentQuestion(data.question)
          setCorrectAnswer(null)
          setAnsweredPlayers(new Set())
          setGameState('question')
          break
        case 'player_answered':
          setAnsweredPlayers(prev => new Set([...prev, data.playerId]))
          break
        case 'question_ended':
          setCorrectAnswer(data.correctAnswer)
          setRankings(data.rankings)
          setPlayers(prev => prev.map((p) => {
            const r = data.rankings.find(r => r.playerId === p.id)
            return r ? { ...p, score: r.score } : p
          }))
          setGameState('results')
          break
        case 'game_ended':
          setRankings(data.finalRankings)
          setGameState('ended')
          break
        case 'game_state':
          setGameState(data.state)
          setPlayers(data.players)
          break
        case 'error':
          setError(data.message)
          break
      }
    },
    onOpen() { setError(null) },
    onError() { setError('Connection error') },
  })

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
          wakeLock.addEventListener('release', () => { wakeLock = null })
        }
      }
      catch {}
    }
    requestWakeLock()
    const onVisible = () => { if (document.visibilityState === 'visible' && !wakeLock) requestWakeLock() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      wakeLock?.release()
    }
  }, [])

  const createGame = async () => {
    if (!socket || !gameName) { setError('Please enter a game name'); return }
    const valid = questions.filter(q => q.question && q.options.every(o => o.trim()))
    if (valid.length === 0) { setError('Please add at least one complete question'); return }
    socket.send(JSON.stringify({ type: 'host_create', name: gameName, questions: valid }))
    try {
      await createKahootGame({ roomId, gameName, questions: valid.map(q => ({ question: q.question, options: q.options, correctAnswer: q.correctAnswer, timeLimit: q.timeLimit, points: q.points })) })
      toast.success('Game saved')
    }
    catch { toast.error('Game created but not saved to DB') }
  }

  const startGame = () => socket?.send(JSON.stringify({ type: 'host_start' }))
  const nextQuestion = () => socket?.send(JSON.stringify({ type: 'host_next_question' }))
  const restartGame = () => socket?.send(JSON.stringify({ type: 'host_restart_game' }))
  const openProjector = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/party/kahoot-projector?room=${roomId}`
    window.open(url, '_blank', 'width=1920,height=1080')
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30, points: 1000 }])
  }

  const updateQuestion = (index: number, field: keyof Question, value: unknown) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const options = [...q.options]
      options[optIndex] = value
      return { ...q, options }
    }))
  }

  const removeQuestion = (index: number) => setQuestions(prev => prev.filter((_, i) => i !== index))

  const questionRefCallback = (node: HTMLDivElement | null, index: number) => {
    if (node && index === questions.length - 1 && questions.length > lastQuestionCount.current) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const input = node.querySelector('input[type="text"]') as HTMLInputElement
      if (input) setTimeout(() => input.focus(), 300)
      lastQuestionCount.current = questions.length
    }
  }

  // ── Error banner ──────────────────────────────────────────────────────────
  const ErrorBanner = error
    ? (
        <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-3 mb-6 f-mono text-[12px] text-[#D4380D]">
          {error}
        </div>
      )
    : null

  // ── GAME CREATION FORM ───────────────────────────────────────────────────
  if (!gameCreated) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); createGame() }} className="space-y-0">
        {ErrorBanner}

        {/* Game name */}
        <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6 mb-6">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-4">Game Settings</div>
          <label className={labelCls}>Game Name</label>
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            placeholder="e.g. JavaScript Fundamentals Quiz"
            required
            className={inputCls}
          />
        </div>

        {/* Questions */}
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            ref={node => questionRefCallback(node, qIndex)}
            className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6 mb-4"
          >
            {/* Question header */}
            <div className="flex items-center justify-between mb-5">
              <span className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D]">
                Question {qIndex + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="flex items-center gap-1 f-mono text-[9px] tracking-[0.1em] uppercase text-[#D4380D] hover:underline"
                >
                  <Trash2 size={10} />
                  Remove
                </button>
              )}
            </div>

            {/* Question text */}
            <div className="mb-5">
              <label className={labelCls}>Question</label>
              <input
                type="text"
                value={q.question}
                onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                placeholder="Enter your question..."
                required
                className={inputCls}
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {q.options.map((opt, optIndex) => {
                const col = OPTION_COLORS[optIndex]!
                const isCorrect = q.correctAnswer === optIndex
                return (
                  <div key={optIndex} className={`border-2 p-3 transition-colors ${isCorrect ? `${col.border} ${col.bg}` : 'border-[#1A1008]/20 bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`f-mono text-[9px] tracking-[0.2em] uppercase font-bold ${isCorrect ? 'text-[#1A1008]' : 'text-[#1A1008]/40'}`}>
                        {col.label}
                      </span>
                      {isCorrect && (
                        <span className="f-mono text-[8px] tracking-[0.15em] uppercase text-[#1B6B3A]">correct</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(qIndex, optIndex, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                      required
                      className="w-full bg-transparent f-mono text-[12px] text-[#1A1008] placeholder:text-[#1A1008]/25 outline-none"
                    />
                  </div>
                )
              })}
            </div>

            {/* Settings row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1A1008]/10">
              <div>
                <label className={labelCls}>Correct Answer</label>
                <select
                  value={q.correctAnswer.toString()}
                  onChange={e => updateQuestion(qIndex, 'correctAnswer', Number(e.target.value))}
                  className={inputCls}
                >
                  {q.options.map((_, i) => (
                    <option key={i} value={i.toString()}>Option {i + 1} ({OPTION_COLORS[i]?.label})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Time Limit (sec)</label>
                <input
                  type="number"
                  value={q.timeLimit}
                  onChange={e => updateQuestion(qIndex, 'timeLimit', Number(e.target.value))}
                  min="5"
                  max="120"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Points</label>
                <input
                  type="number"
                  value={q.points}
                  onChange={e => updateQuestion(qIndex, 'points', Number(e.target.value))}
                  min="100"
                  step="100"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={addQuestion}
            className={`${pressBtnCls} bg-white text-[#1A1008] flex items-center gap-1.5`}
          >
            <Plus size={11} />
            Add Question
          </button>
          <button
            type="submit"
            className={`${pressBtnCls} bg-[#D4380D] text-white`}
          >
            Create Game →
          </button>
        </div>
      </form>
    )
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────
  if (gameState === 'waiting') {
    return (
      <div className="space-y-4">
        {ErrorBanner}

        <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-1">Lobby</div>
              <h2 className="f-display font-black text-[22px] text-[#1A1008] leading-tight">
                Waiting for Players
              </h2>
            </div>
            <div className="text-right">
              <div className="f-mono text-[32px] font-black text-[#1A1008] leading-none">{players.length}</div>
              <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40">joined</div>
            </div>
          </div>

          {players.length > 0
            ? (
                <div className="space-y-1.5 mb-6">
                  {players.map((player, i) => (
                    <div key={player.id} className="flex items-center gap-3 border border-[#1A1008]/10 bg-[#F7F3EC] px-4 py-2.5">
                      <span className="f-mono text-[9px] text-[#1A1008]/30 w-5">{i + 1}</span>
                      <span className="f-mono text-[13px] text-[#1A1008]">{player.name}</span>
                    </div>
                  ))}
                </div>
              )
            : (
                <div className="border-2 border-dashed border-[#1A1008]/15 p-8 text-center mb-6">
                  <p className="f-mono text-[11px] text-[#1A1008]/35">Share the player link above — players will appear here</p>
                </div>
              )}

          <div className="flex gap-3">
            <button
              onClick={startGame}
              disabled={players.length === 0}
              className={`${pressBtnCls} bg-[#D4380D] text-white flex-1`}
            >
              Start Game →
            </button>
            <button
              onClick={openProjector}
              className={`${pressBtnCls} bg-white text-[#1A1008] flex items-center gap-1.5`}
            >
              <Monitor size={11} />
              Projector
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUESTION IN PROGRESS ──────────────────────────────────────────────────
  if (gameState === 'question' && currentQuestion) {
    const allAnswered = answeredPlayers.size === players.length && players.length > 0
    return (
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex border-2 border-[#1A1008]">
          <button
            onClick={() => setShowLeaderboard(false)}
            className={`flex-1 f-mono text-[10px] tracking-[0.12em] uppercase py-2.5 transition-colors ${!showLeaderboard ? 'bg-[#D4380D] text-white' : 'bg-white text-[#1A1008] hover:bg-[#F7F3EC]'}`}
          >
            Question
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className={`flex-1 f-mono text-[10px] tracking-[0.12em] uppercase py-2.5 border-l-2 border-[#1A1008] transition-colors ${showLeaderboard ? 'bg-[#D4380D] text-white' : 'bg-white text-[#1A1008] hover:bg-[#F7F3EC]'}`}
          >
            Live Leaderboard
          </button>
        </div>

        {!showLeaderboard
          ? (
              <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
                <p className="f-display font-bold text-[18px] text-[#1A1008] mb-5">{currentQuestion.question}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {currentQuestion.options.map((option, i) => {
                    const col = OPTION_COLORS[i]!
                    return (
                      <div key={i} className={`border-2 ${col.border} ${col.bg} px-4 py-3 flex items-center gap-3`}>
                        <span className="f-mono text-[10px] font-black text-[#1A1008]/50">{col.label}</span>
                        <span className="f-mono text-[13px] text-[#1A1008]">{option}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-[#1A1008]/10 pt-4 flex items-center justify-between">
                  <div>
                    <span className="f-mono text-[20px] font-black text-[#1A1008]">{answeredPlayers.size}</span>
                    <span className="f-mono text-[12px] text-[#1A1008]/40"> / {players.length} answered</span>
                    {allAnswered && <span className="ml-3 f-mono text-[10px] text-[#1B6B3A] tracking-[0.1em] uppercase">all done!</span>}
                  </div>
                  <button onClick={nextQuestion} className={`${pressBtnCls} bg-[#D4380D] text-white`}>
                    {allAnswered ? 'Show Results →' : 'Skip to Results'}
                  </button>
                </div>
              </div>
            )
          : (
              <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1A1008]/10">
                  <span className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/40">Live Rankings</span>
                  <span className="f-mono text-[11px] text-[#1A1008]">{answeredPlayers.size} / {players.length} answered</span>
                </div>
                <div className="space-y-1.5 mb-5">
                  {[...players].sort((a, b) => b.score - a.score).map((player, i) => {
                    const done = answeredPlayers.has(player.id)
                    return (
                      <div key={player.id} className={`flex items-center gap-3 px-4 py-3 border-2 transition-colors ${done ? 'border-[#1B6B3A] bg-[#1B6B3A]/[0.06]' : 'border-[#1A1008]/15 bg-[#F7F3EC]'}`}>
                        <span className="f-mono text-[11px] text-[#1A1008]/40 w-6">#{i + 1}</span>
                        <span className="f-mono text-[13px] text-[#1A1008] flex-1">{player.name}</span>
                        {done && <Check size={12} className="text-[#1B6B3A]" />}
                        <span className="f-mono text-[13px] font-black text-[#D4380D]">{player.score}</span>
                      </div>
                    )
                  })}
                </div>
                <button onClick={nextQuestion} className={`${pressBtnCls} bg-[#D4380D] text-white w-full`}>
                  {allAnswered ? 'Show Results →' : 'Skip to Results'}
                </button>
              </div>
            )}
      </div>
    )
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (gameState === 'results' && currentQuestion && correctAnswer !== null) {
    return (
      <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6 space-y-5">
        <div>
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-3">Correct Answer</div>
          <div className="border-2 border-[#1B6B3A] bg-[#1B6B3A]/[0.08] px-4 py-3 flex items-center gap-3">
            <Check size={14} className="text-[#1B6B3A] shrink-0" />
            <span className="f-display font-bold text-[16px] text-[#1A1008]">
              {OPTION_COLORS[correctAnswer]?.label} — {currentQuestion.options[correctAnswer]}
            </span>
          </div>
        </div>

        <div>
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/40 mb-3">Top 5</div>
          <div className="space-y-1.5">
            {rankings.slice(0, 5).map((player, i) => (
              <div key={player.playerId} className="flex items-center gap-3 border border-[#1A1008]/10 bg-[#F7F3EC] px-4 py-2.5">
                <span className="f-mono text-[11px] text-[#1A1008]/35 w-6">#{i + 1}</span>
                <span className="f-mono text-[13px] text-[#1A1008] flex-1">{player.name}</span>
                <span className="f-mono text-[13px] font-black text-[#D4380D]">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={nextQuestion} className={`${pressBtnCls} bg-[#D4380D] text-white w-full`}>
          Next Question →
        </button>
      </div>
    )
  }

  // ── GAME ENDED ────────────────────────────────────────────────────────────
  if (gameState === 'ended') {
    const MEDALS = ['🥇', '🥈', '🥉']
    return (
      <div className="border-2 border-[#1A1008] bg-white shadow-[4px_4px_0_#1A1008] p-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="f-display font-black text-[32px] text-[#1A1008] leading-tight">
            Game Over<span className="text-[#D4380D]">.</span>
          </h2>
          <p className="f-mono text-[11px] text-[#1A1008]/40 mt-1 tracking-[0.15em] uppercase">Final Rankings</p>
        </div>

        <div className="space-y-2 mb-8">
          {rankings.map((player, i) => (
            <div
              key={player.playerId}
              className={`flex items-center gap-3 border-2 px-4 py-3 ${i === 0 ? 'border-[#D4380D] bg-[#D4380D]/[0.06]' : 'border-[#1A1008]/15 bg-[#F7F3EC]'}`}
            >
              <span className="text-lg w-8">{MEDALS[i] ?? `#${i + 1}`}</span>
              <span className="f-mono text-[14px] text-[#1A1008] flex-1">{player.name}</span>
              <span className="f-mono text-[16px] font-black text-[#D4380D]">{player.score}</span>
            </div>
          ))}
        </div>

        <button onClick={restartGame} className={`${pressBtnCls} bg-[#D4380D] text-white w-full`}>
          Play Again
        </button>
      </div>
    )
  }

  return null
}
