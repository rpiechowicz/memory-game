<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <nav class="text-white pb-4">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between h-16 items-center">
        <header class="text-center">
          <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Memory Game - Counter Strike 2
          </h1>
        </header>

        <div class="flex space-x-4">
          <router-link
            to="/"
            class="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
            :active-class="route.name === 'dashboard' ? 'bg-blue-800' : ''"
          >
            Strona główna
          </router-link>
          <router-link
            to="/games"
            class="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
            :active-class="route.name === 'games' ? 'bg-blue-800' : ''"
          >
            Tablica gier
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
