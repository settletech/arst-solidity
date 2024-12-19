const { TronWeb } = require('tronweb')
import * as MultiSigArtifacts from "../artifacts/contracts/MultiSigWalletB.sol/MultiSigWalletB.json";
import * as StableTokenArtifacts from "../artifacts/contracts/StableToken.sol/StableToken.json";

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const privateKey = ''; // TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz
const owner2PrivateKey = ''; 

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
const multisigAddress = '';
const stableTokenAddress = '';
const myAddress = tronWeb.address.fromPrivateKey(privateKey); 

async function interactWithContract() {
    const multisigWallet = await tronWeb.contract(MultiSigArtifacts.abi, multisigAddress);
    const stableToken = await tronWeb.contract(StableTokenArtifacts.abi, stableTokenAddress);
  try {
    // Get the owners of the MultiSigWallet
    const owners = await multisigWallet.getOwners().call();
    // Convert the owner addresses to base58 format
    const base58Owners = owners.map((owner) => tronWeb.address.fromHex(owner));
    console.log("MultiSigWallet owners:", base58Owners);

    // Encode the mint function call on StableToken
    const recipientAddress = ""; 
    const amountToMint = 1000;
    const amountToMintWithDecimals = tronWeb
      .toBigNumber(amountToMint)
      .multipliedBy(10 ** 18);
    const amountToMintString = amountToMintWithDecimals.toFixed();
    const dataMint = stableToken.contract.methods
      .mint(recipientAddress, amountToMintString)
      .encodeABI();

    // Submit the transaction
    const txId = await multisigWallet
        .submitTransaction(stableToken.address, 0, dataMint)
        .send({ feeLimit: 1000000000, shouldPollResponse: true });
    console.log("Mint transaction submitted:", txId);

    // --- Confirmation and Execution ---
    // New TronWeb instance for the second owner
    const tronWeb2 = new TronWeb(fullNode, solidityNode, eventServer, owner2PrivateKey);
    const multisigWallet2 = await tronWeb2.contract(MultiSigArtifacts.abi, multisigWallet.address);

    // Confirm the transaction with the second owner
    await multisigWallet2.confirmTransaction(txId).send({
        feeLimit: 1000000000,
        shouldPollResponse: true,
    });
    console.log("Mint transaction confirmed by owner 2");

    // Execute the transaction with the first owner (or any other owner)
    await multisigWallet.executeTransaction(txId).send({
        feeLimit: 1000000000,
        shouldPollResponse: true,
    });
    console.log("Mint transaction executed");

    // --- MultiSig pause ---
    
    const dataPause = stableToken.pause().encodeABI();

    // Submit the transaction to pause
    const txIdPause = await multisigWallet
      .submitTransaction(stableToken.address, 0, dataPause)
      .send({ feeLimit: 1000000000, shouldPollResponse: true });
    console.log("Pause transaction submitted:", txIdPause);

    // Confirm the pause transaction with the second owner
    await multisigWallet2.confirmTransaction(txIdPause).send({
      feeLimit: 1000000000,
      shouldPollResponse: true,
    });
    console.log("Pause transaction confirmed by owner 2");

    // Execute the pause transaction
    await multisigWallet.executeTransaction(txIdPause).send({
      feeLimit: 1000000000,
      shouldPollResponse: true,
    });
    console.log("Pause transaction executed");

    // --- MultiSig unpause ---

    const dataUnpause = stableToken.unpause().encodeABI();

    // Submit the transaction to unpause
    const txIdUnpause = await multisigWallet
      .submitTransaction(stableToken.address, 0, dataUnpause)
      .send({ feeLimit: 1000000000, shouldPollResponse: true });
    console.log("Unpause transaction submitted:", txIdUnpause);

    // Confirm the unpause transaction with the second owner
    await multisigWallet2.confirmTransaction(txIdUnpause).send({
      feeLimit: 1000000000,
      shouldPollResponse: true,
    });
    console.log("Unpause transaction confirmed by owner 2");

    // Execute the unpause transaction
    await multisigWallet.executeTransaction(txIdUnpause).send({
      feeLimit: 1000000000,
      shouldPollResponse: true,
    });
    console.log("Unpause transaction executed");



  } catch (error) {
    console.error('Error interacting with contract:', error);
  }
}

interactWithContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });