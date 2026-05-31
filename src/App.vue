<template>
  <div class="min-h-screen bg-casino-bg text-white">
    <AppHeader />

    <main class="max-w-5xl mx-auto px-4 pb-16">

      <!-- Wrong network -->
      <div v-if="walletStore.isConnected && walletStore.isWrongNetwork"
           class="mt-4 bg-yellow-900/40 border border-yellow-600/50 rounded-xl p-4 flex items-center justify-between animate-fade-in">
        <span class="text-yellow-400 font-medium">⚠ Wrong network — switch to Sepolia to play</span>
        <button @click="walletStore.switchToSepolia()" class="btn-gold text-sm py-2 px-4">Switch Network</button>
      </div>

      <!-- Landing (not connected, not demo) -->
      <div v-if="!walletStore.isConnected && !casinoStore.isDemoMode"
           class="mt-20 text-center animate-fade-in">
        <div class="text-7xl mb-6">🎰</div>
        <h2 class="text-3xl font-bold mb-3">Provably Fair Casino</h2>
        <p class="text-casino-muted mb-2 max-w-md mx-auto">
          Every outcome is verifiable on-chain. Play on Sepolia testnet — no real money.
        </p>
        <p class="text-casino-muted/60 text-sm mb-10">4% house edge · Coin Flip · Dice Roll</p>

        <!-- Two CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button @click="connectWallet" :disabled="walletStore.connecting"
                  class="btn-gold text-lg px-8 py-4 w-full sm:w-auto animate-pulse-gold">
            {{ walletStore.connecting ? 'Connecting…' : '🦊 Connect MetaMask' }}
          </button>
          <button @click="casinoStore.startDemo()"
                  class="btn-outline text-lg px-8 py-4 w-full sm:w-auto border-casino-muted/40 hover:border-casino-gold">
            🎮 Try for Fun!
          </button>
        </div>

        <p class="text-casino-muted/40 text-xs mt-4">
          Try for Fun uses virtual chips — no wallet needed, no real ETH
        </p>

        <div class="mt-14 flex flex-wrap gap-6 justify-center text-casino-muted text-sm">
          <div class="flex items-center gap-2"><span class="text-casino-gold">⚡</span> Instant play</div>
          <div class="flex items-center gap-2"><span class="text-casino-gold">🔍</span> On-chain verifiable</div>
          <div class="flex items-center gap-2"><span class="text-casino-gold">🏦</span> 4% house edge</div>
        </div>

        <p class="mt-6 text-casino-muted/50 text-xs">🔊 This game has loud music — turn down your volume first</p>
      </div>

      <!-- Game area (connected OR demo) -->
      <template v-if="walletStore.isConnected && !walletStore.isWrongNetwork || casinoStore.isDemoMode">

        <!-- Demo banner -->
        <div v-if="casinoStore.isDemoMode"
             class="mt-4 bg-purple-900/40 border border-purple-600/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <p class="text-purple-300 font-semibold">🎮 Demo Mode — 1,000 free chips</p>
            <p class="text-purple-400/70 text-sm">Playing for fun, no real ETH involved. Winnings cannot be withdrawn.</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="casinoStore.startDemo()" class="btn-outline text-sm py-2 px-3 border-purple-600/50 text-purple-300">
              Reset chips
            </button>
            <button @click="connectWallet" :disabled="walletStore.connecting"
                    class="btn-gold text-sm py-2 px-4">
              {{ walletStore.connecting ? 'Connecting…' : 'Play for Real' }}
            </button>
          </div>
        </div>

        <BalancePanel v-if="!casinoStore.isDemoMode" class="mt-6" />
        <DemoBalancePanel v-else class="mt-4" />
        <OwnerPanel v-if="!casinoStore.isDemoMode" />

        <!-- Game tabs -->
        <div class="mt-6">
          <div class="flex gap-1 bg-casino-surface border border-casino-border rounded-xl p-1 w-fit mb-6">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                    :disabled="casinoStore.gameInProgress && activeTab !== tab.id"
                    :class="[
                      'px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200',
                      activeTab === tab.id ? 'bg-casino-gold text-casino-bg' : 'text-casino-muted hover:text-white',
                      casinoStore.gameInProgress && activeTab !== tab.id ? 'opacity-40 cursor-not-allowed' : ''
                    ]">
              {{ tab.label }}
            </button>
          </div>
          <Transition name="tab" mode="out-in">
            <CoinFlip    v-if="activeTab === 'coin'"  key="coin"  />
            <SlotMachine v-else                        key="slots" />
          </Transition>
        </div>

        <GameHistory class="mt-8" />
        <LiveFeed class="mt-8" />
      </template>
    </main>

    <EventFeed />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useWalletStore } from './stores/wallet'
import { useCasinoStore } from './stores/casino'
import { useToastStore }  from './stores/toast'
import AppHeader        from './components/AppHeader.vue'
import BalancePanel     from './components/BalancePanel.vue'
import DemoBalancePanel from './components/DemoBalancePanel.vue'
import CoinFlip         from './components/CoinFlip.vue'
import SlotMachine      from './components/SlotMachine.vue'
import GameHistory      from './components/GameHistory.vue'
import EventFeed        from './components/EventFeed.vue'
import OwnerPanel       from './components/OwnerPanel.vue'
import LiveFeed         from './components/LiveFeed.vue'

const walletStore = useWalletStore()
const casinoStore = useCasinoStore()
const toastStore  = useToastStore()
const activeTab   = ref('coin')

const tabs = [
  { id: 'coin',  label: '🪙 Coin Flip' },
  { id: 'slots', label: '🎰 Slots'     },
]

async function connectWallet() {
  try {
    casinoStore.exitDemo()
    await walletStore.connect()
    await casinoStore.refresh()
    casinoStore.watchEvents()
    clearInterval(_refreshInterval)
    _refreshInterval = setInterval(() => casinoStore.refresh(), 15000)
  } catch (e) {
    toastStore.error(e.message || 'Failed to connect wallet')
  }
}

let _refreshInterval = null

onMounted(async () => {
  await walletStore.syncFromProvider()
  if (walletStore.isConnected) {
    await casinoStore.refresh()
    casinoStore.watchEvents()
    _refreshInterval = setInterval(() => casinoStore.refresh(), 15000)
  }
})

onUnmounted(() => {
  casinoStore.unwatchEvents()
  clearInterval(_refreshInterval)
})
</script>

<style scoped>
.tab-enter-active, .tab-leave-active { transition: opacity 0.2s, transform 0.2s; }
.tab-enter-from { opacity: 0; transform: translateY(8px); }
.tab-leave-to   { opacity: 0; transform: translateY(-8px); }
</style>
