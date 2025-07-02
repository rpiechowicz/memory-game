<script setup lang="ts">
import MdiArrowLeftBold from '~icons/mdi/arrow-left-bold'
import MdiArrowRightBold from '~icons/mdi/arrow-right-bold'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const pages = computed(() => Array.from({ length: props.totalPages }, (_, i) => i + 1))

function goTo(p: number): void {
  if (p < 1 || p > props.totalPages || p === props.page)
    return

  emit('update:page', p)
}
</script>

<template>
  <nav v-if="props.totalPages >= 1" class="flex items-center justify-center gap-2 mt-4">
    <button
      class="px-2 py-2 rounded bg-slate-700 text-white disabled:opacity-50"
      :disabled="props.page === 1"
      @click="goTo(props.page - 1)"
    >
      <MdiArrowLeftBold />
    </button>

    <button
      v-for="p in pages"
      :key="p"
      class="px-3 py-1 rounded focus:outline-none"
      :class="p === props.page ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'"
      @click="goTo(p)"
    >
      {{ p }}
    </button>

    <button
      class="px-2 py-2 rounded bg-slate-700 text-white disabled:opacity-50"
      :disabled="props.page === props.totalPages"
      @click="goTo(props.page + 1)"
    >
      <MdiArrowRightBold />
    </button>
  </nav>
</template>
