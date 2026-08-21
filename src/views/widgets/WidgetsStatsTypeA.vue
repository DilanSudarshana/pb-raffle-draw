<script setup>
import { onMounted, ref } from 'vue'
import { CChart } from '@coreui/vue-chartjs'
import { getStyle } from '@coreui/utils'
import { supabase } from '@/lib/supabase'

const widgetChartRef1 = ref()
const widgetChartRef2 = ref()
const loading = ref(true)

// --- headline numbers ---
const totalParticipants = ref(0)
const participantsChangePct = ref(0)

const qualifiedCount = ref(0)
const qualifiedChangePct = ref(0)

const conversionRate = ref(0) // % of quiz attempts that passed
const conversionChangePct = ref(0)

const totalSessions = ref(0) // total quiz attempts
const sessionsChangePct = ref(0)

// --- 7-day trend series (used by the charts) ---
const trendLabels = ref([])
const participantsTrend = ref([])
const qualifiedTrend = ref([])
const conversionTrend = ref([])
const sessionsTrend = ref([])

function last7DayLabels() {
  const labels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return labels
}

// Buckets rows into the last `days` calendar days based on `dateField`
function bucketByDay(rows, dateField, days = 7) {
  const buckets = Array(days).fill(0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  rows.forEach((row) => {
    const rowDate = new Date(row[dateField])
    rowDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today - rowDate) / 86400000)
    const idx = days - 1 - diffDays
    if (idx >= 0 && idx < days) buckets[idx]++
  })
  return buckets
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function arrowIcon(pct) {
  return pct >= 0 ? 'cil-arrow-top' : 'cil-arrow-bottom'
}

async function loadStats() {
  loading.value = true
  trendLabels.value = last7DayLabels()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
  fourteenDaysAgo.setHours(0, 0, 0, 0)

  try {
    // ---------- Participants ("Users" card) ----------
    const { count: totalCount, error: totalErr } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
    if (totalErr) throw totalErr
    totalParticipants.value = totalCount ?? 0

    const { data: recentParticipants, error: recentErr } = await supabase
      .from('participants')
      .select('created_at, qualified')
      .gte('created_at', fourteenDaysAgo.toISOString())
    if (recentErr) throw recentErr

    const pLast7 = (recentParticipants ?? []).filter(
      (p) => new Date(p.created_at) >= sevenDaysAgo,
    )
    const pPrev7 = (recentParticipants ?? []).filter(
      (p) => new Date(p.created_at) < sevenDaysAgo,
    )
    participantsChangePct.value = pctChange(pLast7.length, pPrev7.length)
    participantsTrend.value = bucketByDay(pLast7, 'created_at')

    // ---------- Qualified participants ("Qualified" card) ----------
    const { count: qualCount, error: qualErr } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('qualified', 1)
    if (qualErr) throw qualErr
    qualifiedCount.value = qualCount ?? 0

    const qLast7 = pLast7.filter((p) => Number(p.qualified) === 1)
    const qPrev7 = pPrev7.filter((p) => Number(p.qualified) === 1)
    qualifiedChangePct.value = pctChange(qLast7.length, qPrev7.length)
    qualifiedTrend.value = bucketByDay(qLast7, 'created_at')

    // ---------- Quiz attempts ("Sessions" card) ----------
    const { count: attemptsCount, error: attemptsErr } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
    if (attemptsErr) throw attemptsErr
    totalSessions.value = attemptsCount ?? 0

    const { data: recentAttempts, error: recentAttemptsErr } = await supabase
      .from('quiz_attempts')
      .select('started_at, passed')
      .gte('started_at', fourteenDaysAgo.toISOString())
    if (recentAttemptsErr) throw recentAttemptsErr

    const aLast7 = (recentAttempts ?? []).filter(
      (a) => new Date(a.started_at) >= sevenDaysAgo,
    )
    const aPrev7 = (recentAttempts ?? []).filter(
      (a) => new Date(a.started_at) < sevenDaysAgo,
    )
    sessionsChangePct.value = pctChange(aLast7.length, aPrev7.length)
    sessionsTrend.value = bucketByDay(aLast7, 'started_at')

    // ---------- Conversion rate (passed / total attempts, last 7 days) ----------
    const passedLast7 = aLast7.filter((a) => Number(a.passed) === 1)
    const passedPrev7 = aPrev7.filter((a) => Number(a.passed) === 1)
    const rateLast7 = aLast7.length ? (passedLast7.length / aLast7.length) * 100 : 0
    const ratePrev7 = aPrev7.length ? (passedPrev7.length / aPrev7.length) * 100 : 0
    conversionRate.value = Number(rateLast7.toFixed(1))
    conversionChangePct.value = pctChange(rateLast7, ratePrev7)
    conversionTrend.value = bucketByDay(passedLast7, 'started_at')
  } catch (err) {
    console.error('Failed to load dashboard stats from Supabase:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()

  document.documentElement.addEventListener('ColorSchemeChange', () => {
    if (widgetChartRef1.value) {
      widgetChartRef1.value.chart.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
      widgetChartRef1.value.chart.update()
    }
    if (widgetChartRef2.value) {
      widgetChartRef2.value.chart.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
      widgetChartRef2.value.chart.update()
    }
  })
})
</script>

<template>
  <CRow :xs="{ gutter: 4 }">
    <!-- Total participants -->
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="primary">
        <template #value>{{ totalParticipants.toLocaleString() }}
          <span class="fs-6 fw-normal">
            ({{ participantsChangePct }}%
            <CIcon :icon="arrowIcon(participantsChangePct)" />)
          </span>
        </template>
        <template #title>Participants</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem href="#">View all</CDropdownItem>
              <CDropdownItem href="#">Export CSV</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </template>
        <template #chart>
          <CChart type="line" class="mt-3 mx-3" style="height: 70px" ref="widgetChartRef1" :data="{
            labels: trendLabels,
            datasets: [
              {
                label: 'Participants',
                backgroundColor: 'transparent',
                borderColor: 'rgba(255,255,255,.55)',
                pointBackgroundColor: getStyle('--cui-primary'),
                data: participantsTrend,
              },
            ],
          }" :options="{
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
              y: { display: false, grid: { display: false }, ticks: { display: false } },
            },
            elements: {
              line: { borderWidth: 1, tension: 0.4 },
              point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
            },
          }" />
        </template>
      </CWidgetStatsA>
    </CCol>

    <!-- Qualified participants -->
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="info">
        <template #value>{{ qualifiedCount.toLocaleString() }}
          <span class="fs-6 fw-normal">
            ({{ qualifiedChangePct }}%
            <CIcon :icon="arrowIcon(qualifiedChangePct)" />)
          </span>
        </template>
        <template #title>Qualified</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem href="#">View all</CDropdownItem>
              <CDropdownItem href="#">Export CSV</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </template>
        <template #chart>
          <CChart type="line" class="mt-3 mx-3" style="height: 70px" ref="widgetChartRef2" :data="{
            labels: trendLabels,
            datasets: [
              {
                label: 'Qualified',
                backgroundColor: 'transparent',
                borderColor: 'rgba(255,255,255,.55)',
                pointBackgroundColor: getStyle('--cui-info'),
                data: qualifiedTrend,
              },
            ],
          }" :options="{
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
              y: { display: false, grid: { display: false }, ticks: { display: false } },
            },
            elements: {
              line: { borderWidth: 1 },
              point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
            },
          }" />
        </template>
      </CWidgetStatsA>
    </CCol>

    <!-- Conversion rate (pass rate) -->
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="warning">
        <template #value>{{ conversionRate }}%
          <span class="fs-6 fw-normal">
            ({{ conversionChangePct }}%
            <CIcon :icon="arrowIcon(conversionChangePct)" />)
          </span>
        </template>
        <template #title>Quiz Pass Rate</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem href="#">View all</CDropdownItem>
              <CDropdownItem href="#">Export CSV</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </template>
        <template #chart>
          <CChart type="line" class="mt-3" style="height: 70px" :data="{
            labels: trendLabels,
            datasets: [
              {
                label: 'Passed attempts',
                backgroundColor: 'rgba(255,255,255,.2)',
                borderColor: 'rgba(255,255,255,.55)',
                data: conversionTrend,
                fill: true,
              },
            ],
          }" :options="{
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            scales: {
              x: { border: { display: false }, display: false },
              y: { display: false },
            },
            elements: {
              line: { borderWidth: 2, tension: 0.4 },
              point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
            },
          }" />
        </template>
      </CWidgetStatsA>
    </CCol>

    <!-- Quiz attempts (sessions) -->
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="danger">
        <template #value>{{ totalSessions.toLocaleString() }}
          <span class="fs-6 fw-normal">
            ({{ sessionsChangePct }}%
            <CIcon :icon="arrowIcon(sessionsChangePct)" />)
          </span>
        </template>
        <template #title>Quiz Attempts</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem href="#">View all</CDropdownItem>
              <CDropdownItem href="#">Export CSV</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </template>
        <template #chart>
          <CChart type="bar" class="mt-3 mx-3" style="height: 70px" :data="{
            labels: trendLabels,
            datasets: [
              {
                label: 'Attempts',
                backgroundColor: 'rgba(255,255,255,.2)',
                borderColor: 'rgba(255,255,255,.55)',
                data: sessionsTrend,
                barPercentage: 0.6,
              },
            ],
          }" :options="{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false, drawTicks: false }, ticks: { display: false } },
              y: {
                border: { display: false },
                grid: { display: false, drawTicks: false },
                ticks: { display: false },
              },
            },
          }" />
        </template>
      </CWidgetStatsA>
    </CCol>
  </CRow>
</template>