import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CounterStrikeApi from '../../src/services/CounterStrikeApi'
import { useWeaponsStore } from '../../src/store/weapons'

const mockWeapons = [
  { id: 1, name: 'AK-47 | Redline', price: 15 },
  { id: 2, name: 'AWP | Asiimov', price: 60 },
] as any

vi.mock('../../src/services/CounterStrikeApi', () => {
  return {
    default: {
      getWeaponsList: vi.fn(async () => mockWeapons),
    },
  }
})

const getWeaponsListMock = (CounterStrikeApi as any).getWeaponsList as ReturnType<typeof vi.fn>

describe('useWeaponsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('fetchWeapons populates weapons when empty', async () => {
    const store = useWeaponsStore()

    await store.fetchWeapons()
    await nextTick()

    expect(getWeaponsListMock).toHaveBeenCalledTimes(1)
    expect(store.weapons.length).toBe(mockWeapons.length)
  })

  it('fetchWeapons skips API call when weapons cached', async () => {
    const store = useWeaponsStore()

    // seed weapons
    store.setWeapons(mockWeapons)
    await nextTick()

    await store.fetchWeapons()

    expect(getWeaponsListMock).not.toHaveBeenCalled()
    expect(store.weapons.length).toBe(mockWeapons.length)
  })

  it('clearWeapons removes all weapons', async () => {
    const store = useWeaponsStore()
    store.setWeapons(mockWeapons)
    await nextTick()
    expect(store.weapons.length).toBeGreaterThan(0)

    store.clearWeapons()
    await nextTick()

    expect(store.weapons.length).toBe(0)
  })
})
