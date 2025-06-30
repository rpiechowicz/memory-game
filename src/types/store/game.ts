export interface GameDto {
  id: string
  userId: string
  seed: string
  time: number
  moves: number
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'in_progress' | 'finished' | 'canceled'
  createdAt: string
  updatedAt: string
}
