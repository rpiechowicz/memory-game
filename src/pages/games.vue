<script setup lang="ts">
import type { GameDifficulty, GameDto, GameStatus } from '@/types/store/game'
import { useGameStore } from '@/store/game'
import { GameDifficulties, GameStatuses } from '@/types/store/game'

const gameStore = useGameStore()

const page = ref<number>(1)

const games = computed<GameDto[]>(() => gameStore.games)
const itemsPerPage = computed<number>(() => 10)
const totalPages = computed<number>(() => Math.ceil(games.value.length / itemsPerPage.value))
const paginatedGames = computed<GameDto[]>(() => games.value.slice((page.value - 1) * itemsPerPage.value, page.value * itemsPerPage.value))

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function translateStatus(status: GameStatus): string {
  switch (status) {
    case GameStatuses.IN_PROGRESS:
      return 'W toku'
    case GameStatuses.FINISHED:
      return 'Zakończone'
    case GameStatuses.CANCELED:
      return 'Anulowane'
    default:
      return status
  }
}

function translateDifficulty(difficulty: GameDifficulty): string {
  switch (difficulty) {
    case GameDifficulties.EASY:
      return 'Łatwy'
    case GameDifficulties.MEDIUM:
      return 'Średni'
    case GameDifficulties.HARD:
      return 'Trudny'
    default:
      return difficulty
  }
}
</script>

<template>
  <div class="space-y-6 px-4">
    <div class="flex justify-between">
      <h2 class="text-2xl font-bold text-white lg:text-3xl">Tablica gier</h2>

      <button
        v-if="games.length"
        class="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-800 hover:bg-red-700 transition-colors duration-200"
        @click="gameStore.clearGames()"
      >
        Wyczyść gry
      </button>
    </div>

    <div v-if="games.length" class="w-full overflow-x-auto rounded-lg ring-1 ring-slate-700">
      <table class="min-w-full text-sm text-slate-200 bg-slate-800 table-auto">
        <thead class="bg-slate-700 text-blue-400 uppercase text-xs tracking-wider">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Poziom</th>
            <th class="px-4 py-3 text-left">Ruchy</th>
            <th class="px-4 py-3 text-left">Czas</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-left">Data utworzenia</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700">
          <tr v-for="game in paginatedGames" :key="game.id" class="hover:bg-slate-700">
            <td class="px-4 py-2 whitespace-nowrap">{{ game.id.slice(0, 8) }}</td>
            <td class="px-4 py-2 whitespace-nowrap capitalize">{{ translateDifficulty(game.difficulty) }}</td>
            <td class="px-4 py-2 whitespace-nowrap">{{ game.moves }}</td>
            <td class="px-4 py-2 whitespace-nowrap">{{ formatTime(game.time) }}</td>
            <td class="px-4 py-2 whitespace-nowrap">
              <span :class="{ 'text-green-500': game.status === GameStatuses.FINISHED, 'text-red-500': game.status === GameStatuses.CANCELED }">
                {{ translateStatus(game.status) }}
              </span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap">{{ new Date(game.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="games.length"
      :page="page"
      :total-pages="totalPages"
      @update:page="page = $event"
    />

    <p v-else class="text-slate-400">Brak zapisanych gier.</p>
  </div>
</template>
