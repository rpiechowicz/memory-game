<script setup lang="ts">
const weaponsStore = useWeaponsStore()
const userStore = useUserStore()

onMounted(async () => {
  await weaponsStore.fetchWeapons()
  await userStore.setUser()
})
</script>

<template>
  <div class="min-h-dvh min-w-dvw bg-gray-900 overflow-x-hidden">
    <router-view />
  </div>
</template>

<style scoped>
</style>
