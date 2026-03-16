import { createRouter, createWebHistory } from 'vue-router';

import { env } from '@/config/env';
const router = createRouter({
  history: createWebHistory(env.APP_BASE_PATH),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/school/:academyId',
      name: 'SchoolDetail',
      component: () => import('../views/SchoolDetail.vue')
    }
  ]
});

export default router;
