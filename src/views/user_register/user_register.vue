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
                                    <img src="/src/assets/logo/logo.jpg" alt="People's Bank Logo" class="logo-img" />
                                </div>
                            </div>
                            <div class="orbit"><span class="dot dot-red"></span></div>
                            <div class="orbit orbit-2"><span class="dot dot-green"></span></div>
                            <div class="orbit orbit-3"><span class="dot dot-gold"></span></div>
                        </div>

                        <div class="login-header text-center">
                            <h1 class="login-title">FINTECH LITERATURE<br />WORKSHOP</h1>
                            <h2 class="brand-name">FinTech Challenge</h2>
                            <p class="login-sub">People's Bank &nbsp;•&nbsp; Learn &nbsp;•&nbsp; Play &nbsp;•&nbsp; Win
                            </p>
                        </div>

                        <div class="tricolor-divider">
                            <span></span><span></span><span></span>
                        </div>

                        <!-- ── Registration form ── -->
                        <CForm v-if="!referenceCode" @submit.prevent="handleRegister" class="login-form">
                            <p class="form-heading text-center">Register to Participate</p>

                            <!-- Full Name -->
                            <div class="field-group mb-3">
                                <CInputGroup>
                                    <CInputGroupText class="input-icon">
                                        <CIcon icon="cil-user" />
                                    </CInputGroupText>

                                    <CFormInput id="fullName" v-model="fullName" placeholder="Full Name" type="text"
                                        autocomplete="name" class="form-control-custom" required :disabled="loading" />
                                </CInputGroup>
                            </div>

                            <!-- ID Number -->
                            <div class="field-group mb-3">
                                <CInputGroup>
                                    <CInputGroupText class="input-icon">
                                        <CIcon icon="cil-notes" />
                                    </CInputGroupText>

                                    <CFormInput id="idNumber" v-model="idNumber" placeholder="ID Number" type="text"
                                        class="form-control-custom" required :disabled="loading" />
                                </CInputGroup>
                            </div>

                            <!-- Mobile Number -->
                            <div class="field-group mb-4">
                                <CInputGroup>
                                    <CInputGroupText class="input-icon">
                                        <CIcon icon="cil-people" />
                                    </CInputGroupText>

                                    <CFormInput id="mobileNumber" v-model="mobileNumber" placeholder="Mobile Number"
                                        type="tel" autocomplete="tel" class="form-control-custom" required
                                        :disabled="loading" @input="mobileError = ''" />
                                </CInputGroup>

                                <p v-if="mobileError" class="field-error">
                                    {{ mobileError }}
                                </p>
                            </div>

                            <!-- Register Button -->
                            <CButton type="submit" class="login-btn w-100"
                                :disabled="loading || !fullName || !idNumber || !mobileNumber">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                                    aria-hidden="true"></span>

                                <span class="btn-text">
                                    {{ loading ? 'Registering...' : 'Register & Get Reference' }}
                                </span>

                                <i v-if="!loading" class="mdi mdi-arrow-right btn-arrow"></i>
                            </CButton>
                        </CForm>

                        <!-- ── Success / reference state ── -->
                        <div v-else class="reference-panel text-center">
                            <div class="ref-check">
                                <i class="mdi mdi-check-circle-outline"></i>
                            </div>
                            <p class="ref-label">Successfully Registered!</p>
                            <p class="ref-sub">Keep this reference number — you'll need it at the event.</p>

                            <!-- Registered details -->
                            <div class="details-box">
                                <div class="detail-row">
                                    <span class="detail-label"><i class="mdi mdi-account-outline"></i> Name</span>
                                    <span class="detail-value">{{ registeredName }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label"><i class="mdi mdi-card-account-details-outline"></i> ID
                                        Number</span>
                                    <span class="detail-value">{{ registeredId }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label"><i class="mdi mdi-cellphone"></i> Mobile</span>
                                    <span class="detail-value">{{ registeredMobile }}</span>
                                </div>
                            </div>

                            <div class="ref-code-box">
                                <span class="ref-code">{{ referenceCode }}</span>
                                <button type="button" class="ref-copy-btn" @click="copyReference"
                                    :title="'Copy reference'">
                                    <i class="mdi" :class="copied ? 'mdi-check' : 'mdi-content-copy'"></i>
                                </button>
                            </div>

                            <p class="copy-feedback" :class="{ 'copy-feedback-visible': copied }">
                                Copied to clipboard!
                            </p>
                            <p v-if="copyError" class="field-error">
                                {{ copyError }}
                            </p>

                            <CButton type="button" class="attendance-btn w-100 mt-4" @click="resetForm">
                                Register another participant
                            </CButton>
                        </div>

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
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import '@/styles/css/user_register.css'

export default {
    name: 'RegistrationComponent',
    setup() {
        const fullName = ref('')
        const idNumber = ref('')
        const mobileNumber = ref('')
        const loading = ref(false)
        const isLoaded = ref(false)
        const referenceCode = ref('')
        const copied = ref(false)
        const copyError = ref('')
        const mobileError = ref('')

        // Snapshot of the details actually saved, shown on the success panel.
        // Kept separate from the form fields so resetForm can clear the form
        // without losing what's displayed, and so edits after submit (if any)
        // don't retroactively change the success panel.
        const registeredName = ref('')
        const registeredId = ref('')
        const registeredMobile = ref('')

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

        const validateMobile = () => {
            const digits = mobileNumber.value.replace(/\D/g, '')
            if (digits.length < 9 || digits.length > 12) {
                mobileError.value = 'Enter a valid mobile number'
                return false
            }
            mobileError.value = ''
            return true
        }

        const handleRegister = async () => {
            if (!fullName.value || !idNumber.value || !mobileNumber.value) return
            if (!validateMobile()) return

            loading.value = true
            try {
                const normalizedMobile = mobileNumber.value.replace(/\D/g, '')
                const trimmedName = fullName.value.trim()
                const trimmedId = idNumber.value.trim()

                // Pre-check: has this mobile number registered before?
                const { data: existing, error: checkError } = await supabase
                    .from('participants')
                    .select('id_number')
                    .eq('mobile', normalizedMobile)
                    .maybeSingle()

                if (checkError) throw checkError

                if (existing) {
                    mobileError.value = 'This mobile number is already registered'
                    await showToast({
                        icon: 'warning',
                        title: 'Already registered',
                        text: 'This mobile number has already been used to register.',
                    })
                    return
                }

                // Insert new participant
                const { error: insertError } = await supabase
                    .from('participants')
                    .insert({
                        name: trimmedName,
                        id_number: trimmedId,
                        mobile: normalizedMobile,
                        qualified: false,
                    })

                if (insertError) {
                    // Catches a race-condition duplicate caught by the DB unique constraint
                    if (insertError.code === '23505') {
                        mobileError.value = 'This mobile number is already registered'
                        await showToast({
                            icon: 'warning',
                            title: 'Already registered',
                            text: 'This mobile number has already been used to register.',
                        })
                        return
                    }
                    throw insertError
                }

                // Snapshot the saved details for display
                registeredName.value = trimmedName
                registeredId.value = trimmedId
                registeredMobile.value = normalizedMobile

                // Reference number = the participant's own mobile number
                referenceCode.value = normalizedMobile

                await showToast({
                    icon: 'success',
                    title: 'Successfully Registered!',
                    timer: 1800,
                })

            } catch (error) {
                await showToast({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: error.message || 'Something went wrong. Please try again.',
                })
            } finally {
                loading.value = false
            }
        }

        const copyReference = async () => {
            copyError.value = ''
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(referenceCode.value)
                } else {
                    // Fallback for non-secure contexts / older browsers
                    const textarea = document.createElement('textarea')
                    textarea.value = referenceCode.value
                    textarea.style.position = 'fixed'
                    textarea.style.opacity = '0'
                    document.body.appendChild(textarea)
                    textarea.focus()
                    textarea.select()
                    document.execCommand('copy')
                    document.body.removeChild(textarea)
                }
                copied.value = true
                setTimeout(() => { copied.value = false }, 2000)
            } catch (e) {
                copyError.value = 'Could not copy. Please copy it manually.'
            }
        }

        const resetForm = () => {
            fullName.value = ''
            idNumber.value = ''
            mobileNumber.value = ''
            referenceCode.value = ''
            mobileError.value = ''
            copyError.value = ''
            copied.value = false
            registeredName.value = ''
            registeredId.value = ''
            registeredMobile.value = ''
        }

        return {
            fullName,
            idNumber,
            mobileNumber,
            loading,
            isLoaded,
            referenceCode,
            copied,
            copyError,
            mobileError,
            registeredName,
            registeredId,
            registeredMobile,
            handleRegister,
            copyReference,
            resetForm,
        }
    },
}
</script>