import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet } from "../typechain-types";

describe("MultiSigWallet", function () {
  let wallet: MultiSigWallet;
  let owner1: any, owner2: any, owner3: any, notOwner: any;

  beforeEach(async function () {
    [owner1, owner2, owner3, notOwner] = await ethers.getSigners();
    const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
    wallet = await WalletFactory.deploy([owner1.address, owner2.address], 2) as MultiSigWallet; // 2 of 2 multisig
    await wallet.waitForDeployment();
  });

  // it("should be deployed with correct owners and requirement", async function () {
  //   expect(await wallet.getOwners()).to.deep.equal([owner1.address, owner2.address]);
  //   expect(await wallet.required()).to.equal(2);
  // });

  // it("should allow an owner to submit a transaction", async function () {
  //   // A promise that resolves when the Submission event is emitted
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   const tx = await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  //   await tx.wait();
  
  //   // Wait for the promise to resolve
  //   const txId = await submissionPromise; 
  //   // Check if the event was captured
  //   expect(txId).to.not.be.undefined;
  //   // Proceed with the confirmation
  //   await expect(wallet.connect(owner2).confirmTransaction(txId))
  //     .to.emit(wallet, "Confirmation")
  //     .withArgs(owner2.address, txId);
  // });

  // it("should allow an owner to confirm a transaction", async function () {
  //   // A promise that resolves when the Submission event is emitted
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   const tx = await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  //   await tx.wait();
  
  //   // Wait for the promise to resolve
  //   const txId = await submissionPromise;
  //   // Check if the event was captured
  //   expect(txId).to.not.be.undefined;
  //   // Proceed with the confirmation
  //   await expect(wallet.connect(owner2).confirmTransaction(txId))
  //     .to.emit(wallet, "Confirmation")
  //     .withArgs(owner2.address, txId);
  // });

  // it("should prevent a non-owner from confirming a transaction", async function () {
  //   // A promise that resolves when the Submission event is emitted
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  
  //   // Wait for the promise to resolve, capturing the txId
  //   const txId = await submissionPromise; 
  //   // Check if the event was captured
  //   expect(txId).to.not.be.undefined;
  
  //   await expect(wallet.connect(notOwner).confirmTransaction(txId)).to.be.revertedWith("isOwner[msg.sender]");
  // });

  // it("should execute a transaction when enough confirmations are gathered", async function () {
  //   // Promises to capture both events
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   const executionPromise = new Promise<boolean>((resolve) => {
  //     wallet.once("Execution", (txIndex) => {
  //       console.log("Execution event captured:", txIndex);
  //       resolve(true); // Resolve with true to indicate successful execution
  //     });
  //   });

  //   // Fund the contract with 2 Ether
  //   await owner1.sendTransaction({ to: wallet.target, value: ethers.parseEther("2") }); 
  //   // Submit
  //   await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  //   // Wait for the submission promise to resolve and get the txId
  //   const txId = await submissionPromise;
  //   expect(txId).to.not.be.undefined;
  //   // Confirm the transaction with both owners
  //   await wallet.connect(owner1).confirmTransaction(txId); 
  //   await wallet.connect(owner2).confirmTransaction(txId);

  //   const initialBalance = await ethers.provider.getBalance(owner3.address);
  
  //   // Execute the transaction and wait for the execution promise to resolve
  //   await wallet.connect(owner1).executeTransaction(txId);
  //   const success = await executionPromise;
  //   // Check if the execution was successful
  //   expect(success).to.be.true; 
  
  //   const finalBalance = await ethers.provider.getBalance(owner3.address);
  //   expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
  // });

  // it("should prevent execution if not enough confirmations", async function () {
  //   // A promise that resolves when the Submission event is emitted
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  
  //   // Wait for the submission promise to resolve and get the txId
  //   const txId = await submissionPromise;
  //   expect(txId).to.not.be.undefined;
  //   // Attempt to execute the transaction without enough confirmations
  //   await expect(wallet.connect(owner1).executeTransaction(txId)).to.be.revertedWith("Not enough confirmations"); 
  // });

  // it("should allow an owner to revoke a confirmation", async function () {
  //   // Promise to capture the Submission event
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  
  //   // Wait for the submission promise to resolve and get the txId
  //   const txId = await submissionPromise;
  //   expect(txId).to.not.be.undefined;
  //   // Confirm the transaction with owner2
  //   await wallet.connect(owner2).confirmTransaction(txId);
  //   // Revoke the confirmation and check for the Revocation event
  //   await expect(wallet.connect(owner2).revokeConfirmation(txId))
  //     .to.emit(wallet, "Revocation")
  //     .withArgs(owner2.address, txId);
  // });

  // it("should prevent a non-owner from revoking a confirmation", async function () {
  //   // Promise to capture the Submission event
  //   const submissionPromise = new Promise<any>((resolve) => {
  //     wallet.once("Submission", (txIndex) => {
  //       console.log("Submission event captured:", txIndex);
  //       resolve(txIndex);
  //     });
  //   });
  
  //   await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  
  //   // Wait for the submission promise to resolve and get the txId
  //   const txId = await submissionPromise;
  //   expect(txId).to.not.be.undefined;
  //   // Confirm the transaction with owner2
  //   await wallet.connect(owner2).confirmTransaction(txId);
  //   // Try to revoke the confirmation with a non-owner and expect a revert
  //   await expect(wallet.connect(notOwner).revokeConfirmation(txId)).to.be.revertedWith("Not an owner"); 
  // });

  // it("should allow adding a new owner", async function () {
  //   await expect(wallet.connect(owner1).addOwner(owner3.address))
  //     .to.emit(wallet, "OwnerAddition")
  //     .withArgs(owner3.address);
  //   expect(await wallet.isOwner(owner3.address)).to.be.true;
  // });

  // it("should allow removing an owner", async function () {
  //   await expect(wallet.connect(owner1).removeOwner(owner2.address))
  //     .to.emit(wallet, "OwnerRemoval")
  //     .withArgs(owner2.address);
  //   expect(await wallet.isOwner(owner2.address)).to.be.false;
  // });

  // it("should allow changing the requirement", async function () {
  //   await expect(wallet.connect(owner1).changeRequirement(1))
  //     .to.emit(wallet, "RequirementChange")
  //     .withArgs(1);
  //   expect(await wallet.required()).to.equal(1);
  // });

  
});