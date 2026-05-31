<template>
  <div class="bg-casino-surface/60 border border-casino-border rounded-xl p-4 space-y-3">

    <!-- Progress bar -->
    <div class="h-1.5 bg-casino-border rounded-full overflow-hidden">
      <div class="h-full bg-casino-gold rounded-full progress-fill" :key="startKey" />
    </div>

    <!-- Block counter -->
    <div class="flex items-center justify-between text-xs">
      <span class="text-casino-muted">Current block</span>
      <span class="font-mono text-casino-gold tabular-nums">
        {{ blockNumber ? '#' + blockNumber.toLocaleString('en-US') : '…' }}
      </span>
    </div>

    <!-- Rotating message -->
    <Transition name="msg" mode="out-in">
      <p :key="msgIndex" class="text-casino-muted/80 text-xs text-center leading-relaxed italic">
        "{{ messages[msgIndex] }}"
      </p>
    </Transition>

    <!-- TX link (real mode only) -->
    <div v-if="txHash" class="text-center">
      <a :href="`https://sepolia.etherscan.io/tx/${txHash}`" target="_blank"
         class="text-xs text-casino-gold/60 hover:text-casino-gold underline">
        View pending tx on Etherscan ↗
      </a>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { publicClient } from '../config/viem'
import { useCasinoStore } from '../stores/casino'

const props = defineProps({
  txHash: { type: String, default: null }
})

const casinoStore = useCasinoStore()

const messages = [
  'Your seed is locked — waiting for block randomness…',
  'Miners are sealing your fate in the next block…',
  'No one — not even the casino — knows the outcome yet…',
  'Randomness = keccak256(prevrandao ⊕ your seed ⊕ nonce)…',
  'The result will be verifiable on Etherscan forever…',
  'Block prevrandao changes every ~12 seconds…',
  'Your client seed adds entropy the casino cannot predict…',
]

const blockNumber = ref(null)
const msgIndex    = ref(0)
const startKey    = ref(0)

let blockTimer = null
let msgTimer   = null

onMounted(async () => {
  startKey.value++

  // fetch block number
  try {
    blockNumber.value = Number(await publicClient.getBlockNumber())
  } catch {}

  blockTimer = setInterval(async () => {
    try { blockNumber.value = Number(await publicClient.getBlockNumber()) } catch {}
  }, 2500)

  msgTimer = setInterval(() => {
    msgIndex.value = (msgIndex.value + 1) % messages.length
  }, 3000)
})

onUnmounted(() => {
  clearInterval(blockTimer)
  clearInterval(msgTimer)
})
</script>

<style scoped>
.progress-fill {
  animation: fill 12s linear forwards;
}
@keyframes fill {
  from { width: 0% }
  to   { width: 100% }
}

.msg-enter-active, .msg-leave-active { transition: all 0.4s ease; }
.msg-enter-from { opacity: 0; transform: translateY(6px); }
.msg-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
