import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");


const {
  RANDOM_STRING,
  PRIVATE_KEY,
  SEPOLIA_RPC_URL,
  ETHERSCAN_API_KEY
} = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      blockGasLimit: 30000000, 
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY]
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc" || "",
      accounts:
      PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    snowtrace: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: [PRIVATE_KEY]
    },
  },
  sourcify: {
    enabled: false
  },
  etherscan: {
    apiKey: "snowtrace",
    customChains: [
      {
        network: "snowtrace",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://avalanche.testnet.localhost:8080"
        }
      }
    ]
  }
};

export default config;
