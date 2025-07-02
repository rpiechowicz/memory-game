import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
  },

  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'pinia', '@vueuse/core'],
      dts: false,
    }),
  ],
})
