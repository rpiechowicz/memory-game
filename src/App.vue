<script setup lang="ts">
const weaponsStore = useWeaponsStore()
const userStore = useUserStore()

onMounted(async () => {
  await weaponsStore.fetchWeapons()
  await userStore.setUser()
})
</script>

<template>
  <div class="max-h-dvh max-w-dvw">
    <router-view />
  </div>
</template>

<style scoped>
</style>
