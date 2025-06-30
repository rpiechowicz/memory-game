<script setup lang="ts">
const weaponsStore = useWeaponsStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const seed = ref(Math.random().toString(36).substring(2, 10))
const selectedDifficulty = ref<'easy' | 'medium' | 'hard'>('easy')

function getTileCount(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return 12
    case 'medium':
      return 20
    case 'hard':
      return 30
    default:
      return 12
  }
}

function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array]
  let s = 0
  for (let i = 0; i < seed.length; i++) {
    s += seed.charCodeAt(i)
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
    s = (s * 9301 + 49297) % 233280
  }

  return result
}

function getRandomTiles(): any[] {
  const pool = [...weaponsStore.weapons]
  const count = getTileCount(selectedDifficulty.value)
  const shuffled = seededShuffle(pool, seed.value).slice(0, count / 2)
  return [...shuffled, ...shuffled].sort(() => Math.random() - 0.5)
}

const tiles = ref<any[]>([])

watch([seed, selectedDifficulty], () => {
  tiles.value = getRandomTiles()
  drawTiles()
}, { immediate: true })

function drawTiles() {
  const canvas = canvasRef.value
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const tileSize = 100
  const gap = 10
  const cols = 4
  const rows = Math.ceil(getTileCount(selectedDifficulty.value) / cols)
  canvas.width = cols * (tileSize + gap) - gap
  canvas.height = rows * (tileSize + gap) - gap

  let x = 0
  let y = 0
  let loadedCount = 0
  const tileImages: { img: HTMLImageElement, x: number, y: number }[] = []

  tiles.value.forEach((tile, i) => {
    const img = new Image()
    img.src = tile.image
    const pos = { x, y }
    tileImages.push({ img, ...pos })

    img.onload = () => {
      loadedCount++
      if (loadedCount === tiles.value.length) {
        tileImages.forEach(({ img, x, y }) => {
          ctx.fillStyle = '#444'
          ctx.fillRect(x, y, tileSize, tileSize)
          ctx.drawImage(img, x + 5, y + 5, tileSize - 10, tileSize - 10)
        })
      }
    }

    x += tileSize + gap
    if ((i + 1) % cols === 0) {
      x = 0
      y += tileSize + gap
    }
  })
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas)
    return

  drawTiles()
})
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex gap-4 items-center">
      <label>
        Seed:
        <input v-model="seed" class="border px-2 py-1 rounded" />
      </label>
      <label>
        Poziom:
        <select v-model="selectedDifficulty" class="border px-2 py-1 rounded">
          <option value="easy">Łatwy</option>
          <option value="medium">Średni</option>
          <option value="hard">Trudny</option>
        </select>
      </label>
    </div>
    <div class="flex justify-center items-center">
      <canvas ref="canvasRef" class="border border-gray-500 rounded" />
    </div>
  </div>
</template>
