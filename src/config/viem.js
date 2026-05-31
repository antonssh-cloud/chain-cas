import { createPublicClient, createWalletClient, webSocket, http, custom, fallback } from 'viem'
import { sepolia } from 'viem/chains'

export const CHAIN = sepolia

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: fallback([
    webSocket('wss://ethereum-sepolia-rpc.publicnode.com'),
    http('https://ethereum-sepolia-rpc.publicnode.com'),
    http('https://1rpc.io/sepolia'),
  ]),
})

export function getWalletClient() {
  if (!window.ethereum) throw new Error('No wallet detected')
  return createWalletClient({
    chain: CHAIN,
    transport: custom(window.ethereum)
  })
}
