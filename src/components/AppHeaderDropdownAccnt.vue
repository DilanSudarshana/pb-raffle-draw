<template>
  <CNavItem>
    <CNavLink href="#" class="logout-link" @click.prevent="handleLogout">
      <CIcon icon="cil-lock-locked" class="logout-icon" />
      <span class="logout-text">Logout</span>
    </CNavLink>
  </CNavItem>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    localStorage.clear()
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.logout-link {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logout-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.logout-text {
  font-size: 15px;
}
</style>