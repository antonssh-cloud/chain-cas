<template>
  <div class="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div class="flex gap-6 sm:gap-8">
      <div>
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">Wallet Balance</p>
        <p class="text-2xl font-bold text-casino-gold font-mono">
          {{ fmtEth(casinoStore.walletEth) }}
          <span class="text-sm font-normal text-casino-muted">ETH</span>
        </p>
        <p class="text-casino-muted/50 text-xs">Sepolia testnet</p>
      </div>
      <div class="hidden sm:block">
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">House Balance</p>
        <p class="text-xl font-semibold text-white font-mono">
          {{ fmtEth(casinoStore.houseBalance) }}
          <span class="text-sm font-normal text-casino-muted">ETH</span>
        </p>
        <p class="text-casino-muted/50 text-xs">Max bet: {{ fmtEth4(casinoStore.maxBetEth) }} ETH</p>
      </div>
    </div>

    <button @click="casinoStore.refresh()" class="btn-outline text-sm py-2.5 px-3" title="Refresh">↻</button>
  </div>
</template>

<script setup>
import { formatEther } from 'viem'
import { useCasinoStore } from '../stores/casino'

const casinoStore = useCasinoStore()

function fmtEth(wei) {
  return parseFloat(formatEther(wei)).toFixed(4)
}

function fmtEth4(eth) {
  return parseFloat(eth).toFixed(4)
}
</script>
