<template>
  <CHeader position="sticky" :class="headerClassNames">
    <CContainer class="border-bottom px-4" fluid>
      <CHeaderToggler @click="sidebar.toggleVisible()" style="margin-inline-start: -14px">
        <CIcon icon="cil-menu" size="lg" />
      </CHeaderToggler>

      <CHeaderNav class="d-none d-md-flex">
        <CNavItem>
          <CNavLink href="/dashboard"> Dashboard </CNavLink>
        </CNavItem>

        <CDropdown variant="nav-item">
          <CDropdownToggle :caret="true">
            <CIcon icon="cil-history" class="me-1" />
            Recent History
          </CDropdownToggle>
          <CDropdownMenu style="min-width: 350px; max-height: 400px; overflow-y: auto;">
            <CDropdownHeader>Recent Activity</CDropdownHeader>

            <div v-if="recentHistory.length === 0" class="px-3 py-2 text-muted">
              No recent history
            </div>

            <template v-else>
              <CDropdownItem v-for="item in recentHistory" :key="item.id"
                class="d-flex align-items-center justify-content-between py-2 px-3"
                style="border: none; cursor: default;">
                <div class="flex-grow-1 me-2 d-flex align-items-center" style="cursor: pointer;"
                  @click="navigateToItem(item.url)">
                  <div>
                    <div class="fw-semibold text-truncate" style="max-width: 220px;">
                      <small>{{ item.title }}</small>
                    </div>
                    <small class="text-muted">
                      <CIcon icon="cil-clock" size="sm" class="me-1 text-muted" />
                      {{ formatTimestamp(item.timestamp) }}
                    </small>
                  </div>
                </div>
                <CButton variant="ghost" size="sm" class="p-1 ms-2" @click.stop="removeHistoryItem(item.id)"
                  style="min-width: auto; border: none;">
                  <CIcon icon="cil-x" size="sm" class="text-danger" />
                </CButton>
              </CDropdownItem>

              <CDropdownDivider />

              <CDropdownItem class="text-center text-primary" @click="recentHistory = []">
                <CIcon icon="cil-trash" size="sm" class="me-1" />
                <small>Clear All History</small>
              </CDropdownItem>
            </template>
          </CDropdownMenu>
        </CDropdown>
      </CHeaderNav>

      <CHeaderNav class="ms-auto">
        <CNavItem>
          <CNavLink href="#">
            <CIcon icon="cil-bell" size="lg" />
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href="#">
            <CIcon icon="cil-envelope-open" size="lg" />
          </CNavLink>
        </CNavItem>
      </CHeaderNav>

      <CHeaderNav>
        <li class="nav-item py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75"></div>
        </li>
        <CDropdown variant="nav-item" placement="bottom-end">
          <CDropdownToggle :caret="false">
            <CIcon v-if="colorMode === 'dark'" icon="cil-moon" size="lg" />
            <CIcon v-else-if="colorMode === 'light'" icon="cil-sun" size="lg" />
            <CIcon v-else icon="cil-contrast" size="lg" />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem :active="colorMode === 'light'" class="d-flex align-items-center" component="button"
              type="button" @click="setColorMode('light')">
              <CIcon class="me-2" icon="cil-sun" size="lg" /> Light
            </CDropdownItem>
            <CDropdownItem :active="colorMode === 'dark'" class="d-flex align-items-center" component="button"
              type="button" @click="setColorMode('dark')">
              <CIcon class="me-2" icon="cil-moon" size="lg" /> Dark
            </CDropdownItem>
            <CDropdownItem :active="colorMode === 'auto'" class="d-flex align-items-center" component="button"
              type="button" @click="setColorMode('auto')">
              <CIcon class="me-2" icon="cil-contrast" size="lg" /> Auto
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
        <li class="nav-item py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75"></div>
        </li>
        <AppHeaderDropdownAccnt />
      </CHeaderNav>
    </CContainer>

    <CContainer class="px-4" fluid>
      <AppBreadcrumb />
    </CContainer>
  </CHeader>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useColorModes } from '@coreui/vue'
import { useRoute, useRouter } from 'vue-router'

import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppHeaderDropdownAccnt from '@/components/AppHeaderDropdownAccnt.vue'
import { useSidebarStore } from '@/stores/sidebar.js'

const headerClassNames = ref('mb-4 p-0')
const { colorMode, setColorMode } = useColorModes('coreui-free-vue-admin-template-theme')
const sidebar = useSidebarStore()
const route = useRoute()
const router = useRouter()

// ── Recent history ─────────────────────────────────────────────────────────
const recentHistory = ref([])
const maxHistoryItems = 10

const getRouteTitle = (routeObj) => {
  if (routeObj.meta?.title) return routeObj.meta.title
  if (routeObj.name) {
    return routeObj.name.toString()
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  return routeObj.path
}

const formatTimestamp = (date) => {
  const diff = Date.now() - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const addToHistory = (routeObj) => {
  const title = getRouteTitle(routeObj)
  const path = routeObj.path

  // Skip if same as last entry
  if (recentHistory.value.length > 0 && recentHistory.value[0].url === path) return

  // Remove duplicate, prepend new entry
  recentHistory.value = recentHistory.value.filter(item => item.url !== path)
  recentHistory.value.unshift({ id: Date.now(), title, url: path, timestamp: new Date(), routeName: routeObj.name })

  // Trim to max
  if (recentHistory.value.length > maxHistoryItems) {
    recentHistory.value = recentHistory.value.slice(0, maxHistoryItems)
  }
}

const removeHistoryItem = (id) => {
  recentHistory.value = recentHistory.value.filter(item => item.id !== id)
}

const navigateToItem = (url) => {
  router.push(url)
}

// Track every route change
watch(route, (newRoute) => {
  addToHistory(newRoute)
}, { immediate: true })

// ── Scroll shadow ──────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener('scroll', () => {
    headerClassNames.value = document.documentElement.scrollTop > 0
      ? 'mb-4 p-0 shadow-sm'
      : 'mb-4 p-0'
  })
})
</script>

<style scoped>
@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

.nav-link:hover {
  transform: translateY(-2px);
}
</style>