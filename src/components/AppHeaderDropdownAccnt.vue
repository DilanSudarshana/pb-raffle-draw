<template>
  <CNavItem>
    <CNavLink component="button" type="button" @click="handleLogout" class="w-100 text-start">
      <CIcon icon="cil-lock-locked" /> Logout
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
    if (error) throw error
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
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