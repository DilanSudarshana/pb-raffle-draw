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
import '@/styles/css/kiosk.css'

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