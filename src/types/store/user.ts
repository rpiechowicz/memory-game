import type { GameDto } from '@/types/store/game'

export interface UserDto {
  id: string
  username: string
  games: GameDto[]
  createdAt: string
  updatedAt: string
}
