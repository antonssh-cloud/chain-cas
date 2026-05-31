<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />

    <div class="relative card w-full max-w-md animate-slide-up">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Buy Chips</h2>
        <button @click="$emit('close')" class="text-casino-muted hover:text-white transition-colors text-xl">✕</button>
      </div>

      <!-- Rate banner -->
      <div class="bg-casino-gold/10 border border-casino-gold/30 rounded-xl p-3 mb-4 flex items-center gap-3">
        <span class="text-2xl">🪙</span>
        <div>
          <p class="text-casino-gold font-bold text-sm">1 chip = 0.001 ETH</p>
          <p class="text-casino-muted text-xs">Chips let you play. Withdraw anytime (min 1 chip).</p>
        </div>
      </div>

      <!-- Wallet balance -->
      <div class="bg-casino-surface rounded-lg px-4 py-3 mb-4 border border-casino-border">
        <p class="text-casino-muted text-xs mb-1">Wallet Balance</p>
        <p class="font-mono font-bold">{{ fmtEth(casinoStore.walletEth) }} ETH</p>
      </div>

      <!-- Amount input -->
      <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">
        ETH Amount
      </label>
      <input v-model="amount" type="number" step="0.001" min="0.001"
             placeholder="0.01"
             class="input-field font-mono mb-3"
             @keyup.enter="confirm" />

      <div class="flex gap-2 mb-4">
        <button v-for="val in ['0.01', '0.05', '0.1', '0.5']" :key="val"
                @click="amount = val" class="btn-outline text-xs py-1.5 flex-1">
          {{ val }}
        </button>
      </div>

      <!-- Chips preview -->
      <div v-if="chipsPreview > 0"
           class="bg-casino-felt border border-green-800/40 rounded-xl p-4 mb-4 text-center animate-fade-in">
        <p class="text-casino-muted text-xs mb-1">You will receive</p>
        <p class="text-3xl font-black text-casino-gold">
          {{ chipsPreview.toLocaleString('en-US') }}
          <span class="text-lg font-normal text-casino-muted ml-1">chips</span>
        </p>
      </div>

      <p class="text-casino-muted/60 text-xs mb-4">
        Need testnet ETH?
        <a href="https://sepoliafaucet.com" target="_blank" class="text-casino-gold hover:underline">sepoliafaucet.com</a>
      </p>

      <div class="flex gap-3">
        <button @click="$emit('close')" class="btn-outline flex-1">Cancel</button>
        <button @click="confirm" :disabled="!amount || loading" class="btn-gold flex-1">
          {{ loading ? 'Confirming…' : `Buy ${chipsPreview > 0 ? chipsPreview.toLocaleString() + ' chips' : 'Chips'}` }}
        </button>
      </div>

      <p v-if="error" class="text-casino-lose text-sm mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatEther } from 'viem'
import { useCasinoStore } from '../stores/casino'
import { useToastStore } from '../stores/toast'

const emit = defineEmits(['close'])
const casinoStore = useCasinoStore()
const toastStore  = useToastStore()

const amount  = ref('')
const loading = ref(false)
const error   = ref('')

function fmtEth(wei) {
  return parseFloat(formatEther(wei)).toFixed(4)
}

const chipsPreview = computed(() => {
  const val = parseFloat(amount.value)
  if (!val || val < 0) return 0
  return Math.floor(val * 1000)
})

async function confirm() {
  error.value = ''
  const val = parseFloat(amount.value)
  if (!val || val < 0.001) { error.value = 'Minimum deposit is 0.001 ETH (1 chip)'; return }

  loading.value = true
  try {
    await casinoStore.deposit(amount.value)
    toastStore.success(`Bought ${chipsPreview.value.toLocaleString()} chips!`)
    emit('close')
  } catch (e) {
    error.value = e.shortMessage || e.message || 'Transaction failed'
  } finally {
    loading.value = false
  }
}
</script>
