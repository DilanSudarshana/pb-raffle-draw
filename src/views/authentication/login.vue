<template>
    <div class="login-wrapper min-vh-100 d-flex flex-row align-items-center">

        <div class="orb orb-red"></div>
        <div class="orb orb-green"></div>
        <div class="orb orb-gold"></div>

        <div class="tricolor-bar">
            <span class="bar-red"></span>
            <span class="bar-green"></span>
            <span class="bar-gold"></span>
        </div>

        <CContainer>
            <CRow class="justify-content-center">
                <CCol :md="8" :lg="6" :xl="4">
                    <div class="login-card" :class="{ 'card-loaded': isLoaded }">

                        <div class="logo-wrapper">
                            <div class="logo-ring-outer">
                                <div class="logo-ring-inner">
                                    <img src="/src/assets/logo/logo.jpg" alt="Raffle Draw Admin Logo"
                                        class="logo-img" />
                                </div>
                            </div>
                            <div class="orbit"><span class="dot dot-red"></span></div>
                            <div class="orbit orbit-2"><span class="dot dot-green"></span></div>
                            <div class="orbit orbit-3"><span class="dot dot-gold"></span></div>
                        </div>

                        <div class="login-header text-center">
                            <h1 class="login-title">RAFFLE DRAW<br />ADMIN PANEL</h1>
                            <h2 class="brand-name">RaffleDraw</h2>
                            <p class="login-sub">Sign in to your account</p>
                        </div>

                        <div class="tricolor-divider">
                            <span></span><span></span><span></span>
                        </div>

                        <CForm @submit.prevent="handleLogin" class="login-form">
                            <div class="field-group mb-3">
                                <CInputGroup>
                                    <CInputGroupText class="input-icon">
                                        <CIcon icon="cil-user" />
                                    </CInputGroupText>
                                    <CFormInput id="email" v-model="email" placeholder="Email" type="email"
                                        autocomplete="email" class="form-control-custom" required :disabled="loading" />
                                </CInputGroup>
                            </div>

                            <div class="field-group mb-4">
                                <CInputGroup>
                                    <CInputGroupText class="input-icon">
                                        <CIcon icon="cil-lock-locked" />
                                    </CInputGroupText>
                                    <CFormInput id="password" v-model="password" type="password" placeholder="Password"
                                        autocomplete="current-password" class="form-control-custom" required
                                        :disabled="loading" />
                                </CInputGroup>
                            </div>

                            <CButton type="submit" class="login-btn w-100" :disabled="loading || !email || !password">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                                    aria-hidden="true"></span>
                                <span class="btn-text">{{ loading ? 'Signing in...' : 'Sign In' }}</span>
                                <i v-if="!loading" class="mdi mdi-arrow-right btn-arrow"></i>
                            </CButton>

                            <div class="text-center mt-3">
                                <CButton color="link" class="forgot-btn" @click="handleForgotPassword"
                                    :disabled="loading">
                                    Forgot your password?
                                </CButton>
                            </div>
                        </CForm>

                        <div class="card-footer-stripe">
                            <span class="stripe-red"></span>
                            <span class="stripe-green"></span>
                            <span class="stripe-gold"></span>
                        </div>

                    </div>
                </CCol>
            </CRow>
        </CContainer>
    </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { ref, onMounted, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import '@/styles/css/admin_login.css'

export default {
    name: 'LoginComponent',
    setup() {
        const router = useRouter()
        const email = ref('')
        const password = ref('')
        const loading = ref(false)
        const isLoaded = ref(false)

        onMounted(() => {
            setTimeout(() => { isLoaded.value = true }, 120)
        })

        const showToast = async ({ icon, title, text, timer = 3000 }) => {
            const Swal = (await import('sweetalert2')).default
            return Swal.fire({
                toast: true,
                position: 'top-end',
                icon,
                title,
                text,
                showConfirmButton: false,
                timer,
                timerProgressBar: true,
            })
        }

        const handleLogin = async () => {
            if (!email.value || !password.value) return
            loading.value = true

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.value,
                    password: password.value,
                })

                if (error) throw error

                // Supabase persists the session itself; cache a light user object if other
                // parts of the app read from localStorage directly.
                localStorage.setItem('user', JSON.stringify(data.user))

                await showToast({
                    icon: 'success',
                    title: 'Logged in successfully!',
                    timer: 1500,
                })

                await nextTick()
                router.replace({ name: 'Dashboard' })

            } catch (error) {
                await showToast({
                    icon: 'error',
                    title: 'Login Failed',
                    text: error.message || 'Invalid email or password.',
                })
            } finally {
                loading.value = false
            }
        }

        const handleForgotPassword = async () => {
            if (!email.value) {
                await showToast({
                    icon: 'warning',
                    title: 'Enter your email first, then click "Forgot your password?"',
                })
                return
            }

            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
                    redirectTo: `${window.location.origin}/reset-password`,
                })
                if (error) throw error

                await showToast({
                    icon: 'success',
                    title: 'Password reset email sent!',
                })
            } catch (error) {
                await showToast({
                    icon: 'error',
                    title: 'Could not send reset email',
                    text: error.message,
                })
            }
        }

        return {
            email,
            password,
            loading,
            isLoaded,
            handleLogin,
            handleForgotPassword,
        }
    },
}
</script>