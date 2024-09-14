import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  Address,
  Client,
  Hex,
  TestActions,
  createTestClient,
  encodePacked,
  erc20Abi,
  getContract,
  http,
  keccak256,
  pad,
  publicActions,
} from 'viem'
import * as chains from 'viem/chains'

// USDT on Polygon
const usdtAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const userAddress = '0x436f795B64E23E6cE7792af4923A68AFD3967952'

const getSlot = (userAddress: Address, mappingSlot: number) => {
  return keccak256(
    encodePacked(
      ['uint256', 'uint256'],
      [BigInt(userAddress), BigInt(mappingSlot)]
    )
  )
}

const checkSlot = async (
  testClient: Client & TestActions,
  tokenAddress: Address,
  userAddress: Address,
  mappingSlot: number
) => {
  const balanceSlot: string = getSlot(userAddress, mappingSlot)

  // Convert DEADBEEF to BigInt and then to hex
  const hexString = '0xDEADBEEF'
  const storageValue = pad(hexString, { size: 32 })

  await testClient.setStorageAt({
    address: tokenAddress,
    index: balanceSlot as Hex,
    value: storageValue,
  })

  const token = getContract({
    address: tokenAddress,
    abi: erc20Abi,
    client: testClient,
  })

  const balance = await token.read.balanceOf([userAddress])

  return balance.toString() === BigInt(hexString).toString()
}

const findBalanceSlot = async (
  client: Client & TestActions,
  tokenAddress: Address,
  userAddress: Address
) => {
  const snapshotId = await client.snapshot()
  for (let slotNumber = 0; slotNumber < 100; slotNumber++) {
    const check = await checkSlot(client, tokenAddress, userAddress, slotNumber)
    try {
      if (check) {
        await client.revert({
          id: snapshotId,
        })
        return slotNumber
      }
    } catch {}
    await client.revert({
      id: snapshotId,
    })
  }
}

const setBalance = async (
  client: Client & TestActions,
  balance: number,
  tokenAddress: Address,
  userAddress: Address
) => {
  const balanceHex = balance.toString(16)
  const token = getContract({
    address: tokenAddress,
    abi: erc20Abi,
    client,
  })

  // automatically find mapping slot
  const mappingSlot = await findBalanceSlot(client, tokenAddress, userAddress)

  if (mappingSlot == undefined)
    throw new Error('Could not find USDC.balanceOf slot')

  // calculate balanceOf[signerAddress] slot
  const signerBalanceSlot = getSlot(userAddress, mappingSlot)

  // set it to the value
  await client.setStorageAt({
    address: token.address,
    index: signerBalanceSlot as Hex,
    value: pad(`0x${balanceHex}`, { size: 32 }),
  })
}

/**
 * Gets the chain object for the given chain id.
 * @param chainId - Chain id of the target EVM chain.
 * @returns Viem's chain object.
 */
function getChain(chainId: number) {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain
    }
  }

  throw new Error(`Chain with id ${chainId} not found`)
}

it('Change USDT ownership', async function () {
  // Create test client connected to local Anvil instance
  const testClient = createTestClient({
    chain: chains.polygon,
    mode: 'anvil',
    transport: http('http://127.0.0.1:8545'),
  }).extend(publicActions)

  const value: number = 100
  await setBalance(testClient, 100, usdtAddress, userAddress)

  const usdt = getContract({
    address: usdtAddress,
    abi: erc20Abi,
    client: testClient,
  })

  const balance = await usdt.read.balanceOf([userAddress])

  console.log('Balance: ', balance)
  expect(balance).to.be.eq(BigInt(value))
})
