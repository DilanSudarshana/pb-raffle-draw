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
import { supabase } from '@/lib/supabase' // adjust path to your Supabase client

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

<style scoped>
/* ── Variables ── */
:root {
    --red: #e53935;
    --green: #43a047;
    --gold: #FFD700;
    --dark: #0f0f1a;
}

/* ── Wrapper ── */
.login-wrapper {
    background:
        url('/src/assets/login_background.jpg') center/cover no-repeat fixed,
        linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
    position: relative;
    overflow: hidden;
    min-height: 100vh;
}

.login-wrapper::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
            rgba(15, 15, 26, 0.82) 0%,
            rgba(26, 26, 46, 0.78) 100%);
    pointer-events: none;
    z-index: 0;
}

/* ── Tricolor top bar ── */
.tricolor-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    display: flex;
    z-index: 100;
}

.bar-red {
    flex: 1;
    background: #e53935;
}

.bar-green {
    flex: 1;
    background: #43a047;
}

.bar-gold {
    flex: 1;
    background: #FFD700;
}

/* ── Background orbs ── */
.orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: drift 12s ease-in-out infinite alternate;
}

.orb-red {
    width: 420px;
    height: 420px;
    background: #e53935;
    top: -120px;
    left: -100px;
    animation-delay: 0s;
}

.orb-green {
    width: 350px;
    height: 350px;
    background: #43a047;
    bottom: -100px;
    right: -80px;
    animation-delay: -4s;
}

.orb-gold {
    width: 300px;
    height: 300px;
    background: #FFD700;
    top: 40%;
    left: 55%;
    animation-delay: -8s;
}

/* ── Card ── */
.login-card {
    background: rgba(15, 15, 26, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 2.5rem 2rem 0;
    backdrop-filter: blur(20px);
    box-shadow:
        0 0 0 1px rgba(255, 215, 0, 0.08),
        0 24px 60px rgba(0, 0, 0, 0.5),
        0 0 80px rgba(229, 57, 53, 0.06);
    position: relative;
    z-index: 1;
    overflow: hidden;
    opacity: 0;
    transform: translateY(24px) scale(0.98);
    transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    margin: 1rem;
}

.login-card.card-loaded {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* ── Logo ── */
.logo-wrapper {
    position: relative;
    width: 90px;
    height: 90px;
    margin: 0 auto 1.5rem;
}

.logo-ring-outer {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    padding: 3px;
    background: conic-gradient(#e53935 0deg 120deg,
            #43a047 120deg 240deg,
            #FFD700 240deg 360deg);
    animation: rotate 8s linear infinite;
}

.logo-ring-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: #1a1a2e;
    padding: 3px;
}

.logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    animation: rotate 8s linear infinite reverse;
}

.orbit {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 110px;
    height: 110px;
    margin-top: -55px;
    margin-left: -55px;
    border-radius: 50%;
    animation: rotate 4s linear infinite;
}

.orbit-2 {
    width: 126px;
    height: 126px;
    margin-top: -63px;
    margin-left: -63px;
    animation-duration: 6s;
    animation-direction: reverse;
}

.orbit-3 {
    width: 142px;
    height: 142px;
    margin-top: -71px;
    margin-left: -71px;
    animation-duration: 9s;
}

.dot {
    position: absolute;
    top: 0;
    left: 50%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transform: translateX(-50%);
}

.dot-red {
    background: #e53935;
    box-shadow: 0 0 8px #e53935;
}

.dot-green {
    background: #43a047;
    box-shadow: 0 0 8px #43a047;
}

.dot-gold {
    background: #FFD700;
    box-shadow: 0 0 8px #FFD700;
}

/* ── Header ── */
.login-header {
    margin-bottom: 1rem;
}

.login-title {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1.3;
    margin-bottom: 0.4rem;
    background: linear-gradient(135deg, #e53935 0%, #FFD700 50%, #43a047 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% auto;
    animation: titleShift 6s linear infinite;
}

.brand-name {
    font-size: 1.6rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #FFD700, #43a047, #e53935, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 300% auto;
    animation: titleShift 6s linear infinite reverse;
}

.login-sub {
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0;
}

/* ── Tricolor divider ── */
.tricolor-divider {
    display: flex;
    gap: 4px;
    margin: 1rem auto;
    width: 60px;
    justify-content: center;
}

.tricolor-divider span:nth-child(1) {
    display: block;
    height: 3px;
    flex: 1;
    background: #e53935;
    border-radius: 2px;
}

.tricolor-divider span:nth-child(2) {
    display: block;
    height: 3px;
    flex: 1;
    background: #43a047;
    border-radius: 2px;
}

.tricolor-divider span:nth-child(3) {
    display: block;
    height: 3px;
    flex: 1;
    background: #FFD700;
    border-radius: 2px;
}

/* ── Form ── */
.login-form {
    padding-bottom: 1.5rem;
}

.input-icon {
    background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%);
    border: none;
    color: white;
    border-radius: 10px 0 0 10px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.form-control-custom {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-radius: 0 10px 10px 0;
    color: #ffffff;
    padding: 11px 16px;
    font-size: 0.88rem;
    transition: all 0.3s ease;
}

.form-control-custom::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

.form-control-custom:focus {
    background: rgba(255, 255, 255, 0.1);
    border-color: #FFD700;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.12);
    color: #fff;
    outline: none;
}

.form-control-custom:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Login button ── */
.login-btn {
    background: linear-gradient(135deg, #e53935 0%, #c62828 40%, #43a047 70%, #2e7d32 100%);
    background-size: 200% auto;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    padding: 12px 24px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #fff;
    position: relative;
    overflow: hidden;
    transition: background-position 0.5s ease, transform 0.2s ease, box-shadow 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.login-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
            rgba(255, 215, 0, 0.0) 0%,
            rgba(255, 215, 0, 0.15) 50%,
            rgba(255, 215, 0, 0.0) 100%);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
}

.login-btn:hover:not(:disabled)::before {
    transform: translateX(100%);
}

.login-btn:hover:not(:disabled) {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow:
        0 8px 24px rgba(229, 57, 53, 0.3),
        0 0 40px rgba(255, 215, 0, 0.15);
}

.login-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.btn-arrow {
    font-size: 1rem;
    transition: transform 0.3s ease;
}

.login-btn:hover:not(:disabled) .btn-arrow {
    transform: translateX(4px);
}

/* ── Forgot ── */
.forgot-btn {
    color: rgba(255, 215, 0, 0.7);
    font-size: 0.72rem;
    text-decoration: none;
    border: none;
    background: none;
    letter-spacing: 0.03em;
    transition: color 0.3s ease;
    padding: 0;
}

.forgot-btn:hover:not(:disabled) {
    color: #FFD700;
    text-decoration: underline;
}

/* ── Card footer stripe ── */
.card-footer-stripe {
    display: flex;
    height: 4px;
    margin: 0 -2rem;
    border-radius: 0 0 20px 20px;
    overflow: hidden;
}

.stripe-red {
    flex: 1;
    background: #e53935;
}

.stripe-green {
    flex: 1;
    background: #43a047;
}

.stripe-gold {
    flex: 1;
    background: #FFD700;
}

/* ── Keyframes ── */
@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
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

@keyframes drift {
    from {
        transform: translate(0, 0) scale(1);
    }

    to {
        transform: translate(30px, 20px) scale(1.08);
    }
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .login-card {
        padding: 2rem 1.5rem 0;
        margin: 0.5rem;
    }

    .login-title {
        font-size: 1rem;
    }

    .brand-name {
        font-size: 1.3rem;
    }

    .orb {
        opacity: 0.12;
    }
}

@media (max-width: 480px) {
    .login-card {
        padding: 1.75rem 1.25rem 0;
    }

    .logo-wrapper {
        width: 76px;
        height: 76px;
    }

    .logo-ring-outer {
        width: 76px;
        height: 76px;
    }
}
</style>