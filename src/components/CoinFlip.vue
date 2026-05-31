<template>
  <div :class="['card coin-card relative overflow-hidden', spinning && 'card-disco']">
    <div class="grid md:grid-cols-2 gap-8 relative z-10">

      <!-- Audio elements -->
      <audio ref="themeEl" loop preload="auto" src="/oii-sound-theme.mp3" />
      <audio ref="audioEl" loop preload="auto" />

      <!-- Cat visual -->
      <div class="flex flex-col items-center justify-center min-h-[260px] relative">
        <button @click="toggleMute"
                class="absolute top-0 right-0 text-casino-muted hover:text-white transition-colors p-1"
                :title="muted ? 'Unmute' : 'Mute'">
          <span class="text-lg">{{ muted ? '🔇' : '🔊' }}</span>
        </button>
        <div :class="[
              'rounded-full overflow-hidden',
              pulseClass,
              !spinning && result
                ? (result.won ? 'ring-4 ring-casino-win ring-offset-2 ring-offset-casino-card'
                              : 'ring-4 ring-casino-lose ring-offset-2 ring-offset-casino-card')
                : ''
            ]">
          <!-- Waiting: spinning GIF -->
          <img v-if="spinning"
               :src="spinGif"
               class="w-44 h-44 object-contain" />
          <!-- Result: front = Heads, back = Tails -->
          <img v-else-if="result"
               :src="result.coinResult ? '/oiicat-front.webp' : '/oiicat-back.webp'"
               class="w-44 h-44 object-contain" />
          <!-- Choice selected, no result yet -->
          <img v-else-if="choice !== null"
               :src="choice ? '/oiicat-front.webp' : '/oiicat-back.webp'"
               class="w-44 h-44 object-contain opacity-60" />
          <!-- Initial: no choice -->
          <img v-else
               src="/oiicat-front.webp"
               class="w-44 h-44 object-contain opacity-30" />
        </div>

        <Transition name="result">
          <div v-if="!spinning && result" class="mt-6 text-center animate-slide-up">
            <div :class="result.won ? 'text-casino-win' : 'text-casino-lose'" class="text-2xl font-bold">
              {{ result.won ? '🎉 YOU WIN' : '😔 YOU LOSE' }}
            </div>
            <div class="font-mono text-sm mt-1" :class="result.won ? 'text-casino-win' : 'text-casino-muted'">
              {{ result.won ? '+' : '' }}{{ fmt(result.profitChips) }} {{ result.unit || 'chips' }}
            </div>
            <div class="text-casino-muted/50 text-xs mt-1">
              Balance: {{ fmt(casinoStore.localChips) }} {{ casinoStore.isDemoMode ? 'chips' : 'ETH' }}
            </div>
          </div>
        </Transition>
      </div>

      <!-- Controls -->
      <div class="flex flex-col gap-5">
        <div>
          <h3 class="text-lg font-bold mb-1">Coin Flip</h3>
        </div>

        <!-- Heads / Tails -->
        <div>
          <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">Your Pick</label>
          <div class="flex gap-2">
            <button v-for="opt in [
                      { label: 'Heads', value: true,  img: '/oiicat-front.webp' },
                      { label: 'Tails', value: false, img: '/oiicat-back.webp'  }
                    ]"
                    :key="opt.label" @click="choice = opt.value"
                    :class="[
                      'flex-1 py-2 rounded-lg font-semibold transition-all border flex items-center justify-center gap-2',
                      choice === opt.value
                        ? 'bg-casino-gold text-casino-bg border-casino-gold'
                        : 'bg-casino-surface border-casino-border text-casino-muted hover:border-casino-gold/50'
                    ]">
              <img :src="opt.img" class="w-7 h-7 object-contain rounded-full" />
              {{ opt.label }}
            </button>
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
            Win: <span class="text-casino-gold font-mono">+{{ fmt(betInput) }} chips</span>
          </p>
        </div>
        <div v-else>
          <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">
            Fixed Bet · balance: <span class="text-white">{{ fmt(casinoStore.localChips) }} ETH</span>
          </label>
          <div class="input-field font-mono text-casino-gold font-bold">0.001 ETH</div>
          <p class="text-casino-muted text-xs mt-1">
            Win: <span class="text-casino-gold font-mono">+0.001 ETH</span>
          </p>
        </div>

        <button @click="flip" :disabled="confirming || spinning || !betInput || choice === null"
                :class="['btn-gold w-full py-4 text-lg', result && !spinning && beatActive ? 'btn-beat' : '']">
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
            Flipping…
          </span>
          <span v-else>Flip Coin</span>
        </button>

        <p v-if="error" class="text-casino-lose text-sm animate-shake">{{ error }}</p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCasinoStore } from '../stores/casino'

const casinoStore  = useCasinoStore()

const SPIN_GIFS = [
  { gif: '/oiicat-move.gif',      sound: '/oii-sound.wav'      },
  { gif: '/oiicat-move-slow.gif', sound: '/oii-sound-slow.wav' },
]
const THEME_VOL_LOW  = 0.07
const THEME_VOL_HIGH = 1.0

const choice        = ref(null)
const betInput      = ref(1)
const confirming    = ref(false)
const spinning      = ref(false)
const result        = ref(null)
const error         = ref('')
const pendingTxHash = ref(null)
const spinGif       = ref(SPIN_GIFS[0].gif)
const muted         = ref(localStorage.getItem('soundMuted') === 'true')
const audioEl       = ref(null)
const themeEl       = ref(null)
const beatActive    = ref(false)

// ── Beat detection via Web Audio API ─────────────────────────────────────────
let audioCtx   = null
let analyser   = null
let beatData   = null
let rafId      = null
let lastBeatMs = 0
let fadeTimer  = null

function setupAnalyser() {
  if (audioCtx || !themeEl.value || !audioEl.value) return
  try {
    audioCtx = new (window.AudioContext || window['webkitAudioContext'])()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.5
    beatData = new Uint8Array(analyser.frequencyBinCount)
    // Оба трека → анализатор, сигналы суммируются
    audioCtx.createMediaElementSource(themeEl.value).connect(analyser)
    audioCtx.createMediaElementSource(audioEl.value).connect(analyser)
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
  if (bass > 155 && now - lastBeatMs > 200) {
    lastBeatMs = now
    beatActive.value = false
    requestAnimationFrame(() => { beatActive.value = true })
  }
  rafId = requestAnimationFrame(tickBeats)
}

const pulseClass = computed(() => {
  if (result.value && !spinning.value) return ''
  if (beatActive.value) return spinning.value ? 'cat-beat-strong' : 'cat-beat-weak'
  if (spinning.value)   return 'cat-spinning-base'
  return 'cat-idle-breathe'
})

// ── Volume fade ───────────────────────────────────────────────────────────────
function fadeTo(el, target, ms = 500) {
  if (!el) return
  clearInterval(fadeTimer)
  const steps = 25, dt = ms / steps
  const start = el.volume, delta = target - start
  let i = 0
  fadeTimer = setInterval(() => {
    i++
    el.volume = Math.min(1, Math.max(0, start + delta * (i / steps)))
    if (i >= steps) clearInterval(fadeTimer)
  }, dt)
}

// ── Mute toggle ───────────────────────────────────────────────────────────────
function toggleMute() {
  muted.value = !muted.value
  localStorage.setItem('soundMuted', String(muted.value))
  if (muted.value) {
    themeEl.value?.pause()
    audioEl.value?.pause()
  } else {
    if (themeEl.value) {
      themeEl.value.volume = spinning.value ? THEME_VOL_HIGH : THEME_VOL_LOW
      themeEl.value.play().catch(() => {})
    }
    if (audioEl.value && spinning.value) audioEl.value.play().catch(() => {})
  }
}

// ── Spin sound ────────────────────────────────────────────────────────────────
function startAudio(src) {
  setupAnalyser()
  if (themeEl.value && !muted.value) {
    if (themeEl.value.paused) themeEl.value.play().catch(() => {})
    fadeTo(themeEl.value, THEME_VOL_HIGH)
  }
  if (audioEl.value) {
    audioEl.value.src = src
    audioEl.value.currentTime = 0
    if (!muted.value) audioEl.value.play().catch(() => {})
  }
}

function stopAudio() {
  if (audioEl.value) { audioEl.value.pause(); audioEl.value.currentTime = 0 }
  if (themeEl.value && !muted.value) fadeTo(themeEl.value, THEME_VOL_LOW)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  if (themeEl.value && !muted.value) {
    themeEl.value.volume = THEME_VOL_LOW
    themeEl.value.play().catch(() => {})
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearInterval(fadeTimer)
  audioCtx?.close()
  themeEl.value?.pause()
  audioEl.value?.pause()
  document.body.classList.remove('casino-disco')
})

function fmt(n) {
  const v = parseFloat(n) || 0
  return v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(3)
}

async function flip() {
  error.value = ''

  if (choice.value === null) { error.value = 'Pick Heads or Tails'; return }
  const bet = parseFloat(betInput.value)
  if (casinoStore.isDemoMode) {
    if (!bet || bet <= 0) { error.value = 'Enter a bet'; return }
    if (bet > casinoStore.localChips) { error.value = 'Not enough chips'; return }
  }

  const picked        = SPIN_GIFS[Math.floor(Math.random() * SPIN_GIFS.length)]
  result.value        = null
  pendingTxHash.value = null
  spinGif.value       = picked.gif
  confirming.value          = !casinoStore.isDemoMode
  casinoStore.uiAnimating   = true

  try {
    const r = await casinoStore.flipCoin(choice.value, bet, {
      onSubmitted: () => {
        confirming.value = false
        spinning.value = true
        document.body.classList.add('casino-disco')
        startAudio(picked.sound)
      }
    })
    pendingTxHash.value = r.hash || null
    result.value = r
  } catch (e) {
    error.value = e.shortMessage || e.message
  } finally {
    confirming.value = false
    stopAudio()
    spinning.value = false
    document.body.classList.remove('casino-disco')
    casinoStore.uiAnimating = false
  }
}
</script>

<style scoped>
.result-enter-active { transition: all 0.4s ease; }
.result-enter-from   { opacity: 0; transform: translateY(12px); }

/* Idle — лёгкое дыхание, зовёт сделать ставку */
@keyframes breathe {
  0%, 100% { transform: scale(1.00); box-shadow: 0 0  5px 0px rgba(240,183,47,0.10); }
  50%       { transform: scale(1.05); box-shadow: 0 0 20px 4px rgba(240,183,47,0.30); }
}
.cat-idle-breathe { animation: breathe 2s ease-in-out infinite; }

/* Кнопка Flip после результата — пульсирует в такт */
@keyframes btn-beat {
  0%   { transform: scale(1.05); box-shadow: 0 0 20px 4px rgba(240,183,47,0.6); }
  100% { transform: scale(1.00); box-shadow: 0 0  0px 0px rgba(240,183,47,0.0); }
}
.btn-beat { animation: btn-beat 0.28s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }

/* Резкий удар — мгновенный пик, быстрое затухание */
@keyframes beat-strong {
  0%   { transform: scale(1.22); box-shadow: 0 0 70px 20px rgba(240,183,47,1.0); }
  100% { transform: scale(1.00); box-shadow: 0 0 10px  0px rgba(240,183,47,0.2); }
}
@keyframes beat-weak {
  0%   { transform: scale(1.08); box-shadow: 0 0 30px  8px rgba(240,183,47,0.55); }
  100% { transform: scale(1.00); box-shadow: 0 0  6px  0px rgba(240,183,47,0.10); }
}

.cat-beat-strong  { animation: beat-strong 0.28s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }
.cat-beat-weak    { animation: beat-weak   0.35s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; }
.cat-spinning-base { box-shadow: 0 0 20px 4px rgba(240,183,47,0.3); }

/* ── Disco box-shadow on the coin card during spin ── */
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
</style>
