import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");

const {
  RANDOM_STRING,
  PRIVATE_KEY,
  SEPOLIA_RPC_URL,
  ETHERSCAN_API_KEY,
  FUJI_RPC_URL,
  CARDONA_RPC_URL,
  HOLESKY_RPC_URL,
  BASE_SEPOLIA_URL,
  BASE_API_KEY,
  AVAX_PRIVATE_KEY,
  AVAX_RPC_URL,
  WORLD_SEPOLIA_RPC_URL,
  WORLDCOIN_PRIVATE_KEY,
  BASE_SEPOLIA_PRIVATE_KEY,
} = process.env;

task("account", "returns nonce and balance for specified address on multiple networks")
  .addParam("address")
  .setAction(async address => {
    const web3BaseSepolia = createAlchemyWeb3(BASE_SEPOLIA_URL);
    const web3Sepolia = createAlchemyWeb3(SEPOLIA_RPC_URL);
    //const web3Fuji = createAlchemyWeb3(FUJI_RPC_URL);
    const web3Avax = createAlchemyWeb3(AVAX_RPC_URL);

    const networkIDArr = [" BaseSepolia: ", "     Sepolia: ", "        Avax: "];
    const providerArr = [web3BaseSepolia, web3Sepolia, web3Avax];
    const resultArr = [];
    
    for (let i = 0; i < providerArr.length; i++) {
      const nonce = await providerArr[i].eth.getTransactionCount(address.address, "latest");
      const balance = await providerArr[i].eth.getBalance(address.address)
      resultArr.push([networkIDArr[i], nonce, parseFloat(providerArr[i].utils.fromWei(balance, "ether")).toFixed(2) + "ETH"]);
    }
    resultArr.unshift(["|  NETWORK  | NONCE | BALANCE | "])
    console.log(resultArr);
  });

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      blockGasLimit: 30000000, 
    },
    /*sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY]
    },
     holesky: {
      url: HOLESKY_RPC_URL,
      accounts: [PRIVATE_KEY]
    },*/
     baseSepolia: {
      url: BASE_SEPOLIA_URL,
      accounts: 
        BASE_SEPOLIA_PRIVATE_KEY !== undefined ? [BASE_SEPOLIA_PRIVATE_KEY] : [],
    },
    /*cardona: {
      url: CARDONA_RPC_URL,
      accounts: [PRIVATE_KEY]
    },*/
    avalanche: {
      url: AVAX_RPC_URL || "",
      accounts:
        AVAX_PRIVATE_KEY !== undefined ? [AVAX_PRIVATE_KEY] : [],
    },
    'world-chain-sepolia': {
      url: WORLD_SEPOLIA_RPC_URL || "",
      accounts:
        WORLDCOIN_PRIVATE_KEY !== undefined ? [WORLDCOIN_PRIVATE_KEY] : [],
    }
    /*fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc" || "",
      accounts:
      PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    snowtrace: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    }, */
  },
  sourcify: {
    enabled: false
  },
  etherscan: {
    /*apiKey: {
      //fuji: "snowtrace",
      sepolia: ETHERSCAN_API_KEY,
      baseSepolia: BASE_API_KEY,
    },*/
    // apiKey: ETHERSCAN_API_KEY,
    apiKey: {
      'world-chain-sepolia' : 'empty'
    },
    customChains: [ {
        network: "world-chain-sepolia",
        chainId: 4801,
        urls: {
          apiURL: "https://worldchain-sepolia.explorer.alchemy.com/api",
          browserURL: "https://worldchain-sepolia.explorer.alchemy.com"
        }
      }
    ] 
    /*customChains: [
      {
        network: "snowtrace",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://avalanche.testnet.localhost:8080"
        }

        network: "avalanche",
        chainId: 43114,
        urls: {
          //apiURL: "https://api.avascan.info/v2/network/mainnet/evm/43114/etherscan",
          apiURL: "https://avalanche-c-chain-rpc.publicnode.com",
          browserURL: " https://subnets.avax.network/c-chain"
        }
      }
    ]*/
  }
};

export default config;
