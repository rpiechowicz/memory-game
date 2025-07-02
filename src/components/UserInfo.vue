<script setup lang="ts">
const userStore = useUserStore()
const gameStore = useGameStore()
</script>

<template>
  <div class="lg:w-80 flex-shrink-0">
    <div class="bg-gray-800 rounded-xl p-6 shadow-2xl sticky top-4 h-[600px]">
      <h2 class="text-xl font-bold mb-4 text-white">Informacje o grze</h2>

      <!-- User Info -->
      <div class="mb-6">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Gracz</h3>
        <div class="bg-gray-900 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {{ userStore.user.username?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div>
              <p class="font-medium text-white">{{ userStore.user.username || 'Anonimowy Gracz' }}</p>
              <p class="text-xs text-gray-400">ID: {{ userStore.user.id?.substring(0, 8) || '---' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Stats -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-1">Czas</h3>
          <p class="text-white font-medium">
            {{ (gameStore.currentGame?.time || '-') }} {{ gameStore.currentGame?.time ? 'sekund' : '' }}
          </p>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-1">Ilość ruchów</h3>
          <p class="text-white font-mono">{{ gameStore.currentGame?.moves || '-' }}</p>
        </div>
      </div>

      <!-- Game Instructions -->
      <div class="mt-8 pt-6 border-t border-gray-700 space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-1">Ilość rozegranych gier</h3>
          <p class="text-white font-medium">
            {{ userStore.user.games?.length || '-' }}
          </p>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-1">Najlepszy czas</h3>
          <p class="text-white font-medium">
            {{ gameStore.games.length > 0 ? `${gameStore.bestTime} sekund` : '-' }}
          </p>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-1">Najmniejsza ilość ruchów</h3>
          <p class="text-white font-medium">
            {{ gameStore.games.length > 0 ? gameStore.bestMoves : '-' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
