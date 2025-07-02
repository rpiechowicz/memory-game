<script setup lang="ts">
const gameStore = useGameStore()
const route = useRoute()

watch(() => route.fullPath, () => {
  gameStore.cancelGame()
})
</script>

<template>
  <div class="w-7xl mx-auto">
    <NavBar />

    <router-view>
      <template #default="{ Component }">
        <transition name="zoom-fade" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </template>
    </router-view>
  </div>
</template>
