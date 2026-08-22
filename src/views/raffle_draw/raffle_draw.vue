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

                            <div class="wheel-stage">
                                <div class="wheel-wrap" ref="wheelWrapEl" :style="{ '--wheel-size': wheelSize + 'px' }">
                                    <div class="wheel-pointer"></div>

                                    <!-- ring of gold marquee bulbs around the rim -->
                                    <div class="wheel-lights">
                                        <span v-for="i in LIGHT_COUNT" :key="'light-' + i" class="light-bulb"
                                            :style="lightStyle(i)">
                                            <span class="light-bulb-dot"
                                                :style="{ animationDelay: `${-((i - 1) / LIGHT_COUNT) * CHASE_DURATION_S}s` }"></span>
                                        </span>
                                    </div>

                                    <div class="wheel" :style="wheelStyle">
                                        <span v-for="(p, i) in wheelPrizes" :key="p.id" class="wheel-label"
                                            :style="labelStyle(i)">{{ p.name }}</span>
                                    </div>

                                    <div class="wheel-center-mark"><span class="hub-star">✦</span></div>
                                </div>

                                <!-- pedestal stand under the wheel -->
                                <div class="wheel-stand">
                                    <div class="stand-neck"></div>
                                    <div class="stand-base"></div>
                                </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const spinning = ref(false)
const wheelRotation = ref(0)

// Classic casino wheel palette: alternating red / cream wedges instead of a
// rainbow of colors, so the wheel matches the reference "jackpot" wheel look.
const WHEEL_COLOR_A = '#c62828' // deep casino red
const WHEEL_COLOR_B = '#fdf6e3' // warm cream/white

// Number of gold marquee bulbs drawn around the rim
const LIGHT_COUNT = 20
// How long one full lap of the chase-light animation takes
const CHASE_DURATION_S = 1.6

// The wheel is sized in viewport units, capped to fit both the card width
// and the overall 100vh page budget, so its pixel size varies with screen size. All the label/bulb placement
// math below was originally tuned for a fixed 300px wheel; wheelSize tracks
// the real rendered size so everything scales together instead of drifting
// off the rim on larger or smaller screens.
const wheelWrapEl = ref(null)
const wheelSize = ref(300)
let resizeObserver = null

onMounted(() => {
    if (wheelWrapEl.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width
            if (w) wheelSize.value = w
        })
        resizeObserver.observe(wheelWrapEl.value)
    }
})

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
})

// All the geometry below was tuned against a 300px reference wheel; scaling
// by wheelSize/300 keeps the same proportions at any rendered size.
const scaleFactor = computed(() => wheelSize.value / 300)

// The visual spin (CSS transition below) and the reveal timeout must agree —
// change both together if you want a different draw duration.
const SPIN_DURATION_MS = 15000
const SPIN_TURNS = 10 // full rotations before landing; higher = feels slower/more dramatic over 15s

// Smaller font as segment count grows, so longer prize names don't collide
const labelFontSizePx = computed(() => {
    const n = wheelPrizes.value.length || 1
    let base = 13
    if (n > 8) base = 10
    else if (n > 6) base = 11
    else if (n > 4) base = 12
    return Math.round(base * scaleFactor.value)
})

const wheelStyle = computed(() => {
    const n = wheelPrizes.value.length || 1
    const seg = 360 / n
    const stops = wheelPrizes.value
        .map((p, i) => `${i % 2 === 0 ? WHEEL_COLOR_A : WHEEL_COLOR_B} ${i * seg}deg ${(i + 1) * seg}deg`)
        .join(',')

    if (!wheelPrizes.value.length) {
        return { background: '#333', transform: `rotate(${wheelRotation.value}deg)` }
    }

    // Thin gold spokes drawn on every segment boundary, layered on top of the
    // wedge colors. Without these the flat two-tone conic-gradient reads as a
    // muddy blob rather than distinct casino wedges.
    const spokeWidthDeg = Math.max(0.6, Math.min(1.6, seg * 0.04))
    const spokes = `repeating-conic-gradient(from ${-spokeWidthDeg / 2}deg, rgba(255, 215, 0, 0.95) 0deg ${spokeWidthDeg}deg, transparent ${spokeWidthDeg}deg ${seg}deg)`

    return {
        background: `${spokes}, conic-gradient(${stops})`,
        transform: `rotate(${wheelRotation.value}deg)`,
    }
})

function labelStyle(i) {
    const n = wheelPrizes.value.length || 1
    const seg = 360 / n
    const mid = i * seg + seg / 2
    const radius = 118 * scaleFactor.value
    const onRed = i % 2 === 0
    // translateX(-50%) at the end centers the label on the radial line instead
    // of left-anchoring it — that left-anchoring was the main cause of the
    // crooked/overlapping look on longer prize names.
    return {
        transform: `rotate(${mid}deg) translateY(-${radius}px) rotate(${-mid}deg) translateX(-50%)`,
        fontSize: `${labelFontSizePx.value}px`,
        color: onRed ? '#fff' : '#7a1414',
        textShadow: onRed ? '0 1px 2px rgba(0,0,0,0.75)' : '0 1px 1px rgba(255,255,255,0.5)',
    }
}

// Positions the small gold marquee bulbs evenly around the wheel rim.
function lightStyle(i) {
    const angle = (360 / LIGHT_COUNT) * (i - 1)
    const radius = 147 * scaleFactor.value
    return {
        transform: `rotate(${angle}deg) translateY(-${radius}px)`,
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
    // send the kiosk back to the kiosk landing route for the next participant
    router.push({ name: 'kiosk' })
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
    height: 100vh;
    justify-content: center;
    padding: 0.75rem 0;
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
    width: 56px;
    height: 56px;
    margin: 0 auto 0.5rem;
}

.logo-ring-outer {
    width: 56px;
    height: 56px;
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
    width: 68px;
    height: 68px;
    margin-top: -34px;
    margin-left: -34px;
    border-radius: 50%;
    animation: rotate 4s linear infinite;
}

.orbit-2 {
    width: 78px;
    height: 78px;
    margin-top: -39px;
    margin-left: -39px;
    animation-duration: 6s;
    animation-direction: reverse;
}

.orbit-3 {
    width: 90px;
    height: 90px;
    margin-top: -45px;
    margin-left: -45px;
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
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1.25;
    margin-bottom: 0.25rem;
    background: linear-gradient(135deg, #e53935 0%, #FFD700 50%, #43a047 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% auto;
    animation: titleShift 6s linear infinite;
}

.brand-name {
    font-size: 1.15rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    margin-bottom: 0.2rem;
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
    margin: 0.5rem auto;
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
    padding: 1.1rem 1.5rem;
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
    font-size: 1.1rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 0.3rem;
}

.intro-desc {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.82rem;
    margin-bottom: 0.5rem;
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
    margin-bottom: 0.25rem;
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

.wheel-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.wheel-wrap {
    --wheel-size: 300px;
    position: relative;
    width: min(100%, clamp(200px, 42vh, 480px));
    aspect-ratio: 1 / 1;
    margin: 0.5rem auto 0;
}

/* Pulsing colored halo behind the wheel for a game-cabinet glow */
.wheel-wrap::before {
    content: '';
    position: absolute;
    inset: -10%;
    z-index: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.4), rgba(229, 57, 53, 0.28) 55%, transparent 75%);
    filter: blur(18px);
    animation: glowPulse 2.4s ease-in-out infinite;
    pointer-events: none;
}

.wheel-pointer {
    position: absolute;
    top: calc(var(--wheel-size) * -0.047);
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: calc(var(--wheel-size) * 0.047) solid transparent;
    border-right: calc(var(--wheel-size) * 0.047) solid transparent;
    border-top: calc(var(--wheel-size) * 0.08) solid #FFD700;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
    z-index: 4;
}

/* Gold marquee bulbs ringing the wheel rim */
.wheel-lights {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
}

.light-bulb {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
}

.light-bulb-dot {
    position: absolute;
    width: calc(var(--wheel-size) * 0.03);
    height: calc(var(--wheel-size) * 0.03);
    margin-left: calc(var(--wheel-size) * -0.015);
    margin-top: calc(var(--wheel-size) * -0.015);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fffbe0, #FFD700 60%, #b8860b 100%);
    box-shadow: 0 0 6px 2px rgba(255, 215, 0, 0.85);
    animation: twinkle 1.6s ease-in-out infinite;
}

.wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
    z-index: 1;
    overflow: hidden;
    /* Duration here must stay in sync with SPIN_DURATION_MS in the script (15s). */
    transition: transform 15s cubic-bezier(0.1, 0.7, 0.15, 1);
    border: calc(var(--wheel-size) * 0.027) solid #FFD700;
    box-shadow:
        0 0 0 3px #7a1414,
        0 0 0 4px rgba(255, 215, 0, 0.35),
        0 10px 30px rgba(0, 0, 0, 0.55),
        inset 0 0 25px rgba(0, 0, 0, 0.35);
}

.wheel::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 16%, rgba(255, 255, 255, 0.32), transparent 55%);
    pointer-events: none;
}

.wheel-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: 0 0;
    font-weight: 700;
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
    width: calc(var(--wheel-size) * 0.18);
    height: calc(var(--wheel-size) * 0.18);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff6c9, #FFD700 45%, #b8860b 100%);
    border: calc(var(--wheel-size) * 0.01) solid #7a1414;
    box-shadow: 0 0 0 calc(var(--wheel-size) * 0.013) rgba(15, 15, 26, 0.9), 0 4px 10px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.hub-star {
    color: #7a1414;
    font-size: calc(var(--wheel-size) * 0.038);
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.4);
}

/* Pedestal stand beneath the wheel */
.wheel-stand {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(100%, clamp(200px, 42vh, 480px));
    margin-top: -4px;
}

.stand-neck {
    width: 14%;
    aspect-ratio: 42 / 26;
    background: linear-gradient(180deg, #c62828, #7a1414);
    clip-path: polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%);
    border-left: 2px solid rgba(255, 215, 0, 0.4);
    border-right: 2px solid rgba(255, 215, 0, 0.4);
}

.stand-base {
    width: 38%;
    aspect-ratio: 116 / 16;
    border-radius: 8px;
    background: linear-gradient(180deg, #e53935, #8b0000);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 215, 0, 0.5);
}

.btn-primary.kiosk-btn {
    background: linear-gradient(135deg, #e53935 0%, #c62828 40%, #43a047 70%, #2e7d32 100%);
    background-size: 200% auto;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    padding: 10px 24px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 0.75rem;
    transition: background-position 0.5s ease, transform 0.2s ease;
    width: 100%;
}

.btn-primary.kiosk-btn:not(:disabled) {
    animation: ctaGlow 2s ease-in-out infinite;
}

.btn-primary.kiosk-btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.btn-primary.kiosk-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    animation: none;
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
    margin: 0.9rem -1.5rem -1.1rem;
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

@keyframes twinkle {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.4;
    }
}

@keyframes glowPulse {

    0%,
    100% {
        opacity: 0.6;
        transform: scale(0.96);
    }

    50% {
        opacity: 1;
        transform: scale(1.05);
    }
}

@keyframes ctaGlow {

    0%,
    100% {
        box-shadow: 0 0 0 rgba(255, 215, 0, 0);
    }

    50% {
        box-shadow: 0 0 18px 4px rgba(255, 215, 0, 0.55);
    }
}
</style>