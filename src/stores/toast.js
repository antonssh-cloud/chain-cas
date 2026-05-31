import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function add(message, type = 'info', duration = 5000, txHash = null) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type, txHash })
    setTimeout(() => remove(id), duration)
    return id
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (msg, txHash) => add(msg, 'success', 5000, txHash)
  const error   = (msg)         => add(msg, 'error', 7000)
  const info    = (msg, txHash) => add(msg, 'info', 5000, txHash)

  return { toasts, add, remove, success, error, info }
})
