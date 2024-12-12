const { TronWeb } = require('tronweb')
import * as MultiSigArtifacts from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import * as StableTokenArtifacts from "../artifacts/contracts/StableToken.sol/StableToken.json";

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const privateKey = ''; // TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
const contractABI = artifacts.abi;
const contractBytecode = artifacts.bytecode;

async function freezeTRXForBandwidth() {
  const freezeAmount = 100_000_000; // Freeze 100 TRX (in sun)
  try {
    const result = await tronWeb.transactionBuilder.freezeBalance(
      freezeAmount,
      3, // Freeze for 3 days
      'BANDWIDTH', 
      tronWeb.defaultAddress.base58, 
    );
    const signedTxn = await tronWeb.trx.sign(result);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);
    console.log('TRX frozen for Bandwidth:', receipt);
  } catch (error) {
    console.error('Error freezing TRX:', error);
  }
}

async function deployContract() {
  // Deploy MultiSigWallet
  const multisigWallet = await tronWeb.contract().new({
    abi: MultiSigArtifacts.abi,
    bytecode: MultiSigArtifacts.bytecode,
    feeLimit: 1000000000,
    callValue: 0,
    userFeePercentage: 30,
    originEnergyLimit: 10000000,
    parameters: [
      [
        "TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz", 
        "TKSBtpcknEYtocLhYNE6jG62xqHwvFs6gc",
      ],
      2, // Required confirmations
    ],
  });

  console.log("MultiSigWallet deployed to:", multisigWallet.address);

  // Deploy StableToken
  const stableToken = await tronWeb.contract().new({
    abi: StableTokenArtifacts.abi,
    bytecode: StableTokenArtifacts.bytecode,
    feeLimit: 1000000000,
    callValue: 0,
    userFeePercentage: 30,
    originEnergyLimit: 10000000,
  });

  console.log("StableToken deployed to:", stableToken.address);

  // Grant the MULTISIG_ROLE to the MultiSigWallet
  const multisigRole = tronWeb.sha3("MULTISIG_ROLE"); // Calculate the role hash
  await stableToken
    .grantRole(multisigRole, multisigWallet.address)
    .send({
      feeLimit: 1000000000,
      shouldPollResponse: true,
    });
}

// Freeze TRX, then deploy
freezeTRXForBandwidth() 
  .then(() => deployContract())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });