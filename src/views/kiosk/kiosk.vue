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

                        <!-- ---------- LANGUAGE SELECT SCREEN ---------- -->
                        <div v-if="screen === 'language'" class="intro-hero">
                            <div class="intro-icon-wrap">
                                <div class="intro-ring"></div>
                                <div class="intro-ring ir2"></div>
                                <div class="intro-icon">🌐</div>
                            </div>
                            <h2 class="intro-title">Choose Your Language</h2>
                            <p class="intro-desc">Select a language to begin the challenge.</p>

                            <div class="lang-list">
                                <button v-for="l in langOptions" :key="l.code" class="lang-btn" :disabled="loading"
                                    @click="chooseLanguage(l.code)">
                                    <span>{{ l.label }}</span>
                                    <i class="mdi mdi-arrow-right btn-arrow"></i>
                                </button>
                            </div>

                            <div v-if="alertMsg" class="alert-box">{{ alertMsg }}</div>
                        </div>

                        <!-- ---------- MOBILE ENTRY SCREEN ---------- -->
                        <div v-else-if="screen === 'reference'" class="intro-hero">
                            <div class="intro-icon-wrap">
                                <div class="intro-ring"></div>
                                <div class="intro-ring ir2"></div>
                                <div class="intro-icon">🏆</div>
                            </div>
                            <h2 class="intro-title">Ready for the Challenge?</h2>
                            <p class="intro-desc">Enter your mobile number to start the quiz.</p>

                            <button class="lang-chip" @click="screen = 'language'">
                                <i class="mdi mdi-web"></i> {{ currentLangLabel }} · change
                            </button>

                            <CForm @submit.prevent="submitMobile" class="kiosk-form">
                                <div class="field-group mb-3">
                                    <CFormInput v-model="mobile" class="reference-input" required type="tel"
                                        inputmode="numeric" maxlength="10" placeholder="07XXXXXXXX" autocomplete="off"
                                        :disabled="loading" @input="mobile = mobile.replace(/[^0-9]/g, '')" />
                                </div>
                                <CButton type="submit" class="login-btn w-100" :disabled="loading || !isValidMobile">
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

                            <div class="q-tag">FINTECH KNOWLEDGE &middot; {{ currentLangLabel }}</div>
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
                                <div class="result-icon">{{ passed ? '🏆' : '😕' }}</div>
                            </div>
                            <h2 class="intro-title">{{ resultTitle }}</h2>
                            <p class="intro-desc">{{ resultDesc }}</p>

                            <!-- pass state: brief transition message while we hand off to the raffle page -->
                            <div v-if="passed" class="redirect-hint">
                                <span class="spinner-border spinner-border-sm me-2" role="status"
                                    aria-hidden="true"></span>
                                Opening the raffle draw...
                            </div>

                            <!-- fail state: "better luck next time" stays right here -->
                            <template v-else>
                                <div class="better-luck-badge">Better luck next time!</div>
                                <button class="btn-outline" @click="restart">Back to Start</button>
                            </template>
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
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

// =====================================================
// SCREEN STATE
// =====================================================

const screen = ref('language')
// language | reference | quiz | result

const isLoaded = ref(false)
const loading = ref(false)
const alertMsg = ref('')

// =====================================================
// LANGUAGE SELECTION
// =====================================================

const langOptions = [
    {
        code: 1,
        label: 'English',
    },
    {
        code: 2,
        label: 'සිංහල',
    },
    {
        code: 3,
        label: 'தமிழ்',
    },
]

const selectedLang = ref(null)

const currentLangLabel = computed(() => {
    return (
        langOptions.find(
            (language) => language.code === selectedLang.value
        )?.label || ''
    )
})

function chooseLanguage(code) {
    selectedLang.value = code
    alertMsg.value = ''
    screen.value = 'reference'
}

// =====================================================
// PARTICIPANT
// =====================================================

const mobile = ref('')
const participantName = ref('')

const isValidMobile = computed(() => {
    return /^0\d{9}$/.test(mobile.value)
})

// =====================================================
// QUIZ QUESTIONS
// =====================================================

const attemptQuestions = ref([])

const current = ref(0)

const currentQuestion = computed(() => {
    return attemptQuestions.value[current.value]
})

const progressPct = computed(() => {
    if (!attemptQuestions.value.length) {
        return 0
    }

    return (
        ((current.value + 1) /
            attemptQuestions.value.length) *
        100
    )
})

// =====================================================
// QUIZ STATE
// =====================================================

const answered = ref(false)

const feedback = ref('')

const feedbackClass = ref('')

const selectedAnswer = ref(null)

const correctOption = ref(null)

const quizComplete = ref(false)

const score = ref(0)

const passed = ref(false)

const resultTitle = ref('')

const resultDesc = ref('')

// =====================================================
// TIMER
// =====================================================

const QUESTION_TIME = 15

const seconds = ref(QUESTION_TIME)

let timerId = null

const ringStyle = computed(() => {
    const circumference = 2 * Math.PI * 19

    const pct = seconds.value / QUESTION_TIME

    return {
        strokeDasharray: `${circumference}`,
        strokeDashoffset:
            `${circumference * (1 - pct)}`,
    }
})

// =====================================================
// PAGE LOAD
// =====================================================

onMounted(() => {
    setTimeout(() => {
        isLoaded.value = true
    }, 120)
})

// =====================================================
// ARRAY SHUFFLE
// =====================================================

function shuffle(arr) {
    const a = [...arr]

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))

            ;[a[i], a[j]] = [a[j], a[i]]
    }

    return a
}

// =====================================================
// SUBMIT MOBILE NUMBER
// =====================================================

const submitMobile = async () => {
    // ---------------------------------------------
    // Validate mobile
    // ---------------------------------------------

    if (!isValidMobile.value) {
        alertMsg.value =
            'Please enter a valid 10-digit mobile number.'
        return
    }

    // ---------------------------------------------
    // Validate language
    // ---------------------------------------------

    if (!selectedLang.value) {
        alertMsg.value =
            'Please select a language first.'

        screen.value = 'language'

        return
    }

    loading.value = true
    alertMsg.value = ''

    try {
        // =================================================
        // 1. FIND PARTICIPANT
        // =================================================

        const {
            data: participant,
            error: pErr,
        } = await supabase
            .from('participants')
            .select(
                'mobile, name, id_number, quiz_attempted, qualified'
            )
            .eq('mobile', mobile.value)
            .maybeSingle()

        if (pErr) {
            alertMsg.value =
                `Participant lookup failed: ${pErr.message}`

            return
        }

        // ---------------------------------------------
        // Participant does not exist
        // ---------------------------------------------

        if (!participant) {
            alertMsg.value =
                'This mobile number is not registered. Please register first.'

            return
        }

        // =================================================
        // 2. CHECK WHETHER QUIZ WAS ALREADY ATTEMPTED
        // =================================================

        if (
            participant.quiz_attempted &&
            participant.quiz_attempted > 0
        ) {
            alertMsg.value =
                'You have already participated in this quiz.'

            return
        }

        // Store participant name
        participantName.value = participant.name

        // =================================================
        // 3. GET QUESTIONS FOR SELECTED LANGUAGE ONLY
        // =================================================

        /*
         * Language mapping:
         *
         * 1 = English
         * 2 = Sinhala
         * 3 = Tamil
         */

        const {
            data: questions,
            error: qErr,
        } = await supabase
            .from('questions')
            .select(`
                id,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                active,
                lang
            `)
            .eq('active', true)
            .eq('lang', selectedLang.value)

        // =================================================
        // QUESTION FETCH ERROR
        // =================================================

        if (qErr) {
            alertMsg.value =
                `Question fetch failed: ${qErr.message}`

            return
        }

        // =================================================
        // CHECK QUESTION COUNT
        // =================================================

        if (!questions || questions.length < 3) {
            alertMsg.value =
                `Not enough active questions available in ${currentLangLabel.value}. ` +
                `Required: 3, Available: ${questions?.length ?? 0}.`

            return
        }

        // =================================================
        // 4. RANDOMLY SELECT EXACTLY 3 QUESTIONS
        // =================================================

        attemptQuestions.value =
            shuffle(questions).slice(0, 3)

        // =================================================
        // 5. RESET QUIZ
        // =================================================

        score.value = 0

        current.value = 0

        quizComplete.value = false

        passed.value = false

        selectedAnswer.value = null

        correctOption.value = null

        answered.value = false

        feedback.value = ''

        feedbackClass.value = ''

        // =================================================
        // 6. OPEN QUIZ
        // =================================================

        screen.value = 'quiz'

        startQuestion()

    } catch (e) {
        console.error(
            'submitMobile error:',
            e
        )

        alertMsg.value =
            e?.message ||
            'Something went wrong. Please try again.'

    } finally {
        loading.value = false
    }
}

// =====================================================
// START QUESTION
// =====================================================

function startQuestion() {
    answered.value = false

    feedback.value = ''

    feedbackClass.value = ''

    selectedAnswer.value = null

    correctOption.value = null

    startTimer()
}

// =====================================================
// START TIMER
// =====================================================

function startTimer() {
    clearInterval(timerId)

    seconds.value = QUESTION_TIME

    timerId = setInterval(() => {
        seconds.value--

        if (seconds.value <= 0) {
            clearInterval(timerId)

            if (!answered.value) {
                selectAnswer('X', true)
            }
        }
    }, 1000)
}

// =====================================================
// OPTION STYLE
// =====================================================

function optionClass(letter) {
    if (!answered.value) {
        return ''
    }

    // Correct option
    if (letter === correctOption.value) {
        return 'opt-correct'
    }

    // Wrong selected option
    if (
        letter === selectedAnswer.value &&
        letter !== correctOption.value
    ) {
        return 'opt-wrong'
    }

    return ''
}

// =====================================================
// SELECT ANSWER
// =====================================================

async function selectAnswer(
    letter,
    timeout = false
) {
    // Prevent multiple clicks
    if (answered.value) {
        return
    }

    answered.value = true

    clearInterval(timerId)

    selectedAnswer.value = letter

    const q = currentQuestion.value

    if (!q) {
        console.error(
            'Current question is undefined.'
        )

        return
    }

    // =================================================
    // CHECK ANSWER
    // =================================================

    const isCorrect =
        letter === q.correct_option

    correctOption.value =
        q.correct_option

    // =================================================
    // CALCULATE NEW SCORE
    // =================================================

    const newScore =
        score.value +
        (isCorrect ? 1 : 0)

    score.value = newScore

    // =================================================
    // FEEDBACK
    // =================================================

    feedbackClass.value =
        isCorrect
            ? 'fb-correct'
            : 'fb-wrong'

    if (isCorrect) {
        feedback.value =
            '✓ Correct! Your answer is correct.'
    } else {
        feedback.value =
            `✕ Incorrect. ${timeout
                ? 'Time expired. '
                : ''
            }Correct answer: <strong>Option ${q.correct_option}</strong>.`
    }

    // =================================================
    // CHECK LAST QUESTION
    // =================================================

    const isLastQuestion =
        current.value ===
        attemptQuestions.value.length - 1

    if (!isLastQuestion) {
        return
    }

    // =================================================
    // QUIZ COMPLETE
    // =================================================

    quizComplete.value = true

    // IMPORTANT:
    // Use newScore because this answer has just been added.
    const finalScore = newScore

    const totalQuestions =
        attemptQuestions.value.length

    const didPass =
        finalScore === totalQuestions

    passed.value = didPass

    // =================================================
    // SAVE QUIZ ATTEMPT
    // =================================================

    try {
        const {
            error: attemptErr,
        } = await supabase
            .from('quiz_attempts')
            .insert({
                participant_mobile:
                    mobile.value,

                question_ids:
                    attemptQuestions.value.map(
                        (q) => q.id
                    ),

                score: finalScore,

                passed: didPass,

                completed_at:
                    new Date().toISOString(),
            })

        if (attemptErr) {
            console.error(
                'quiz_attempts insert failed:',
                attemptErr.message,
                attemptErr.details,
                attemptErr.hint
            )
        }

        // =================================================
        // UPDATE PARTICIPANT
        // =================================================

        const {
            error: updateErr,
        } = await supabase
            .from('participants')
            .update({
                quiz_attempted: 1,

                qualified: didPass,

                quiz_completed_at:
                    new Date().toISOString(),
            })
            .eq(
                'mobile',
                mobile.value
            )

        if (updateErr) {
            console.error(
                'participants update failed:',
                updateErr.message,
                updateErr.details,
                updateErr.hint
            )
        }

    } catch (e) {
        console.error(
            'Failed to save quiz attempt:',
            e
        )
    }

    // =================================================
    // RESULT
    // =================================================

    if (didPass) {

        resultTitle.value =
            'Excellent! You Qualified!'

        resultDesc.value =
            'All 3 answers are correct. Get ready for the raffle draw...'

        screen.value = 'result'

        // =================================================
        // GO TO RAFFLE DRAW
        // =================================================

        setTimeout(() => {
            router.push({
                name: 'raffle_draw',

                query: {
                    mobile:
                        mobile.value,

                    name:
                        participantName.value,
                },
            })
        }, 1200)

    } else {

        resultTitle.value =
            'Challenge Complete'

        resultDesc.value =
            `You scored ${finalScore}/${totalQuestions}. ` +
            'You need all 3 correct answers to unlock the raffle draw.'

        screen.value = 'result'
    }
}

// =====================================================
// NEXT QUESTION
// =====================================================

function nextQuestion() {
    if (
        current.value >=
        attemptQuestions.value.length - 1
    ) {
        return
    }

    current.value++

    startQuestion()
}

// =====================================================
// RESTART QUIZ
// =====================================================

function restart() {
    clearInterval(timerId)

    mobile.value = ''

    participantName.value = ''

    alertMsg.value = ''

    attemptQuestions.value = []

    current.value = 0

    score.value = 0

    quizComplete.value = false

    passed.value = false

    selectedAnswer.value = null

    correctOption.value = null

    answered.value = false

    feedback.value = ''

    feedbackClass.value = ''

    seconds.value = QUESTION_TIME

    selectedLang.value = null

    resultTitle.value = ''

    resultDesc.value = ''

    screen.value = 'language'
}

// =====================================================
// CLEANUP TIMER
// =====================================================

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
.result-center {
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

/* Language select */
.lang-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 0.5rem;
}

.lang-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 13px 18px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.lang-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #FFD700;
    transform: translateY(-1px);
}

.lang-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.lang-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    padding: 5px 12px;
    margin-bottom: 1rem;
    cursor: pointer;
}

.lang-chip:hover {
    color: #FFD700;
    border-color: #FFD700;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-position 0.5s ease, transform 0.2s ease;
    width: 100%;
}

.login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.login-btn:disabled {
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
    margin-top: 0.5rem;
    cursor: pointer;
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

.redirect-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    margin-top: 0.5rem;
}

.better-luck-badge {
    display: inline-block;
    margin-bottom: 1rem;
    padding: 8px 18px;
    border-radius: 20px;
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.35);
    color: #ffb4b0;
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
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