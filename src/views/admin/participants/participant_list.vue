<template>
    <CCol :md="12">
        <CCard class="mb-4 shadow-sm card-gold-top">
            <CCardHeader>
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="compact-heading mb-0">
                        <i class="mdi mdi-account-group-outline me-2"></i>
                        PARTICIPANTS
                    </h6>
                </div>
            </CCardHeader>

            <CCardBody>
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 table-controls">
                    <input v-model="searchQuery" @input="currentPage = 1" type="text" class="form-control search-input"
                        placeholder="Search participants..." />
                    <select v-model.number="pageSize" class="form-select page-size-select">
                        <option v-for="n in pageSizeOptions" :key="n" :value="n">Show {{ n }} per page</option>
                    </select>
                </div>

                <div v-if="loadError" class="alert alert-danger py-2 mb-3">{{ loadError }}</div>

                <div class="table-responsive">
                    <table id="table-participants" class="table table-bordered table-hover align-middle">
                        <thead>
                            <tr>
                                <th class="sortable" @click="sortBy('mobile')">
                                    Mobile <i :class="sortIcon('mobile')"></i>
                                </th>
                                <th class="sortable" @click="sortBy('name')">
                                    Name <i :class="sortIcon('name')"></i>
                                </th>
                                <th class="hide-mobile">ID Number</th>
                                <th class="hide-mobile sortable" @click="sortBy('quiz_attempted')">
                                    Quiz Attempted <i :class="sortIcon('quiz_attempted')"></i>
                                </th>
                                <th class="hide-mobile sortable" @click="sortBy('quiz_started_at')">
                                    Quiz Started At <i :class="sortIcon('quiz_started_at')"></i>
                                </th>
                                <th class="hide-mobile sortable" @click="sortBy('quiz_completed_at')">
                                    Quiz Completed At <i :class="sortIcon('quiz_completed_at')"></i>
                                </th>
                                <th class="hide-mobile sortable" @click="sortBy('created_at')">
                                    Created At <i :class="sortIcon('created_at')"></i>
                                </th>
                                <th>Qualified</th>
                                <th class="action-column">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="9" class="text-center text-muted py-4">Loading...</td>
                            </tr>
                            <tr v-else-if="!paginatedList.length">
                                <td colspan="9">
                                    <div class="text-center text-muted py-4">
                                        <i class="mdi mdi-account-group-outline"
                                            style="font-size:2rem;display:block;margin-bottom:.5rem;"></i>
                                        No participants found
                                    </div>
                                </td>
                            </tr>
                            <tr v-for="row in paginatedList" :key="row.mobile">
                                <td>{{ row.mobile }}</td>
                                <td>
                                    <span :title="row.name"
                                        style="display:inline-block;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{
                                            row.name }}</span>
                                </td>
                                <td class="hide-mobile">{{ row.id_number }}</td>
                                <td class="hide-mobile">
                                    <CBadge :color="row.quiz_attempted === 1 ? 'success' : 'secondary'">
                                        {{ row.quiz_attempted === 1 ? 'Yes' : 'No' }}
                                    </CBadge>
                                </td>
                                <td class="hide-mobile">{{ formatDateTime(row.quiz_started_at) }}</td>
                                <td class="hide-mobile">{{ formatDateTime(row.quiz_completed_at) }}</td>
                                <td class="hide-mobile">{{ formatDateTime(row.created_at) }}</td>
                                <td>
                                    <span class="badge rounded-pill"
                                        :class="row.qualified ? 'bg-success' : 'bg-warning'">
                                        {{ row.qualified ? 'Qualified' : 'Not Qualified' }}
                                    </span>
                                </td>
                                <td class="action-column">
                                    <div class="d-flex gap-2 justify-content-center align-items-center">
                                        <button class="btn btn-sm"
                                            :class="row.qualified ? 'btn-outline-success' : 'btn-outline-warning'"
                                            :title="row.qualified ? 'Mark Not Qualified' : 'Mark Qualified'"
                                            @click="toggleQualified(row)">
                                            <i class="mdi mdi-swap-horizontal"></i>
                                        </button>
                                        <router-link :to="{ name: 'ParticipantView', params: { id: row.mobile } }"
                                            class="btn btn-sm btn-outline-primary" title="View">
                                            <i class="mdi mdi-eye-outline"></i>
                                        </router-link>
                                        <!-- <button class="btn btn-sm btn-outline-danger" title="Delete"
                                            @click="deleteParticipant(row.mobile)">
                                            <i class="mdi mdi-delete-outline"></i>
                                        </button> -->
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-3 pagination-bar">
                    <span class="text-muted page-info">
                        Showing {{ rangeStart }} to {{ rangeEnd }} of {{ sortedList.length }} records
                    </span>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-secondary" :disabled="currentPage === 1"
                            @click="goToPage(1)">First</button>
                        <button class="btn btn-sm btn-outline-secondary" :disabled="currentPage === 1"
                            @click="goToPage(currentPage - 1)">Previous</button>
                        <button class="btn btn-sm btn-outline-secondary" :disabled="currentPage === totalPages"
                            @click="goToPage(currentPage + 1)">Next</button>
                        <button class="btn btn-sm btn-outline-secondary" :disabled="currentPage === totalPages"
                            @click="goToPage(totalPages)">Last</button>
                    </div>
                </div>
            </CCardBody>
        </CCard>
    </CCol>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/utils/ToastService.js'

export default {
    name: 'ListParticipants',
    setup() {
        const participantList = ref([])
        const loadError = ref('')
        const loading = ref(false)

        const searchQuery = ref('')
        const sortKey = ref('created_at')
        const sortAsc = ref(false)

        const currentPage = ref(1)
        const pageSize = ref(25)
        const pageSizeOptions = [10, 25, 50, 100]

        const formatDateTime = (val) => {
            if (!val) return '-'
            const d = new Date(val)
            if (isNaN(d.getTime())) return '-'
            return d.toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        }

        const fetchParticipants = async () => {
            loadError.value = ''
            loading.value = true
            try {
                const { data, error } = await supabase
                    .from('participants')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error
                participantList.value = data || []
            } catch (error) {
                loadError.value = error.message || 'Failed to load participants'
                await showToast({ icon: 'error', title: 'Failed to load participants' })
            } finally {
                loading.value = false
            }
        }

        const filteredList = computed(() => {
            const q = searchQuery.value.trim().toLowerCase()
            if (!q) return participantList.value
            return participantList.value.filter(p =>
                (p.mobile || '').toLowerCase().includes(q) ||
                (p.name || '').toLowerCase().includes(q) ||
                (p.id_number || '').toLowerCase().includes(q)
            )
        })

        const sortedList = computed(() => {
            const list = [...filteredList.value]
            const key = sortKey.value
            list.sort((a, b) => {
                let av = a[key]
                let bv = b[key]
                if (av == null) av = ''
                if (bv == null) bv = ''
                if (av < bv) return sortAsc.value ? -1 : 1
                if (av > bv) return sortAsc.value ? 1 : -1
                return 0
            })
            return list
        })

        const sortBy = (key) => {
            if (sortKey.value === key) {
                sortAsc.value = !sortAsc.value
            } else {
                sortKey.value = key
                sortAsc.value = true
            }
            currentPage.value = 1
        }

        const sortIcon = (key) => {
            if (sortKey.value !== key) return 'mdi mdi-unfold-more-horizontal text-muted'
            return sortAsc.value ? 'mdi mdi-arrow-up' : 'mdi mdi-arrow-down'
        }

        const totalPages = computed(() =>
            Math.max(1, Math.ceil(sortedList.value.length / pageSize.value))
        )

        const paginatedList = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            return sortedList.value.slice(start, start + pageSize.value)
        })

        const rangeStart = computed(() =>
            sortedList.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
        )
        const rangeEnd = computed(() =>
            Math.min(currentPage.value * pageSize.value, sortedList.value.length)
        )

        const goToPage = (page) => {
            if (page < 1 || page > totalPages.value) return
            currentPage.value = page
        }

        const toggleQualified = async (record) => {
            const newStatus = !record.qualified
            try {
                const { error } = await supabase
                    .from('participants')
                    .update({ qualified: newStatus })
                    .eq('mobile', record.mobile)

                if (error) throw error
                record.qualified = newStatus
            } catch (error) {
                await showToast({ icon: 'error', title: error.message || 'Failed to update status' })
            }
        }

        const deleteParticipant = async (mobile) => {
            try {
                const { error } = await supabase
                    .from('participants')
                    .delete()
                    .eq('mobile', mobile)

                if (error) throw error

                const idx = participantList.value.findIndex(p => p.mobile == mobile)
                if (idx !== -1) participantList.value.splice(idx, 1)

                await showToast({ icon: 'success', title: 'Participant deleted successfully!' })
            } catch (error) {
                await showToast({ icon: 'error', title: error.message || 'Failed to delete participant' })
            }
        }

        onMounted(fetchParticipants)

        return {
            participantList,
            loadError,
            loading,
            searchQuery,
            currentPage,
            pageSize,
            pageSizeOptions,
            totalPages,
            paginatedList,
            sortedList,
            rangeStart,
            rangeEnd,
            sortBy,
            sortIcon,
            goToPage,
            formatDateTime,
            toggleQualified,
            deleteParticipant,
        }
    }
}
</script>

<style scoped>
.table {
    font-size: 0.75rem;
    min-width: 900px;
}

.table th {
    background: #f8f9fa;
    font-weight: 600;
    padding: 0.75rem;
    font-size: 0.7rem;
}

.table th.sortable {
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

.table th.sortable i {
    font-size: 0.85rem;
    vertical-align: middle;
}

.table td {
    font-size: 0.7rem;
    padding: 0.5rem;
}

.table-responsive::-webkit-scrollbar {
    height: 5px;
}

.table-responsive::-webkit-scrollbar-thumb {
    background: #1b2630;
    border-radius: 99px;
}

.table-controls .search-input {
    max-width: 280px;
}

.table-controls .page-size-select {
    max-width: 200px;
}

.pagination-bar .page-info {
    font-size: 0.75rem;
}

:root[data-coreui-theme='dark'] .table th,
:root[data-coreui-theme='dark'] .table td {
    background-color: #1e222d !important;
    color: #f1f1f1 !important;
    border-color: #444 !important;
}

:root[data-coreui-theme='dark'] .table thead th {
    background-color: #1e222d !important;
    color: #fff !important;
}

:root[data-coreui-theme='dark'] .table-hover tbody tr:hover {
    background-color: #1e222d !important;
}

:root[data-coreui-theme='dark'] .search-input,
:root[data-coreui-theme='dark'] .page-size-select {
    background-color: #2d2d2d !important;
    color: #fff !important;
    border: 1px solid #444 !important;
}

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
</style>