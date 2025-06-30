import type { GameDto } from '@/types/store/game'
import { v4 as uuid } from 'uuid'

const userStore = useUserStore()

const gameStorage = {
  games: useStorage<GameDto[]>('games', [], localStorage),
}

export const useGameStore = defineStore('game', () => {
  const currentGame = ref<GameDto | null>(null)
  const games = computed<GameDto[]>(() => gameStorage.games.value)

  function setNewGame(payload: { difficulty: 'easy' | 'medium' | 'hard' }) {
    const newGame: GameDto = {
      id: uuid(),
      userId: userStore.user.id!,
      seed: uuid(),
      moves: 0,
      time: 0,
      difficulty: payload.difficulty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    gameStorage.games.value.push(newGame)
    userStore.user.games!.push(newGame)
    currentGame.value = newGame
  }

  function clearGames() {
    gameStorage.games.value = []
    userStore.user.games!.length = 0
  }

  return {
    games,
    currentGame,
    setNewGame,
    clearGames
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot))
