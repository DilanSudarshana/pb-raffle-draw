<template>
    <CCol :md="12">
        <CCard class="mb-4 shadow-sm card-gold-top">
            <CCardHeader>
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="compact-heading mb-0">
                        <i class="mdi mdi-account-edit-outline me-2"></i>
                        UPDATE PARTICIPANT
                    </h6>
                    <router-link to="/master/participants/list">
                        <button class="btn btn-sm btn-outline-secondary">
                            <i class="mdi mdi-arrow-left me-1"></i>
                            Back to List
                        </button>
                    </router-link>
                </div>
            </CCardHeader>

            <CCardBody>
                <div v-if="fetching" class="text-center text-muted py-4">Loading participant...</div>

                <div v-else-if="loadError" class="alert alert-danger py-2 mb-3">{{ loadError }}</div>

                <form v-else @submit.prevent="handleUpdate" novalidate>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Full Name</label>
                            <input v-model="fullName" type="text" class="form-control" placeholder="Enter full name"
                                :disabled="saving" />
                            <div v-if="nameError" class="invalid-feedback d-block">{{ nameError }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">ID Number</label>
                            <input v-model="idNumber" type="text" class="form-control"
                                placeholder="Enter ID / NIC number" :disabled="saving" />
                            <div v-if="idError" class="invalid-feedback d-block">{{ idError }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">
                                Mobile Number
                                <i class="mdi mdi-lock-outline text-muted ms-1"
                                    title="Mobile is the unique key and cannot be changed here"></i>
                            </label>
                            <input :value="originalMobile" type="text" class="form-control" disabled />
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Qualified</label>
                            <select v-model="qualified" class="form-select" :disabled="saving">
                                <option :value="false">Not Qualified</option>
                                <option :value="true">Qualified</option>
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Quiz Attempted</label>
                            <select v-model.number="quizAttempted" class="form-select" :disabled="saving">
                                <option :value="0">No</option>
                                <option :value="1">Yes</option>
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Quiz Started At</label>
                            <input v-model="quizStartedAt" type="datetime-local" class="form-control"
                                :disabled="saving" />
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Quiz Completed At</label>
                            <input v-model="quizCompletedAt" type="datetime-local" class="form-control"
                                :disabled="saving" />
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Registered On</label>
                            <input :value="formatDateTime(createdAt)" type="text" class="form-control" disabled />
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                        <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="mdi mdi-content-save-outline me-1"></i>
                            {{ saving ? 'Saving...' : 'Update Participant' }}
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="saving"
                            @click="loadParticipant">
                            <i class="mdi mdi-refresh me-1"></i>
                            Reload
                        </button>
                    </div>
                </form>
            </CCardBody>
        </CCard>
    </CCol>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/utils/ToastService.js'

export default {
    name: 'UpdateParticipant',
    setup() {
        const route = useRoute()
        const mobileParam = route.params.id   // matches router path 'participants/:id'

        const originalMobile = ref('')
        const fullName = ref('')
        const idNumber = ref('')
        const qualified = ref(false)
        const quizAttempted = ref(0)
        const quizStartedAt = ref('')
        const quizCompletedAt = ref('')
        const createdAt = ref(null)

        const fetching = ref(false)
        const saving = ref(false)
        const loadError = ref('')

        const nameError = ref('')
        const idError = ref('')

        const formatDateTime = (val) => {
            if (!val) return '-'
            const d = new Date(val)
            if (isNaN(d.getTime())) return '-'
            return d.toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        }

        // Converts a timestamptz value to the "YYYY-MM-DDTHH:mm" format
        // required by <input type="datetime-local">
        const toLocalInputValue = (val) => {
            if (!val) return ''
            const d = new Date(val)
            if (isNaN(d.getTime())) return ''
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }

        const loadParticipant = async () => {
            if (!mobileParam) {
                loadError.value = 'No participant specified'
                return
            }

            fetching.value = true
            loadError.value = ''
            try {
                const { data, error } = await supabase
                    .from('participants')
                    .select('*')
                    .eq('mobile', mobileParam)
                    .maybeSingle()

                if (error) throw error

                if (!data) {
                    loadError.value = 'Participant not found'
                    return
                }

                originalMobile.value = data.mobile
                fullName.value = data.name
                idNumber.value = data.id_number
                qualified.value = data.qualified
                quizAttempted.value = data.quiz_attempted
                quizStartedAt.value = toLocalInputValue(data.quiz_started_at)
                quizCompletedAt.value = toLocalInputValue(data.quiz_completed_at)
                createdAt.value = data.created_at
            } catch (error) {
                loadError.value = error.message || 'Failed to load participant'
                await showToast({ icon: 'error', title: 'Failed to load participant' })
            } finally {
                fetching.value = false
            }
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

            return valid
        }

        const handleUpdate = async () => {
            if (!validateForm()) return

            saving.value = true
            try {
                const trimmedName = fullName.value.trim()
                const trimmedId = idNumber.value.trim()

                // Make sure the ID number isn't already used by a different participant
                const { data: existing, error: checkError } = await supabase
                    .from('participants')
                    .select('mobile')
                    .eq('id_number', trimmedId)
                    .neq('mobile', originalMobile.value)
                    .maybeSingle()

                if (checkError) throw checkError

                if (existing) {
                    idError.value = 'This ID number is already used by another participant'
                    await showToast({ icon: 'warning', title: 'ID number already in use' })
                    return
                }

                const { error: updateError } = await supabase
                    .from('participants')
                    .update({
                        name: trimmedName,
                        id_number: trimmedId,
                        qualified: qualified.value,
                        quiz_attempted: quizAttempted.value,
                        quiz_started_at: quizStartedAt.value ? new Date(quizStartedAt.value).toISOString() : null,
                        quiz_completed_at: quizCompletedAt.value ? new Date(quizCompletedAt.value).toISOString() : null,
                    })
                    .eq('mobile', originalMobile.value)

                if (updateError) {
                    if (updateError.code === '23505') {
                        idError.value = 'This ID number is already used by another participant'
                        await showToast({ icon: 'warning', title: 'ID number already in use' })
                        return
                    }
                    throw updateError
                }

                await showToast({ icon: 'success', title: 'Participant updated successfully!' })
            } catch (error) {
                await showToast({ icon: 'error', title: error.message || 'Failed to update participant' })
            } finally {
                saving.value = false
            }
        }

        onMounted(loadParticipant)

        return {
            originalMobile,
            fullName,
            idNumber,
            qualified,
            quizAttempted,
            quizStartedAt,
            quizCompletedAt,
            createdAt,
            fetching,
            saving,
            loadError,
            nameError,
            idError,
            formatDateTime,
            loadParticipant,
            handleUpdate,
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