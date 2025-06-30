export interface GameDto {
  id: string
  userId: string
  seed: string
  time: number
  moves: number
  difficulty: 'easy' | 'medium' | 'hard'
  createdAt: string
  updatedAt: string
}
