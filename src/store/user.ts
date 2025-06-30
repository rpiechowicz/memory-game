import type { UserDto } from '@/types/store/user'
import { v4 as uuid } from 'uuid'

const userStorage = {
  user: useStorage<Partial<UserDto>>('user', {}, localStorage),
}

export const useUserStore = defineStore('user', () => {
  const user = computed<Partial<UserDto>>(() => userStorage.user.value)

  function setUser() {
    if (user.value.id) {
      return
    }

    const newUser: UserDto = {
      id: uuid(),
      username: `User ${uuid().substring(0, 8)}`,
      games: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    userStorage.user.value = newUser
  }

  function clearUser() {
    userStorage.user.value = {}
  }

  return {
    user,
    setUser,
    clearUser
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
