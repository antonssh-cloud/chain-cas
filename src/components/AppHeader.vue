<template>
  <header class="border-b border-casino-border bg-casino-surface/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <span class="text-2xl">🎰</span>
        <div>
          <span class="font-bold text-white tracking-tight">Chain Casino</span>
          <span class="ml-2 badge bg-blue-900/60 text-blue-300 border border-blue-700/40">
            Sepolia
          </span>
        </div>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- House balance (public info) -->
        <div v-if="casinoStore.houseBalance > 0n" class="hidden sm:flex items-center gap-1.5 text-sm text-casino-muted">
          <span class="text-casino-gold/60">House:</span>
          <span class="font-mono">{{ fmtEth(casinoStore.houseBalance) }} ETH</span>
        </div>

        <WalletButton />
      </div>
    </div>
  </header>
</template>

<script setup>
import { formatEther } from 'viem'
import { useCasinoStore } from '../stores/casino'
import WalletButton from './WalletButton.vue'

const casinoStore = useCasinoStore()

function fmtEth(wei) {
  return parseFloat(formatEther(wei)).toFixed(4)
}
</script>
