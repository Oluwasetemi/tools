import type * as Party from 'partykit/server'

// Types for Kahoot game
interface Player {
  id: string
  name: string
  score: number
  answers: { questionId: string, correct: boolean, points: number }[]
}

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number // index of correct option
  timeLimit: number // seconds
  points: number
}

type GameState = 'waiting' | 'question' | 'results' | 'leaderboard' | 'ended'

interface Game {
  id: string
  name: string
  questions: Question[]
  currentQuestionIndex: number
  state: GameState
  players: Map<string, Player>
  createdBy: string
  createdAt: number
  questionStartTime?: number
}

type ClientMessage
  = | { type: 'host_create', name: string, questions: Omit<Question, 'id'>[] }
    | { type: 'player_join', name: string }
    | { type: 'host_start' }
    | { type: 'host_next_question' }
    | { type: 'player_answer', questionId: string, answerIndex: number }
    | { type: 'host_end_game' }
    | { type: 'host_restart_game' }
    | { type: 'get_state' }

type ServerMessage
  = | { type: 'game_created', gameId: string }
    | { type: 'player_joined', player: Omit<Player, 'answers'> }
    | { type: 'game_started' }
    | { type: 'question_started', question: Omit<Question, 'correctAnswer'>, timeRemaining: number }
    | { type: 'question_ended', correctAnswer: number, rankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'game_ended', finalRankings: Array<{ playerId: string, name: string, score: number, answers: Player['answers'] }> }
    | { type: 'player_answered', playerId: string }
    | { type: 'leaderboard', rankings: Array<{ playerId: string, name: string, score: number }> }
    | { type: 'game_state', state: GameState, players: Array<Omit<Player, 'answers'>> }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }

export default class KahootServer implements Party.Server {
  private game: Game | null = null
  private questionTimer: ReturnType<typeof setTimeout> | null = null
  private hostId: string | null = null
  private answeredPlayers: Set<string> = new Set()

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load game state from storage
    const storedGame = await this.room.storage.get<{
      id: string
      name: string
      questions: Question[]
      currentQuestionIndex: number
      state: GameState
      players: Array<[string, Player]>
      createdBy: string
      createdAt: number
    }>('game')

    if (storedGame) {
      this.game = {
        ...storedGame,
        players: new Map(storedGame.players),
      }
    }

    const storedHostId = await this.room.storage.get<string>('hostId')
    if (storedHostId) {
      this.hostId = storedHostId
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected to Kahoot room:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`,
    )

    // Send current game state to new connection
    if (this.game) {
      this.sendGameState(conn)
    }

    this.broadcastConnectionCount()
  }

  onClose(conn: Party.Connection) {
    // Remove player if they disconnect
    if (this.game && this.game.players.has(conn.id)) {
      this.game.players.delete(conn.id)
      this.saveGameState()
    }

    this.broadcastConnectionCount()
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== 'string')
      return

    try {
      const data: ClientMessage = JSON.parse(message)

      switch (data.type) {
        case 'host_create':
          await this.handleHostCreate(data, sender)
          break

        case 'player_join':
          await this.handlePlayerJoin(data, sender)
          break

        case 'host_start':
          await this.handleHostStart(sender)
          break

        case 'host_next_question':
          await this.handleHostNextQuestion(sender)
          break

        case 'player_answer':
          await this.handlePlayerAnswer(data, sender)
          break

        case 'host_end_game':
          await this.handleHostEndGame(sender)
          break

        case 'host_restart_game':
          await this.handleRestartGame(sender)
          break

        case 'get_state':
          this.sendGameState(sender)
          break
      }
    }
    catch (error) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        } as ServerMessage),
      )
    }
  }

  private async handleHostCreate(
    data: { name: string, questions: Omit<Question, 'id'>[] },
    sender: Party.Connection,
  ) {
    if (this.game) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'A game already exists in this room',
        } as ServerMessage),
      )
      return
    }

    this.hostId = sender.id
    this.game = {
      id: this.room.id,
      name: data.name,
      questions: data.questions.map((q, i) => ({
        ...q,
        id: `q-${i}`,
      })),
      currentQuestionIndex: -1,
      state: 'waiting',
      players: new Map(),
      createdBy: sender.id,
      createdAt: Date.now(),
    }

    await this.saveGameState()
    await this.room.storage.put('hostId', this.hostId)

    sender.send(
      JSON.stringify({
        type: 'game_created',
        gameId: this.game.id,
      } as ServerMessage),
    )

    this.broadcastGameState()
  }

  private async handlePlayerJoin(
    data: { name: string },
    sender: Party.Connection,
  ) {
    if (!this.game) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'No game exists',
        } as ServerMessage),
      )
      return
    }

    if (this.game.state !== 'waiting') {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Game has already started',
        } as ServerMessage),
      )
      return
    }

    const player: Player = {
      id: sender.id,
      name: data.name,
      score: 0,
      answers: [],
    }

    this.game.players.set(sender.id, player)
    await this.saveGameState()

    this.room.broadcast(
      JSON.stringify({
        type: 'player_joined',
        player: { id: player.id, name: player.name, score: player.score },
      } as ServerMessage),
    )

    this.sendGameState(sender)
  }

  private async handleHostStart(sender: Party.Connection) {
    if (!this.game || sender.id !== this.hostId) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Only the host can start the game',
        } as ServerMessage),
      )
      return
    }

    if (this.game.state !== 'waiting') {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Game has already started',
        } as ServerMessage),
      )
      return
    }

    this.game.state = 'question'
    this.game.currentQuestionIndex = 0
    await this.saveGameState()

    this.room.broadcast(
      JSON.stringify({
        type: 'game_started',
      } as ServerMessage),
    )

    // Start first question after a short delay
    setTimeout(() => this.startQuestion(), 2000)
  }

  private async handleHostNextQuestion(sender: Party.Connection) {
    if (!this.game || sender.id !== this.hostId) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Only the host can advance questions',
        } as ServerMessage),
      )
      return
    }

    this.game.currentQuestionIndex++

    if (this.game.currentQuestionIndex >= this.game.questions.length) {
      await this.endGame()
      return
    }

    this.game.state = 'question'
    await this.saveGameState()

    this.startQuestion()
  }

  private startQuestion() {
    if (!this.game)
      return

    const question = this.game.questions[this.game.currentQuestionIndex]
    if (!question)
      return

    this.game.questionStartTime = Date.now()
    this.answeredPlayers.clear()

    // Send question without correct answer
    const { correctAnswer, ...questionWithoutAnswer } = question

    this.room.broadcast(
      JSON.stringify({
        type: 'question_started',
        question: questionWithoutAnswer,
        timeRemaining: question.timeLimit,
      } as ServerMessage),
    )

    // Set timer for question
    if (this.questionTimer) {
      clearTimeout(this.questionTimer)
    }

    this.questionTimer = setTimeout(() => {
      this.endQuestion()
    }, question.timeLimit * 1000)
  }

  private async handlePlayerAnswer(
    data: { questionId: string, answerIndex: number },
    sender: Party.Connection,
  ) {
    if (!this.game)
      return

    const player = this.game.players.get(sender.id)
    if (!player) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Player not found',
        } as ServerMessage),
      )
      return
    }

    if (this.answeredPlayers.has(sender.id)) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'You have already answered this question',
        } as ServerMessage),
      )
      return
    }

    const question = this.game.questions[this.game.currentQuestionIndex]
    if (!question || question.id !== data.questionId) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid question',
        } as ServerMessage),
      )
      return
    }

    this.answeredPlayers.add(sender.id)

    // Calculate points based on correctness and speed
    const correct = data.answerIndex === question.correctAnswer
    let points = 0

    if (correct && this.game.questionStartTime) {
      const timeElapsed = (Date.now() - this.game.questionStartTime) / 1000
      const timeRemaining = Math.max(0, question.timeLimit - timeElapsed)
      // Award more points for faster answers
      const speedBonus = timeRemaining / question.timeLimit
      points = Math.round(question.points * (0.5 + speedBonus * 0.5))
    }

    player.score += points
    player.answers.push({
      questionId: question.id,
      correct,
      points,
    })

    await this.saveGameState()

    // Notify others that player answered (without revealing the answer)
    this.room.broadcast(
      JSON.stringify({
        type: 'player_answered',
        playerId: sender.id,
      } as ServerMessage),
      [sender.id],
    )
  }

  private async endQuestion() {
    if (!this.game)
      return

    const question = this.game.questions[this.game.currentQuestionIndex]
    this.game.state = 'results'

    const rankings = Array.from(this.game.players.values())
      .sort((a, b) => b.score - a.score)
      .map(p => ({ playerId: p.id, name: p.name, score: p.score }))

    await this.saveGameState()

    this.room.broadcast(
      JSON.stringify({
        type: 'question_ended',
        correctAnswer: question.correctAnswer,
        rankings,
      } as ServerMessage),
    )
  }

  private async endGame() {
    if (!this.game)
      return

    this.game.state = 'ended'

    const finalRankings = Array.from(this.game.players.values())
      .sort((a, b) => b.score - a.score)
      .map(p => ({
        playerId: p.id,
        name: p.name,
        score: p.score,
        answers: p.answers,
      }))

    await this.saveGameState()

    this.room.broadcast(
      JSON.stringify({
        type: 'game_ended',
        finalRankings,
      } as ServerMessage),
    )
  }

  private async handleHostEndGame(sender: Party.Connection) {
    if (!this.game || sender.id !== this.hostId) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Only the host can end the game',
        } as ServerMessage),
      )
      return
    }

    await this.endGame()
  }

  private async handleRestartGame(sender: Party.Connection) {
    if (!this.game || sender.id !== this.hostId) {
      sender.send(
        JSON.stringify({
          type: 'error',
          message: 'Only the host can restart the game',
        } as ServerMessage),
      )
      return
    }

    // Reset all players' scores and answers
    for (const player of this.game.players.values()) {
      player.score = 0
      player.answers = []
    }

    // Reset game state
    this.game.state = 'waiting'
    this.game.currentQuestionIndex = -1
    this.answeredPlayers.clear()

    if (this.questionTimer) {
      clearTimeout(this.questionTimer)
      this.questionTimer = null
    }

    await this.saveGameState()

    // Broadcast that game has been reset to waiting
    this.room.broadcast(
      JSON.stringify({
        type: 'game_state',
        state: this.game.state,
        players: Array.from(this.game.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
        })),
      } as ServerMessage),
    )
  }

  private sendGameState(conn: Party.Connection) {
    if (!this.game)
      return

    conn.send(
      JSON.stringify({
        type: 'game_state',
        state: this.game.state,
        players: Array.from(this.game.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
        })),
      } as ServerMessage),
    )
  }

  private broadcastGameState() {
    if (!this.game)
      return

    this.room.broadcast(
      JSON.stringify({
        type: 'game_state',
        state: this.game.state,
        players: Array.from(this.game.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
        })),
      } as ServerMessage),
    )
  }

  private async saveGameState() {
    if (!this.game)
      return

    await this.room.storage.put('game', {
      ...this.game,
      players: Array.from(this.game.players.entries()),
    })
  }

  private broadcastConnectionCount() {
    const count = [...this.room.getConnections()].length
    this.room.broadcast(
      JSON.stringify({
        type: 'connection_count',
        count,
      } as ServerMessage),
    )
  }
}

KahootServer satisfies Party.Worker
