import { expect } from 'chai'
import '@nomicfoundation/hardhat-ethers'
import * as hre from 'hardhat'
const { ethers } = hre

const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'

// the slot must be a hex string stripped of leading zeros! no padding!
// https://ethereum.stackexchange.com/questions/129645/not-able-to-set-storage-slot-on-hardhat-network
const ownerSlot = '0x0'

it('Change USDT ownership', async function () {
  const usdt = await ethers.getContractAt('IUSDT', usdtAddress)
  const [signer] = await ethers.getSigners()
  const signerAddress = await signer.getAddress()

  // storage value must be a 32 bytes long padded with leading zeros hex string
  const value = ethers.utils.hexlify(ethers.utils.zeroPad(signerAddress, 32))

  expect(await usdt.getOwner()).to.not.be.eq(signerAddress)
  await ethers.provider.send('hardhat_setStorageAt', [
    usdtAddress,
    ownerSlot,
    value,
  ])

  expect(await usdt.getOwner()).to.be.eq(signerAddress)
})
