// 1 chip = 0.001 ETH = 10^15 wei
// Display layer only — contract still works in wei

const WEI_PER_CHIP = 1_000_000_000_000_000n // 10^15

export function weiToChips(wei) {
  if (!wei) return 0
  return Number(wei) / 1e15
}

export function chipsToEthStr(chips) {
  // chips is a number; returns ETH string for parseEther
  return (Number(chips) / 1000).toFixed(10).replace(/\.?0+$/, '') || '0'
}

export function formatChips(chips) {
  const n = Math.floor(chips)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return n.toLocaleString('en-US')
  return n.toString()
}

export const MIN_BET_CHIPS = 1    // 1 chip = 0.001 ETH
