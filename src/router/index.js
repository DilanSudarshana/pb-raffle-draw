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
    path: '/',
    name: 'Register',
    component: () => import('@/views/user_register/user_register.vue'),
  },

  {
    path: '/kiosk',
    name: 'kiosk',
    component: () => import('@/views/kiosk/kiosk.vue'),
  },

  {
    path: '/raffle_draw',
    name: 'raffle_draw',
    component: () => import('@/views/raffle_draw/raffle_draw.vue'),
  },

  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('@/views/authentication/login.vue'),
    meta: {
      requiresGuest: true,
    },
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
      {
        path: 'participants',
        name: 'Participants',
        component: () => import('@/views/admin/participants/participant_main.vue'),
      },
      {
        path: 'participants/:id',
        name: 'ParticipantView',
        component: () => import('@/views/admin/participants/participant_update.vue'),
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
  if (to.meta.requiresAuth) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return '/'
    }

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
  if (event === 'SIGNED_OUT') {
    if (router.currentRoute.value.path !== '/') {
      router.replace('/')
    }
  }
})

export default router
