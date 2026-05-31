<template>
  <div v-if="casinoStore.isOwner"
       class="mt-6 bg-yellow-950/40 border border-yellow-600/40 rounded-xl p-5 animate-fade-in">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-yellow-400 text-lg">👑</span>
      <h3 class="text-yellow-400 font-bold text-sm uppercase tracking-wider">Owner Panel</h3>
    </div>

    <div class="grid sm:grid-cols-3 gap-4">
      <!-- House balance -->
      <div class="bg-casino-surface rounded-lg p-4 border border-casino-border sm:col-span-3">
        <p class="text-casino-muted text-xs mb-1">House Balance</p>
        <p class="font-mono text-xl font-bold text-yellow-400">
          {{ formatEther(casinoStore.houseBalance) }} ETH
        </p>
        <p class="text-casino-muted/60 text-xs mt-0.5">
          Max bet: {{ (Number(formatEther(casinoStore.houseBalance)) / 10).toFixed(4) }} ETH
        </p>
      </div>

      <!-- Fund house -->
      <div class="sm:col-span-2 flex flex-col gap-2">
        <label class="text-xs font-medium text-casino-muted uppercase tracking-wider">Fund House (ETH)</label>
        <div class="flex gap-2">
          <input v-model="fundAmount" type="number" step="0.001" min="0.001"
                 placeholder="0.01" class="input-field font-mono flex-1" />
          <button @click="doFund" :disabled="casinoStore.loading || !fundAmount"
                  class="btn-gold px-4 text-sm whitespace-nowrap">
            <span v-if="casinoStore.loading && activeTx === 'fund'">Funding…</span>
            <span v-else>+ Fund</span>
          </button>
        </div>
      </div>

      <!-- Withdraw house -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-medium text-casino-muted uppercase tracking-wider">Withdraw All</label>
        <button @click="doWithdrawAll"
                :disabled="casinoStore.loading || casinoStore.houseBalance === 0n"
                class="btn-outline border-yellow-600/50 text-yellow-400 hover:border-yellow-400 px-4 py-2 text-sm h-full">
          <span v-if="casinoStore.loading && activeTx === 'withdraw'">Withdrawing…</span>
          <span v-else>Withdraw All →</span>
        </button>
      </div>
    </div>

    <p v-if="txError" class="text-casino-lose text-xs mt-3 animate-shake">{{ txError }}</p>
    <p v-if="txSuccess" class="text-casino-win text-xs mt-3">{{ txSuccess }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatEther } from 'viem'
import { useCasinoStore } from '../stores/casino'
import { useToastStore }  from '../stores/toast'

const casinoStore = useCasinoStore()
const toastStore  = useToastStore()

const fundAmount = ref('')
const activeTx   = ref('')
const txError    = ref('')
const txSuccess  = ref('')

async function doFund() {
  txError.value   = ''
  txSuccess.value = ''
  activeTx.value  = 'fund'
  try {
    await casinoStore.fundHouse(fundAmount.value)
    toastStore.success(`Funded house with ${fundAmount.value} ETH`)
    txSuccess.value = `Funded +${fundAmount.value} ETH`
    fundAmount.value = ''
  } catch (e) {
    txError.value = e.shortMessage || e.message
  } finally {
    activeTx.value = ''
  }
}

async function doWithdrawAll() {
  txError.value   = ''
  txSuccess.value = ''
  activeTx.value  = 'withdraw'
  try {
    const amount = formatEther(casinoStore.houseBalance)
    await casinoStore.withdrawHouse(amount)
    toastStore.success(`Withdrew ${amount} ETH from house`)
    txSuccess.value = `Withdrew ${amount} ETH to your wallet`
  } catch (e) {
    txError.value = e.shortMessage || e.message
  } finally {
    activeTx.value = ''
  }
}
</script>
