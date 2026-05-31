<template>
  <div v-if="casinoStore.gameHistory.length > 0">
    <h3 class="text-sm font-semibold text-casino-muted uppercase tracking-wider mb-3">Your Games</h3>
    <div class="space-y-2">
      <div v-for="game in casinoStore.gameHistory" :key="game.id" class="animate-fade-in">

        <!-- Main row -->
        <div @click="toggle(game.id)"
             :class="[
               'flex items-center justify-between bg-casino-card border rounded-xl px-4 py-3 transition-colors',
               game.hash ? 'cursor-pointer hover:border-casino-gold/30' : '',
               expanded === game.id ? 'border-casino-gold/40 rounded-b-none' : 'border-casino-border'
             ]">
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ game.type === 'coin' ? '🪙' : '🎰' }}</span>
            <div>
              <p class="font-medium text-sm">{{ game.detail }}</p>
              <p class="text-xs text-casino-muted/50">Bet: {{ fmt(game.betChips) }} {{ game.unit || 'chips' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p :class="game.won ? 'text-casino-win' : 'text-casino-lose'" class="font-bold text-sm font-mono">
                {{ game.profitChips >= 0 ? '+' : '' }}{{ fmt(game.profitChips) }} {{ game.unit || 'chips' }}
              </p>
              <span :class="game.won ? 'bg-casino-win/10 text-casino-win' : 'bg-casino-lose/10 text-casino-lose'"
                    class="badge text-xs">
                {{ game.won ? 'WIN' : 'LOSS' }}
              </span>
            </div>
            <span v-if="game.hash" class="text-casino-muted/40 text-xs">
              {{ expanded === game.id ? '▲' : '▼' }}
            </span>
          </div>
        </div>

        <!-- Verify panel -->
        <Transition name="verify">
          <div v-if="expanded === game.id && game.hash"
               class="bg-casino-surface border border-t-0 border-casino-gold/40 rounded-b-xl px-4 py-4 space-y-3">

            <p class="text-casino-gold text-xs font-semibold uppercase tracking-wider">🔍 Provably Fair Verification</p>

            <!-- Transaction -->
            <div class="grid gap-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-casino-muted text-xs w-24 flex-shrink-0">TX Hash</span>
                <a :href="`https://sepolia.etherscan.io/tx/${game.hash}`" target="_blank"
                   class="text-xs font-mono text-casino-gold hover:underline truncate">
                  {{ game.hash }}
                </a>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-casino-muted text-xs w-24 flex-shrink-0">Random Hash</span>
                <span class="text-xs font-mono text-white/70 truncate">{{ game.randomHash }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-casino-muted text-xs w-24 flex-shrink-0">Client Seed</span>
                <span class="text-xs font-mono text-white/70 truncate">{{ game.clientSeed }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-casino-muted text-xs w-24 flex-shrink-0">Nonce</span>
                <span class="text-xs font-mono text-white/70">{{ game.nonce }}</span>
              </div>
            </div>

            <!-- Formula -->
            <div class="bg-casino-bg rounded-lg p-3 border border-casino-border">
              <p class="text-casino-muted text-xs mb-1.5 font-medium">How to verify:</p>
              <p class="font-mono text-xs text-white/60 leading-relaxed break-all">
                keccak256(<span class="text-casino-gold">prevrandao</span>,
                <span class="text-blue-400">clientSeed</span>,
                <span class="text-purple-400">playerAddress</span>,
                <span class="text-green-400">nonce</span>,
                <span class="text-orange-400">prevBlockHash</span>)
                = <span class="text-white">randomHash</span>
              </p>
              <p class="text-casino-muted/50 text-xs mt-2">
                {{ game.type === 'coin'
                  ? 'result = randomHash % 100 < 48 → Heads'
                  : `reel_i = uint8(randomHash[i]) % 6 → ${game.detail}` }}
              </p>
            </div>

            <a :href="`https://sepolia.etherscan.io/tx/${game.hash}#eventlog`" target="_blank"
               class="inline-flex items-center gap-1.5 text-xs text-casino-gold hover:underline">
              View full event log on Etherscan ↗
            </a>
          </div>
        </Transition>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCasinoStore } from '../stores/casino'

const casinoStore = useCasinoStore()
const expanded    = ref(null)

function toggle(id) {
  const game = casinoStore.gameHistory.find(g => g.id === id)
  if (!game?.hash) return
  expanded.value = expanded.value === id ? null : id
}

function fmt(n) {
  const v = parseFloat(n) || 0
  return v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(3)
}
</script>

<style scoped>
.verify-enter-active, .verify-leave-active { transition: all 0.25s ease; }
.verify-enter-from, .verify-leave-to       { opacity: 0; transform: translateY(-6px); }
</style>
