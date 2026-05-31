import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getWalletClient, publicClient, CHAIN } from '../config/viem'

export const useWalletStore = defineStore('wallet', () => {
  const address  = ref(null)
  const chainId  = ref(null)
  const connecting = ref(false)

  const isConnected   = computed(() => !!address.value)
  const isWrongNetwork = computed(() => chainId.value !== null && chainId.value !== CHAIN.id)
  const shortAddress  = computed(() =>
    address.value
      ? `${address.value.slice(0, 6)}…${address.value.slice(-4)}`
      : null
  )

  async function connect() {
    if (!window.ethereum) throw new Error('MetaMask not found. Please install it.')
    connecting.value = true
    try {
      const client = getWalletClient()
      const accounts = await client.requestAddresses()
      address.value = accounts[0]
      chainId.value = await client.getChainId()
    } finally {
      connecting.value = false
    }
  }

  async function switchToSepolia() {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN.id.toString(16)}` }]
      })
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${CHAIN.id.toString(16)}`,
            chainName: 'Sepolia',
            rpcUrls: ['https://rpc2.sepolia.org'],
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        })
      }
    }
  }

  function disconnect() {
    address.value = null
    chainId.value = null
  }

  // Sync wallet state with MetaMask
  async function syncFromProvider() {
    if (!window.ethereum) return
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        address.value = accounts[0]
        const id = await window.ethereum.request({ method: 'eth_chainId' })
        chainId.value = parseInt(id, 16)
      }
    } catch {}
  }

  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      address.value = accounts[0] || null
      if (!accounts[0]) chainId.value = null
    })
    window.ethereum.on('chainChanged', (id) => {
      chainId.value = parseInt(id, 16)
    })
  }

  return {
    address, chainId, connecting,
    isConnected, isWrongNetwork, shortAddress,
    connect, disconnect, switchToSepolia, syncFromProvider
  }
})
