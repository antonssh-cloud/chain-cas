<template>
  <div>
    <button v-if="!walletStore.isConnected"
            @click="connect"
            :disabled="walletStore.connecting"
            class="btn-gold text-sm py-2 px-4">
      {{ walletStore.connecting ? 'Connecting…' : 'Connect Wallet' }}
    </button>

    <div v-else class="flex items-center gap-2">
      <div class="hidden sm:flex items-center gap-2 bg-casino-card border border-casino-border rounded-lg px-3 py-2">
        <span class="w-2 h-2 rounded-full bg-casino-win animate-pulse"></span>
        <span class="font-mono text-sm text-white">{{ walletStore.shortAddress }}</span>
      </div>
      <button @click="walletStore.disconnect()"
              class="btn-outline text-sm py-2 px-3">
        Disconnect
      </button>
    </div>
  </div>
</template>

<script setup>
import { useWalletStore } from '../stores/wallet'
import { useCasinoStore } from '../stores/casino'
import { useToastStore } from '../stores/toast'

const walletStore  = useWalletStore()
const casinoStore  = useCasinoStore()
const toastStore   = useToastStore()

async function connect() {
  try {
    await walletStore.connect()
    await casinoStore.refresh()
  } catch (e) {
    toastStore.error(e.message || 'Failed to connect wallet')
  }
}
</script>
