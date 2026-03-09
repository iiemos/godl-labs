import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/stake',
      name: 'stake',
      component: () => import('../views/StakeView.vue')
    },
    {
      path: '/governance-data',
      name: 'governance-data',
      component: () => import('../views/TeamView.vue')
    },
    {
      path: '/mine',
      name: 'mine',
      component: () => import('../views/MineView.vue')
    },
    {
      path: '/swap',
      name: 'swap',
      component: () => import('../views/SwapView.vue')
    }
  ]
})

export default router
