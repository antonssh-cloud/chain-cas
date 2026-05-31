<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
    <TransitionGroup name="toast">
      <div v-for="toast in toastStore.toasts" :key="toast.id"
           :class="[
             'flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl border backdrop-blur-sm cursor-pointer',
             toast.type === 'success' ? 'bg-green-900/80 border-green-700/50 text-green-100' :
             toast.type === 'error'   ? 'bg-red-900/80   border-red-700/50   text-red-100'   :
                                        'bg-casino-card   border-casino-border text-white'
           ]"
           @click="toastStore.remove(toast.id)">
        <span class="text-lg flex-shrink-0 mt-0.5">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <div>
          <p class="text-sm leading-snug">{{ toast.message }}</p>
          <a v-if="toast.txHash"
             :href="`https://sepolia.etherscan.io/tx/${toast.txHash}`"
             target="_blank"
             class="text-xs opacity-70 hover:opacity-100 underline mt-0.5 block"
             @click.stop>
            View on Etherscan ↗
          </a>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
const toastStore = useToastStore()
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(100%); }
.toast-leave-to     { opacity: 0; transform: translateX(100%); }
.toast-move         { transition: transform 0.3s ease; }
</style>
