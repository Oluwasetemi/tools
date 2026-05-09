import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Trophy } from 'lucide-react'

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

export function KahootPlayer({
  roomId,
  playerName: initialPlayerName,
  host = 'localhost:1999',
}: KahootPlayerProps) {
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
    // Request wake lock to keep screen on during game
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
          console.log('Screen Wake Lock activated')

          wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock released')
          })
        }
      }
      catch (err) {
        console.warn('Wake Lock request failed:', err)
      }
    }

    requestWakeLock()

    // Re-request wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wakeLock === null) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const ws = new PartySocket({
      host,
      room: roomId,
      party: 'kahoot',
    })

    ws.addEventListener('message', (event) => {
      const data: ServerMessage = JSON.parse(event.data)

      switch (data.type) {
        case 'game_started':
          setGameState('question')
          break

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
          // Find my rank
          const myIndex = data.rankings.findIndex(r => r.playerId === ws.id)
          if (myIndex !== -1) {
            setMyRank({
              rank: myIndex + 1,
              score: data.rankings[myIndex].score,
            })
          }
          break

        case 'game_ended':
          const finalIndex = data.finalRankings.findIndex(r => r.playerId === ws.id)
          if (finalIndex !== -1) {
            setMyRank({
              rank: finalIndex + 1,
              score: data.finalRankings[finalIndex].score,
            })
          }
          setGameState('ended')
          break

        case 'game_state':
          setGameState(data.state)
          break

        case 'error':
          setError(data.message)
          break
      }
    })

    ws.addEventListener('open', () => {
      console.log('Connected to Kahoot server')
      setError(null)

      // Auto-join if playerName is provided
      if (initialPlayerName) {
        ws.send(
          JSON.stringify({
            type: 'player_join',
            name: initialPlayerName,
          }),
        )
        setHasJoined(true)
      }
    })

    setSocket(ws)

    return () => {
      ws.close()
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Release wake lock on cleanup
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          console.log('Screen Wake Lock released on cleanup')
        })
      }
    }
  }, [roomId, host, initialPlayerName])

  const joinGame = () => {
    if (!socket || !playerName.trim()) {
      setError('Please enter your name')
      return
    }

    socket.send(
      JSON.stringify({
        type: 'player_join',
        name: playerName.trim(),
      }),
    )

    setHasJoined(true)
  }

  const submitAnswer = (answerIndex: number) => {
    if (!socket || !currentQuestion || hasAnswered)
      return

    setSelectedAnswer(answerIndex)
    setHasAnswered(true)

    socket.send(
      JSON.stringify({
        type: 'player_answer',
        questionId: currentQuestion.id,
        answerIndex,
      }),
    )
  }

  const optionColors = [
    'bg-red-500 hover:bg-red-600',
    'bg-blue-500 hover:bg-blue-600',
    'bg-yellow-500 hover:bg-yellow-600',
    'bg-green-500 hover:bg-green-600',
  ]

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2">Join Game</h1>
          <p className="text-center text-gray-600 mb-6">
            Room:
            {' '}
            <span className="font-mono font-bold">{roomId}</span>
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <Input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && joinGame()}
              placeholder="Enter your name..."
              autoFocus
            />
          </div>

          <Button
            onClick={joinGame}
            color="purple"
            className="w-full text-lg"
          >
            Join Game
          </Button>
        </div>
      </div>
    )
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white font-bold">
                {playerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome,
              {playerName}
              !
            </h2>
            <p className="text-gray-600">Waiting for the game to start...</p>
          </div>

          <div className="animate-pulse">
            <div className="h-2 bg-purple-200 rounded mb-2"></div>
            <div className="h-2 bg-purple-300 rounded mb-2"></div>
            <div className="h-2 bg-purple-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-purple-600 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-center mb-8">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => submitAnswer(index)}
                  disabled={hasAnswered}
                  className={`${
                    optionColors[index]
                  } text-white rounded-lg p-8 text-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedAnswer === index ? 'ring-4 ring-white scale-105' : ''
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {hasAnswered && (
              <p className="text-center text-gray-600 mt-6 text-lg">
                Answer submitted! Waiting for others...
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'results' && currentQuestion && correctAnswer !== null) {
    const wasCorrect = selectedAnswer === correctAnswer

    return (
      <div className="min-h-screen bg-purple-600 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div
            className={`text-center mb-8 ${
              wasCorrect ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <h2 className="text-4xl font-bold mb-2">
              {wasCorrect ? 'Correct!' : 'Wrong!'}
            </h2>
            <p className="text-xl">
              The correct answer was:
              {' '}
              <span className="font-bold">{currentQuestion.options[correctAnswer]}</span>
            </p>
          </div>

          {myRank && (
            <div className="bg-purple-100 rounded-lg p-6 text-center">
              <p className="text-gray-700 mb-2">Your current rank</p>
              <p className="text-5xl font-bold text-purple-600 mb-2">
                #
                {myRank.rank}
              </p>
              <p className="text-2xl font-semibold">
                {myRank.score}
                {' '}
                points
              </p>
            </div>
          )}

          <p className="text-center text-gray-600 mt-6">
            Get ready for the next question...
          </p>
        </div>
      </div>
    )
  }

  if (gameState === 'ended') {
    return (
      <div className="min-h-screen bg-purple-600 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Game Over!</h2>

          {myRank && (
            <div className="mb-6">
              <div
                className={`rounded-lg p-8 mb-4 ${
                  myRank.rank === 1
                    ? 'bg-yellow-100 border-4 border-yellow-500'
                    : myRank.rank === 2
                      ? 'bg-gray-200 border-4 border-gray-400'
                      : myRank.rank === 3
                        ? 'bg-orange-100 border-4 border-orange-500'
                        : 'bg-purple-100'
                }`}
              >
                <p className="text-gray-700 mb-2">Your final rank</p>
                <p className="text-6xl font-bold text-purple-600 mb-2">
                  #
                  {myRank.rank}
                </p>
                <p className="text-3xl font-semibold">
                  {myRank.score}
                  {' '}
                  points
                </p>
              </div>

              {myRank.rank === 1 && (
                <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-3">
                  <Trophy className="size-8" />
                  Congratulations! You won!
                  <Trophy className="size-8" />
                </p>
              )}
            </div>
          )}

          <p className="text-gray-600">Thanks for playing!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
