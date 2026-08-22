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
                        <h2 class="brand-name">Congratulations, {{ participantName || 'Champion' }}!</h2>
                        <p class="header-sub">Central Bank FinTech Literature Workshop</p>
                    </div>

                    <div class="tricolor-divider">
                        <span></span><span></span><span></span>
                    </div>

                    <!-- ===================== MAIN CARD ===================== -->
                    <div class="kiosk-card" :class="{ 'card-loaded': isLoaded }">

                        <!-- ---------- WHEEL SCREEN ---------- -->
                        <div v-if="screen === 'wheel'" class="wheel-center">
                            <div class="section-label"><span class="section-line"></span><span
                                    class="section-text">RAFFLE DRAW</span><span class="section-line"></span></div>
                            <h2 class="intro-title">Good Luck!</h2>
                            <p class="intro-desc">You qualified with a perfect score — spin the wheel for your prize.
                            </p>
                            <div v-if="alertMsg" class="alert-box">{{ alertMsg }}</div>
                            <div class="wheel-wrap">
                                <div class="wheel-pointer"></div>
                                <div class="wheel" :style="wheelStyle">
                                    <span v-for="(p, i) in wheelPrizes" :key="p.id" class="wheel-label"
                                        :style="labelStyle(i)">{{ p.name }}</span>
                                </div>
                                <div class="wheel-center-mark">PB</div>
                            </div>
                            <button class="btn-primary kiosk-btn" :disabled="spinning || !wheelPrizes.length || !mobile"
                                @click="spin">
                                {{ spinning ? 'DRAWING...' : 'SPIN THE WHEEL' }}
                            </button>
                        </div>

                        <!-- ---------- PRIZE SCREEN ---------- -->
                        <div v-else-if="screen === 'prize'" class="result-center">
                            <div class="prize-burst">🎉</div>
                            <p class="header-sub">YOUR RESULT</p>
                            <h2 class="prize-title">{{ prize?.prize_name }}</h2>
                            <p class="intro-desc">{{ prize?.description || 'Thank you for participating.' }}</p>
                            <div v-if="prize && prize.is_winner" class="winner-badge">★ WINNER — PLEASE COLLECT
                                YOUR GIFT ★</div>
                            <button class="btn-primary kiosk-btn" @click="finish">Finish</button>
                        </div>

                        <!-- ---------- MISSING PARTICIPANT / GUARD SCREEN ---------- -->
                        <div v-else class="result-center">
                            <div class="result-icon-wrap">
                                <div class="result-ring"></div>
                                <div class="result-icon">⚠️</div>
                            </div>
                            <h2 class="intro-title">No Active Entry Found</h2>
                            <p class="intro-desc">Please complete the quiz first to unlock the raffle draw.</p>
                            <button class="btn-outline" @click="finish">Back to Quiz</button>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const isLoaded = ref(false)
const alertMsg = ref('')

// screen: 'guard' (no participant in query) | 'wheel' | 'prize'
const screen = ref('guard')

// participant handed off from the quiz page via route query
const mobile = ref('')
const participantName = ref('')

onMounted(() => {
    setTimeout(() => { isLoaded.value = true }, 120)

    mobile.value = typeof route.query.mobile === 'string' ? route.query.mobile : ''
    participantName.value = typeof route.query.name === 'string' ? route.query.name : ''

    if (!mobile.value) {
        screen.value = 'guard'
        return
    }

    screen.value = 'wheel'
    loadWheel()
})

// ---------- wheel ----------
// Wheel sections come live from Supabase "prizes" (active = true). Segments
// are drawn evenly for display; the actual winner is picked using each
// prize's `weight`, restricted to prizes that still have stock at spin time.
const wheelPrizes = ref([])
const wheelColors = ['#e53935', '#43a047', '#FFD700', '#2e7d32', '#f57f17', '#c62828', '#1565c0', '#6a1b9a', '#00838f', '#ad1457']
const spinning = ref(false)
const wheelRotation = ref(0)

// The visual spin (CSS transition below) and the reveal timeout must agree —
// change both together if you want a different draw duration.
const SPIN_DURATION_MS = 15000
const SPIN_TURNS = 10 // full rotations before landing; higher = feels slower/more dramatic over 15s

// Smaller font as segment count grows, so longer prize names don't collide
const labelFontSizePx = computed(() => {
    const n = wheelPrizes.value.length || 1
    if (n <= 4) return 13
    if (n <= 6) return 12
    if (n <= 8) return 11
    return 10
})

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
    const radius = 118
    // translateX(-50%) at the end centers the label on the radial line instead
    // of left-anchoring it — that left-anchoring was the main cause of the
    // crooked/overlapping look on longer prize names.
    return {
        transform: `rotate(${mid}deg) translateY(-${radius}px) rotate(${-mid}deg) translateX(-50%)`,
        fontSize: `${labelFontSizePx.value}px`,
    }
}

async function loadWheel() {
    try {
        const { data, error, status, statusText } = await supabase
            .from('prizes')
            .select('id, name, description, is_winner, weight, stock, awarded_count, active')
            .eq('active', true)

        // Debug aid: an RLS policy blocking anon SELECT returns error === null
        // and data === [] — it does NOT throw. If you see data.length === 0
        // here but rows exist in the table, it's almost always a missing
        // "select" policy for the anon role on public.prizes.
        console.log('[loadWheel] status:', status, statusText, 'rows:', data?.length ?? 0, 'error:', error)

        if (error) {
            alertMsg.value = `Failed to load prizes: ${error.message}`
            wheelPrizes.value = []
            return
        }

        if (!data || !data.length) {
            alertMsg.value = 'No prizes available right now. (If prizes exist in the table, check the RLS SELECT policy on "prizes" for the anon role.)'
            wheelPrizes.value = []
            return
        }

        alertMsg.value = ''
        wheelPrizes.value = data
    } catch (e) {
        alertMsg.value = e.message || 'Failed to load prizes.'
        wheelPrizes.value = []
    }
    wheelRotation.value = 0
}

// Weighted random pick using each prize's `weight` column.
// Higher weight = more likely to be picked. Falls back to weight 1 if unset.
function pickWeightedPrize(prizes) {
    const total = prizes.reduce((sum, p) => sum + (p.weight || 1), 0)
    let r = Math.random() * total
    for (const p of prizes) {
        r -= (p.weight || 1)
        if (r <= 0) return p
    }
    return prizes[prizes.length - 1]
}

// ---------- prize ----------
const prize = ref(null)

async function spin() {
    if (!mobile.value) {
        alertMsg.value = 'Missing participant details. Please restart from the quiz.'
        return
    }

    spinning.value = true
    alertMsg.value = ''
    try {
        // raffle_results has "mobile" as its PRIMARY KEY, so this is a
        // direct existence check — one raffle entry per participant, ever.
        const { data: existingDraw, error: dErr } = await supabase
            .from('raffle_results')
            .select('mobile')
            .eq('mobile', mobile.value)
            .maybeSingle()
        if (dErr) throw dErr
        if (existingDraw) {
            alertMsg.value = 'You have already spun the wheel.'
            spinning.value = false
            return
        }

        if (!wheelPrizes.value.length) {
            alertMsg.value = 'No prizes available right now.'
            spinning.value = false
            return
        }

        // Only draw from prizes that still have stock (or unlimited stock)
        const eligible = wheelPrizes.value.filter(
            p => p.stock === null || p.stock === undefined || p.stock > 0
        )
        if (!eligible.length) {
            alertMsg.value = 'No prizes in stock right now.'
            spinning.value = false
            return
        }

        const chosen = pickWeightedPrize(eligible)
        // Use the index within the FULL displayed wheel so the rotation
        // lands visually on the correct segment
        const idx = wheelPrizes.value.findIndex(p => p.id === chosen.id)

        const { error: insErr } = await supabase.from('raffle_results').insert({
            mobile: mobile.value,
            participant_name: participantName.value || 'Participant',
            prize_id: chosen.id,
            prize_name: chosen.name,
            description: chosen.description,
            is_winner: !!chosen.is_winner,
        })
        if (insErr) throw insErr

        // Decrement stock (if limited) and bump awarded_count for winning prizes
        if (chosen.is_winner) {
            const updates = { awarded_count: (chosen.awarded_count || 0) + 1 }
            if (typeof chosen.stock === 'number') {
                updates.stock = Math.max(chosen.stock - 1, 0)
            }
            const { error: updErr } = await supabase
                .from('prizes')
                .update(updates)
                .eq('id', chosen.id)
            if (updErr) console.error('Failed to update prize stock/awarded_count:', updErr)
        }

        const n = wheelPrizes.value.length || 1
        const seg = 360 / n
        wheelRotation.value = SPIN_TURNS * 360 + (360 - (idx * seg + seg / 2))

        setTimeout(() => {
            prize.value = {
                prize_name: chosen.name,
                description: chosen.description,
                is_winner: !!chosen.is_winner,
            }
            screen.value = 'prize'
            spinning.value = false
        }, SPIN_DURATION_MS + 300) // small buffer so the CSS transition fully settles first
    } catch (e) {
        alertMsg.value = e.message || 'Something went wrong during the draw.'
        spinning.value = false
    }
}

function finish() {
    // send the kiosk back to the quiz landing page for the next participant
    router.push({ name: 'quiz' })
}
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

.result-center,
.wheel-center {
    text-align: center;
}

.result-icon-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-ring {
    position: absolute;
    inset: 0;
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 50%;
    animation: rotate 6s linear infinite;
}

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

.btn-outline {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
    padding: 10px 20px;
    font-size: 0.85rem;
    cursor: pointer;
}

.btn-outline:hover {
    border-color: #FFD700;
    color: #FFD700;
}

.alert-box {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.3);
    color: #ffb4b0;
    font-size: 0.85rem;
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
    width: 300px;
    height: 300px;
    margin: 1.5rem auto;
    max-width: 100%;
}

.wheel-pointer {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-top: 22px solid #FFD700;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
    z-index: 2;
}

.wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
    overflow: hidden;
    /* Duration here must stay in sync with SPIN_DURATION_MS in the script (15s). */
    transition: transform 15s cubic-bezier(0.1, 0.7, 0.15, 1);
    border: 4px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.15), inset 0 0 30px rgba(0, 0, 0, 0.35);
}

.wheel-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: 0 0;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
    white-space: nowrap;
    max-width: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    pointer-events: none;
}

.wheel-center-mark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #1a1a2e;
    border: 3px solid #FFD700;
    box-shadow: 0 0 0 4px rgba(15, 15, 26, 0.9), 0 4px 10px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFD700;
    font-weight: 800;
    font-size: 0.8rem;
    z-index: 2;
}

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

.btn-primary.kiosk-btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.btn-primary.kiosk-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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