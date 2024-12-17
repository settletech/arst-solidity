import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWalletB } from "../typechain-types"; 

describe("MultiSigWalletB", function () {
  let wallet: MultiSigWalletB;
  let owner1: any, owner2: any, owner3: any, notOwner: any;

  beforeEach(async function () {
    [owner1, owner2, owner3, notOwner] = await ethers.getSigners();
    const WalletFactory = await ethers.getContractFactory("MultiSigWalletB");
    wallet = await WalletFactory.deploy([owner1.address, owner2.address], 2) as MultiSigWalletB;
    await wallet.waitForDeployment();
  });

  it("should be deployed with correct owners and requirement", async function () {
    expect(await wallet.getOwners()).to.deep.equal([owner1.address, owner2.address]);
    expect(await wallet.numConfirmationsRequired()).to.equal(2);
  });

//   it("should allow an owner to submit a transaction", async function () {
//     const submissionPromise = new Promise<any>((resolve) => {
//       wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => { 
//         console.log("Submission event captured:", txIndex);
//         resolve(txIndex);
//       });
//     });

//     const tx = await wallet.connect(owner1).submitTransaction(owner3.address, 0, owner3.address, ethers.parseEther("1")); 
//     await tx.wait();

//     const txId = await submissionPromise;
//     expect(txId).to.not.be.undefined;

//     await expect(wallet.connect(owner2).confirmTransaction(txId))
//       .to.emit(wallet, "ConfirmTransaction") 
//       .withArgs(owner2.address, txId);
//   });

//   it("should prevent a non-owner from confirming a transaction", async function () {
//     // Promise to capture the SubmitTransaction event
//     const submissionPromise = new Promise<any>((resolve) => {
//       wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => {
//         console.log("SubmitTransaction event captured:", txIndex);
//         resolve(txIndex);
//       });
//     });
  
//     await wallet.connect(owner1).submitTransaction(owner3.address, 0, owner3.address, ethers.parseEther("1")); 
  
//     // Wait for the promise to resolve, capturing the txId
//     const txId = await submissionPromise;
//     expect(txId).to.not.be.undefined;
  
//     // Try to confirm the transaction with a non-owner and expect a revert
//     await expect(wallet.connect(notOwner).confirmTransaction(txId)).to.be.revertedWith("not owner"); 
//   });

//   it("should execute a transaction when enough confirmations are gathered", async function () {
//     const submissionPromise = new Promise<any>((resolve) => {
//       wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => {
//         console.log("Submission event captured:", txIndex);
//         resolve(txIndex);
//       });
//     });

//     const executionPromise = new Promise<boolean>((resolve) => {
//       wallet.once("ExecuteTransaction", (owner, txIndex) => { 
//         console.log("Execution event captured:", txIndex);
//         resolve(true);
//       });
//     });

//     await owner1.sendTransaction({ to: wallet.target, value: ethers.parseEther("2") });

//     await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), owner3.address, ethers.parseEther("1")); 

//     const txId = await submissionPromise;
//     expect(txId).to.not.be.undefined;

//     await wallet.connect(owner1).confirmTransaction(txId);
//     await wallet.connect(owner2).confirmTransaction(txId);


//     const initialBalance = await ethers.provider.getBalance(owner3.address);

//     await wallet.connect(owner1).executeTransaction(txId);
//     const success = await executionPromise;

//     expect(success).to.be.true;

//     const finalBalance = await ethers.provider.getBalance(owner3.address);
//     expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
//   });

//   it("should allow an owner to revoke a confirmation", async function () {
//     const submissionPromise = new Promise<any>((resolve) => {
//       wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => {
//         console.log("Submission event captured:", txIndex);
//         resolve(txIndex);
//       });
//     });

//     await wallet.connect(owner1).submitTransaction(owner3.address, 0, owner3.address, ethers.parseEther("1")); 

//     const txId = await submissionPromise;
//     expect(txId).to.not.be.undefined;

//     await wallet.connect(owner2).confirmTransaction(txId);

//     await expect(wallet.connect(owner2).revokeConfirmation(txId))
//       .to.emit(wallet, "RevokeConfirmation") 
//       .withArgs(owner2.address, txId);
//   });

  it("should allow adding a new owner", async function () {
    const submissionPromise = new Promise<any>((resolve) => {
      wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => {
        console.log("SubmitTransaction event captured (addOwner):", txIndex);
        resolve(txIndex);
      });
    });

    const executionPromise = new Promise<boolean>((resolve) => {
      wallet.once("ExecuteOwnershipTransaction", (owner, txIndex) => {
        console.log("ExecuteOwnershipTransaction event captured (addOwner):", txIndex);
        resolve(true);
      });
    });

    await wallet.connect(owner1).addOwner(owner3.address);

    const txId = await submissionPromise;
    expect(txId).to.not.be.undefined;

    // Need to confirm the transaction with the second owner
    await wallet.connect(owner2).confirmTransaction(txId);

    // Execute the transaction
    await wallet.connect(owner1).executeOwnershipTransaction(txId);

    const executed = await executionPromise;
    expect(executed).to.be.true;

    // Check if owner3 was added
    expect(await wallet.isOwner(owner3.address)).to.be.true;
  });

  it("should allow removing an owner", async function () {
    const submissionPromise = new Promise<any>((resolve) => {
      wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => {
        console.log("SubmitTransaction event captured (removeOwner):", txIndex);
        resolve(txIndex);
      });
    });

    const executionPromise = new Promise<boolean>((resolve) => {
      wallet.once("ExecuteOwnershipTransaction", (owner, txIndex) => {
        console.log("ExecuteOwnershipTransaction event captured (removeOwner):", txIndex);
        resolve(true);
      });
    });

    await wallet.connect(owner1).removeOwner(owner2.address);

    const txId = await submissionPromise;
    expect(txId).to.not.be.undefined;

    // Need to confirm the transaction (even though owner2 is being removed)
    await wallet.connect(owner2).confirmTransaction(txId);

    // Execute the transaction
    await wallet.connect(owner1).executeOwnershipTransaction(txId);

    const executed = await executionPromise;
    expect(executed).to.be.true;

    // Check if owner2 was removed
    expect(await wallet.isOwner(owner2.address)).to.be.false;
  });

  it("should allow changing the requirement", async function () {
    const submissionPromise = new Promise<any>((resolve) => {
      wallet.once("SubmitTransaction", (owner, txIndex, to, value, data) => {
        console.log("SubmitTransaction event captured (changeRequirement):", txIndex);
        resolve(txIndex);
      });
    });

    const executionPromise = new Promise<boolean>((resolve) => {
      wallet.once("ExecuteOwnershipTransaction", (owner, txIndex) => {
        console.log("ExecuteOwnershipTransaction event captured (changeRequirement):", txIndex);
        resolve(true);
      });
    });

    const newRequirement = 1; 
    console.log("New requirement:", newRequirement);

    await wallet.connect(owner1).changeRequirement(newRequirement);

    const txId = await submissionPromise;
    expect(txId).to.not.be.undefined;

    // Need to confirm the transaction with the second owner
    await wallet.connect(owner2).confirmTransaction(txId);

    // Execute the transaction
    await wallet.connect(owner1).executeOwnershipTransaction(txId);

    const executed = await executionPromise;
    expect(executed).to.be.true;

    // Check if the requirement was changed
    expect(await wallet.numConfirmationsRequired()).to.equal(1);
  });
  

  
});