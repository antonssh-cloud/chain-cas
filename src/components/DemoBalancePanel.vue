<template>
  <div class="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
              border-purple-700/30 bg-purple-950/20">
    <div class="flex gap-6 sm:gap-8">
      <div>
        <p class="text-purple-400/70 text-xs font-medium uppercase tracking-wider mb-1">Demo Chips</p>
        <p class="text-2xl font-bold text-purple-300 font-mono">{{ fmt(casinoStore.localChips) }}</p>
        <p class="text-purple-400/40 text-xs">virtual · cannot withdraw</p>
      </div>
      <div>
        <p class="text-purple-400/70 text-xs font-medium uppercase tracking-wider mb-1">Started with</p>
        <p class="text-xl font-semibold text-white font-mono">1,000</p>
        <p class="text-purple-400/40 text-xs">
          {{ casinoStore.localChips >= 1000 ? '+' : '' }}{{ fmt(casinoStore.localChips - 1000) }} net
        </p>
      </div>
    </div>

    <div class="flex gap-2">
      <button @click="casinoStore.startDemo()"
              class="btn-outline text-sm py-2.5 border-purple-700/40 text-purple-300 hover:border-purple-400">
        Reset (1,000 chips)
      </button>
      <button disabled
              class="btn-outline text-sm py-2.5 opacity-30 cursor-not-allowed"
              title="Connect wallet to withdraw real ETH">
        Cash Out 🔒
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCasinoStore } from '../stores/casino'

const casinoStore = useCasinoStore()

function fmt(n) {
  const v = parseFloat(n) || 0
  return v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(3)
}
</script>
