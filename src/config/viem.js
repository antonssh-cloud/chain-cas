import { createPublicClient, createWalletClient, http, custom, fallback } from 'viem'
import { sepolia } from 'viem/chains'

export const CHAIN = sepolia

export const publicClient = createPublicClient({
  chain: CHAIN,
  pollingInterval: 4000,
  transport: fallback([
    http('https://ethereum-sepolia-rpc.publicnode.com'),
    http('https://sepolia.drpc.org'),
    http('https://rpc.sepolia.org'),
  ]),
})

export function getWalletClient() {
  if (!window.ethereum) throw new Error('No wallet detected')
  return createWalletClient({
    chain: CHAIN,
    transport: custom(window.ethereum)
  })
}
