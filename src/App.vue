<script setup lang="ts">
const weaponsStore = useWeaponsStore()
const userStore = useUserStore()

onMounted(async () => {
  // await weaponsStore.fetchWeapons()
  await userStore.setUser()
})
</script>

<template>
  <div class="min-h-dvh min-w-dvw bg-gray-900 flex items-center justify-center py-4 px-4">
    <router-view />
  </div>
</template>

<style scoped>
</style>
