export type FeedbackType = 'emoji' | 'text' | 'score'

export interface EmojiOption {
  readonly emoji: string
  readonly label: string
  readonly count: number
}

export interface TextResponse {
  readonly id: string
  readonly text: string
  readonly timestamp: number
}

export interface ScoreData {
  readonly total: number
  readonly count: number
  readonly average: number
  readonly distribution: Readonly<Record<number, number>>
}

export interface FeedbackSession {
  readonly id: string
  readonly title: string
  readonly type: FeedbackType
  readonly createdBy: string
  readonly createdAt: number
  readonly isActive: boolean
  readonly emojiOptions?: readonly EmojiOption[]
  readonly textResponses?: readonly TextResponse[]
  readonly scoreData?: ScoreData
  readonly scoreRange?: { readonly min: number, readonly max: number }
}

export type ServerMessage
  = | { type: 'feedback_created', session: FeedbackSession }
    | { type: 'feedback_updated', session: FeedbackSession }
    | { type: 'feedback_closed', session: FeedbackSession }
    | { type: 'error', message: string }
    | { type: 'connection_count', count: number }
