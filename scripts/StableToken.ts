const { TronWeb } = require('tronweb')
import * as artifacts from '../artifacts/contracts/StableToken.sol/StableToken.json';

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
  const contract = await tronWeb.contract().new({
    abi: contractABI,
    bytecode: contractBytecode,
    feeLimit: 1000000000,
    callValue: 0,
    userFeePercentage: 30,
    originEnergyLimit: 10000000,
    // No parameters needed for this contract
  });

  const hexAddress = contract.address;
  const base58Address = tronWeb.address.fromHex(hexAddress);

  console.log('Contract deployed at address:');
  console.log('Hexadecimal: ', hexAddress);
  console.log('Base58Check: ', base58Address);
}

// Freeze TRX, then deploy
freezeTRXForBandwidth() 
  .then(() => deployContract())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });