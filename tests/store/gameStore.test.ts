import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useGameStore } from '../../src/store/game'
import { useUserStore } from '../../src/store/user'
import { GameDifficulties, GameStatuses } from '../../src/types/store/game'

describe('useGameStore – extended scenarios', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('computes bestMoves and bestTime correctly', async () => {
    const userStore = useUserStore()
    userStore.setUser()
    const store = useGameStore()

    // 1. Easy game (baseline)
    store.setNewGame({ difficulty: GameDifficulties.EASY })
    store.finishGame({ moves: 30, time: 100 })
    await nextTick()

    // 2. Medium – lepsza liczba ruchów
    store.setNewGame({ difficulty: GameDifficulties.MEDIUM })
    store.finishGame({ moves: 25, time: 110 })
    await nextTick()

    // 3. Hard – lepszy czas
    store.setNewGame({ difficulty: GameDifficulties.HARD })
    store.finishGame({ moves: 40, time: 90 })
    await nextTick()

    expect(store.bestMoves).toBe(25)
    expect(store.bestTime).toBe(90)
  })

  it('cancelGame sets status to CANCELED and clears currentGame', async () => {
    const userStore = useUserStore()
    userStore.setUser()
    const store = useGameStore()

    store.setNewGame({ difficulty: GameDifficulties.EASY })
    await nextTick()
    expect(store.currentGame).not.toBeNull()

    store.cancelGame()

    expect(store.games[store.games.length - 1].status).toBe(GameStatuses.CANCELED)
    expect(store.currentGame).toBeNull()
  })

  it('clearGames removes every game from history', async () => {
    const userStore = useUserStore()
    userStore.setUser()
    const store = useGameStore()

    store.setNewGame({ difficulty: GameDifficulties.EASY })
    store.finishGame({ moves: 15, time: 70 })
    await nextTick()
    expect(store.games.length).toBeGreaterThan(0)

    store.clearGames()
    expect(store.games.length).toBe(0)
  })
})
