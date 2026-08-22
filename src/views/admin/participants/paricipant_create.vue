<template>
    <CCol :md="12">
        <CCard class="mb-4 shadow-sm card-gold-top">
            <CCardHeader>
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="compact-heading mb-0">
                        <i class="mdi mdi-account-plus-outline me-2"></i>
                        ADD PARTICIPANT
                    </h6>
                </div>
            </CCardHeader>

            <CCardBody>
                <form @submit.prevent="handleCreate" novalidate>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Full Name</label>
                            <input v-model="fullName" type="text" class="form-control" placeholder="Enter full name"
                                :disabled="loading" />
                            <div v-if="nameError" class="invalid-feedback d-block">{{ nameError }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">ID Number</label>
                            <input v-model="idNumber" type="text" class="form-control"
                                placeholder="Enter ID / NIC number" :disabled="loading" />
                            <div v-if="idError" class="invalid-feedback d-block">{{ idError }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Mobile Number</label>
                            <input v-model="mobileNumber" type="text" class="form-control"
                                placeholder="Enter mobile number" :disabled="loading" @blur="validateMobile" />
                            <div v-if="mobileError" class="invalid-feedback d-block">{{ mobileError }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Qualified</label>
                            <select v-model="qualified" class="form-select" :disabled="loading">
                                <option :value="false">Not Qualified</option>
                                <option :value="true">Qualified</option>
                            </select>
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                        <button type="submit" class="btn btn-primary btn-sm" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="mdi mdi-content-save-outline me-1"></i>
                            {{ loading ? 'Saving...' : 'Save Participant' }}
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="loading"
                            @click="resetForm">
                            <i class="mdi mdi-refresh me-1"></i>
                            Reset
                        </button>
                    </div>
                </form>
            </CCardBody>
        </CCard>
    </CCol>
</template>

<script>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/utils/ToastService.js'

export default {
    name: 'CreateParticipant',
    emits: ['created'],
    setup(props, { emit }) {
        const fullName = ref('')
        const idNumber = ref('')
        const mobileNumber = ref('')
        const qualified = ref(false)
        const loading = ref(false)

        const nameError = ref('')
        const idError = ref('')
        const mobileError = ref('')

        const validateMobile = () => {
            const digits = mobileNumber.value.replace(/\D/g, '')
            if (digits.length < 9 || digits.length > 12) {
                mobileError.value = 'Enter a valid mobile number'
                return false
            }
            mobileError.value = ''
            return true
        }

        const validateForm = () => {
            nameError.value = ''
            idError.value = ''

            let valid = true

            if (!fullName.value.trim()) {
                nameError.value = 'Full name is required'
                valid = false
            }

            if (!idNumber.value.trim()) {
                idError.value = 'ID number is required'
                valid = false
            }

            if (!mobileNumber.value.trim() || !validateMobile()) {
                valid = false
            }

            return valid
        }

        const resetForm = () => {
            fullName.value = ''
            idNumber.value = ''
            mobileNumber.value = ''
            qualified.value = false
            nameError.value = ''
            idError.value = ''
            mobileError.value = ''
        }

        const handleCreate = async () => {
            if (!validateForm()) return

            loading.value = true
            try {
                const normalizedMobile = mobileNumber.value.replace(/\D/g, '')
                const trimmedName = fullName.value.trim()
                const trimmedId = idNumber.value.trim()

                // Pre-check: mobile or id_number already registered?
                const { data: existing, error: checkError } = await supabase
                    .from('participants')
                    .select('mobile, id_number')
                    .or(`mobile.eq.${normalizedMobile},id_number.eq.${trimmedId}`)
                    .maybeSingle()

                if (checkError) throw checkError

                if (existing) {
                    if (existing.mobile === normalizedMobile) {
                        mobileError.value = 'This mobile number is already registered'
                    } else {
                        idError.value = 'This ID number is already registered'
                    }
                    await showToast({ icon: 'warning', title: 'Already registered' })
                    return
                }

                const { data: inserted, error: insertError } = await supabase
                    .from('participants')
                    .insert({
                        name: trimmedName,
                        id_number: trimmedId,
                        mobile: normalizedMobile,
                        qualified: qualified.value,
                    })
                    .select()
                    .single()

                if (insertError) {
                    if (insertError.code === '23505') {
                        const msg = insertError.message?.includes('id_number')
                            ? 'This ID number is already registered'
                            : 'This mobile number is already registered'
                        if (msg.includes('ID')) idError.value = msg
                        else mobileError.value = msg
                        await showToast({ icon: 'warning', title: 'Already registered' })
                        return
                    }
                    throw insertError
                }

                await showToast({ icon: 'success', title: 'Participant added successfully!' })
                emit('created', inserted)
                resetForm()
            } catch (error) {
                await showToast({ icon: 'error', title: error.message || 'Failed to add participant' })
            } finally {
                loading.value = false
            }
        }

        return {
            fullName,
            idNumber,
            mobileNumber,
            qualified,
            loading,
            nameError,
            idError,
            mobileError,
            validateMobile,
            handleCreate,
            resetForm,
        }
    }
}
</script>

<style scoped>
.compact-heading {
    font-size: 0.875rem;
}

.card-gold-top {
    position: relative;
    overflow: hidden;
}

.card-gold-top::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg,
            #e53935 0% 33.3%,
            #43a047 33.3% 66.6%,
            #FFD700 66.6% 100%);
}

.form-label {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.form-control,
.form-select {
    font-size: 0.8rem;
}

.invalid-feedback {
    font-size: 0.7rem;
}

:root[data-coreui-theme='dark'] .form-control,
:root[data-coreui-theme='dark'] .form-select {
    background-color: #2d2d2d !important;
    color: #fff !important;
    border: 1px solid #444 !important;
}

:root[data-coreui-theme='dark'] .form-label {
    color: #f1f1f1 !important;
}
</style>