import { ethers } from "hardhat";
import { MultiSigWallet, StableToken } from "../typechain-types"; 
import { expect } from "chai"; 

async function interactWithContracts() {
  // Get signers
  const [owner1, owner2, recipient] = await ethers.getSigners();

  // Deploy the MultiSigWallet contract
  const MultiSigFactory = await ethers.getContractFactory("MultiSigWallet");
  const multisigWallet = (await MultiSigFactory.deploy(
    [owner1.address, owner2.address],
    2
  )) as MultiSigWallet;
  await multisigWallet.waitForDeployment();

  console.log("MultiSigWallet deployed to:", multisigWallet.target);

  // Deploy the StableToken contract
  const StableTokenFactory = await ethers.getContractFactory("StableToken");
  const stableToken = (await StableTokenFactory.deploy()) as StableToken;
  await stableToken.waitForDeployment();

  console.log("StableToken deployed to:", stableToken.target);

  // Grant the MULTISIG_ROLE to the MultiSigWallet
  const multisigRole = await stableToken.MULTISIG_ROLE();
  await stableToken.grantRole(multisigRole, multisigWallet.target);

  // Encode the mint function call on StableToken
  const recipientAddress = recipient.address; 
  const amountToMint = ethers.parseEther("1000"); // Mint 1000 tokens
  const data = stableToken.interface.encodeFunctionData("mint", [recipientAddress, amountToMint]);

  // Submit the transaction through the MultiSigWallet
  // const tx = await multisigWallet.connect(owner1).submitTransaction(stableToken.target, 0, data);
  // const receipt = await tx.wait();
  // console.log("Transaction receipt:", receipt);

  // Submit, confirm, and execute the transaction through the MultiSigWallet
  const submissionPromise = new Promise<any>((resolve) => {
    multisigWallet.once("Submission", (txIndex) => {
      console.log("Submission event captured:", txIndex);
      resolve(txIndex);
    });
  });

  const confirmationPromise = new Promise<any>((resolve) => {
    multisigWallet.once("Confirmation", (sender, txIndex) => {
      console.log("Confirmation event captured:", sender, txIndex);
      resolve(txIndex);
    });
  });

  const executionPromise = new Promise<boolean>((resolve) => {
    multisigWallet.once("Execution", (txIndex) => {
      console.log("Execution event captured:", txIndex);
      resolve(true);
    });
  });

  const tx = await multisigWallet.connect(owner1).submitTransaction(stableToken.target, 0, data, {
    gasLimit: 3000000, 
  });

  // Wait for the submission promise to resolve and get the txId
  const txId = await submissionPromise;
  expect(txId).to.not.be.undefined;

  // Confirm the transaction with the second owner
  await multisigWallet.connect(owner2).confirmTransaction(txId);

  // Wait for the confirmation and execution promises to resolve
  await confirmationPromise;
  const executed = await executionPromise;

  // Check if the execution was successful
  expect(executed).to.be.true;

  // Check the recipient's token balance
  const recipientBalance = await stableToken.balanceOf(recipientAddress);
  expect(recipientBalance).to.equal(amountToMint);

  console.log("Transaction receipt:", await tx.wait());



}

interactWithContracts();