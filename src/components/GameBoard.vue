<script setup lang="ts">
import { v4 as uuid } from 'uuid';
import confetti from 'canvas-confetti';
import clickSound from '@/assets/audio/click.wav';
import pairSound from '@/assets/audio/pair.wav';
import endSound from '@/assets/audio/end.wav';

// Stores
const weaponStore = useWeaponsStore();
const userStore = useUserStore();
const gameStore = useGameStore();

const clickAudio = new Audio(clickSound)
const pairAudio = new Audio(pairSound)
const endAudio = new Audio(endSound)

// Difficulty and grid settings
const selectedDifficulty = ref<'easy' | 'medium' | 'hard'>('easy');
const gridMap: Record<string, { cols: number; rows: number }> = {
  easy: { cols: 4, rows: 3 },    // 6 pairs
  medium: { cols: 5, rows: 4 },  // 10 pairs
  hard: { cols: 6, rows: 5 },    // 15 pairs
};
const gridCols = computed(() => gridMap[selectedDifficulty.value].cols);
const gridRows = computed(() => gridMap[selectedDifficulty.value].rows);

// Game seed (code)
const seed = ref<string>(uuid());
const isGameStarted = ref<boolean>(false);
const moves = ref<number>(0);
const startTime = ref<number>(0);
const isGameFinished = ref<boolean>(false);

// Loading/error state
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

// Canvas reference
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Device Pixel Ratio for HiDPI screens
const dpr = window.devicePixelRatio || 1

// Card dimensions
const cardSize = 140;

// Backside image
const backImage = new Image();

// Game state
interface Card {
  img: HTMLImageElement;
  url: string;
  rarityColor: string;
  revealed: boolean;
  matched: boolean;
}
const cards = reactive<Card[]>([]);
const flipped = reactive<number[]>([]);
const isProcessing = ref<boolean>(false);

// Utility: shuffle array
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize the board based on difficulty and seed
function initGame() {
  isLoading.value = true;
  error.value = null;
  cards.splice(0, cards.length);
  try {
    // Prepare items with image and rarity color
    const items = shuffle([...weaponStore.weapons]);
    const total = gridCols.value * gridRows.value;
    const pairCount = Math.floor(total / 2);
    const selectedItems = items.slice(0, pairCount);
    let deck: { image: string; rarityColor: string }[] = [];
    selectedItems.forEach(item => {
      deck.push({ image: item.image, rarityColor: item.rarity.color });
      deck.push({ image: item.image, rarityColor: item.rarity.color });
    });
    if (total % 2 !== 0) {
      const extra = items[pairCount];
      deck.push({ image: extra.image, rarityColor: extra.rarity.color });
    }
    shuffle(deck);
    deck.forEach(cardInfo => {
      const img = new Image();
      img.src = cardInfo.image;
      cards.push({
        img,
        url: cardInfo.image,
        rarityColor: cardInfo.rarityColor,
        revealed: false,
        matched: false
      });
    });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    isLoading.value = false;
  }
}

// Draw the current state onto the canvas
function drawBoard() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Set CSS size
  canvas.style.width = `${gridCols.value * cardSize}px`;
  canvas.style.height = `${gridRows.value * cardSize}px`;
  // Set actual resolution for HiDPI
  canvas.width = gridCols.value * cardSize * dpr;
  canvas.height = gridRows.value * cardSize * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, gridCols.value * cardSize, gridRows.value * cardSize);
  cards.forEach((card, i) => {
    const x = (i % gridCols.value) * cardSize;
    const y = Math.floor(i / gridCols.value) * cardSize;
    if (card.revealed || card.matched) {
      // draw gradient background
      const bgGrad = ctx.createLinearGradient(x, y, x + cardSize, y + cardSize);
      bgGrad.addColorStop(0, card.rarityColor);
      bgGrad.addColorStop(1, '#000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(x, y, cardSize, cardSize);
      // draw the card image
      ctx.drawImage(card.img, x, y, cardSize, cardSize);
    } else {
      // draw the card back
      ctx.drawImage(backImage, x, y, cardSize, cardSize);
    }
    // draw border
    ctx.strokeStyle = '#131A29';
    ctx.strokeRect(x, y, cardSize, cardSize);
  });
}

// Handle click events on the canvas
function handleClick(event: MouseEvent) {
  if (isProcessing.value || isLoading.value || error.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  // Use CSS pixel coordinates for tile detection
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const col = Math.floor(x / cardSize);
  const row = Math.floor(y / cardSize);
  const idx = row * gridCols.value + col;
  const card = cards[idx];
  if (!card || card.revealed || card.matched) return;

  clickAudio.currentTime = 0
  clickAudio.play()

  card.revealed = true;
  flipped.push(idx);
  drawBoard();

  if (flipped.length === 2) {
    moves.value++;
    gameStore.currentGame!.moves = moves.value;
    isProcessing.value = true;
    const [i1, i2] = flipped;
    if (cards[i1].url === cards[i2].url) {
      cards[i1].matched = true;
      cards[i2].matched = true;
      pairAudio.currentTime = 0
      pairAudio.play()
      resetSelection();
      if (cards.every(c => c.matched)) {
        isGameFinished.value = true;
        const duration = Math.floor((Date.now() - startTime.value) / 1000);
        gameStore.finishGame({ moves: moves.value, time: duration });
        endAudio.currentTime = 0
        endAudio.play()
        confetti({
          particleCount: 100,
          startVelocity: 30,
          spread: 360,
        });
      }
    } else {
      setTimeout(() => {
        cards[i1].revealed = false;
        cards[i2].revealed = false;
        resetSelection();
        if (cards.every(c => c.matched)) {
          isGameFinished.value = true;
          const duration = Math.floor((Date.now() - startTime.value) / 1000);
          gameStore.finishGame({ moves: moves.value, time: duration });
        }
      }, 500);
    }
  }
}

// Reset flipped selections
function resetSelection() {
  flipped.splice(0, flipped.length);
  isProcessing.value = false;
  drawBoard();
}

// Start a new game when user clicks
function startGame(): void {
  isGameStarted.value = true;
  isGameFinished.value = false;
  moves.value = 0;
  startTime.value = Date.now();
  gameStore.setNewGame({ difficulty: selectedDifficulty.value });
  initGame();
  nextTick(() => drawBoard());
}

// React to difficulty changes: reset game state when difficulty changes
watch(selectedDifficulty, () => {
  isGameStarted.value = false;
  isGameFinished.value = false;
  moves.value = 0;
  gameStore.cancelGame();
  resetSelection();
});

// On mount, start the game
onMounted(() => {
  initGame();
  drawBoard();
});
</script>


<template>
  <div class="bg-gray-900 text-white p-4 w-full">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <header class="mb-8 text-center">
        <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Memory Game - Counter Strike 2
        </h1>
      </header>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column: Game -->
        <div class="flex-1">
          <!-- Controls -->
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
                    @click="seed = uuid()"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Game Board -->
          <div class="bg-gray-800 rounded-xl p-4 md:p-6 shadow-2xl overflow-auto">
            <div class="flex justify-center">
              <!-- Show start button when game hasn't started -->
              <div v-if="!isGameStarted" class="flex flex-col items-center justify-center p-12 text-center h-[430px]">
                <h2 class="text-2xl font-bold text-white mb-6">Gotowy na grę?</h2>
                <p class="text-gray-300 mb-8 max-w-md">Kliknij przycisk poniżej, aby rozpocząć nową grę.</p>
                <button
                  @click="startGame"
                  class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
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
                  @click="startGame"
                  class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                    Rozpocznij nową grę
                  </span>
                </button>
              </div>

              <div
                v-else-if="isLoading"
                class="flex items-center justify-center p-12 text-gray-400"
              >
                <svg class="animate-spin h-8 w-8 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Ładowanie gry...</span>
              </div>

              <div v-else-if="error" class="text-center p-8">
                <div class="text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p class="text-lg font-medium text-white mb-4">Wystąpił błąd podczas ładowania gry</p>
                <p class="text-gray-300 mb-6">{{ error }}</p>
                <button
                  @click="startGame()"
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Spróbuj ponownie
                </button>
              </div>

              <canvas
                v-else
                ref="canvasRef"
                :width="gridCols * cardSize"
                :height="gridRows * cardSize"
                @click="handleClick"
                class="w-full rounded-lg shadow-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- Right Column: Info Panel -->
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
                  {{ gameStore.games.length > 0 ? gameStore.bestTime + ' sekund': '-' }}
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
      </div>
    </div>
  </div>
</template>