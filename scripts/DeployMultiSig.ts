const { TronWeb } = require('tronweb')
import * as MultiSigArtifacts from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import * as StableTokenArtifacts from "../artifacts/contracts/StableToken.sol/StableToken.json";
import * as TokenVaultArtifacts from "../artifacts/contracts/Vault.sol/TokenVault.json"; 


const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const privateKey = '';

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

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
        "TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz", // Initial owners
        "TLUvNKzyws3ub2iy8AY8C4SqE7ndgKX6dB",
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

  // --- Transfer ownership of StableToken to MultiSigWallet ---
  try {
    await stableToken.transferOwnership(multisigWallet.address).send({
      feeLimit: 1000000000,
    });

    console.log("Ownership of StableToken transferred to MultiSigWallet");
  } catch (error) {
    console.error("Error transferring ownership:", error);
  }

  // Deploy Vault
  const vault = await tronWeb.contract().new({
    abi: TokenVaultArtifacts.abi,
    bytecode: TokenVaultArtifacts.bytecode,
    feeLimit: 1000000000,
    callValue: 0,
    userFeePercentage: 30,
    originEnergyLimit: 10000000,
    parameters: [stableToken.address], 
  });

  console.log("TokenVault deployed to:", vault.address);

  // Encode the grantRole function call
  const vaultOwnerRole = tronWeb.sha3("VAULTOWNER_ROLE");
  const accountToGrant = multisigWallet.address;
  const dataGrantRole = vault.contract.methods
    .grantRole(vaultOwnerRole, accountToGrant)
    .encodeABI();

  // Submit the transaction through the MultiSigWallet
  const txIdGrantRole = await multisigWallet
    .submitTransaction(vault.address, 0, dataGrantRole)
    .send({ feeLimit: 1000000000, shouldPollResponse: true });

  console.log("Grant role transaction submitted:", txIdGrantRole);
}

// Freeze TRX, then deploy
freezeTRXForBandwidth() 
  .then(() => deployContract())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
