// After deploying, paste the contract address here (from deploy script output)
export const CASINO_ADDRESS = '0xd261106758A3bd535D78A217268c247538199280'

export const CASINO_ABI = [
  // ── View ────────────────────────────────────────────────────────────────────
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'houseBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'maxBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'MIN_BET',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // ── Write ───────────────────────────────────────────────────────────────────
  {
    name: 'fundHouse',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: []
  },
  {
    name: 'withdrawHouse',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'flipCoin',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'clientSeed', type: 'uint256' },
      { name: 'betHeads', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'playSlots',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'clientSeed', type: 'uint256' }
    ],
    outputs: []
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    name: 'HouseFunded',
    type: 'event',
    inputs: [
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'CoinFlipResult',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'playerChoice', type: 'bool', indexed: false },
      { name: 'result', type: 'bool', indexed: false },
      { name: 'betAmount', type: 'uint256', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
      { name: 'won', type: 'bool', indexed: false },
      { name: 'nonce', type: 'uint256', indexed: false },
      { name: 'randomHash', type: 'bytes32', indexed: false }
    ]
  },
  {
    name: 'SlotsResult',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'reel0', type: 'uint8', indexed: false },
      { name: 'reel1', type: 'uint8', indexed: false },
      { name: 'reel2', type: 'uint8', indexed: false },
      { name: 'multiplierX10', type: 'uint16', indexed: false },
      { name: 'betAmount', type: 'uint256', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
      { name: 'won', type: 'bool', indexed: false },
      { name: 'nonce', type: 'uint256', indexed: false },
      { name: 'randomHash', type: 'bytes32', indexed: false }
    ]
  }
]
