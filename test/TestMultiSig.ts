import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet, StableToken, TokenVault } from "../typechain-types";

let wallet: MultiSigWallet;
let token: StableToken;
let vault: TokenVault;
let owner1: any, owner2: any, owner3: any, owner4, notOwner: any;
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const ZERO_ETHER = ethers.parseEther("0");
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
    expect(await wallet.numConfirmationsRequired()).to.be.equal(2);
    expect(await wallet.activeOwners()).to.be.equal(3);
  });
  
  it("should allow an owner to submit a tx", async () => {
    await expect(wallet.connect(owner1).submitTransaction(wallet.target, ONE_ETHER, "0x"))
      .to.emit(wallet, "SubmitTransaction")
      .withArgs(owner1.address, ZERO, wallet.target, ONE_ETHER, "0x")
    
    expect(await wallet.isConfirmed(ZERO, owner1.address)).to.be.equal(true);
  });

  it("should prevent a non-owner to submit a tx", async () => {
    await expect(wallet.connect(notOwner).submitTransaction(wallet.target, ONE_ETHER, "0x"))
      .to.be.revertedWith("not owner");
  });

  it("should allow an owner to confirm a tx", async () => {
    const tx = await wallet.connect(owner1).submitTransaction(wallet.target, ONE_ETHER, "0x");
    await tx.wait();
  
    // Proceed with the confirmation
    const txId = ZERO;

    await expect(wallet.connect(owner2).confirmTransaction(txId))
      .to.emit(wallet, "ConfirmTransaction")
      .withArgs(owner2.address, txId);
  });

  
  it("should prevent a non-owner from confirming a tx", async function () {
 
    await wallet.connect(owner1).submitTransaction(wallet.target, ONE_ETHER, "0x");
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

    await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");
  
    // Confirm the transaction with owner2
    await wallet.connect(owner2).confirmTransaction(ZERO);
    // Revoke the confirmation and check for the Revocation event
    await expect(wallet.connect(owner2).revokeConfirmation(ZERO))
      .to.emit(wallet, "RevokeConfirmation")
      .withArgs(owner2.address, ZERO);

    await expect(wallet.connect(owner1).executeTransaction(ZERO))
      .to.be.revertedWith("Not enough confirmations")

    // Confirm the transaction again
    await expect(wallet.connect(owner2).confirmTransaction(ZERO)).not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;
  });

  
  it("should prevent a non-owner from revoking a confirmation", async function () {
  
    await wallet.connect(owner1).submitTransaction(owner3.address, ONE_ETHER, "0x");
  
    // Confirm the transaction with owner2
    await wallet.connect(owner2).confirmTransaction(ZERO);

    // Revoke the confirmation and check for the Revocation event
    await expect(wallet.connect(notOwner).revokeConfirmation(ZERO))
      .to.be.revertedWith("not owner");

    // Confirm the transaction again
    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .to.be.revertedWith("tx already confirmed");

    await expect(wallet.connect(owner1).executeTransaction(ZERO))
      .not.to.be.reverted; 
  });

  
  it("should only allow multisig to add additional owners", async function () {
    await expect(wallet.connect(owner1).addOwner(owner3.address))
      .to.be.revertedWith("not owner");
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

  });

  it("should verify new token owner", async () => {
    expect(await token.owner()).to.be.equal(wallet.target);
  });

  
  it("should execute goverment tx", async () => {
    const ABI = ["function changeRequirement(uint256 _numConfirmationsRequired)"];

    const valueHex = new ethers.Interface(ABI);
    const requirementData = valueHex.encodeFunctionData("changeRequirement", [ONE]);

    await wallet.connect(owner1).submitTransaction(wallet.target, ZERO, requirementData);

    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;

    expect(await wallet.numConfirmationsRequired()).to.be.equal(ONE);
  });

  it("should allow multisig to add a new owner", async function () {
    const ABI = ["function addOwner(address _owner)"];

    const valueHex = new ethers.Interface(ABI);
    const addOwnerData = valueHex.encodeFunctionData("addOwner", [notOwner.address]);

    await expect(wallet.connect(owner1).submitTransaction(wallet.target, ZERO, addOwnerData))
      .not.to.be.reverted;

    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;

    expect(await wallet.isOwner(notOwner.address)).to.be.true;
  });

  it("should allow removing an owner", async function () {
    const ABI = ["function removeOwner(address _owner)"];

    const valueHex = new ethers.Interface(ABI);
    const removeOwnerData = valueHex.encodeFunctionData("removeOwner", [owner3.address]);

    await expect(wallet.connect(owner1).submitTransaction(wallet.target, ZERO, removeOwnerData))
      .not.to.be.reverted;

    expect(await wallet.isOwner(owner3.address)).to.be.true;

    await expect(wallet.connect(owner2).confirmTransaction(ZERO));

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;

    expect(await wallet.isOwner(owner3.address)).to.be.false;
  });

  it("should not allow removing an owner if less than required", async function () {
    const ABI = ["function removeOwner(address _owner)"];

    const valueHex = new ethers.Interface(ABI);
    const removeOwnerData = valueHex.encodeFunctionData("removeOwner", [owner3.address]);

    await expect(wallet.connect(owner1).submitTransaction(wallet.target, ZERO, removeOwnerData))
      .not.to.be.reverted;

    expect(await wallet.activeOwners()).to.be.equal(3);
    await expect(wallet.connect(owner2).confirmTransaction(ZERO));
    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;
    
    expect(await wallet.activeOwners()).to.be.equal(2);
    const removeOwnerData2 = valueHex.encodeFunctionData("removeOwner", [owner2.address]);
    await expect(wallet.connect(owner1).submitTransaction(wallet.target, ZERO_ETHER, removeOwnerData2))
      .not.to.be.reverted;

    await expect(wallet.connect(owner2).confirmTransaction(ONE));

    await expect(wallet.connect(owner1).executeTransaction(ONE))
      .to.be.revertedWith("tx failed");
      

    expect(await wallet.activeOwners()).to.be.equal(2);
    expect(await wallet.isOwner(owner2.address)).to.be.true;
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
});

 describe("Vaul Testing", function () {

  let ownerRole: any;
  let adminRole: any;

  beforeEach(async function () {
    [owner1, owner2, owner3, owner4, notOwner] = await ethers.getSigners();

    const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
    wallet = await WalletFactory.deploy([owner1.address, owner2.address, owner3.address], 2) as MultiSigWallet;
    await wallet.waitForDeployment();

    const TokenFactory = await ethers.getContractFactory("StableToken");
    token = await TokenFactory.deploy() as StableToken;
    await token.waitForDeployment();

    await token.transferOwnership(wallet.target);

    const VaultFactory = await ethers.getContractFactory("TokenVault");
    vault = await VaultFactory.deploy(token.target) as TokenVault;
    await vault.waitForDeployment();

    await vault.transferOwnership(wallet.target);

    ownerRole = await vault.VAULTOWNER_ROLE();
    adminRole = await vault.DEFAULT_ADMIN_ROLE();

    // Transfer tokens to the vault
    const ABI = ["function mint(address to, uint256 amount)"];

    const valueHex = new ethers.Interface(ABI);
    const mintData = valueHex.encodeFunctionData("mint", [vault.target, TEN_ETHER]);

    await wallet.connect(owner1).submitTransaction(token.target, ZERO, mintData);

    await expect(wallet.connect(owner2).confirmTransaction(ZERO))
      .not.to.be.reverted;

    await expect(wallet.connect(owner1).executeTransaction(ZERO)).not.to.be.reverted;
  });

  it("should verify multisig as vault owner", async () => {
    expect(await vault.owner()).to.be.equal(wallet.target);
  });

  it("should validate the vault owner role", async () => {
    expect(await vault.hasRole(ownerRole, owner1.address)).to.be.true;
  });

  it("should validate the default admin role", async () => {
    expect(await vault.hasRole(adminRole, owner1.address)).to.be.true;
  });

  it("should validate the token address admin role", async () => {
    expect(await vault.token()).to.be.equal(token.target);
  });
  
  it("should validate vault balance ", async () => {
    expect(await token.balanceOf(vault.target)).to.be.equal(TEN_ETHER);

    expect(await vault.getBalance()).to.be.equal(TEN_ETHER);
  });

  it("should validate only vault owner can transfer", async () => {
    await expect(vault.connect(owner2).transfer(owner2.address, ONE_ETHER))
      .to.be.revertedWithCustomError(vault, "AccessControlUnauthorizedAccount")
      .withArgs(owner2.address, ownerRole);
  });

  it("should validate transfer receipient", async () => {
    await expect(vault.transfer(ADDRESS_ZERO, ONE_ETHER))
      .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
      .withArgs(ADDRESS_ZERO);
  });

  it("should validate that vault owner can transfer", async () => {
    await expect(vault.transfer(owner2.address, ONE_ETHER))
      .to.emit(vault, "Transfer")
      .withArgs(owner2.address, ONE_ETHER);

    expect(await token.balanceOf(owner2.address)).to.be.equal(ONE_ETHER);
  });

});