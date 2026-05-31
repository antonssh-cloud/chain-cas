<template>
  <div>
    <div class="flex items-center gap-2 mb-3">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-casino-win opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-casino-win"></span>
      </span>
      <h3 class="text-sm font-semibold text-casino-muted uppercase tracking-wider">Live On-Chain Activity</h3>
    </div>

    <div v-if="events.length === 0"
         class="bg-casino-card border border-casino-border rounded-xl px-4 py-5 text-center text-casino-muted/50 text-sm">
      Waiting for activity on-chain…
    </div>

    <div v-else class="space-y-2">
      <div v-for="ev in events" :key="ev.id"
           class="flex items-center justify-between bg-casino-card border border-casino-border rounded-xl px-4 py-3 animate-fade-in">
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ ev.type === 'coin' ? '🪙' : '🎰' }}</span>
          <div>
            <p class="text-sm font-medium">
              <a :href="`https://sepolia.etherscan.io/address/${ev.player}`" target="_blank"
                 class="font-mono text-casino-gold hover:underline">{{ shortAddr(ev.player) }}</a>
              <span class="text-casino-muted"> · {{ ev.type === 'coin' ? 'Coin Flip' : `Slots ${ev.detail}` }}</span>
            </p>
            <p class="text-xs text-casino-muted/50">{{ fmt(ev.betEth) }} ETH bet</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p :class="ev.won ? 'text-casino-win' : 'text-casino-lose'" class="font-bold text-sm font-mono">
              {{ ev.won ? '+' : '' }}{{ fmt(ev.profitEth) }} ETH
            </p>
            <a :href="`https://sepolia.etherscan.io/tx/${ev.hash}`" target="_blank"
               class="text-casino-muted/40 text-xs hover:text-casino-gold">tx ↗</a>
          </div>
          <span :class="ev.won ? 'bg-casino-win/10 text-casino-win' : 'bg-casino-lose/10 text-casino-lose'"
                class="badge text-xs">
            {{ ev.won ? 'WIN' : 'LOSS' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { publicClient } from '../config/viem'
import { CASINO_ABI, CASINO_ADDRESS } from '../config/casino'

const events  = ref([])
const unwatchers = []

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}

function fmt(n) {
  const v = parseFloat(n) || 0
  return v.toFixed(4)
}

function addEvent(ev) {
  events.value.unshift(ev)
  if (events.value.length > 12) events.value.pop()
}

onMounted(async () => {
  // Load recent history
  try {
    const latest = await publicClient.getBlockNumber()
    const from   = latest > 2000n ? latest - 2000n : 0n

    const SLOT_EMOJI = ['🍒', '🍋', '🍊', '🔔', '💎', '😺']
    const [coinLogs, slotsLogs] = await Promise.all([
      publicClient.getLogs({
        address: CASINO_ADDRESS,
        event: CASINO_ABI.find(x => x.name === 'CoinFlipResult'),
        fromBlock: from, toBlock: 'latest',
      }),
      publicClient.getLogs({
        address: CASINO_ADDRESS,
        event: CASINO_ABI.find(x => x.name === 'SlotsResult'),
        fromBlock: from, toBlock: 'latest',
      }),
    ])

    const parsed = [
      ...coinLogs.map(l => ({
        id: l.transactionHash + l.logIndex,
        type: 'coin',
        player: l.args.player,
        won: l.args.won,
        betEth: Number(l.args.betAmount) / 1e18,
        profitEth: Number(l.args.payout) / 1e18 - Number(l.args.betAmount) / 1e18,
        hash: l.transactionHash,
        blockNumber: l.blockNumber,
      })),
      ...slotsLogs.map(l => ({
        id: l.transactionHash + l.logIndex,
        type: 'slots',
        player: l.args.player,
        detail: `${SLOT_EMOJI[l.args.reel0]} ${SLOT_EMOJI[l.args.reel1]} ${SLOT_EMOJI[l.args.reel2]}`,
        mult: Number(l.args.multiplierX10) / 10,
        won: l.args.won,
        betEth: Number(l.args.betAmount) / 1e18,
        profitEth: Number(l.args.payout) / 1e18 - Number(l.args.betAmount) / 1e18,
        hash: l.transactionHash,
        blockNumber: l.blockNumber,
      })),
    ]
    parsed.sort((a, b) => Number(b.blockNumber - a.blockNumber))
    events.value = parsed.slice(0, 12)
  } catch {}

  // Watch live
  unwatchers.push(
    publicClient.watchContractEvent({
      address: CASINO_ADDRESS,
      abi: CASINO_ABI,
      eventName: 'CoinFlipResult',
      onLogs: (logs) => logs.forEach(l => addEvent({
        id: l.transactionHash + l.logIndex,
        type: 'coin',
        player: l.args.player,
        won: l.args.won,
        betEth: Number(l.args.betAmount) / 1e18,
        profitEth: Number(l.args.payout) / 1e18 - Number(l.args.betAmount) / 1e18,
        hash: l.transactionHash,
      })),
    }),
    publicClient.watchContractEvent({
      address: CASINO_ADDRESS,
      abi: CASINO_ABI,
      eventName: 'SlotsResult',
      onLogs: (logs) => logs.forEach(l => {
        const E = ['🍒', '🍋', '🍊', '🔔', '💎', '😺']
        addEvent({
          id: l.transactionHash + l.logIndex,
          type: 'slots',
          player: l.args.player,
          detail: `${E[l.args.reel0]} ${E[l.args.reel1]} ${E[l.args.reel2]}`,
          mult: Number(l.args.multiplierX10) / 10,
          won: l.args.won,
          betEth: Number(l.args.betAmount) / 1e18,
          profitEth: Number(l.args.payout) / 1e18 - Number(l.args.betAmount) / 1e18,
          hash: l.transactionHash,
        })
      }),
    })
  )
})

onUnmounted(() => unwatchers.forEach(u => u()))
</script>
