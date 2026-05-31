<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
    <TransitionGroup name="ev">
      <div v-for="ev in events" :key="ev.id"
           class="pointer-events-auto w-72 bg-casino-card border border-casino-border
                  rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 cursor-pointer"
           @click="remove(ev.id)">
        <span class="text-xl flex-shrink-0">{{ ev.icon }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm leading-snug">
            <a :href="`https://sepolia.etherscan.io/address/${ev.player}`"
               target="_blank" @click.stop
               class="font-mono text-casino-gold hover:underline">{{ short(ev.player) }}</a>
            <span class="text-white/80"> {{ ev.action }}</span>
          </p>
          <p class="text-xs font-mono mt-0.5" :class="ev.amountClass">{{ ev.amount }}</p>
        </div>
        <a v-if="ev.hash"
           :href="`https://sepolia.etherscan.io/tx/${ev.hash}`"
           target="_blank" @click.stop
           class="text-casino-muted/40 hover:text-casino-gold text-xs flex-shrink-0">↗</a>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { publicClient } from '../config/viem'
import { CASINO_ABI, CASINO_ADDRESS } from '../config/casino'
import { useWalletStore }  from '../stores/wallet'
import { useCasinoStore }  from '../stores/casino'

const SLOT_EMOJI = ['🍒', '🍋', '🍊', '🔔', '💎', '😺']
const TTL          = 6000
const FOREIGN_DELAY = 0

const walletStore = useWalletStore()
const casinoStore = useCasinoStore()
const events      = ref([])
const timers      = {}
const unwatchers  = []

function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}

function fmtEth(wei) {
  const eth = Number(wei) / 1e18
  return eth % 1 === 0 ? eth.toFixed(3) : eth.toFixed(4)
}

function addToFeed(ev) {
  events.value.unshift(ev)
  if (events.value.length > 5) events.value.pop()
  timers[ev.id] = setTimeout(() => remove(ev.id), TTL)
}

function add(ev) {
  const isOwn = walletStore.address &&
    ev.player?.toLowerCase() === walletStore.address.toLowerCase()

  if (isOwn) {
    if (!casinoStore.uiAnimating) {
      addToFeed(ev)
    } else {
      const stop = watch(() => casinoStore.uiAnimating, animating => {
        if (!animating) { addToFeed(ev); stop() }
      })
    }
  } else {
    setTimeout(() => addToFeed(ev), FOREIGN_DELAY)
  }
}

function remove(id) {
  clearTimeout(timers[id])
  delete timers[id]
  events.value = events.value.filter(e => e.id !== id)
}

function mkId(hash, idx) { return hash + idx }

function coinEv(l) {
  if (!l.args.won) return null
  const profit = Number(l.args.payout) / 1e18 - Number(l.args.betAmount) / 1e18
  return {
    id: mkId(l.transactionHash, l.logIndex),
    player: l.args.player,
    icon: '🪙',
    action: 'won on Coin Flip',
    amount: `+${fmtEth(BigInt(Math.round(profit * 1e18)))} ETH`,
    amountClass: 'text-casino-win',
    hash: l.transactionHash,
  }
}

function slotsEv(l) {
  if (!l.args.won) return null
  const r0 = Number(l.args.reel0), r1 = Number(l.args.reel1), r2 = Number(l.args.reel2)
  const mult = Number(l.args.multiplierX10) / 10
  const profit = Number(l.args.payout) / 1e18 - Number(l.args.betAmount) / 1e18
  return {
    id: mkId(l.transactionHash, l.logIndex),
    player: l.args.player,
    icon: '🎰',
    action: `${SLOT_EMOJI[r0]}${SLOT_EMOJI[r1]}${SLOT_EMOJI[r2]} · ${mult}×`,
    amount: `+${fmtEth(BigInt(Math.round(profit * 1e18)))} ETH`,
    amountClass: 'text-casino-win',
    hash: l.transactionHash,
  }
}

onMounted(() => {
  unwatchers.push(
    publicClient.watchContractEvent({
      address: CASINO_ADDRESS, abi: CASINO_ABI, eventName: 'CoinFlipResult',
      onLogs: logs => logs.forEach(l => { const e = coinEv(l); if (e) add(e) }),
    }),
    publicClient.watchContractEvent({
      address: CASINO_ADDRESS, abi: CASINO_ABI, eventName: 'SlotsResult',
      onLogs: logs => logs.forEach(l => { const e = slotsEv(l); if (e) add(e) }),
    }),
    publicClient.watchContractEvent({
      address: CASINO_ADDRESS, abi: CASINO_ABI, eventName: 'Deposit',
      onLogs: logs => logs.forEach(l => add({
        id: mkId(l.transactionHash, l.logIndex),
        player: l.args.player,
        icon: '💳',
        action: 'deposited',
        amount: `${fmtEth(l.args.amount)} ETH`,
        amountClass: 'text-casino-gold',
        hash: l.transactionHash,
      })),
    }),
    publicClient.watchContractEvent({
      address: CASINO_ADDRESS, abi: CASINO_ABI, eventName: 'Withdrawal',
      onLogs: logs => logs.forEach(l => add({
        id: mkId(l.transactionHash, l.logIndex),
        player: l.args.player,
        icon: '🏧',
        action: 'withdrew',
        amount: `${fmtEth(l.args.amount)} ETH`,
        amountClass: 'text-casino-muted',
        hash: l.transactionHash,
      })),
    }),
  )
})

onUnmounted(() => {
  unwatchers.forEach(u => u())
  Object.values(timers).forEach(clearTimeout)
})
</script>

<style scoped>
.ev-enter-active { transition: all 0.3s ease; }
.ev-leave-active { transition: all 0.3s ease; }
.ev-enter-from   { opacity: 0; transform: translateX(110%); }
.ev-leave-to     { opacity: 0; transform: translateX(110%); }
.ev-move         { transition: transform 0.3s ease; }
</style>
