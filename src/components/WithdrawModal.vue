<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />

    <div class="relative card w-full max-w-md animate-slide-up">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Cash Out</h2>
        <button @click="$emit('close')" class="text-casino-muted hover:text-white text-xl">✕</button>
      </div>

      <!-- Balance summary -->
      <div class="bg-casino-surface rounded-lg px-4 py-3 border border-casino-border mb-4">
        <p class="text-casino-muted text-xs mb-1">Available (on-chain)</p>
        <p class="font-mono font-bold text-casino-gold text-xl">{{ fmt(casinoStore.chips) }} chips</p>
        <p class="text-casino-muted/50 text-xs">≈ {{ (casinoStore.chips / 1000).toFixed(4) }} ETH</p>
      </div>

      <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">
        Chips to withdraw (max: {{ fmt(casinoStore.chips) }})
      </label>
      <input v-model.number="chips" type="number" step="1" min="1"
             :max="Math.floor(casinoStore.chips)"
             placeholder="1" class="input-field font-mono mb-2"
             @keyup.enter="confirm" />

      <p class="text-casino-muted text-xs mb-4">
        ≈ <span class="text-white font-mono">{{ ethPreview }} ETH</span> to your wallet
        <span class="text-casino-muted/50 ml-1">(min 1 chip)</span>
      </p>

      <div class="flex gap-2 mb-4">
        <button v-for="pct in [0.25, 0.5, 0.75, 1]" :key="pct"
                @click="chips = Math.floor(casinoStore.chips * pct)"
                class="btn-outline text-xs py-1.5 flex-1">
          {{ pct * 100 }}%
        </button>
      </div>

      <div class="flex gap-3">
        <button @click="$emit('close')" class="btn-outline flex-1">Cancel</button>
        <button @click="confirm" :disabled="!chips || chips < 1 || loading" class="btn-gold flex-1">
          {{ loading ? 'Confirming…' : `Withdraw ${chips ? fmt(chips) : ''} chips` }}
        </button>
      </div>

      <p v-if="error" class="text-casino-lose text-sm mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCasinoStore } from '../stores/casino'
import { useToastStore } from '../stores/toast'

const emit = defineEmits(['close'])
const casinoStore = useCasinoStore()
const toastStore  = useToastStore()

const chips   = ref('')
const loading = ref(false)
const error   = ref('')

function fmt(n) {
  const v = parseFloat(n) || 0
  return v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(3)
}

const ethPreview = computed(() =>
  chips.value ? (Number(chips.value) / 1000).toFixed(4) : '0.0000'
)

async function confirm() {
  error.value = ''
  const n = Number(chips.value)
  if (!n || n < 1) { error.value = 'Minimum 1 chip (0.001 ETH)'; return }
  if (n > casinoStore.chips) { error.value = 'Exceeds balance'; return }

  loading.value = true
  try {
    await casinoStore.withdraw(n)
    toastStore.success(`Withdrew ${fmt(n)} chips → ${ethPreview.value} ETH`)
    emit('close')
  } catch (e) {
    error.value = e.shortMessage || e.message || 'Transaction failed'
  } finally {
    loading.value = false
  }
}
</script>
