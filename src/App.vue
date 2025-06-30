<script setup lang="ts">
const weaponsStore = useWeaponsStore()

onMounted(async () => {
  await weaponsStore.fetchWeapons()
})
</script>

<template>
  <div class="memory-game">
    <router-view />
  </div>
</template>

<style scoped>
</style>
