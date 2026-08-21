/**
 * router/index.js - Vue Router Configuration
 *
 * This file configures the application routing using Vue Router 5.
 * It defines all routes and navigation structure for the SPA.
 *
 * Routing Features:
 * - Hash-based routing (createWebHashHistory) for static hosting compatibility
 * - Lazy loading for all route components (code splitting)
 * - Nested routes for layout-based navigation
 * - Automatic scroll to top on navigation
 *
 * Route Structure:
 * - Protected routes: Wrapped in DefaultLayout with sidebar and header
 * - Public routes: Login, Register, 404, 500 pages without layout
 *
 * Adding New Routes:
 * 1. Import component (use dynamic import for code splitting)
 * 2. Add route object to appropriate section
 * 3. Update _nav.js for sidebar navigation (if needed)
 *
 * @see https://router.vuejs.org/
 */

import { h, resolveComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'

/**
 * Application routes configuration
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('@/views/authentication/login.vue'),
  },

  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/user_register/user_register.vue'),
  },

  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () =>
          import(/* webpackChunkName: "dashboard" */ '@/views/dashboard/Dashboard.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

export default router
