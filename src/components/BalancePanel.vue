<template>
  <div class="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div class="flex gap-6 sm:gap-8">
      <div>
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">Your Balance</p>
        <p class="text-2xl font-bold text-casino-gold font-mono">
          {{ fmtEth(casinoStore.contractBalance) }}
          <span class="text-sm font-normal text-casino-muted">ETH</span>
        </p>
        <p class="text-casino-muted/50 text-xs">On-chain · bet 0.001 ETH each</p>
      </div>
      <div>
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">Wallet</p>
        <p class="text-xl font-semibold text-white font-mono">
          {{ fmtEth(casinoStore.walletEth) }}
          <span class="text-sm font-normal text-casino-muted">ETH</span>
        </p>
        <p class="text-casino-muted/50 text-xs">Sepolia testnet</p>
      </div>
      <div class="hidden sm:block">
        <p class="text-casino-muted text-xs font-medium uppercase tracking-wider mb-1">House</p>
        <p class="text-xl font-semibold text-white font-mono">
          {{ fmtEth(casinoStore.houseBalance) }}
          <span class="text-sm font-normal text-casino-muted">ETH</span>
        </p>
      </div>
    </div>

    <div class="flex gap-2">
      <button @click="showDeposit = true" class="btn-gold text-sm py-2 px-4">Deposit</button>
      <button @click="showWithdraw = true" :disabled="casinoStore.ethBalance <= 0"
              class="btn-outline text-sm py-2 px-4">Withdraw</button>
      <button @click="casinoStore.refresh()" class="btn-outline text-sm py-2.5 px-3" title="Refresh">↻</button>
    </div>
  </div>

  <DepositModal  v-if="showDeposit"  @close="showDeposit = false"  />
  <WithdrawModal v-if="showWithdraw" @close="showWithdraw = false" />
</template>

<script setup>
import { ref } from 'vue'
import { formatEther } from 'viem'
import { useCasinoStore } from '../stores/casino'
import DepositModal  from './DepositModal.vue'
import WithdrawModal from './WithdrawModal.vue'

const casinoStore  = useCasinoStore()
const showDeposit  = ref(false)
const showWithdraw = ref(false)

function fmtEth(wei) {
  return parseFloat(formatEther(wei)).toFixed(4)
}
</script>
