<template>
  <CSidebar class="modern-sidebar border-end" colorScheme="dark" position="fixed" :unfoldable="sidebar.unfoldable"
    :visible="sidebar.visible" @visible-change="(value) => sidebar.toggleVisible(value)">

    <CSidebarHeader class="sidebar-header border-bottom">
      <RouterLink custom to="/" v-slot="{ href, navigate }">
        <CSidebarBrand v-bind="$attrs" as="a" :href="href" @click="navigate" class="brand-container">
          <div class="brand-wrapper" :class="{ 'loaded': isLoaded }">
            <div class="logo-container">
              <div class="logo-ring"></div>
              <div class="logo-inner">
                <img src="/src/assets/logo/logo.jpg" alt="PB LearnPro Logo" class="logo-image" />
              </div>
            </div>
            <div class="brand-text" v-if="!sidebar.unfoldable">
              <span class="brand-title">PB RAFFLE DRAW</span>
              <span class="brand-subtitle">FinTech Challenge</span>
            </div>
          </div>
        </CSidebarBrand>
      </RouterLink>
      <CCloseButton class="close-btn d-lg-none" dark @click="sidebar.toggleVisible()" />
    </CSidebarHeader>

    <div class="nav-container">
      <AppSidebarNav />
    </div>

    <CSidebarFooter class="sidebar-footer border-top d-none d-lg-flex">
      <div class="footer-content">
        <CSidebarToggler @click="sidebar.toggleUnfoldable()" class="toggle-btn" />
      </div>
    </CSidebarFooter>

  </CSidebar>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { AppSidebarNav } from '@/components/AppSidebarNav.js'
import { useSidebarStore } from '@/stores/sidebar.js'
import { ref, onMounted } from 'vue'

const sidebar = useSidebarStore()
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<style scoped>
.modern-sidebar {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

.sidebar-header {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.sidebar-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.05), transparent);
  animation: shimmer 3s infinite;
}

.brand-container {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  width: 100%;
}

.brand-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(-10px);
  width: 100%;
}

.brand-wrapper.loaded {
  opacity: 1;
  transform: translateY(0);
}

.brand-wrapper:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

/* ── Logo ── */
.logo-container {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tricolor spinning ring — red, green, gold */
.logo-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 3px;
  background: conic-gradient(#e53935 0deg 120deg,
      #43a047 120deg 240deg,
      #FFD700 240deg 360deg);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: rotate 8s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.logo-container:hover .logo-ring {
  opacity: 1;
}

.logo-inner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1;
  position: relative;
}

.logo-inner:hover {
  transform: scale(1.05);
  box-shadow:
    0 0 10px rgba(229, 57, 53, 0.4),
    0 0 18px rgba(67, 160, 71, 0.3),
    0 0 26px rgba(255, 215, 0, 0.3);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.logo-container:hover .logo-image {
  filter: brightness(1.1);
}

/* ── Brand text ── */
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.025em;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.brand-subtitle {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.3s ease;
}

/* Title cycles red → green → gold on hover via gradient clip */
.brand-wrapper:hover .brand-title {
  background: linear-gradient(90deg, #e53935, #43a047, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  animation: titleShift 6s linear infinite;
  background-size: 200% auto;
}

.brand-wrapper:hover .brand-subtitle {
  background: linear-gradient(90deg, #FFD700, #43a047, #e53935);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  animation: titleShift 6s linear infinite reverse;
  background-size: 200% auto;
}

/* ── Close button ── */
.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* ── Nav scrollbar ── */
.nav-container {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.nav-container::-webkit-scrollbar {
  width: 6px;
}

.nav-container::-webkit-scrollbar-track {
  background: transparent;
}

.nav-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.nav-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* ── Footer ── */
.sidebar-footer {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 1rem;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.toggle-btn {
  padding: 0.5rem;
  transition: all 0.3s ease;
  color: #ffffff;
}

.toggle-btn:hover {
  transform: scale(1.05);
}

/* ── Keyframes ── */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes titleShift {
  0% {
    background-position: 0% center;
  }

  100% {
    background-position: 200% center;
  }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .brand-title {
    font-size: 1rem;
  }

  .brand-subtitle {
    font-size: 0.65rem;
  }

  .logo-container {
    width: 40px;
    height: 40px;
  }

  .logo-inner {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .sidebar-header {
    padding: 0.75rem;
  }

  .brand-wrapper {
    gap: 0.5rem;
  }

  .logo-container {
    width: 36px;
    height: 36px;
  }

  .logo-inner {
    width: 32px;
    height: 32px;
  }

  .brand-title {
    font-size: 0.9rem;
  }

  .brand-subtitle {
    font-size: 0.6rem;
  }
}

@media (prefers-color-scheme: dark) {
  .modern-sidebar {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  }

  .sidebar-header {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .sidebar-footer {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }
}
</style>