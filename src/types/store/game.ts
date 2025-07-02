export const GameDifficulties = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const

export const GameStatuses = {
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
  CANCELED: 'canceled',
} as const

export type GameDifficulty = (typeof GameDifficulties)[keyof typeof GameDifficulties]
export type GameStatus = (typeof GameStatuses)[keyof typeof GameStatuses]

export interface GameDto {
  id: string
  userId: string
  seed: string
  time: number
  moves: number
  difficulty: GameDifficulty
  status: GameStatus
  createdAt: string
  updatedAt: string
}

export interface GameCard {
  img: HTMLImageElement
  url: string
  rarityColor: string
  revealed: boolean
  matched: boolean
}
