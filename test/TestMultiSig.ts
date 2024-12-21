import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet, StableToken } from "../typechain-types";

let wallet: MultiSigWallet;
let token: StableToken;
let owner1: any, owner2: any, owner3: any, owner4, notOwner: any;
const ONE_ETHER = ethers.parseEther("1");
const TWO_ETHER = ethers.parseEther("2");
const TEN_ETHER = ethers.parseEther("10");
const ZERO = 0;
const ONE = 1;
const TWO = 2;

describe("MultiSigWallet", function () {
  
  
  beforeEach(async function () {
    [owner1, owner2, owner3, owner4, notOwner] = await ethers.getSigners();
    const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
    wallet = await WalletFactory.deploy([owner1.address, owner2.address, owner3.address], 2) as MultiSigWallet;
    await wallet.waitForDeployment();

    // Send funds to the multi signature contract
    await owner1.sendTransaction({ to: wallet.target, value: TWO_ETHER});
  });

  it("should be deployed with correct owners and requirement", async () => {
    expect(await wallet.getOwners()).to.deep.equal([owner1.address, owner2.address, owner3.address]);
    expect(await wallet.numConfirmationsRequired()).to.equal(2);
  }); 
  
  it("should allow an owner to submit a tx", async () => {
    await expect(wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x"))
      .to.emit(wallet, "SubmitTransaction")
      .withArgs(owner1.address, ZERO, owner3.address, ethers.parseEther("1"), "0x")
    
    expect(await wallet.isConfirmed(ZERO, owner1.address)).to.be.equal(true);
  });

  it("should prevent a non-owner to submit a tx", async () => {
    await expect(wallet.connect(notOwner).submitTransaction(owner3.address, ONE_ETHER, "0x"))
      .to.be.revertedWith("not owner");
  });

  it("should allow an owner to confirm a tx", async () => {
    const tx = await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");
    await tx.wait();
  
    // Proceed with the confirmation
    const txId = ZERO;

    await expect(wallet.connect(owner2).confirmTransaction(txId))
      .to.emit(wallet, "ConfirmTransaction")
      .withArgs(owner2.address, txId);
  });

  
  it("should prevent a non-owner from confirming a tx", async function () {
 
    await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");
    await expect(wallet.connect(notOwner).confirmTransaction(ZERO)).to.be.revertedWith("not owner");

  });

  it("should execute a tx when enough confirmations are gathered", async function () {
    // Submit
    await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");

    // Wait for the submission promise to resolve and get the txId
    await wallet.connect(owner2).confirmTransaction(ZERO);

    const initialBalance = await ethers.provider.getBalance(owner3.address);
  
    // Execute the transaction and wait for the execution promise to resolve
    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;
      
    const finalBalance = await ethers.provider.getBalance(owner3.address);
    expect(finalBalance - initialBalance).to.equal(ONE_ETHER);
    expect(await ethers.provider.getBalance(wallet)).to.be.equal(ONE_ETHER);
  });

  it("should execute a tx when more than the required confirmations", async function () {
    // Submit
    await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");

    // Wait for the submission promise to resolve and get the txId
    await wallet.connect(owner2).confirmTransaction(ZERO);
    await wallet.connect(owner3).confirmTransaction(ZERO);

    const initialBalance = await ethers.provider.getBalance(owner3.address);
  
    // Execute the transaction and wait for the execution promise to resolve
    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;
      
    const finalBalance = await ethers.provider.getBalance(owner3.address);
    expect(finalBalance - initialBalance).to.equal(ONE_ETHER);
    expect(await ethers.provider.getBalance(wallet)).to.be.equal(ONE_ETHER);
  });

  
  it("should prevent execution if not enough confirmations", async function () {
  
    await expect(wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x")).not.to.be.reverted;
  
    // Attempt to execute the transaction without enough confirmations
    await expect(wallet.connect(owner1).executeTransaction(ZERO)).to.be.revertedWith("Not enough confirmations"); 
  });


  it("should allow an owner to revoke a confirmation", async function () {

    await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  
    // Confirm the transaction with owner2
    await wallet.connect(owner2).confirmTransaction(ZERO);
    // Revoke the confirmation and check for the Revocation event
    await expect(wallet.connect(owner2).revokeConfirmation(ZERO))
      .to.emit(wallet, "RevokeConfirmation")
      .withArgs(owner2.address, ZERO);

    // Confirm the transaction again
    await expect(wallet.connect(owner2).confirmTransaction(ZERO)).not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted; 
  });

  
  it("should prevent a non-owner from revoking a confirmation", async function () {
  
    await wallet.connect(owner1).submitTransaction(owner3.address, ethers.parseEther("1"), "0x");
  
    // Confirm the transaction with owner2
    await wallet.connect(owner2).confirmTransaction(ZERO);

    // Revoke the confirmation and check for the Revocation event
    await expect(wallet.connect(notOwner).revokeConfirmation(ZERO)).to.be.revertedWith("not owner");

    // Confirm the transaction again
    await expect(wallet.connect(owner2).confirmTransaction(ZERO)).to.be.revertedWith("tx already confirmed");

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted; 
  });

  
  it("should allow adding a new owner", async function () {
    await expect(wallet.connect(owner1).addOwner(owner3.address)).not.to.be.reverted;

    expect(await wallet.isOwner(owner3.address)).to.be.true;

    await expect(wallet.connect(notOwner).addOwner(owner3.address))
      .to.be.revertedWith("not owner");
  });

  it("should only allow owners to add additional owners", async function () {
    await expect(wallet.connect(notOwner).addOwner(owner3.address))
      .to.be.revertedWith("not owner");
  });


  it("should allow removing an owner", async function () {
    await expect(wallet.connect(owner1).removeOwner(owner2.address))
      .not.to.be.reverted;

    expect(await wallet.isOwner(owner2.address)).to.be.true;

    await expect(wallet.connect(owner3).confirmTransaction(ZERO));

    await expect(wallet.connect(owner1).executeOwnershipTransaction(ZERO)).not.to.be.reverted; 

    expect(await wallet.isOwner(owner2.address)).to.be.false;
  });

  
  it("should allow changing the confirmations required", async function () {
    expect (await wallet.numConfirmationsRequired()).to.be.equal(2);

    await expect(wallet.connect(owner1).changeRequirement(3)).not.to.be.reverted;
    await expect(wallet.connect(owner2).confirmTransaction(ZERO));

    await expect(wallet.connect(owner1).executeOwnershipTransaction(ZERO)).not.to.be.reverted; 

    expect (await wallet.numConfirmationsRequired()).to.be.equal(3);
  });

  it("should verify transaction properties", async function () {
    await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");

    let _tx:any;

    _tx = await wallet.getTransaction(ZERO);
    expect(_tx.to).to.be.equal(owner3.address);
    expect(_tx.value).to.be.equal(ONE_ETHER);
    expect(_tx.data).to.be.equal("0x");
    expect(_tx.executed).to.be.equal(false);
    expect(_tx.numConfirmations).to.be.equal(ONE);

    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .not.to.be.reverted;

    _tx = await wallet.getTransaction(ZERO);
    expect(_tx.to).to.be.equal(owner3.address);
    expect(_tx.value).to.be.equal(ONE_ETHER);
    expect(_tx.data).to.be.equal("0x");
    expect(_tx.executed).to.be.equal(false);
    expect(_tx.numConfirmations).to.be.equal(TWO);

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;

    _tx = await wallet.getTransaction(ZERO);
    expect(_tx.to).to.be.equal(owner3.address);
    expect(_tx.value).to.be.equal(ONE_ETHER);
    expect(_tx.data).to.be.equal("0x");
    expect(_tx.executed).to.be.equal(true);
    expect(_tx.numConfirmations).to.be.equal(TWO);

  });

});


describe("ARST Token Minting", function () {

  beforeEach(async function () {
    [owner1, owner2, owner3, owner4, notOwner] = await ethers.getSigners();

    const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
    wallet = await WalletFactory.deploy([owner1.address, owner2.address, owner3.address], 2) as MultiSigWallet;
    await wallet.waitForDeployment();

    const TokenFactory = await ethers.getContractFactory("StableToken");
    token = await TokenFactory.deploy() as StableToken;
    await token.waitForDeployment();

    await token.transferOwnership(wallet.target);

    // Send funds to the multi signature contract
    await owner1.sendTransaction({ to: wallet.target, value: TWO_ETHER});
  });

  it("should verify new token owner", async () => {
    expect(await token.owner()).to.be.equal(wallet.target);
  });

  
  it("should mint tokens", async () => {
    const ABI = ["function mint(address to, uint256 amount)"];

    const valueHex = new ethers.Interface(ABI);
    const mintData = valueHex.encodeFunctionData("mint", [owner3.address,TEN_ETHER]);

    await wallet.connect(owner1).submitTransaction(token.target, ZERO, mintData);

    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;

    expect(await token.balanceOf(owner3.address)).to.be.equal(TEN_ETHER);
  });

  it("should execute goverment tx", async () => {
    const ABI = ["function _changeRequirement(uint256 _numConfirmationsRequired)"];

    const valueHex = new ethers.Interface(ABI);
    const requirementData = valueHex.encodeFunctionData("_changeRequirement", [ONE]);

    await wallet.connect(owner1).submitTransaction(wallet.target, ZERO, requirementData);

    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;

    expect(await wallet.numConfirmationsRequired()).to.be.equal(ONE);
  });
});