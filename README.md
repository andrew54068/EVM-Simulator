# EVM Storage Modification for Token Balance Simulation

This project demonstrates techniques for modifying EVM storage on an Anvil-forked chain to simulate specific scenarios involving ERC20 token balances and ownership.

## Purpose

The primary goal is to showcase methods for directly manipulating contract storage to:
- Modify token balances
- Change contract ownership
- Mint tokens
- Find and manipulate storage slots

These techniques are useful for testing and simulating complex DeFi scenarios without needing to acquire large amounts of tokens or permissions on mainnet.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and configure as needed
4. Ensure you have an Anvil instance running with a forked mainnet .e.g. `anvil --fork-url https://polygon-mainnet.infura.io/v3/your-infura-key`

## Key Features

- Direct EVM storage manipulation for ERC20 tokens (USDT, USDC)
- Automatic discovery of balance mapping slots
- Ownership transfer simulation
- Token minting simulation
- Uses both Viem and Ethers.js for different approaches

## Test Files

- `test/viem-version.ts`: Modifies USDT balance using Viem
- `test/modify-balance.ts`: Changes USDC balance using Hardhat/Ethers.js
- `test/mint-usdt.ts`: Simulates USDT minting by changing ownership
- `test/change-usdt-owner.ts`: Demonstrates USDT ownership transfer

## Running Tests

Execute the tests with: