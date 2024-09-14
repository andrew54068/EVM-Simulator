require('dotenv').config();
require("@nomiclabs/hardhat-waffle");

const INFURA_API_KEY = process.env.INFURA_API_KEY;

if (!INFURA_API_KEY) throw new Error("INFURA_API_KEY required");

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/" + INFURA_API_KEY,
        
        // specify a block to fork from
        // remove if you want to fork from the last block
        // blockNumber: 14674245,
      }
    }
  },
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
};