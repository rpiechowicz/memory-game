<script setup lang="ts">
import type { GameCard, GameDifficulty } from '@/types/store/game'
import confetti from 'canvas-confetti'
import MdiAlertCircle from '~icons/mdi/alert-circle'
import MdiContentCopy from '~icons/mdi/content-copy'
import MdiPlayCircle from '~icons/mdi/play-circle'
import { clickSound, endSound, pairSound } from '@/assets/audio'
import { GameDifficulties, GameStatuses } from '@/types/store/game'

const weaponStore = useWeaponsStore()
const gameStore = useGameStore()

const clickAudio: HTMLAudioElement = new Audio(clickSound)
const pairAudio: HTMLAudioElement = new Audio(pairSound)
const endAudio: HTMLAudioElement = new Audio(endSound)
const backImage: HTMLImageElement = new Image()

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const isGameStarted = ref<boolean>(false)
const isGameFinished = ref<boolean>(false)
const isError = computed<boolean>(() => weaponStore.weapons.length === 0)

const gridMap: Record<GameDifficulty, { cols: number, rows: number }> = {
  [GameDifficulties.EASY]: { cols: 4, rows: 5 },
  [GameDifficulties.MEDIUM]: { cols: 5, rows: 6 },
  [GameDifficulties.HARD]: { cols: 6, rows: 7 },
  [GameDifficulties.CUSTOM]: { cols: 2, rows: 3 },
}

const startTime = ref<number>(0)
const moves = ref<number>(0)
const selectedDifficulty = ref<GameDifficulty>(GameDifficulties.EASY)
const gridCols = ref<number>(gridMap[selectedDifficulty.value].cols)
const gridRows = ref<number>(gridMap[selectedDifficulty.value].rows)
const seed = ref<string>(`${selectedDifficulty.value}-${gridCols.value}-${gridRows.value}`)

const cards = reactive<GameCard[]>([])
const flipped = reactive<number[]>([])
const isProcessing = ref<boolean>(false)
const cardSize = ref<number>(140)

// Adjust card size so that entire board fits horizontally
function updateCardSize(): void {
  // Get available width from canvas container (or window as fallback)
  const containerWidth = canvasRef.value?.parentElement?.clientWidth ?? window.innerWidth
  const maxWidth = containerWidth - 32 // small margin
  const maxHeight = window.innerHeight - 300 // header & controls space

  const sizeByWidth = Math.floor(maxWidth / gridCols.value)
  const sizeByHeight = Math.floor(maxHeight / gridRows.value)

  const optimal = Math.min(sizeByWidth, sizeByHeight)
  // Keep cards between 40 and 140 px
  cardSize.value = Math.max(40, Math.min(140, optimal))
}

// Recompute on load and when window resizes
onMounted(() => {
  updateCardSize()
  window.addEventListener('resize', updateCardSize)
})

onUnmounted(() => window.removeEventListener('resize', updateCardSize))
const dpr = ref<number>(window.devicePixelRatio || 1)

// Sanitize grid size (allowed range 2-99)
function sanitizeGridValue(value: number): number {
  if (value > 10) {
    return 10
  }
  if (value < 2) {
    return 2
  }
  return value
}

// Handlers for custom grid size inputs
function onGridColsChange(event: Event): void {
  const input = event.target as HTMLInputElement
  gridCols.value = sanitizeGridValue(Number(input.value))
}

function onGridRowsChange(event: Event): void {
  const input = event.target as HTMLInputElement
  gridRows.value = sanitizeGridValue(Number(input.value))
}

// Copy seed to clipboard
function copySeed(): void {
  navigator.clipboard.writeText(seed.value)
}

// Utility: shuffle array
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// Initialize the board based on difficulty and seed
function initGame() {
  cards.splice(0, cards.length)

  try {
    // Build a deck large enough for any grid size (up to 99×99)
    const deck = ref<{ image: string, rarityColor: string }[]>([])
    const allItems = shuffle([...weaponStore.weapons])
    if (allItems.length === 0)
      return // avoid crash when weapon list empty

    const total = gridCols.value * gridRows.value
    const pairCount = Math.floor(total / 2)

    // Fill deck cycling through available items if grid is larger than weapon pool
    for (let i = 0; i < pairCount; i++) {
      const item = allItems[i % allItems.length]
      deck.value.push({ image: item.image, rarityColor: item.rarity.color })
      deck.value.push({ image: item.image, rarityColor: item.rarity.color })
    }

    // Handle odd number of cards
    if (total % 2 !== 0) {
      const extra = allItems[pairCount % allItems.length]
      deck.value.push({ image: extra.image, rarityColor: extra.rarity.color })
    }

    shuffle(deck.value)

    deck.value.forEach((cardInfo) => {
      const img = new Image()
      img.src = cardInfo.image
      cards.push({
        img,
        url: cardInfo.image,
        rarityColor: cardInfo.rarityColor,
        revealed: false,
        matched: false
      })
    })
  }
  catch (e) {
    console.error(e)
  }
}

// Draw the current state onto the canvas
function drawBoard() {
  if (!canvasRef.value)
    return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx)
    return

  // Set CSS size
  canvasRef.value.style.width = `${gridCols.value * cardSize.value}px`
  canvasRef.value.style.height = `${gridRows.value * cardSize.value}px`

  // Set actual resolution for HiDPI
  canvasRef.value.width = gridCols.value * cardSize.value * dpr.value
  canvasRef.value.height = gridRows.value * cardSize.value * dpr.value

  ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform before scaling
  ctx.scale(dpr.value, dpr.value)
  ctx.clearRect(0, 0, gridCols.value * cardSize.value, gridRows.value * cardSize.value)

  cards.forEach((card, i) => {
    const x = (i % gridCols.value) * cardSize.value
    const y = Math.floor(i / gridCols.value) * cardSize.value
    if (card.revealed || card.matched) {
      // draw gradient background
      const bgGrad = ctx.createLinearGradient(x, y, x + cardSize.value, y + cardSize.value)
      bgGrad.addColorStop(0, card.rarityColor)
      bgGrad.addColorStop(1, '#000')

      ctx.fillStyle = bgGrad
      ctx.fillRect(x, y, cardSize.value, cardSize.value)

      // draw the card image
      ctx.drawImage(card.img, x, y, cardSize.value, cardSize.value)
    }
    else {
      // draw the card back
      ctx.drawImage(backImage, x, y, cardSize.value, cardSize.value)
    }
    // draw border
    ctx.strokeStyle = '#131A29'
    ctx.strokeRect(x, y, cardSize.value, cardSize.value)
  })
}

// Handle click events on the canvas
function handleClick(event: MouseEvent) {
  if (isProcessing.value)
    return

  if (!canvasRef.value)
    return

  const rect = canvasRef.value.getBoundingClientRect()

  // Use CSS pixel coordinates for tile detection
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const col = Math.floor(x / cardSize.value)
  const row = Math.floor(y / cardSize.value)
  const idx = row * gridCols.value + col
  const card = cards[idx]

  if (!card || card.revealed || card.matched)
    return

  clickAudio.currentTime = 0
  clickAudio.play()

  card.revealed = true
  flipped.push(idx)
  drawBoard()

  if (flipped.length === 2) {
    moves.value++
    gameStore.currentGame!.moves = moves.value
    isProcessing.value = true
    const [i1, i2] = flipped

    if (cards[i1].url === cards[i2].url) {
      cards[i1].matched = true
      cards[i2].matched = true

      pairAudio.currentTime = 0
      pairAudio.play()

      resetSelection()

      if (cards.every(c => c.matched)) {
        isGameFinished.value = true
        const duration = Math.floor((Date.now() - startTime.value) / 1000)

        gameStore.finishGame({ moves: moves.value, time: duration })

        endAudio.currentTime = 0
        endAudio.play()

        confetti({
          particleCount: 100,
          startVelocity: 30,
          spread: 360,
        })
      }
    }
    else {
      setTimeout(() => {
        cards[i1].revealed = false
        cards[i2].revealed = false

        resetSelection()

        if (cards.every(c => c.matched)) {
          isGameFinished.value = true
          const duration = Math.floor((Date.now() - startTime.value) / 1000)

          gameStore.finishGame({ moves: moves.value, time: duration })

          endAudio.currentTime = 0
          endAudio.play()

          confetti({
            particleCount: 100,
            startVelocity: 30,
            spread: 360,
          })
        }
      }, 500)
    }
  }
}

// Reset flipped selections
function resetSelection() {
  flipped.splice(0, flipped.length)
  isProcessing.value = false
  drawBoard()
}

// Start a new game when user clicks
function startGame(): void {
  if (gameStore.currentGame?.status === GameStatuses.IN_PROGRESS) {
    gameStore.cancelGame()
  }

  isGameStarted.value = true
  isGameFinished.value = false
  moves.value = 0
  startTime.value = Date.now()

  gameStore.setNewGame({ difficulty: selectedDifficulty.value })
  initGame()
  nextTick(() => drawBoard())
}

// When grid size changes (CUSTOM), regenerate seed and reset board
// Apply seed string changes entered by user
watch(seed, (val) => {
  const match = val.match(/^(\w+)-(\d+)-(\d+)$/)

  if (!match) {
    return
  }
  const [, diffStr, colsStr, rowsStr] = match
  const diff = diffStr as GameDifficulty

  if (!Object.values(GameDifficulties).includes(diff)) {
    return
  }

  selectedDifficulty.value = diff

  if (diff === GameDifficulties.CUSTOM) {
    const cols = sanitizeGridValue(Number(colsStr))
    const rows = sanitizeGridValue(Number(rowsStr))
    gridCols.value = cols
    gridRows.value = rows
    seed.value = `${diff}-${cols}-${rows}`
  }
  else {
    gridCols.value = gridMap[diff].cols
    gridRows.value = gridMap[diff].rows
    seed.value = `${diff}-${gridMap[diff].cols}-${gridMap[diff].rows}`
  }

  updateCardSize()

  if (isGameStarted.value) {
    // fully restart game to reset stats and timer

    isGameStarted.value = false
    isGameFinished.value = false
    moves.value = 0
    startTime.value = Date.now()

    gameStore.cancelGame()
    resetSelection()
  }
  else {
    resetSelection()
  }
})

watch([gridCols, gridRows], () => {
  updateCardSize()

  seed.value = `${selectedDifficulty.value}-${gridCols.value}-${gridRows.value}`

  if (selectedDifficulty.value === GameDifficulties.CUSTOM) {
    resetSelection()

    if (isGameStarted.value) {
      initGame()
      nextTick(() => drawBoard())
    }
  }
})

// React to difficulty changes: reset game state when difficulty changes
watch(selectedDifficulty, (val) => {
  if (val !== GameDifficulties.CUSTOM) {
    gridCols.value = gridMap[val].cols
    gridRows.value = gridMap[val].rows
  }

  // update seed for new difficulty
  seed.value = `${val}-${gridCols.value}-${gridRows.value}`
  updateCardSize()

  isGameStarted.value = false
  isGameFinished.value = false
  moves.value = 0
  startTime.value = Date.now()

  gameStore.cancelGame()
  resetSelection()
})

// On mount, start the game
onMounted(() => {
  initGame()
  drawBoard()
})
</script>

<template>
  <div class="w-full">
    <div class="mx-auto">
      <div class="flex flex-col lg:flex-row gap-8">
        <div class="flex-1">
          <div class="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div class="w-full sm:w-64">
                <label class="block text-sm font-medium text-gray-300 mb-1">Poziom trudności:</label>
                <select
                  v-model="selectedDifficulty"
                  class="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="easy">Łatwy (6 par)</option>
                  <option value="medium">Średni (10 par)</option>
                  <option value="hard">Trudny (15 par)</option>
                  <option value="custom">Własny</option>
                </select>
              </div>

              <div class="w-full sm:w-48">
                <div class="text-sm font-medium text-gray-300 mb-1">Rozmiar planszy:</div>
                <div class="text-white font-mono bg-gray-700 px-4  rounded-lg text-center" :class="{ 'py-3': selectedDifficulty !== GameDifficulties.CUSTOM }">
                  <div v-if="selectedDifficulty !== GameDifficulties.CUSTOM">
                    {{ gridCols }} × {{ gridRows }}
                  </div>

                  <div v-if="selectedDifficulty === GameDifficulties.CUSTOM" class="flex items-center gap-2 py-2 w-full">
                    <div>
                      <input
                        v-model="gridCols"
                        type="number"
                        max="10"
                        min="2"
                        class="w-full bg-gray-700 text-white px-3 py-1 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        @change="onGridColsChange"
                      >
                    </div>

                    <div>x</div>

                    <div>
                      <input
                        v-model="gridRows"
                        type="number"
                        max="10"
                        min="2"
                        class="w-full bg-gray-700 text-white px-3 py-1 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        @change="onGridRowsChange"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex-1 w-full sm:w-auto">
                <label class="block text-sm font-medium text-gray-300 mb-1">Kod gry:</label>
                <div class="relative">
                  <div>
                    <input
                      v-model="seed"
                      :readonly="selectedDifficulty !== GameDifficulties.CUSTOM"
                      type="text"
                      class="w-full bg-gray-700 text-white px-4 py-3 pr-10 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                  </div>

                  <button
                    title="Losuj nowy kod"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                    @click="copySeed"
                  >
                    <MdiContentCopy class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-800 rounded-xl p-4 md:p-6 shadow-2xl overflow-auto">
            <div class="flex justify-center">
              <div v-if="!isGameStarted && !isError" class="flex flex-col items-center justify-center p-12 text-center h-[430px]">
                <h2 class="text-2xl font-bold text-white mb-6">Gotowy na grę?</h2>
                <p class="text-gray-300 mb-8 max-w-md">Kliknij przycisk poniżej, aby rozpocząć nową grę.</p>
                <button
                  class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  @click="startGame"
                >
                  <span class="flex items-center">
                    <MdiPlayCircle class="h-5 w-5 mr-2" />
                    Rozpocznij grę
                  </span>
                </button>
              </div>

              <div v-else-if="isGameFinished" class="flex flex-col items-center justify-center p-12 text-center h-[430px]">
                <h2 class="text-2xl font-bold text-white mb-6">Gratulacje! Ukończyłeś grę!</h2>
                <div class="text-gray-300 mb-8 max-w-md">
                  <p>Czas: {{ Math.floor((Date.now() - startTime) / 1000) }} sekund</p>
                  <p>Ruchy: {{ moves }}</p>
                </div>

                <button
                  class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  @click="startGame"
                >
                  <span class="flex items-center">
                    <MdiPlayCircle class="h-5 w-5 mr-2" />
                    Rozpocznij nową grę
                  </span>
                </button>
              </div>

              <div v-else-if="isError" class="flex items-center flex-col text-center p-8">
                <div class="text-red-400 mb-4">
                  <MdiAlertCircle class="h-12 w-12" />
                </div>
                <p class="text-lg font-medium text-white mb-4">Wystąpił błąd podczas ładowania gry</p>
                <button
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  @click="weaponStore.fetchWeapons()"
                >
                  Spróbuj ponownie
                </button>
              </div>

              <canvas
                v-else
                ref="canvasRef"
                :width="gridCols * cardSize"
                :height="gridRows * cardSize"
                class="w-full rounded-lg shadow-lg cursor-pointer"
                @click="handleClick"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
