import type { WeaponSkinDto } from '@/types/store/weapons'
import CounterStrikeApi from '@/services/CounterStrikeApi'

const weaponsStorages = {
  weapons: useStorage<WeaponSkinDto[]>('weapons', [], localStorage),
}

export const useWeaponsStore = defineStore('weapons', () => {
  const weapons = computed<WeaponSkinDto[]>(() => weaponsStorages.weapons.value)

  async function fetchWeapons() {
    if (weapons.value.length > 0) {
      return
    }

    const response = await CounterStrikeApi.getWeaponsList()

    if (response) {
      setWeapons(response)
    }
  }

  function setWeapons(weapons: WeaponSkinDto[]) {
    weaponsStorages.weapons.value = weapons
  }

  function clearWeapons() {
    weaponsStorages.weapons.value = []
  }

  return {
    weapons,
    setWeapons,
    clearWeapons,
    fetchWeapons
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWeaponsStore, import.meta.hot))
