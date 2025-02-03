import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      blockGasLimit: 30000000, 
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc" || "",
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: {
      fuji: "snowtrace",
    },
    customChains: [
      {
        network: "fuji",
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
