<script setup lang="ts">
import type { GameCard, GameDifficulty } from '@/types/store/game'
import confetti from 'canvas-confetti'
import { v4 as uuid } from 'uuid'
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

const startTime = ref<number>(0)
const moves = ref<number>(0)
const seed = ref<string>(uuid())
const selectedDifficulty = ref<GameDifficulty>(GameDifficulties.EASY)

const cards = reactive<GameCard[]>([])
const flipped = reactive<number[]>([])
const isProcessing = ref<boolean>(false)
const cardSize = ref<number>(140)
const dpr = ref<number>(window.devicePixelRatio || 1)

const gridMap: Record<GameDifficulty, { cols: number, rows: number }> = {
  [GameDifficulties.EASY]: { cols: 4, rows: 3 },
  [GameDifficulties.MEDIUM]: { cols: 5, rows: 4 },
  [GameDifficulties.HARD]: { cols: 6, rows: 5 }
}

const gridCols = computed(() => gridMap[selectedDifficulty.value].cols)
const gridRows = computed(() => gridMap[selectedDifficulty.value].rows)

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
    // Prepare items with image and rarity color
    const deck = ref<{ image: string, rarityColor: string }[]>([])
    const items = shuffle([...weaponStore.weapons])
    const total = gridCols.value * gridRows.value
    const pairCount = Math.floor(total / 2)
    const selectedItems = items.slice(0, pairCount)

    selectedItems.forEach((item) => {
      deck.value.push({ image: item.image, rarityColor: item.rarity.color })
      deck.value.push({ image: item.image, rarityColor: item.rarity.color })
    })

    if (total % 2 !== 0) {
      const extra = items[pairCount]
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

// React to difficulty changes: reset game state when difficulty changes
watch(selectedDifficulty, () => {
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
                  class="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="easy">Łatwy (6 par)</option>
                  <option value="medium">Średni (10 par)</option>
                  <option value="hard">Trudny (15 par)</option>
                </select>
              </div>

              <div class="w-full sm:w-48">
                <div class="text-sm font-medium text-gray-300 mb-1">Rozmiar planszy:</div>
                <div class="text-white font-mono bg-gray-700 px-4 py-2 rounded-lg text-center">
                  {{ gridCols }} × {{ gridRows }}
                </div>
              </div>

              <div class="flex-1 w-full sm:w-auto">
                <label class="block text-sm font-medium text-gray-300 mb-1">Kod gry:</label>
                <div class="relative">
                  <input
                    v-model="seed"
                    type="text"
                    class="w-full bg-gray-700 text-white px-4 py-2 pr-10 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    readonly
                  >
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
