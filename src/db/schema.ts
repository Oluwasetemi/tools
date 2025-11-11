import { boolean, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

// Enums
export const feedbackTypeEnum = pgEnum('feedback_type', ['emoji', 'text', 'score'])
export const gameStateEnum = pgEnum('game_state', ['waiting', 'question', 'results', 'leaderboard', 'ended'])

// Kahoot Tables
export const kahootGames = pgTable('kahoot_games', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 255 }).notNull().unique(),
  gameName: text('game_name').notNull(),
  state: gameStateEnum('state').notNull().default('waiting'),
  currentQuestionIndex: integer('current_question_index').default(0),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
})

export const kahootQuestions = pgTable('kahoot_questions', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => kahootGames.id, { onDelete: 'cascade' }),
  questionOrder: integer('question_order').notNull(),
  question: text('question').notNull(),
  options: jsonb('options').notNull(), // Array of strings
  correctAnswer: integer('correct_answer').notNull(),
  timeLimit: integer('time_limit').notNull().default(30),
  points: integer('points').notNull().default(1000),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const kahootPlayers = pgTable('kahoot_players', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => kahootGames.id, { onDelete: 'cascade' }),
  playerName: varchar('player_name', { length: 255 }).notNull(),
  score: integer('score').notNull().default(0),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const kahootAnswers = pgTable('kahoot_answers', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => kahootGames.id, { onDelete: 'cascade' }),
  questionId: integer('question_id').notNull().references(() => kahootQuestions.id, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull().references(() => kahootPlayers.id, { onDelete: 'cascade' }),
  selectedAnswer: integer('selected_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  timeToAnswer: integer('time_to_answer').notNull(), // in milliseconds
  pointsEarned: integer('points_earned').notNull().default(0),
  answeredAt: timestamp('answered_at').defaultNow().notNull(),
})

// Polls Tables
export const polls = pgTable('polls', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 255 }).notNull().unique(),
  question: text('question').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
})

export const pollOptions = pgTable('poll_options', {
  id: serial('id').primaryKey(),
  pollId: integer('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  optionOrder: integer('option_order').notNull(),
  votes: integer('votes').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pollVotes = pgTable('poll_votes', {
  id: serial('id').primaryKey(),
  pollId: integer('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionId: integer('option_id').notNull().references(() => pollOptions.id, { onDelete: 'cascade' }),
  voterId: varchar('voter_id', { length: 255 }).notNull(), // Session ID or user ID
  votedAt: timestamp('voted_at').defaultNow().notNull(),
})

// Feedback Tables
export const feedbackSessions = pgTable('feedback_sessions', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 255 }).notNull().unique(),
  title: text('title').notNull(),
  type: feedbackTypeEnum('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config'), // For score ranges, emoji options, etc.
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
})

export const feedbackResponses = pgTable('feedback_responses', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => feedbackSessions.id, { onDelete: 'cascade' }),
  respondentId: varchar('respondent_id', { length: 255 }).notNull(), // Session ID or user ID
  responseType: feedbackTypeEnum('response_type').notNull(),
  emojiResponse: varchar('emoji_response', { length: 10 }),
  textResponse: text('text_response'),
  scoreResponse: integer('score_response'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
})

// Feelings/Emoji Stream Tables
export const feelingSessions = pgTable('feeling_sessions', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
})

export const feelingEmojis = pgTable('feeling_emojis', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => feelingSessions.id, { onDelete: 'cascade' }),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  participantId: varchar('participant_id', { length: 255 }).notNull(), // Session ID or user ID
  postedAt: timestamp('posted_at').defaultNow().notNull(),
})
