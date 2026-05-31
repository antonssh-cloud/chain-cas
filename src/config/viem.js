import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { sepolia } from 'viem/chains'

export const CHAIN = sepolia

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http()
})

export function getWalletClient() {
  if (!window.ethereum) throw new Error('No wallet detected')
  return createWalletClient({
    chain: CHAIN,
    transport: custom(window.ethereum)
  })
}
