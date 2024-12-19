const { TronWeb } = require('tronweb')
import * as MultiSigArtifacts from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";

const fullNode = "https://api.nileex.io";
const solidityNode = "https://api.nileex.io";
const eventServer = "https://api.nileex.io";
const privateKey = ""; // TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
const multisigAddress = "41733e2f713d7e678125c444e71adb60f4912b40e2"; 

async function interactWithContract() {
  const multisigWallet = await tronWeb.contract(MultiSigArtifacts.abi, multisigAddress);

  try {
    // --- Add owner ---

    const newOwnerAddress = "NEW_OWNER_ADDRESS"; 

    await multisigWallet
      .addOwner(newOwnerAddress)
      .send({ feeLimit: 1000000000, shouldPollResponse: true });
    console.log("Owner added:", newOwnerAddress);

    // --- Remove owner ---

    const ownerToRemoveAddress = "OWNER_TO_REMOVE_ADDRESS"; 

    await multisigWallet
      .removeOwner(ownerToRemoveAddress)
      .send({ feeLimit: 1000000000, shouldPollResponse: true });
    console.log("Owner removed:", ownerToRemoveAddress);

    // --- Change requirement ---

    const newRequirement = 3; // The new requirement

    await multisigWallet
      .changeRequirement(newRequirement)
      .send({ feeLimit: 1000000000, shouldPollResponse: true });
    console.log("Requirement changed to:", newRequirement);
  } catch (error) {
    console.error("Error interacting with contract:", error);
  }
}

interactWithContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });