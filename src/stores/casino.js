import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parseEther, formatEther, parseEventLogs } from 'viem'
import { publicClient, getWalletClient } from '../config/viem'
import { CASINO_ABI, CASINO_ADDRESS } from '../config/casino'
import { useWalletStore } from './wallet'

export const useCasinoStore = defineStore('casino', () => {
  const walletStore = useWalletStore()

  // ── On-chain state ────────────────────────────────────────────────────────
  const contractBalance = ref(0n)  // player's ETH in contract (wei)
  const houseBalance    = ref(0n)
  const walletEth       = ref(0n)
  const ownerAddress    = ref('')

  const BET_ETH = 0.001
  const BET_WEI = BigInt(1e15)

  // Player's in-contract ETH as float
  const ethBalance = computed(() => Number(contractBalance.value) / 1e18)

  // ── Demo mode ─────────────────────────────────────────────────────────────
  const isDemoMode = ref(false)
  const demoChips  = ref(0)

  // Unified balance: contract ETH for real, virtual chips for demo
  const localChips = computed(() => isDemoMode.value ? demoChips.value : ethBalance.value)

  const isOwner = computed(() =>
    !!walletStore.address && !!ownerAddress.value &&
    walletStore.address.toLowerCase() === ownerAddress.value.toLowerCase()
  )

  const gameHistory    = ref([])
  const loading        = ref(false)
  const gameInProgress = ref(false)

  // ── On-chain reads ─────────────────────────────────────────────────────────
  async function refresh() {
    if (!walletStore.address) return
    const addr = walletStore.address
    const [bal, house, eth, owner] = await Promise.all([
      publicClient.readContract({ address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'balances', args: [addr] }),
      publicClient.readContract({ address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'houseBalance' }),
      publicClient.getBalance({ address: addr }),
      publicClient.readContract({ address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'owner' }),
    ])
    contractBalance.value = bal
    houseBalance.value    = house
    walletEth.value       = eth
    ownerAddress.value    = owner
  }

  async function getAccount() {
    const client = getWalletClient()
    const accounts = await client.getAddresses()
    if (!accounts[0]) throw new Error('No account connected')
    return accounts[0]
  }

  function generateClientSeed() {
    const arr = new Uint8Array(32)
    crypto.getRandomValues(arr)
    return BigInt('0x' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(''))
  }

  // ── Deposit ────────────────────────────────────────────────────────────────
  async function deposit(amountEth) {
    loading.value = true
    try {
      const client  = getWalletClient()
      const account = await getAccount()
      const hash = await client.writeContract({
        address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'deposit',
        value: parseEther(String(amountEth).trim()),
        gas: 80000n,
        account,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await refresh()
      return hash
    } finally { loading.value = false }
  }

  // ── Withdraw ───────────────────────────────────────────────────────────────
  async function withdraw(amountEth) {
    loading.value = true
    try {
      const weiAmount = parseEther(String(amountEth).trim())
      const client  = getWalletClient()
      const account = await getAccount()
      const hash = await client.writeContract({
        address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'withdraw',
        args: [weiAmount],
        gas: 80000n,
        account,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await refresh()
      return hash
    } finally { loading.value = false }
  }

  // ── Coin Flip ──────────────────────────────────────────────────────────────
  async function flipCoin(betHeads, betChips, { onSubmitted } = {}) {
    gameInProgress.value = true
    try {
      if (isDemoMode.value) {
        const bet = parseFloat(betChips)
        if (!bet || bet <= 0) throw new Error('Invalid bet')
        onSubmitted?.()
        await new Promise(r => setTimeout(r, 8000 + Math.random() * 7000))
        return _flipCoinLocal(betHeads, bet)
      }

      if (ethBalance.value < BET_ETH) throw new Error('Insufficient balance — deposit first')

      const clientSeed = generateClientSeed()
      loading.value = true
      try {
        const client  = getWalletClient()
        const account = await getAccount()
        const hash = await client.writeContract({
          address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'flipCoin',
          args: [clientSeed, betHeads],
          gas: 200000n,
          account,
        })
        onSubmitted?.(hash)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        if (receipt.status === 'reverted') throw new Error('Transaction reverted')
        const logs = parseEventLogs({ abi: CASINO_ABI, eventName: 'CoinFlipResult', logs: receipt.logs, strict: false })
        if (!logs.length) throw new Error('Event not found in receipt')
        const e = logs[0].args

        await refresh()

        const profitEth = Number(e.payout) / 1e18 - BET_ETH
        const entry = {
          id: Date.now() + Math.random(),
          type: 'coin', won: e.won,
          betChips: BET_ETH, profitChips: profitEth,
          unit: 'ETH',
          playerChoice: e.playerChoice, coinResult: e.result,
          detail: `${e.playerChoice ? 'Heads' : 'Tails'} → ${e.result ? 'Heads' : 'Tails'}`,
          hash,
          randomHash: e.randomHash,
          clientSeed: '0x' + clientSeed.toString(16).padStart(64, '0'),
          nonce: Number(e.nonce),
        }
        gameHistory.value.unshift(entry)
        if (gameHistory.value.length > 20) gameHistory.value.pop()
        return entry
      } finally { loading.value = false }
    } finally { gameInProgress.value = false }
  }

  // ── Slots ──────────────────────────────────────────────────────────────────
  const _SLOT_EMOJI = ['🍒', '🍋', '🍊', '🔔', '💎', '😺']
  const _SLOT_MULT  = [50, 60, 70, 100, 150, 300]

  async function playSlots(betChips, { onSubmitted } = {}) {
    gameInProgress.value = true
    try {
      if (isDemoMode.value) {
        const bet = parseFloat(betChips)
        if (!bet || bet <= 0) throw new Error('Invalid bet')
        onSubmitted?.()
        await new Promise(r => setTimeout(r, 8000 + Math.random() * 7000))
        return _slotsLocal(bet)
      }

      if (ethBalance.value < BET_ETH) throw new Error('Insufficient balance — deposit first')

      const clientSeed = generateClientSeed()
      loading.value = true
      try {
        const client  = getWalletClient()
        const account = await getAccount()
        const hash = await client.writeContract({
          address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'playSlots',
          args: [clientSeed],
          gas: 200000n,
          account,
        })
        onSubmitted?.(hash)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        if (receipt.status === 'reverted') throw new Error('Transaction reverted')
        const logs = parseEventLogs({ abi: CASINO_ABI, eventName: 'SlotsResult', logs: receipt.logs, strict: false })
        if (!logs.length) throw new Error('Event not found in receipt')
        const e = logs[0].args

        const r0 = Number(e.reel0), r1 = Number(e.reel1), r2 = Number(e.reel2)
        const mult = Number(e.multiplierX10) / 10
        const profitEth = Number(e.payout) / 1e18 - BET_ETH
        const entry = {
          id: Date.now() + Math.random(),
          type: 'slots', won: e.won,
          betChips: BET_ETH, profitChips: profitEth,
          unit: 'ETH',
          reel0: r0, reel1: r1, reel2: r2, mult,
          detail: `${_SLOT_EMOJI[r0]} ${_SLOT_EMOJI[r1]} ${_SLOT_EMOJI[r2]} · ${mult}×`,
          hash,
          randomHash: e.randomHash,
          clientSeed: '0x' + clientSeed.toString(16).padStart(64, '0'),
          nonce: Number(e.nonce),
        }
        return entry
      } finally { loading.value = false }
    } finally { gameInProgress.value = false }
  }

  // ── Owner functions ────────────────────────────────────────────────────────
  async function fundHouse(amountEth) {
    loading.value = true
    try {
      const client  = getWalletClient()
      const account = await getAccount()
      const hash = await client.writeContract({
        address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'fundHouse',
        value: parseEther(String(amountEth).trim()),
        account,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await refresh()
      return hash
    } finally { loading.value = false }
  }

  async function withdrawHouse(amountEth) {
    loading.value = true
    try {
      const client  = getWalletClient()
      const account = await getAccount()
      const hash = await client.writeContract({
        address: CASINO_ADDRESS, abi: CASINO_ABI, functionName: 'withdrawHouse',
        args: [parseEther(String(amountEth).trim())],
        account,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await refresh()
      return hash
    } finally { loading.value = false }
  }

  // ── Demo mode internals ────────────────────────────────────────────────────
  function startDemo() {
    isDemoMode.value  = true
    demoChips.value   = 1000
    gameHistory.value = []
  }

  function exitDemo() {
    isDemoMode.value  = false
    demoChips.value   = 0
    gameHistory.value = []
  }

  function _flipCoinLocal(betHeads, bet) {
    const isHeads = Math.random() < 0.48
    const won     = isHeads === betHeads
    demoChips.value = Number((demoChips.value + (won ? bet : -bet)).toFixed(6))
    if (demoChips.value < 0) demoChips.value = 0

    const entry = {
      id: Date.now() + Math.random(),
      type: 'coin', won, betChips: bet, profitChips: won ? bet : -bet,
      unit: 'chips',
      playerChoice: betHeads, coinResult: isHeads,
      detail: `${betHeads ? 'Heads' : 'Tails'} → ${isHeads ? 'Heads' : 'Tails'}`,
    }
    gameHistory.value.unshift(entry)
    if (gameHistory.value.length > 20) gameHistory.value.pop()
    return entry
  }

  function _slotsLocal(bet) {
    const r0 = Math.floor(Math.random() * 6)
    const r1 = Math.floor(Math.random() * 6)
    const r2 = Math.floor(Math.random() * 6)
    let multX10 = 0
    if (r0 === r1 && r1 === r2)         multX10 = _SLOT_MULT[r0]
    else if (r0===r1||r1===r2||r0===r2) multX10 = 15
    const mult   = multX10 / 10
    const profit = bet * mult - bet

    const entry = {
      id: Date.now() + Math.random(),
      type: 'slots', won: profit >= 0 && multX10 > 0, betChips: bet, profitChips: profit,
      unit: 'chips',
      reel0: r0, reel1: r1, reel2: r2, mult,
      detail: `${_SLOT_EMOJI[r0]} ${_SLOT_EMOJI[r1]} ${_SLOT_EMOJI[r2]} · ${mult}×`,
    }
    return entry
  }

  function applySlotsBalance(entry) {
    if (isDemoMode.value) {
      demoChips.value = Math.max(0, Number((demoChips.value + entry.profitChips).toFixed(6)))
    } else {
      contractBalance.value = contractBalance.value + BigInt(Math.round(entry.profitChips * 1e18))
      refresh().catch(() => {})
    }
  }

  return {
    contractBalance, houseBalance, walletEth,
    ethBalance, BET_ETH,
    localChips, isDemoMode, demoChips,
    ownerAddress, isOwner,
    gameHistory, loading, gameInProgress,
    refresh, deposit, withdraw,
    flipCoin, playSlots, applySlotsBalance,
    fundHouse, withdrawHouse,
    startDemo, exitDemo,
  }
})
