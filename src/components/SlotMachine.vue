<template>
  <div :class="['card', spinning && 'card-disco']">
    <!-- Audio -->
    <audio ref="themeEl" loop preload="auto" src="/push-push.mp3" />
    <audio ref="spinEl"  loop preload="auto" src="/sanic-spin.mp3" />
    <audio ref="sfxEl"   preload="auto" />

    <div class="grid md:grid-cols-2 gap-8">

      <!-- Machine visual -->
      <div class="flex flex-col items-center justify-center min-h-[340px] relative">

        <!-- Mute -->
        <button @click="toggleMute"
                class="absolute top-0 right-0 text-casino-muted hover:text-white transition-colors p-1"
                :title="muted ? 'Unmute' : 'Mute'">
          <span class="text-lg">{{ muted ? '🔇' : '🔊' }}</span>
        </button>

        <!-- Frame -->
        <div :class="['bg-casino-bg rounded-2xl p-4', spinning && 'card-disco']"
             style="border: 2px solid rgba(240,183,47,0.45);
                    box-shadow: 0 0 40px rgba(240,183,47,0.12), inset 0 0 24px rgba(0,0,0,0.6)">

          <div class="flex items-center gap-1 mb-3 justify-center">
            <div class="h-px flex-1 bg-casino-gold/25" />
            <span class="text-casino-gold/50 text-xs font-mono uppercase tracking-widest px-2">Payline</span>
            <div class="h-px flex-1 bg-casino-gold/25" />
          </div>

          <!-- Reels -->
          <div class="flex gap-3">
            <div v-for="ri in [0,1,2]" :key="ri"
                 class="relative rounded-xl overflow-hidden transition-all duration-300"
                 :style="{
                   width: '80px', height: (SYMBOL_H * 3) + 'px',
                   background: '#050810',
                   border: locked[ri] ? '1px solid rgba(240,183,47,0.5)' : '1px solid rgba(255,255,255,0.06)',
                   boxShadow: locked[ri] ? '0 0 16px rgba(240,183,47,0.25)' : 'none',
                 }">

              <div class="absolute inset-0 pointer-events-none" style="z-index:2;
                background: linear-gradient(to bottom,
                  rgba(5,8,16,0.85) 0%, transparent 28%,
                  transparent 72%, rgba(5,8,16,0.85) 100%)" />

              <div v-if="locked[ri]"
                   class="absolute inset-x-0 pointer-events-none" style="z-index:1;"
                   :style="{ top: SYMBOL_H + 'px', height: SYMBOL_H + 'px',
                             background: 'rgba(240,183,47,0.07)' }" />

              <div style="z-index:0; position:relative;"
                   :style="{ transform: `translateY(${getTranslateY(ri)}px)`, willChange: 'transform' }">
                <div v-for="(sym, j) in getVisible(ri)" :key="j"
                     class="flex items-center justify-center select-none"
                     :style="{ height: SYMBOL_H + 'px', fontSize: '38px', lineHeight: '1' }">
                  {{ EMOJI[sym] }}
                </div>
              </div>
            </div>
          </div>

          <!-- Lock indicators -->
          <div class="flex gap-3 mt-3 justify-center">
            <div v-for="ri in [0,1,2]" :key="ri"
                 class="w-[80px] h-1 rounded-full transition-all duration-500"
                 :style="{ background: locked[ri] ? '#f0b72f' : 'rgba(255,255,255,0.1)' }" />
          </div>
        </div>

        <!-- Result -->
        <div class="mt-4 text-center min-h-[60px] flex flex-col items-center justify-center">
          <Transition name="res">
            <div v-if="!spinning && result" key="r">
              <div :class="result.won ? 'text-casino-win' : 'text-casino-lose'" class="text-2xl font-bold">
                {{ result.won ? `🎉 ${result.mult}× WIN!` : '😔 No match' }}
              </div>
              <div class="font-mono text-sm mt-1" :class="result.won ? 'text-casino-win' : 'text-casino-muted'">
                {{ result.profitChips >= 0 ? '+' : '' }}{{ fmt(result.profitChips) }} {{ result.unit || 'chips' }}
              </div>
              <div class="text-casino-muted/50 text-xs mt-1">
                Balance: {{ fmt(casinoStore.localChips) }} {{ casinoStore.isDemoMode ? 'chips' : 'ETH' }}
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col gap-5">
        <div>
          <h3 class="text-lg font-bold mb-1">Slots</h3>
          <p class="text-casino-muted text-sm">3 reels · 6 symbols · jackpot 30× · ~4% edge</p>
        </div>

        <!-- Paytable -->
        <div class="bg-casino-surface/50 rounded-xl p-3 border border-casino-border">
          <p class="text-casino-muted text-xs font-semibold mb-2 uppercase tracking-wider">Paytable</p>
          <div class="space-y-1.5">
            <div v-for="(row, idx) in PAYTABLE" :key="row.label"
                 class="flex items-center justify-between text-sm">
              <span :class="['font-mono text-base tracking-widest leading-none',
                             paytableActiveIdx === idx ? 'paytable-active' : '']">{{ row.syms }}</span>
              <span :class="['font-bold tabular-nums',
                             paytableActiveIdx === idx ? 'text-white paytable-active' : 'text-casino-gold']">{{ row.label }}</span>
            </div>
          </div>
        </div>

        <!-- Bet -->
        <div v-if="casinoStore.isDemoMode">
          <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">
            Bet (chips) · balance: <span class="text-white">{{ fmt(casinoStore.localChips) }} chips</span>
          </label>
          <input v-model="betInput" type="number" step="1" min="1"
                 placeholder="1" class="input-field font-mono" />
          <div class="flex gap-2 mt-2">
            <button v-for="pct in [0.1, 0.25, 0.5, 1]" :key="pct"
                    @click="betInput = Math.max(1, Math.floor(casinoStore.localChips * pct))"
                    class="btn-outline text-xs py-1 px-2">{{ pct * 100 }}%</button>
          </div>
          <p v-if="betInput > 0" class="text-casino-muted text-xs mt-1">
            3-of-kind: <span class="text-casino-gold font-mono">+{{ fmt(betInput) }} chips</span>
          </p>
        </div>
        <div v-else>
          <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">
            Fixed Bet · balance: <span class="text-white">{{ fmt(casinoStore.localChips) }} ETH</span>
          </label>
          <div class="input-field font-mono text-casino-gold font-bold">0.001 ETH</div>
          <p class="text-casino-muted text-xs mt-1">
            Jackpot 😺😺😺: <span class="text-casino-gold font-mono">+0.029 ETH</span>
          </p>
        </div>

        <button @click="spin" :disabled="confirming || spinning || !betInput"
                :class="['btn-gold w-full py-4 text-lg', !spinning && !confirming ? 'btn-pulse' : '']">
          <span v-if="confirming" class="flex items-center justify-center gap-2">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Confirm in MetaMask…
          </span>
          <span v-else-if="spinning" class="flex items-center justify-center gap-2">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Spinning…
          </span>
          <span v-else>🎰 Spin!</span>
        </button>

        <p v-if="error" class="text-casino-lose text-sm animate-shake">{{ error }}</p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCasinoStore } from '../stores/casino'

const casinoStore = useCasinoStore()

// ── Constants ──────────────────────────────────────────────────────────────────
const SYMBOL_H  = 72
const CYCLE_LEN = 12
const SPIN_SPD  = 22   // px/frame ≈ 18 symbols/s
const EMOJI     = ['🍒', '🍋', '🍊', '🔔', '💎', '😺']
const THEME_VOL = 0.55

const PAYTABLE = [
  { syms: '😺😺😺', label: '30×'  },
  { syms: '💎💎💎', label: '15×'  },
  { syms: '🔔🔔🔔', label: '10×'  },
  { syms: '🍊🍊🍊', label: '7×'   },
  { syms: '🍋🍋🍋', label: '6×'   },
  { syms: '🍒🍒🍒', label: '5×'   },
  { syms: 'Any pair', label: '1.5×' },
]

// ── Audio ──────────────────────────────────────────────────────────────────────
const themeEl = ref(null)
const spinEl  = ref(null)
const sfxEl   = ref(null)
const muted   = ref(localStorage.getItem('slotsMuted') === 'true')
const beatActive       = ref(false)
const paytableActiveIdx = ref(-1)

let audioCtx   = null
let analyser   = null
let beatData   = null
let rafBeatId  = null
let lastBeatMs = 0
let fadeTimer  = null
let paytableTimer = null

function setupAnalyser() {
  if (audioCtx || !themeEl.value) return
  try {
    audioCtx = new (window.AudioContext || window['webkitAudioContext'])()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.5
    beatData = new Uint8Array(analyser.frequencyBinCount)
    audioCtx.createMediaElementSource(themeEl.value).connect(analyser)
    if (spinEl.value) audioCtx.createMediaElementSource(spinEl.value).connect(analyser)
    analyser.connect(audioCtx.destination)
    tickBeats()
  } catch {}
}

function tickBeats() {
  if (!analyser) return
  analyser.getByteFrequencyData(beatData)
  let bass = 0
  for (let i = 0; i < 5; i++) bass += beatData[i]
  bass /= 5
  const now = Date.now()
  if (bass > 145 && now - lastBeatMs > 180) {
    lastBeatMs = now
    beatActive.value = false
    requestAnimationFrame(() => { beatActive.value = true })
  }
  rafBeatId = requestAnimationFrame(tickBeats)
}

function fadeTo(el, target, ms = 400) {
  if (!el) return
  clearInterval(fadeTimer)
  const steps = 20, dt = ms / steps
  const start = el.volume, delta = target - start
  let i = 0
  fadeTimer = setInterval(() => {
    i++
    el.volume = Math.min(1, Math.max(0, start + delta * (i / steps)))
    if (i >= steps) clearInterval(fadeTimer)
  }, dt)
}

function toggleMute() {
  muted.value = !muted.value
  localStorage.setItem('slotsMuted', String(muted.value))
  if (muted.value) {
    themeEl.value?.pause()
    spinEl.value?.pause()
    sfxEl.value?.pause()
  } else if (spinning.value) {
    if (spinEl.value) {
      spinEl.value.volume = 0
      spinEl.value.play().catch(() => {})
      fadeTo(spinEl.value, 1.0)
    }
  } else {
    if (themeEl.value) {
      themeEl.value.volume = THEME_VOL
      themeEl.value.play().catch(() => {})
    }
  }
}

function startTheme() {
  setupAnalyser()
  if (!muted.value && themeEl.value) {
    themeEl.value.volume = THEME_VOL
    themeEl.value.play().catch(() => {})
  }
}

function stopTheme() {
  fadeTo(themeEl.value, 0, 250)
  setTimeout(() => themeEl.value?.pause(), 280)
}

function playSfx(src) {
  if (!sfxEl.value) return
  sfxEl.value.src = src
  sfxEl.value.currentTime = 0
  if (!muted.value) sfxEl.value.play().catch(() => {})
}

function resumeThemeAfterSfx() {
  if (!sfxEl.value || muted.value) return
  sfxEl.value.onended = () => {
    sfxEl.value.onended = null
    if (!muted.value && themeEl.value) {
      themeEl.value.volume = 0
      themeEl.value.currentTime = 0
      themeEl.value.play().catch(() => {})
      fadeTo(themeEl.value, THEME_VOL, 600)
    }
  }
}

onMounted(() => { startTheme() })

onUnmounted(() => {
  cancelAnimationFrame(rafBeatId)
  clearInterval(fadeTimer)
  audioCtx?.close()
  themeEl.value?.pause()
  spinEl.value?.pause()
  sfxEl.value?.pause()
  document.body.classList.remove('casino-disco')
  clearInterval(paytableTimer)
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
})

// ── Reel state ─────────────────────────────────────────────────────────────────
function mkStrip() {
  return Array.from({ length: CYCLE_LEN }, () => Math.floor(Math.random() * 6))
}

const strips   = ref([mkStrip(), mkStrip(), mkStrip()])
const offsets  = ref([0, 0, 0])
const locked   = ref([false, false, false])
const tweening = ref([false, false, false])

const anyLocked = computed(() => locked.value.some(Boolean))

function getVisible(i) {
  const si = Math.floor(offsets.value[i] / SYMBOL_H)
  return [0, 1, 2, 3].map(j => strips.value[i][(si + j) % CYCLE_LEN])
}

function getTranslateY(i) {
  return -(offsets.value[i] % SYMBOL_H)
}

// ── Spin loop ──────────────────────────────────────────────────────────────────
let rafId = null

function tick() {
  for (let i = 0; i < 3; i++) {
    if (!locked.value[i] && !tweening.value[i]) {
      offsets.value[i] += SPIN_SPD
    }
  }
  rafId = requestAnimationFrame(tick)
}

function initReels() {
  strips.value   = [mkStrip(), mkStrip(), mkStrip()]
  offsets.value  = [0, 0, 0]
  locked.value   = [false, false, false]
  tweening.value = [false, false, false]
}

// ── Stop reel ─────────────────────────────────────────────────────────────────
async function stopReel(i, target) {
  tweening.value[i] = true

  const centerSi = Math.floor(offsets.value[i] / SYMBOL_H) + 1
  let ahead = 8
  for (; ahead <= 30; ahead++) {
    if (strips.value[i][(centerSi + ahead) % CYCLE_LEN] === target) break
  }
  if (ahead > 30) {
    ahead = 10
    strips.value[i][(centerSi + ahead) % CYCLE_LEN] = target
  }

  const finalOffset = (centerSi + ahead - 1) * SYMBOL_H
  await tweenTo(i, finalOffset, 1100)
  locked.value[i]   = true
  tweening.value[i] = false
}

function tweenTo(i, target, ms) {
  return new Promise(resolve => {
    const from = offsets.value[i]
    const t0   = performance.now()
    function frame(now) {
      const t    = Math.min((now - t0) / ms, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      offsets.value[i] = from + (target - from) * ease
      if (t < 1) requestAnimationFrame(frame)
      else { offsets.value[i] = target; resolve() }
    }
    requestAnimationFrame(frame)
  })
}

// ── Game logic ────────────────────────────────────────────────────────────────
const betInput      = ref(1)
const confirming    = ref(false)
const spinning      = ref(false)
const result        = ref(null)
const error         = ref('')
const pendingTxHash = ref(null)

function fmt(n) {
  const v = parseFloat(n) || 0
  return v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(3)
}

async function spin() {
  error.value = ''
  const bet = parseFloat(betInput.value)
  if (casinoStore.isDemoMode) {
    if (!bet || bet <= 0) { error.value = 'Enter a bet'; return }
    if (bet > casinoStore.localChips) { error.value = 'Not enough chips'; return }
  }

  result.value        = null
  pendingTxHash.value = null
  confirming.value    = !casinoStore.isDemoMode

  function startSpin() {
    confirming.value = false
    spinning.value = true
    document.body.classList.add('casino-disco')
    paytableActiveIdx.value = 0
    paytableTimer = setInterval(() => {
      paytableActiveIdx.value = (paytableActiveIdx.value + 1) % PAYTABLE.length
    }, 160)
    // Cancel any pending sfx → theme resume from previous round
    if (sfxEl.value) {
      sfxEl.value.onended = null
      sfxEl.value.pause()
    }
    stopTheme()
    if (spinEl.value) {
      spinEl.value.currentTime = 0
      if (!muted.value) spinEl.value.play().catch(() => {})
    }
    initReels()
    if (!rafId) rafId = requestAnimationFrame(tick)
  }

  try {
    const r = await casinoStore.playSlots(bet, { onSubmitted: startSpin })
    pendingTxHash.value = r.hash || null

    await stopReel(0, r.reel0)
    await new Promise(res => setTimeout(res, 380))
    await stopReel(1, r.reel1)
    await new Promise(res => setTimeout(res, 380))
    await stopReel(2, r.reel2)
    await new Promise(res => setTimeout(res, 420))

    if (spinEl.value) { spinEl.value.pause(); spinEl.value.currentTime = 0 }

    casinoStore.applySlotsBalance(r)
    casinoStore.gameHistory.unshift(r)
    if (casinoStore.gameHistory.length > 20) casinoStore.gameHistory.pop()

    // Play win/lose sfx, then resume theme
    playSfx(r.won ? '/anime-wow.mp3' : '/faaah.mp3')
    resumeThemeAfterSfx()

    result.value = r
  } catch (e) {
    locked.value = [true, true, true]
    error.value  = e.shortMessage || e.message
    if (spinEl.value) { spinEl.value.pause(); spinEl.value.currentTime = 0 }
    startTheme()
  } finally {
    confirming.value = false
    spinning.value = false
    document.body.classList.remove('casino-disco')
    clearInterval(paytableTimer)
    paytableActiveIdx.value = -1
  }
}
</script>

<style scoped>
.res-enter-active { transition: all 0.4s ease; }
.res-enter-from   { opacity: 0; transform: translateY(10px); }

@keyframes btn-beat {
  0%   { transform: scale(1.05); box-shadow: 0 0 22px 5px rgba(240,183,47,0.65); }
  100% { transform: scale(1.00); box-shadow: 0 0  0px 0px rgba(240,183,47,0.0);  }
}
.btn-beat { animation: btn-beat 0.28s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }

@keyframes btn-pulse {
  0%, 100% { transform: scale(1.00); box-shadow: 0 0  6px 0px rgba(240,183,47,0.3); }
  50%       { transform: scale(1.04); box-shadow: 0 0 20px 6px rgba(240,183,47,0.7); }
}
.btn-pulse { animation: btn-pulse 0.65s ease-in-out infinite; }

@keyframes card-glow {
  0%    { box-shadow: 0 0 80px 20px rgba(255,255,255,1.0); }
  12.5% { box-shadow: 0 0 80px 20px rgba(255,  0,  0,1.0); }
  25%   { box-shadow: 0 0 20px  4px rgba(  0,  0,  0,0.2); }
  37.5% { box-shadow: 0 0 80px 20px rgba(  0,255,255,1.0); }
  50%   { box-shadow: 0 0 80px 20px rgba(255,255,255,1.0); }
  62.5% { box-shadow: 0 0 80px 20px rgba(255,255,  0,1.0); }
  75%   { box-shadow: 0 0 20px  4px rgba(  0,  0,  0,0.2); }
  87.5% { box-shadow: 0 0 80px 20px rgba(255,  0,255,1.0); }
  100%  { box-shadow: 0 0 80px 20px rgba(255,255,255,1.0); }
}
.card-disco { animation: card-glow 0.28s steps(1) infinite; }

@keyframes paytable-pulse {
  0%   { transform: scale(1.25); filter: drop-shadow(0 0 8px rgba(240,183,47,1.0)); }
  100% { transform: scale(1.0);  filter: drop-shadow(0 0 0px rgba(240,183,47,0.0)); }
}
.paytable-active { animation: paytable-pulse 0.16s ease-out forwards; display: inline-block; }
</style>
