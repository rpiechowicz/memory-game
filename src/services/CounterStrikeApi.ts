import type { WeaponSkinDto } from '@/types/store/weapons'
import fetch from '@/composables/fetch'
import { FetchMethods } from '@/types/composables/fetch'

const CounterStrikeApi = {
  async getWeaponsList(): Promise<WeaponSkinDto[]> {
    return await fetch<WeaponSkinDto[]>(`${import.meta.env.VITE_API_URL}/skins.json`, {
      method: FetchMethods.GET,
    })
  },
}

export default CounterStrikeApi
