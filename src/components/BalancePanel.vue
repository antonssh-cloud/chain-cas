<template>
  <div class="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div class="flex gap-6 sm:gap-8">
      <!-- Chip balance -->
      <div>
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">Chips</p>
        <p class="text-2xl font-bold text-casino-gold font-mono">{{ fmt(casinoStore.chips) }}</p>
        <p class="text-casino-muted/50 text-xs">≈ {{ chipsToEth(casinoStore.chips) }} ETH · on-chain</p>
      </div>
      <!-- Wallet -->
      <div class="hidden sm:block">
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">Wallet</p>
        <p class="text-xl font-semibold text-white font-mono">
          {{ fmtEth(casinoStore.walletEth) }}
          <span class="text-sm font-normal text-casino-muted">ETH</span>
        </p>
      </div>
    </div>

    <div class="flex gap-2 w-full sm:w-auto">
      <button @click="openDeposit()" class="btn-gold flex-1 sm:flex-none text-sm py-2.5">
        Buy Chips
      </button>
      <button @click="openWithdraw()" :disabled="casinoStore.chips < 1"
              class="btn-outline flex-1 sm:flex-none text-sm py-2.5">
        Cash Out
      </button>
      <button @click="casinoStore.refresh()" class="btn-outline text-sm py-2.5 px-3" title="Refresh">↻</button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { formatEther } from 'viem'
import { useCasinoStore } from '../stores/casino'

const casinoStore  = useCasinoStore()
const openDeposit  = inject('openDeposit')
const openWithdraw = inject('openWithdraw')

function fmt(n) {
  const v = parseFloat(n) || 0
  return v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(3)
}
function fmtEth(wei) {
  return parseFloat(formatEther(wei)).toFixed(4)
}
function chipsToEth(chips) {
  return (parseFloat(chips) / 1000).toFixed(4)
}
</script>
