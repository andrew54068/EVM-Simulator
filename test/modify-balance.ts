import { expect, assert } from 'chai'
import '@nomicfoundation/hardhat-ethers'
import * as hre from 'hardhat'
import { BigNumber, Contract } from 'ethers'
// import { fail } from 'assert'
const { ethers } = hre

const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const getSlot = (userAddress: string, mappingSlot: number) => {
  return ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [userAddress, mappingSlot]
  )
}

const checkSlot = async (erc20: Contract, mappingSlot: number) => {
  const contractAddress = erc20.address
  const userAddress = ethers.constants.AddressZero

  // the slot must be a hex string stripped of leading zeros! no padding!
  // https://ethereum.stackexchange.com/questions/129645/not-able-to-set-storage-slot-on-hardhat-network
  const balanceSlot = getSlot(userAddress, mappingSlot)

  // storage value must be a 32 bytes long padded with leading zeros hex string
  const hexString = '0xDEADBEEF'

  const storageValue = ethers.utils.hexlify(ethers.utils.zeroPad(hexString, 32))

  await ethers.provider.send('hardhat_setStorageAt', [
    contractAddress,
    balanceSlot,
    storageValue,
  ])

  return (
    (await erc20.balanceOf(userAddress)).toString() ===
    BigNumber.from(hexString).toString()
  )
}

const findBalanceSlot = async (erc20: Contract) => {
  const snapshot = await hre.network.provider.send('evm_snapshot')
  for (let slotNumber = 0; slotNumber < 100; slotNumber++) {
    try {
      if (await checkSlot(erc20, slotNumber)) {
        await ethers.provider.send('evm_revert', [snapshot])
        return slotNumber
      }
    } catch {}
    await ethers.provider.send('evm_revert', [snapshot])
  }
}

it('Change USDC user balance', async function () {
  const usdc: Contract = await ethers.getContractAt('IERC20', usdcAddress)

  const [signer] = await ethers.getSigners()
  const signerAddress = await signer.getAddress()

  // automatically find mapping slot
  const mappingSlot = await findBalanceSlot(usdc)
  console.log('Found USDC.balanceOf slot: ', mappingSlot)

  if (!mappingSlot) assert.fail('Could not find USDC.balanceOf slot')

  // calculate balanceOf[signerAddress] slot
  const signerBalanceSlot = getSlot(signerAddress, mappingSlot)

  // set it to the value
  const hexString = '0x075BCD15'
  await ethers.provider.send('hardhat_setStorageAt', [
    usdc.address,
    signerBalanceSlot,
    ethers.utils.hexlify(ethers.utils.zeroPad(hexString, 32)),
  ])

  // check that the user balance is equal to the expected value
  expect((await usdc.balanceOf(signerAddress)).toString()).to.be.eq(
    parseInt(hexString, 16).toString()
  )
})
