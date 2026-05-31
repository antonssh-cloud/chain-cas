<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />

    <div class="relative card w-full max-w-md animate-slide-up">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Withdraw ETH</h2>
        <button @click="$emit('close')" class="text-casino-muted hover:text-white text-xl">✕</button>
      </div>

      <!-- Contract balance -->
      <div class="bg-casino-surface rounded-lg px-4 py-3 border border-casino-border mb-4">
        <p class="text-casino-muted text-xs mb-1">Available (on-chain)</p>
        <p class="font-mono font-bold text-casino-gold text-xl">{{ casinoStore.ethBalance.toFixed(4) }} ETH</p>
      </div>

      <label class="text-xs font-medium text-casino-muted uppercase tracking-wider mb-2 block">
        ETH to withdraw (max: {{ casinoStore.ethBalance.toFixed(4) }})
      </label>
      <input v-model="amount" type="number" step="0.001" min="0.001"
             :max="casinoStore.ethBalance"
             placeholder="0.001" class="input-field font-mono mb-2"
             @keyup.enter="confirm" />

      <div class="flex gap-2 mb-4">
        <button v-for="pct in [0.25, 0.5, 0.75, 1]" :key="pct"
                @click="amount = (casinoStore.ethBalance * pct).toFixed(6)"
                class="btn-outline text-xs py-1.5 flex-1">
          {{ pct * 100 }}%
        </button>
      </div>

      <div class="flex gap-3">
        <button @click="$emit('close')" class="btn-outline flex-1">Cancel</button>
        <button @click="confirm" :disabled="!amount || loading" class="btn-gold flex-1">
          {{ loading ? 'Confirming…' : `Withdraw ${amount || ''} ETH` }}
        </button>
      </div>

      <p v-if="error" class="text-casino-lose text-sm mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCasinoStore } from '../stores/casino'
import { useToastStore } from '../stores/toast'

const emit = defineEmits(['close'])
const casinoStore = useCasinoStore()
const toastStore  = useToastStore()

const amount  = ref('')
const loading = ref(false)
const error   = ref('')

async function confirm() {
  error.value = ''
  const val = parseFloat(amount.value)
  if (!val || val < 0.001) { error.value = 'Minimum 0.001 ETH'; return }
  if (val > casinoStore.ethBalance) { error.value = 'Exceeds balance'; return }

  loading.value = true
  try {
    await casinoStore.withdraw(amount.value)
    toastStore.success(`Withdrew ${val} ETH to wallet`)
    emit('close')
  } catch (e) {
    error.value = e.shortMessage || e.message || 'Transaction failed'
  } finally {
    loading.value = false
  }
}
</script>
