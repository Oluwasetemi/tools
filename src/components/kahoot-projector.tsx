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

export function KahootProjector({ roomId, host = 'localhost:1999' }: KahootProjectorProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [players, setPlayers] = useState<Player[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [rankings, setRankings] = useState<Array<{ playerId: string, name: string, score: number }>>([])
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [connectionCount, setConnectionCount] = useState(0)

  useEffect(() => {
    // Request wake lock
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      }
      catch (err) {
        console.warn('Wake Lock request failed:', err)
      }
    }

    requestWakeLock()

    const ws = new PartySocket({
      host,
      room: roomId,
      party: 'kahoot',
    })

    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
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

        case 'connection_count':
          setConnectionCount(data.count)
          break
      }
    })

    setSocket(ws)

    return () => {
      ws.close()
      if (wakeLock !== null) {
        wakeLock.release()
      }
    }
  }, [roomId, host])

  const optionColors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-green-500',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
      {/* Waiting for game to start */}
      {gameState === 'waiting' && (
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8">Waiting for Game to Start...</h1>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-8 max-w-2xl">
            <p className="text-3xl text-white mb-6">
              Players Joined:
              {players.length}
            </p>
            <div className="space-y-3">
              {players.map(player => (
                <div
                  key={player.id}
                  className="bg-white/30 backdrop-blur px-6 py-4 rounded-xl text-white text-2xl font-medium"
                >
                  {player.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Question */}
      {gameState === 'question' && currentQuestion && (
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              {currentQuestion.question}
            </h2>
            <div className="flex justify-center gap-8 text-white text-2xl">
              <span>
                👥
                {answeredPlayers.size}
                {' '}
                /
                {players.length}
                {' '}
                answered
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`${optionColors[index]} text-white rounded-2xl p-12 text-center shadow-2xl transform hover:scale-105 transition-transform`}
              >
                <p className="text-4xl font-bold">{option}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {gameState === 'results' && currentQuestion && correctAnswer !== null && (
        <div className="w-full max-w-6xl">
          <h2 className="text-5xl font-bold text-white text-center mb-12">Results</h2>

          <div className="mb-12">
            <p className="text-3xl text-white text-center mb-6">Correct Answer:</p>
            <div className={`${optionColors[correctAnswer]} text-white rounded-2xl p-12 text-center shadow-2xl border-8 border-white`}>
              <p className="text-5xl font-bold">{currentQuestion.options[correctAnswer]}</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-2xl p-8">
            <h3 className="text-4xl font-bold text-white text-center mb-8">Top 5 Leaderboard</h3>
            <div className="space-y-4">
              {rankings.slice(0, 5).map((player, index) => (
                <div
                  key={player.playerId}
                  className={`bg-white/30 backdrop-blur px-8 py-6 rounded-xl flex justify-between items-center ${
                    index === 0 ? 'border-4 border-yellow-400' : ''
                  }`}
                >
                  <span className="flex items-center gap-6 text-white">
                    <span className="text-4xl font-bold w-16">
                      #
                      {index + 1}
                    </span>
                    <span className="text-3xl font-medium">{player.name}</span>
                  </span>
                  <span className="text-4xl font-bold text-yellow-300">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Ended */}
      {gameState === 'ended' && (
        <div className="w-full max-w-6xl">
          <h2 className="text-6xl font-bold text-white text-center mb-12">🏆 Game Over! 🏆</h2>

          <div className="bg-white/20 backdrop-blur rounded-2xl p-8">
            <h3 className="text-4xl font-bold text-white text-center mb-8">Final Rankings</h3>
            <div className="space-y-4">
              {rankings.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`px-8 py-6 rounded-xl flex justify-between items-center ${
                    index === 0
                      ? 'bg-yellow-400'
                      : index === 1
                        ? 'bg-gray-300'
                        : index === 2
                          ? 'bg-orange-300'
                          : 'bg-white/30 backdrop-blur'
                  }`}
                >
                  <span className="flex items-center gap-6">
                    <span className="text-4xl font-bold w-16">
                      #
                      {index + 1}
                    </span>
                    <span className="text-3xl font-medium">
                      {player.name}
                    </span>
                  </span>
                  <span className="text-4xl font-bold text-purple-600">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Room info footer */}
      <div className="fixed bottom-4 right-4 text-white/60 text-sm">
        Room:
        {' '}
        {roomId}
        {' '}
        | Connected:
        {' '}
        {connectionCount}
      </div>
    </div>
  )
}
