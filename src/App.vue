<script setup lang="ts">
const weaponsStore = useWeaponsStore()
const userStore = useUserStore()

onMounted(async () => {
  await weaponsStore.fetchWeapons()
  await userStore.setUser()
})
</script>

<template>
  <div class="h-dvh w-dvw bg-gray-900 flex items-center justify-center">
    <router-view />
  </div>
</template>

<style scoped>
</style>
