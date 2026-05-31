<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />

    <div class="relative card w-full max-w-md animate-slide-up">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Deposit ETH</h2>
        <button @click="$emit('close')" class="text-casino-muted hover:text-white transition-colors text-xl">✕</button>
      </div>

      <!-- Wallet balance -->
      <div class="bg-casino-surface rounded-lg px-4 py-3 mb-4 border border-casino-border">
        <p class="text-casino-muted text-xs mb-1">Wallet Balance</p>
        <p class="font-mono font-bold">{{ fmtEth(casinoStore.walletEth) }} ETH</p>
      </div>

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

      <p class="text-casino-muted/60 text-xs mb-4">
        ETH stays in the contract. Play games, withdraw anytime.
        <br>Need testnet ETH?
        <a href="https://sepoliafaucet.com" target="_blank" class="text-casino-gold hover:underline">sepoliafaucet.com</a>
      </p>

      <div class="flex gap-3">
        <button @click="$emit('close')" class="btn-outline flex-1">Cancel</button>
        <button @click="confirm" :disabled="!amount || loading" class="btn-gold flex-1">
          {{ loading ? 'Confirming…' : 'Deposit' }}
        </button>
      </div>

      <p v-if="error" class="text-casino-lose text-sm mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

async function confirm() {
  error.value = ''
  const val = parseFloat(amount.value)
  if (!val || val < 0.001) { error.value = 'Minimum deposit is 0.001 ETH'; return }

  loading.value = true
  try {
    await casinoStore.deposit(amount.value)
    toastStore.success(`Deposited ${val} ETH`)
    emit('close')
  } catch (e) {
    error.value = e.shortMessage || e.message || 'Transaction failed'
  } finally {
    loading.value = false
  }
}
</script>
