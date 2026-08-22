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
import '@/styles/css/raffle_draw.css'

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
