import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.ts', '.vue'],
  },
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'pinia', '@vueuse/core', 'vue-router'],
      dirs: ['src/composables', 'src/store'],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'src/components.d.ts'
    }),
    Icons({
      autoInstall: true,
    }),
  ]
})
