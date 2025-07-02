<script setup lang="ts">
const gameStore = useGameStore()
const route = useRoute()

watch(() => route.fullPath, () => {
  gameStore.cancelGame()
})
</script>

<template>
  <div class="flex items-center justify-center flex-col min-w-dvw min-h-dvh px-6 py-6">
    <div class="xl:w-6xl w-full mx-auto">
      <NavBar />

      <router-view>
        <template #default="{ Component }">
          <transition name="zoom-fade" mode="out-in" appear>
            <component :is="Component" />
          </transition>
        </template>
      </router-view>
    </div>

    <Footer />
  </div>
</template>
