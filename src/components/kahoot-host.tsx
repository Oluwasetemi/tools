import PartySocket from 'partysocket'
import { useEffect, useState } from 'react'

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

export function KahootHost({ roomId, host = 'localhost:1999' }: KahootHostProps) {
  const [socket, setSocket] = useState<PartySocket | null>(null)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [players, setPlayers] = useState<Player[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<Question, 'correctAnswer'> | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null)
  const [rankings, setRankings] = useState<Array<{ playerId: string, name: string, score: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [gameCreated, setGameCreated] = useState(false)
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Form state
  const [gameName, setGameName] = useState('')
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 30,
      points: 1000,
    },
  ])

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
          // Update players with new scores from rankings
          setPlayers(prevPlayers =>
            prevPlayers.map((player) => {
              const ranking = data.rankings.find(r => r.playerId === player.id)
              return ranking ? { ...player, score: ranking.score } : player
            }),
          )
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
    })

    ws.addEventListener('open', () => {
      console.log('Connected to Kahoot server')
      setError(null)
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
  }, [roomId, host])

  const createGame = () => {
    if (!socket || !gameName) {
      setError('Please enter a game name')
      return
    }

    const validQuestions = questions.filter(
      q => q.question && q.options.every(opt => opt.trim()),
    )

    if (validQuestions.length === 0) {
      setError('Please add at least one complete question')
      return
    }

    socket.send(
      JSON.stringify({
        type: 'host_create',
        name: gameName,
        questions: validQuestions,
      }),
    )
  }

  const startGame = () => {
    if (!socket)
      return
    socket.send(JSON.stringify({ type: 'host_start' }))
  }

  const nextQuestion = () => {
    if (!socket)
      return
    socket.send(JSON.stringify({ type: 'host_next_question' }))
  }

  const endGame = () => {
    if (!socket)
      return
    socket.send(JSON.stringify({ type: 'host_end_game' }))
  }

  const restartGame = () => {
    if (!socket)
      return
    socket.send(JSON.stringify({ type: 'host_restart_game' }))
  }

  const openProjector = () => {
    const projectorUrl = `${window.location.origin}/demo/party/kahoot-projector?room=${roomId}`
    window.open(projectorUrl, '_blank', 'width=1920,height=1080')
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 30,
        points: 1000,
      },
    ])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options[optIndex] = value
    setQuestions(newQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  if (!gameCreated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Create Kahoot Game</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Game Name
          </label>
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter game name..."
          />
        </div>

        <div className="space-y-6 mb-6">
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Question
                  {qIndex + 1}
                </h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your question..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {question.options.map((option, optIndex) => (
                  <div key={optIndex}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option
                      {' '}
                      {optIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={e => updateOption(qIndex, optIndex, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        question.correctAnswer === optIndex
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                      placeholder={`Option ${optIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer
                  </label>
                  <select
                    value={question.correctAnswer}
                    onChange={e =>
                      updateQuestion(qIndex, 'correctAnswer', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {question.options.map((_, i) => (
                      <option key={i} value={i}>
                        Option
                        {' '}
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limit (s)
                  </label>
                  <input
                    type="number"
                    value={question.timeLimit}
                    onChange={e =>
                      updateQuestion(qIndex, 'timeLimit', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="5"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={e =>
                      updateQuestion(qIndex, 'points', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="100"
                    step="100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={addQuestion}
            className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-medium"
          >
            Add Question
          </button>
          <button
            onClick={createGame}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Create Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Host Dashboard</h1>
          <p className="text-gray-600">
            Room Code:
            <span className="font-mono font-bold text-lg">{roomId}</span>
          </p>
        </div>
        <button
          onClick={openProjector}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg transition-all hover:scale-105"
          title="Open projector view in new window"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Open Projector View
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {gameState === 'waiting' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Waiting for Players...</h2>
          <p className="text-gray-600 mb-6">
            Players:
            {' '}
            {players.length}
          </p>

          <div className="mb-6 space-y-2">
            {players.map(player => (
              <div
                key={player.id}
                className="bg-gray-100 px-4 py-2 rounded flex justify-between items-center"
              >
                <span className="font-medium">{player.name}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            disabled={players.length === 0}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-400"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'question' && currentQuestion && (
        <div className="bg-white shadow rounded-lg p-6">
          {/* Toggle buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowLeaderboard(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                !showLeaderboard
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Question
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                showLeaderboard
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Live Leaderboard
            </button>
          </div>

          {!showLeaderboard
            ? (
                <>
                  <h2 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h2>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 px-6 py-4 rounded-lg text-center text-lg"
                      >
                        {option}
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="mb-4">
                      <span className="text-lg font-semibold text-gray-700">
                        {answeredPlayers.size}
                        {' '}
                        /
                        {players.length}
                        {' '}
                        players answered
                      </span>
                    </div>

                    {answeredPlayers.size > 0 && answeredPlayers.size < players.length && (
                      <p className="text-sm text-gray-600 mb-4">
                        Waiting for remaining players...
                      </p>
                    )}

                    {answeredPlayers.size === players.length && players.length > 0 && (
                      <p className="text-sm text-green-600 font-semibold mb-4">
                        All players have answered!
                      </p>
                    )}

                    <button
                      onClick={nextQuestion}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                    >
                      {answeredPlayers.size === players.length && players.length > 0
                        ? 'Show Results'
                        : 'Skip to Results'}
                    </button>
                  </div>
                </>
              )
            : (
                <>
                  <h2 className="text-2xl font-semibold mb-6 text-center">Live Leaderboard</h2>

                  <div className="mb-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-purple-900 font-medium">Question in progress</span>
                        <span className="text-purple-700">
                          {answeredPlayers.size}
                          {' '}
                          /
                          {players.length}
                          {' '}
                          answered
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {players
                        .sort((a, b) => b.score - a.score)
                        .map((player, index) => (
                          <div
                            key={player.id}
                            className={`px-6 py-4 rounded-lg flex justify-between items-center transition-all ${
                              answeredPlayers.has(player.id)
                                ? 'bg-green-50 border-2 border-green-500'
                                : 'bg-gray-100 border-2 border-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-4">
                              <span className="font-bold text-xl w-10">
                                #
                                {index + 1}
                              </span>
                              <span className="font-medium text-lg">{player.name}</span>
                              {answeredPlayers.has(player.id) && (
                                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                  ✓ Answered
                                </span>
                              )}
                            </span>
                            <span className="font-bold text-2xl text-purple-600">
                              {player.score}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={nextQuestion}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                    >
                      {answeredPlayers.size === players.length && players.length > 0
                        ? 'Show Results'
                        : 'Skip to Results'}
                    </button>
                  </div>
                </>
              )}
        </div>
      )}

      {gameState === 'results' && currentQuestion && correctAnswer !== null && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Results</h2>

          <div className="mb-6">
            <p className="text-lg mb-4">Correct Answer:</p>
            <div className="bg-green-100 border-2 border-green-500 px-6 py-4 rounded-lg text-center text-lg font-medium">
              {currentQuestion.options[correctAnswer]}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
            <div className="space-y-2">
              {rankings.slice(0, 5).map((player, index) => (
                <div
                  key={player.playerId}
                  className="bg-gray-100 px-4 py-3 rounded flex justify-between items-center"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-bold text-lg w-8">
                      #
                      {index + 1}
                    </span>
                    <span className="font-medium">{player.name}</span>
                  </span>
                  <span className="font-bold text-purple-600">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={nextQuestion}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Next Question
          </button>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Game Over!</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Final Rankings</h3>
            <div className="space-y-3">
              {rankings.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`px-6 py-4 rounded-lg flex justify-between items-center ${
                    index === 0
                      ? 'bg-yellow-100 border-2 border-yellow-500'
                      : index === 1
                        ? 'bg-gray-200'
                        : index === 2
                          ? 'bg-orange-100'
                          : 'bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <span className="font-bold text-2xl w-10">
                      #
                      {index + 1}
                    </span>
                    <span className="font-medium text-lg">{player.name}</span>
                  </span>
                  <span className="font-bold text-2xl text-purple-600">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={restartGame}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
