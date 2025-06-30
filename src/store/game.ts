import type { GameDto } from '@/types/store/game'
import { v4 as uuid } from 'uuid'

const userStore = useUserStore()

const gameStorage = {
  games: useStorage<GameDto[]>('games', [], localStorage),
}

export const useGameStore = defineStore('game', () => {
  let intervalId: number | null = null
  const currentGame = ref<GameDto | null>(null)
  const games = computed<GameDto[]>(() => gameStorage.games.value)

  const bestMoves = computed<number>(() => games.value.reduce((best, current) => {
    if (current.status !== 'finished') return best
    if (!best || current.moves < best) {
      return current.moves
    }
    return best
  }, 0))

  const bestTime = computed<number>(() => games.value.reduce((best, current) => {
    if (current.status !== 'finished') return best
    if (!best || current.time < best) {
      return current.time
    }
    return best
  }, 0))

  function setNewGame(payload: { difficulty: 'easy' | 'medium' | 'hard' }) {
    const newGame: GameDto = {
      id: uuid(),
      userId: userStore.user.id!,
      seed: uuid(),
      moves: 0,
      time: 0,
      difficulty: payload.difficulty,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    gameStorage.games.value.push(newGame)
    userStore.user.games!.push(newGame)
    currentGame.value = newGame
  }

  function finishGame(payload: { moves: number, time: number }) {
    if (!currentGame.value) {
      return
    }

    currentGame.value.moves = payload.moves
    currentGame.value.time = payload.time
    currentGame.value.status = 'finished'
    currentGame.value.updatedAt = new Date().toISOString()
    stopInterval()
  }

  function clearGames() {
    gameStorage.games.value = []
    userStore.user.games!.length = 0
  }

  function startInterval() {
    if (intervalId) {
      clearInterval(intervalId)
    }

    intervalId = window.setInterval(() => {
      if (!currentGame.value) {
        return
      }

      currentGame.value.time = Math.floor((Date.now() - new Date(currentGame.value.createdAt).getTime()) / 1000)
      currentGame.value.updatedAt = new Date().toISOString()
    }, 1000)
  }

  function stopInterval() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  watch(() => currentGame.value, () => {
    if (currentGame.value) {
      startInterval()
    } else {
      stopInterval()
    }
  })

  return {
    games,
    currentGame,
    bestMoves,
    bestTime,
    setNewGame,
    finishGame,
    clearGames
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot))
