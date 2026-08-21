<template>
    <div class="kiosk-wrapper min-vh-100 d-flex flex-column align-items-center">

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
                <CCol :md="10" :lg="8" :xl="6">

                    <!-- ===================== HEADER ===================== -->
                    <div class="kiosk-header text-center" :class="{ 'card-loaded': isLoaded }">
                        <div class="logo-wrapper">
                            <div class="logo-ring-outer">
                                <div class="logo-ring-inner">
                                    <img src="/src/assets/logo/logo.jpg" alt="People's Bank" class="logo-img" />
                                </div>
                            </div>
                            <div class="orbit"><span class="dot dot-red"></span></div>
                            <div class="orbit orbit-2"><span class="dot dot-green"></span></div>
                            <div class="orbit orbit-3"><span class="dot dot-gold"></span></div>
                        </div>
                        <h1 class="header-title">PEOPLE'S BANK &bull; FINTECH CHALLENGE</h1>
                        <h2 class="brand-name">Test Your FinTech Knowledge &amp; Win!</h2>
                        <p class="header-sub">Central Bank FinTech Literature Workshop</p>
                    </div>

                    <div class="tricolor-divider">
                        <span></span><span></span><span></span>
                    </div>

                    <!-- ===================== MAIN CARD ===================== -->
                    <div class="kiosk-card" :class="{ 'card-loaded': isLoaded }">

                        <!-- ---------- REFERENCE SCREEN ---------- -->
                        <div v-if="screen === 'reference'" class="intro-hero">
                            <div class="intro-icon-wrap">
                                <div class="intro-ring"></div>
                                <div class="intro-ring ir2"></div>
                                <div class="intro-icon">🎯</div>
                            </div>
                            <h2 class="intro-title">Ready for the Challenge?</h2>
                            <p class="intro-desc">Enter the reference number received after registration.</p>

                            <CForm @submit.prevent="submitReference" class="kiosk-form">
                                <div class="field-group mb-3">
                                    <CFormInput v-model="reference" class="reference-input" required
                                        placeholder="PB-XXXXXX-XXXX" autocomplete="off" :disabled="loading" />
                                </div>
                                <CButton type="submit" class="login-btn w-100" :disabled="loading || !reference">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                                        aria-hidden="true"></span>
                                    <span class="btn-text">{{ loading ? 'Checking...' : 'Start Challenge' }}</span>
                                    <i v-if="!loading" class="mdi mdi-arrow-right btn-arrow"></i>
                                </CButton>
                            </CForm>

                            <div v-if="alertMsg" class="alert-box">{{ alertMsg }}</div>
                        </div>

                        <!-- ---------- QUIZ SCREEN ---------- -->
                        <div v-else-if="screen === 'quiz'">
                            <div class="quiz-topbar">
                                <div class="q-counter"><strong>{{ current + 1 }}</strong><span
                                        class="q-sep">/</span><span class="q-total">{{ attemptQuestions.length }}</span>
                                </div>
                                <div class="progress-track">
                                    <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
                                </div>
                                <div class="timer-box">
                                    <svg class="timer-ring" viewBox="0 0 44 44">
                                        <circle class="ring-bg" cx="22" cy="22" r="19"></circle>
                                        <circle class="ring-fill" cx="22" cy="22" r="19" :style="ringStyle"></circle>
                                    </svg>
                                    <span class="timer-num">{{ seconds }}</span>
                                </div>
                            </div>

                            <div class="q-tag">FINTECH KNOWLEDGE</div>
                            <div class="q-text">{{ currentQuestion?.question_text }}</div>

                            <div class="options-list">
                                <button v-for="letter in ['A', 'B', 'C', 'D']" :key="letter" class="option-btn"
                                    :class="optionClass(letter)" :disabled="answered" @click="selectAnswer(letter)">
                                    <span class="opt-letter">{{ letter }}</span>
                                    <span class="opt-text">{{ currentQuestion?.['option_' + letter.toLowerCase()]
                                        }}</span>
                                </button>
                            </div>

                            <div v-if="feedback" class="answer-feedback" :class="feedbackClass" v-html="feedback"></div>

                            <div class="next-row">
                                <button v-if="answered && !quizComplete" class="btn-next" @click="nextQuestion">Next
                                    Question →</button>
                            </div>
                        </div>

                        <!-- ---------- RESULT SCREEN ---------- -->
                        <div v-else-if="screen === 'result'" class="result-center">
                            <div class="result-icon-wrap">
                                <div class="result-ring"></div>
                                <div class="result-icon">🏆</div>
                            </div>
                            <h2 class="intro-title">{{ resultTitle }}</h2>
                            <p class="intro-desc">{{ resultDesc }}</p>
                            <button v-if="!passed" class="btn-outline" @click="restart">Back to Start</button>
                        </div>

                        <!-- ---------- WHEEL SCREEN ---------- -->
                        <div v-else-if="screen === 'wheel'" class="wheel-center">
                            <div class="section-label"><span class="section-line"></span><span
                                    class="section-text">RAFFLE DRAW</span><span class="section-line"></span></div>
                            <h2 class="intro-title">Good Luck!</h2>
                            <div class="wheel-wrap">
                                <div class="wheel-pointer"></div>
                                <div class="wheel" :style="wheelStyle">
                                    <span v-for="(p, i) in wheelPrizes" :key="p.name + i" class="wheel-label"
                                        :style="labelStyle(i)">{{ p.name }}</span>
                                </div>
                                <div class="wheel-center-mark">PB</div>
                            </div>
                            <button class="btn-primary kiosk-btn" :disabled="spinning" @click="spin">
                                {{ spinning ? 'DRAWING...' : 'SPIN THE WHEEL' }}
                            </button>
                        </div>

                        <!-- ---------- PRIZE SCREEN ---------- -->
                        <div v-else-if="screen === 'prize'" class="result-center">
                            <div class="prize-burst">🎉</div>
                            <p class="header-sub">YOUR RESULT</p>
                            <h2 class="prize-title">{{ prize?.prize_name }}</h2>
                            <p class="intro-desc">{{ prize?.description || 'Thank you for participating.' }}</p>
                            <div v-if="prize && Number(prize.is_winner)" class="winner-badge">★ WINNER — PLEASE COLLECT
                                YOUR GIFT ★</div>
                            <button class="btn-primary kiosk-btn" @click="restart">Finish</button>
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

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const APP_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ---------- screen state ----------
const screen = ref('reference') // reference | quiz | result | wheel | prize
const isLoaded = ref(false)
const loading = ref(false)
const alertMsg = ref('')

onMounted(() => {
    setTimeout(() => { isLoaded.value = true }, 120)
})

// ---------- reference ----------
const reference = ref('')

const submitReference = async () => {
    loading.value = true
    alertMsg.value = ''
    try {
        const fd = new FormData()
        fd.append('reference', reference.value)
        const r = await fetch(`${APP_BASE}/api/kiosk/reference`, { method: 'POST', body: fd })
        const d = await r.json()
        if (!d.ok) {
            alertMsg.value = d.message
            return
        }
        attemptQuestions.value = d.questions
        current.value = 0
        screen.value = 'quiz'
        startQuestion()
    } finally {
        loading.value = false
    }
}

// ---------- quiz ----------
const attemptQuestions = ref([])
const current = ref(0)
const answered = ref(false)
const feedback = ref('')
const feedbackClass = ref('')
const selectedAnswer = ref(null)
const correctOption = ref(null)
const quizComplete = ref(false)

const currentQuestion = computed(() => attemptQuestions.value[current.value])
const progressPct = computed(() => ((current.value + 1) / attemptQuestions.value.length) * 100)

const seconds = ref(15)
let timerId = null

const ringStyle = computed(() => {
    const circumference = 2 * Math.PI * 19
    const pct = seconds.value / 15
    return {
        strokeDasharray: `${circumference}`,
        strokeDashoffset: `${circumference * (1 - pct)}`,
    }
})

function startQuestion() {
    answered.value = false
    feedback.value = ''
    selectedAnswer.value = null
    correctOption.value = null
    startTimer()
}

function startTimer() {
    clearInterval(timerId)
    seconds.value = 15
    timerId = setInterval(() => {
        seconds.value--
        if (seconds.value <= 0) {
            clearInterval(timerId)
            if (!answered.value) selectAnswer('X', true)
        }
    }, 1000)
}

function optionClass(letter) {
    if (!answered.value) return ''
    if (letter === correctOption.value) return 'opt-correct'
    if (letter === selectedAnswer.value && letter !== correctOption.value) return 'opt-wrong'
    return ''
}

async function selectAnswer(letter, timeout = false) {
    if (answered.value) return
    answered.value = true
    clearInterval(timerId)
    selectedAnswer.value = letter

    const fd = new FormData()
    fd.append('question_id', currentQuestion.value.id)
    fd.append('answer', letter)
    const r = await fetch(`${APP_BASE}/api/kiosk/answer`, { method: 'POST', body: fd })
    const d = await r.json()

    correctOption.value = d.correct_option
    feedbackClass.value = d.correct ? 'fb-correct' : 'fb-wrong'
    feedback.value = d.correct
        ? '✓ Correct! Your answer is correct.'
        : `✕ Incorrect. ${timeout ? 'Time expired. ' : ''}Correct answer: <strong>Option ${d.correct_option}</strong>.`

    if (d.complete) {
        quizComplete.value = true
        passed.value = d.passed
        if (d.passed) {
            resultTitle.value = 'Excellent! You Qualified!'
            resultDesc.value = 'All 3 answers are correct. Opening the raffle draw...'
            screen.value = 'result'
            setTimeout(() => {
                screen.value = 'wheel'
                loadWheel()
            }, 1000)
        } else {
            resultTitle.value = 'Challenge Complete'
            resultDesc.value = 'You need all 3 correct answers to unlock the raffle. Thank you for participating.'
            screen.value = 'result'
        }
    }
}

function nextQuestion() {
    current.value++
    startQuestion()
}

function restart() {
    clearInterval(timerId)
    reference.value = ''
    alertMsg.value = ''
    attemptQuestions.value = []
    current.value = 0
    quizComplete.value = false
    wheelPrizes.value = []
    prize.value = null
    screen.value = 'reference'
}

// ---------- result ----------
const resultTitle = ref('')
const resultDesc = ref('')
const passed = ref(false)

// ---------- wheel ----------
// Wheel sections come live from Admin > Draw Sections, so slice count,
// names, and colors always match whatever is currently active/in stock.
const wheelPrizes = ref([])
const wheelColors = ['#e53935', '#43a047', '#FFD700', '#2e7d32', '#f57f17', '#c62828', '#1565c0', '#6a1b9a', '#00838f', '#ad1457']
const spinning = ref(false)
const wheelRotation = ref(0)

const wheelStyle = computed(() => {
    const n = wheelPrizes.value.length || 1
    const seg = 360 / n
    const stops = wheelPrizes.value
        .map((p, i) => `${wheelColors[i % wheelColors.length]} ${i * seg}deg ${(i + 1) * seg}deg`)
        .join(',')
    return {
        background: wheelPrizes.value.length ? `conic-gradient(${stops})` : '#333',
        transform: `rotate(${wheelRotation.value}deg)`,
    }
})

function labelStyle(i) {
    const n = wheelPrizes.value.length || 1
    const seg = 360 / n
    const mid = i * seg + seg / 2
    return { transform: `rotate(${mid}deg) translateY(-115px) rotate(${-mid}deg)` }
}

async function loadWheel() {
    try {
        const r = await fetch(`${APP_BASE}/api/kiosk/prizes`)
        const d = await r.json()
        wheelPrizes.value = d.ok && d.prizes.length ? d.prizes : []
    } catch {
        wheelPrizes.value = []
    }
    wheelRotation.value = 0
}

// ---------- prize ----------
const prize = ref(null)

async function spin() {
    spinning.value = true
    const r = await fetch(`${APP_BASE}/api/kiosk/draw`, { method: 'POST' })
    const d = await r.json()
    if (!d.ok) {
        alert(d.message)
        spinning.value = false
        return
    }
    const n = wheelPrizes.value.length || 1
    const seg = 360 / n
    let idx = wheelPrizes.value.findIndex((p) => p.name === d.prize.prize_name)
    if (idx < 0) idx = 0
    wheelRotation.value = 1440 + (360 - (idx * seg + seg / 2))

    setTimeout(() => {
        prize.value = d.prize
        screen.value = 'prize'
        spinning.value = false
    }, 4200)
}

onBeforeUnmount(() => {
    clearInterval(timerId)
})
</script>

<style scoped>
:root {
    --red: #e53935;
    --green: #43a047;
    --gold: #FFD700;
    --dark: #0f0f1a;
}

.kiosk-wrapper {
    background:
        url('/src/assets/login_background.jpg') center/cover no-repeat fixed,
        linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
    position: relative;
    overflow: hidden;
    padding: 3rem 0;
}

.kiosk-wrapper::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(15, 15, 26, 0.82) 0%, rgba(26, 26, 46, 0.78) 100%);
    pointer-events: none;
    z-index: 0;
}

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

.kiosk-header {
    position: relative;
    z-index: 1;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.kiosk-header.card-loaded {
    opacity: 1;
    transform: translateY(0);
}

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
    background: conic-gradient(#e53935 0deg 120deg, #43a047 120deg 240deg, #FFD700 240deg 360deg);
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

.header-title {
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
    font-size: 1.4rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #FFD700, #43a047, #e53935, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 300% auto;
    animation: titleShift 6s linear infinite reverse;
}

.header-sub {
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0;
}

.tricolor-divider {
    display: flex;
    gap: 4px;
    margin: 1rem auto;
    width: 60px;
    justify-content: center;
}

.tricolor-divider span {
    display: block;
    height: 3px;
    flex: 1;
    border-radius: 2px;
}

.tricolor-divider span:nth-child(1) {
    background: #e53935;
}

.tricolor-divider span:nth-child(2) {
    background: #43a047;
}

.tricolor-divider span:nth-child(3) {
    background: #FFD700;
}

.kiosk-card {
    background: rgba(15, 15, 26, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.08), 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(229, 57, 53, 0.06);
    position: relative;
    z-index: 1;
    color: #fff;
    opacity: 0;
    transform: translateY(24px) scale(0.98);
    transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.kiosk-card.card-loaded {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.intro-hero,
.result-center,
.wheel-center {
    text-align: center;
}

.intro-icon-wrap,
.result-icon-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.intro-ring,
.result-ring {
    position: absolute;
    inset: 0;
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 50%;
    animation: rotate 6s linear infinite;
}

.ir2 {
    inset: -8px;
    border-color: rgba(229, 57, 53, 0.25);
    animation-duration: 9s;
    animation-direction: reverse;
}

.intro-icon,
.result-icon {
    font-size: 2rem;
}

.intro-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 0.5rem;
}

.intro-desc {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.reference-input {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    padding: 11px 16px;
    font-size: 0.95rem;
    text-align: center;
    letter-spacing: 0.05em;
    width: 100%;
}

.reference-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

.reference-input:focus {
    background: rgba(255, 255, 255, 0.1);
    border-color: #FFD700;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.12);
}

.login-btn,
.btn-primary.kiosk-btn {
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-position 0.5s ease, transform 0.2s ease;
    width: 100%;
}

.login-btn:hover:not(:disabled),
.btn-primary.kiosk-btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.login-btn:disabled,
.btn-primary.kiosk-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-outline {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
    padding: 10px 20px;
    font-size: 0.85rem;
}

.btn-outline:hover {
    border-color: #FFD700;
    color: #FFD700;
}

.alert-box {
    margin-top: 1rem;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.3);
    color: #ffb4b0;
    font-size: 0.85rem;
}

/* Quiz */
.quiz-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1rem;
}

.q-counter {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
}

.q-sep {
    margin: 0 2px;
}

.progress-track {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #e53935, #FFD700, #43a047);
    transition: width 0.3s ease;
}

.timer-box {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.timer-ring {
    width: 44px;
    height: 44px;
    transform: rotate(-90deg);
}

.ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 3;
}

.ring-fill {
    fill: none;
    stroke: #FFD700;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
}

.timer-num {
    position: absolute;
    font-size: 0.85rem;
    font-weight: 700;
}

.q-tag {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    color: #FFD700;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.q-text {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
}

.options-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.option-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px 16px;
    color: #fff;
    text-align: left;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.option-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
}

.option-btn:disabled {
    cursor: not-allowed;
}

.opt-letter {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.option-btn.opt-correct {
    background: rgba(67, 160, 71, 0.2);
    border-color: #43a047;
}

.option-btn.opt-correct .opt-letter {
    background: #43a047;
}

.option-btn.opt-wrong {
    background: rgba(229, 57, 53, 0.2);
    border-color: #e53935;
}

.option-btn.opt-wrong .opt-letter {
    background: #e53935;
}

.answer-feedback {
    margin-top: 1rem;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
}

.fb-correct {
    background: rgba(67, 160, 71, 0.15);
    border: 1px solid rgba(67, 160, 71, 0.3);
    color: #a5d6a7;
}

.fb-wrong {
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.3);
    color: #ffb4b0;
}

.next-row {
    margin-top: 1rem;
    text-align: right;
}

.btn-next {
    background: linear-gradient(135deg, #43a047, #2e7d32);
    border: none;
    border-radius: 8px;
    color: #fff;
    padding: 10px 18px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
}

/* Wheel */
.section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    margin-bottom: 0.5rem;
}

.section-line {
    width: 30px;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
}

.section-text {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: #FFD700;
}

.wheel-wrap {
    position: relative;
    width: 260px;
    height: 260px;
    margin: 1.5rem auto;
}

.wheel-pointer {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 20px solid #FFD700;
    z-index: 2;
}

.wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
    transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
    border: 4px solid rgba(255, 255, 255, 0.1);
}

.wheel-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: 0 0;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
}

.wheel-center-mark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #1a1a2e;
    border: 2px solid #FFD700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.8rem;
    z-index: 2;
}

/* Prize */
.prize-burst {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.prize-title {
    font-size: 1.6rem;
    font-weight: 900;
    background: linear-gradient(90deg, #FFD700, #43a047, #e53935);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
}

.winner-badge {
    margin-top: 1rem;
    padding: 10px 16px;
    border-radius: 8px;
    background: rgba(255, 215, 0, 0.15);
    border: 1px solid rgba(255, 215, 0, 0.4);
    color: #FFD700;
    font-weight: 700;
    font-size: 0.85rem;
}

.card-footer-stripe {
    display: flex;
    height: 4px;
    margin: 2rem -2rem -2rem;
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
</style>