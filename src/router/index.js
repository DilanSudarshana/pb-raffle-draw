/**
 * router/index.js - Vue Router Configuration
 *
 * Public:
 *   /admin/login
 *   /
 *
 * Protected:
 *   /admin/*
 */

import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'
import { supabase } from '@/lib/supabase'

const routes = [
  // =========================================================
  // PUBLIC ROUTES
  // =========================================================

  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('@/views/authentication/login.vue'),
    meta: {
      requiresGuest: true,
    },
  },

  {
    path: '/',
    name: 'Register',
    component: () => import('@/views/user_register/user_register.vue'),
  },

  // =========================================================
  // PROTECTED ADMIN ROUTES
  // =========================================================

  {
    path: '/admin',
    component: DefaultLayout,
    meta: {
      requiresAuth: true,
    },

    redirect: '/admin/dashboard',

    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
      },
    ],
  },

  // =========================================================
  // 404
  // =========================================================

  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),

  routes,

  scrollBehavior() {
    return {
      top: 0,
    }
  },
})

// =========================================================
// AUTHENTICATION GUARD
//
// requiresAuth uses getUser(), which round-trips to the Supabase
// Auth server and validates the token — this cannot be fooled by
// a stale local session. Not logged in → redirect to '/' per
// requirement.
// =========================================================

router.beforeEach(async (to) => {
  console.log('[guard] navigating to:', to.fullPath, 'meta:', to.meta)

  if (to.meta.requiresAuth) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log('[guard] requiresAuth — user:', user, 'error:', error)

    if (error || !user) {
      console.log('[guard] BLOCKED, redirecting to /')
      return '/'
    }

    console.log('[guard] ALLOWED')
    return true
  }

  if (to.meta.requiresGuest) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      return '/admin/dashboard'
    }
  }

  return true
})

// =========================================================
// GLOBAL AUTH STATE LISTENER
//
// beforeEach only re-checks auth when a navigation happens.
// If the user logs out while sitting on a protected page (no
// navigation triggered), the guard above never re-runs. This
// listener reacts directly to Supabase's own auth events.
// =========================================================

supabase.auth.onAuthStateChange((event) => {
  console.log('[auth] event:', event)
  if (event === 'SIGNED_OUT') {
    if (router.currentRoute.value.path !== '/') {
      router.replace('/')
    }
  }
})

export default router
