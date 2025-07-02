import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useUserStore } from '../../src/store/user'

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('setUser creates and persists a new user', async () => {
    const store = useUserStore()
    expect(store.user.id).toBeUndefined()

    store.setUser()
    await nextTick()

    expect(store.user.id).toBeDefined()
    expect(store.user.username).toMatch(/^User /)

    // sprawdź localStorage
    const raw = localStorage.getItem('user')
    expect(raw).not.toBeNull()
    if (raw) {
      const parsed = JSON.parse(raw)
      expect(parsed.id).toBe(store.user.id)
    }
  })

  it('setUser called twice keeps same user', async () => {
    const store = useUserStore()
    store.setUser()
    await nextTick()
    const firstId = store.user.id

    store.setUser()
    await nextTick()
    expect(store.user.id).toBe(firstId)
  })

  it('clearUser removes user data', async () => {
    const store = useUserStore()
    store.setUser()
    expect(store.user.id).toBeDefined()

    store.clearUser()
    await nextTick()
    expect(store.user).toEqual({})
    expect(localStorage.getItem('user')).toBe('{}')
  })
})
