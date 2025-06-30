import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/',
    name: '',
    component: async () => await import('@/layouts/default.vue'),
    meta: {
      open: false,
    },
    children: [
      {
        path: '/',
        name: 'dashboard',
        component: async () => await import('@/pages/dashboard.vue'),
      },
    ],
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  strict: true,
  scrollBehavior: () => {
    return { top: 0, behavior: 'smooth' }
  },
})

export default router
