<script setup>


const weaponStore = useWeaponsStore();

const canvasRef = ref(null);

const rows = 5;
const cols = 5;
const cardSize = 100; // adjust canvas size accordingly (5*100 = 500)

// Backside image for cards
const backImage = new Image();
backImage.src = weaponStore.backImageUrl || '';

// Game state
const cards = reactive([]);
const flipped = reactive([]);
const isProcessing = ref(false);

// Shuffle helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function initGame() {
  // Get available weapon images from store
  const allImages = weaponStore.weapons.map(w => w.image);
  shuffle(allImages);
  // For 5x5 = 25 cards, pick 12 pairs and one extra
  const neededPairs = Math.floor((rows * cols) / 2);
  const selected = allImages.slice(0, neededPairs + 1);
  const deck = [];
  // Create pairs
  for (let i = 0; i < neededPairs; i++) {
    deck.push(selected[i], selected[i]);
  }
  // Add one extra of the last image to fill odd slot
  deck.push(selected[neededPairs]);
  shuffle(deck);

  // Initialize card objects
  cards.splice(0, cards.length);
  deck.forEach((url) => {
    const img = new Image();
    img.src = url;
    cards.push({ img, url, revealed: false, matched: false });
  });
}

function drawBoard() {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  cards.forEach((card, index) => {
    const x = (index % cols) * cardSize;
    const y = Math.floor(index / cols) * cardSize;
    if (card.revealed || card.matched) {
      ctx.drawImage(card.img, x, y, cardSize, cardSize);
    } else {
      ctx.drawImage(backImage, x, y, cardSize, cardSize);
    }
    // Optional: draw border
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x, y, cardSize, cardSize);
  });
}

function handleClick(event) {
  if (isProcessing.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const col = Math.floor(x / cardSize);
  const row = Math.floor(y / cardSize);
  const idx = row * cols + col;
  const card = cards[idx];
  if (!card || card.revealed || card.matched) return;

  card.revealed = true;
  flipped.push(idx);
  drawBoard();

  if (flipped.length === 2) {
    isProcessing.value = true;
    const [i1, i2] = flipped;
    if (cards[i1].url === cards[i2].url) {
      cards[i1].matched = true;
      cards[i2].matched = true;
      resetSelection();
    } else {
      setTimeout(() => {
        cards[i1].revealed = false;
        cards[i2].revealed = false;
        resetSelection();
      }, 1000);
    }
  }
}

function resetSelection() {
  flipped.splice(0, flipped.length);
  isProcessing.value = false;
  drawBoard();
}

onMounted(() => {
  initGame();
  drawBoard();
});
</script>


<template>
  <canvas ref="canvasRef" :width="cols * cardSize" :height="rows * cardSize" @click="handleClick"></canvas>
</template>


<style scoped>
canvas {
  border: 2px solid #000;
  cursor: pointer;
}
</style>