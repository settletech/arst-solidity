import { expect } from "chai";
import { ethers } from "hardhat";
import { StableToken } from "../typechain-types"; 

describe("StableToken", function () {
  let token: StableToken;
  let owner: any;
  let minter: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("StableToken");
    token = await TokenFactory.deploy() as StableToken;
    await token.waitForDeployment(); 
  });

  it("Should have the correct name and symbol", async function () {
    expect(await token.name()).to.equal("StableToken");
    expect(await token.symbol()).to.equal("STT");
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
      "Invalid new owner address."
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
