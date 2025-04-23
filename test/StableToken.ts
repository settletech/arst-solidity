import { expect } from "chai";
import { ethers } from "hardhat";
import { StableToken } from "../typechain-types"; 

describe("StableToken", function () {
  let token: StableToken;
  let owner: any;
  let minter: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let vault: any;
  let newVault: any;
  const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, minter, user1, user2, user3, vault, newVault] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("StableToken");
    token = await TokenFactory.deploy(vault) as StableToken;
    await token.waitForDeployment(); 

    await token.setCustodyVault(vault.address);
  });

  describe("Token functionality", function () {
    it("Should have the correct name and symbol", async function () {
      expect(await token.name()).to.equal("ARST Finance");
      expect(await token.symbol()).to.equal("ARST");
    });

    it("Should have an initial supply of 0", async function () {
      expect(await token.totalSupply()).to.equal(0);
    });

    it("Should revert if trying to transfer to the zero address", async function () {
      await token.mint(user1.address, 1000);
      await expect(token.connect(user1).transfer(ethers.ZeroAddress, 500)).to.be.reverted;
    });

    it("Should revert if trying to transfer from the zero address", async function () {
      await token.mint(user1.address, 1000);
      await expect(token.connect(user1).transferFrom(ethers.ZeroAddress, user2.address, 500)).to.be.reverted;
    });

    it("Should revert if trying to transfer more tokens than the balance", async function () {
      await token.mint(user1.address, 1000);
      await expect(token.connect(user1).transfer(user2.address, 1500)).to.be.reverted; 
    });

    it("Should revert if trying to burn more tokens than the balance", async function () {
      await token.mint(owner.address, 1000);
      await expect(token.burn(1500)).to.be.reverted;
    });

    it("Should revert if trying to transfer ownership to the zero address", async function () {
      await expect(token.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid new owner address"
      );
    });

    it("Should allow transfers", async function () {
      await token.mint(user1.address, 1000);
      await token.connect(user1).transfer(user2.address, 500);
      expect(await token.balanceOf(user1.address)).to.equal(500);
      expect(await token.balanceOf(user2.address)).to.equal(500);
    });

    it("Should allow burning", async function () {
      await expect(token.mint(owner.address, 1000)).not.to.be.reverted;
      await expect(token.connect(owner).burn(500))
        .not.to.be.reverted;
      expect(await token.balanceOf(owner.address)).to.equal(500);
    });

    it("Should not allow burning if not owner", async function () {
      await expect(token.mint(owner.address, 1000)).not.to.be.reverted;
      await expect(token.connect(user1).burn(500))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should allow pausing and unpausing", async function () {
      await token.mint(user1.address, 1000);

      // Pause transfers
      await token.pause();
      await expect(token.connect(user1).transfer(user2.address, 500)).to.be.reverted;

      // Unpause transfers
      await token.unpause();
      await token.connect(user1).transfer(user2.address, 500);
      expect(await token.balanceOf(user1.address)).to.equal(500);
      expect(await token.balanceOf(user2.address)).to.equal(500);
    });

    it("Should revert if a non-owner tries to pause or unpause", async function () {
      await expect(token.connect(user1).pause()).to.be.reverted;
      await expect(token.connect(user1).unpause()).to.be.reverted;
    });

    it("Should allow the owner to transfer ownership", async function () {
      await token.transferOwnership(user1.address);
      expect(await token.owner()).to.equal(user1.address);
    });
  });

  describe("Blacklist features", function () {
    it("Should have defined the vault address", async function () {
      expect(await token.custodyVault()).to.be.equal(vault.address);
    });

    it("Should change vault only by the owner", async () => {
      await expect(token.connect(user1).setCustodyVault(newVault.address))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

      await expect(token.setCustodyVault(newVault.address))
        .not.to.be.reverted;

      await expect(token.setCustodyVault(ADDRESS_ZERO))
        .to.be.revertedWith("Invalid vault address");

      expect(await token.custodyVault()).to.be.equal(newVault.address);
    });

    it("Should allow to change the blacklist status", async function () {
      await expect(token.connect(user1).setBlacklistStatus(user1.address, true))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

      await expect(token.setBlacklistStatus(user1.address, false))
        .to.be.revertedWith("Only new status");

      await expect(token.setBlacklistStatus(user1.address, true))
        .not.to.be.reverted;

      expect(await token.blacklist(user1.address)).to.be.equal(true);
    });


    it("Should validate ownership receiver is not blacklisted", async () => {
      await expect(token.setBlacklistStatus(user1.address, true))
        .not.to.be.reverted;

      await expect(token.transferOwnership(user1.address))
        .to.be.rejectedWith("Address is blacklisted");

      await expect(token.transferOwnership(ADDRESS_ZERO))
        .to.be.rejectedWith("Invalid new owner address");
    });

    it("Should validate minted tokens' receiver is not blacklisted", async () => {
      await expect(token.setBlacklistStatus(user1.address, true))
        .not.to.be.reverted;

      await expect(token.mint(user1.address, 100))
        .to.be.rejectedWith("Address is blacklisted");
    });

    it("Should validate transfer tokens sender is not blacklisted", async () => {
      await expect(token.setBlacklistStatus(user1.address, true))
        .not.to.be.reverted;

      await expect(token.transfer(user1.address, 100))
        .to.be.rejectedWith("Address is blacklisted");

      await expect(token.connect(user1).transfer(user2.address, 100))
        .to.be.rejectedWith("Address is blacklisted");
    });

  });

  it("Should validate accounts blacklistedin transferFrom are not blacklisted", async() => {
    await expect(token.mint(user1.address, 100))
        .not.to.be.reverted;

    await expect(token.connect(user1).approve(user2.address, 100))
      .not.to.be.reverted;

    // Approved sender is blacklisted
    await expect(token.setBlacklistStatus(user1.address, true))
        .not.to.be.reverted;

    await expect(token.connect(user2).transferFrom(user1.address, user3.address, 100))
      .to.be.revertedWith("Address is blacklisted");

    // remove blacklisting to user1
    await expect(token.setBlacklistStatus(user1.address, false))
        .not.to.be.reverted;

    await expect(token.setBlacklistStatus(user2.address, true))
        .not.to.be.reverted;

    await expect(token.connect(user2).transferFrom(user1.address, user3.address, 100))
      .to.be.revertedWith("Address is blacklisted");

    // remove blacklisting to user2
    await expect(token.setBlacklistStatus(user2.address, false))
        .not.to.be.reverted;

    await expect(token.setBlacklistStatus(user3.address, true))
        .not.to.be.reverted;

    await expect(token.connect(user2).transferFrom(user1.address, user3.address, 100))
      .to.be.revertedWith("Address is blacklisted");
  })

  it("Should allow to remove funds from blacklisted users", async() => {
      const vault = await token.custodyVault();
      await expect(token.mint(user1.address, 100))
        .not.to.be.reverted;

      // Approved sender is blacklisted
      await expect(token.setBlacklistStatus(user1.address, true))
        .not.to.be.reverted;

      expect(await token.balanceOf(vault)).to.be.equal(0);

      await expect(token.transferFromBlacklisted(user2.address, 100))
        .to.be.revertedWith("Address is not blacklisted");

      await expect(token.transferFromBlacklisted(user1.address, 0))
        .to.be.revertedWith("Amount should be greater than zero");

      await expect(token.transferFromBlacklisted(user1.address, 200))
        .to.be.revertedWith("Insufficient balance");

      await expect(token.transferFromBlacklisted(user1.address, 100))
        .not.to.be.reverted;

      expect(await token.balanceOf(vault)).to.be.equal(100);

    });

});
