import { ethers } from "hardhat";
import * as MultiSigArtifacts from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import * as StableTokenArtifacts from "../artifacts/contracts/StableToken.sol/StableToken.json";
import * as TokenVaultArtifacts from "../artifacts/contracts/Vault.sol/TokenVault.json";

async function deployContracts() {
    // Get the signer 
    const [signer] = await ethers.getSigners();

    // Deploy MultiSigWallet
    const MultiSigFactory = new ethers.ContractFactory(
        MultiSigArtifacts.abi,
        MultiSigArtifacts.bytecode,
        signer
    );
    const multisigWallet = await MultiSigFactory.deploy(
        [
        "0x7Af53A6599628AE87F77A4F7a4bA82fE999CE0BA", // owner addresses
        ],
        1 // Required confirmations
    );
    await multisigWallet.waitForDeployment();

    console.log("MultiSigWalletB deployed to:", multisigWallet.target);

  // Deploy StableToken
  const StableTokenFactory = new ethers.ContractFactory(
    StableTokenArtifacts.abi,
    StableTokenArtifacts.bytecode,
    signer
  );
  const stableToken = await StableTokenFactory.deploy();
  await stableToken.waitForDeployment();

  console.log("StableToken deployed to:", stableToken.target);

  // --- Transfer ownership of StableToken to MultiSigWallet ---

  await stableToken.transferOwnership(multisigWallet.target);

  console.log("Ownership of StableToken transferred to MultiSigWalletB");

  // --- Deploy Vault ---

  const TokenVaultFactory = new ethers.ContractFactory(
    TokenVaultArtifacts.abi,
    TokenVaultArtifacts.bytecode,
    signer
  );
  const vault = await TokenVaultFactory.deploy(stableToken.target); // StableToken address
  await vault.waitForDeployment();

  console.log("TokenVault deployed to:", vault.target);

  // --- Grant VAULTOWNER_ROLE to the MultiSigWallet ---

  const VAULTOWNER_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("VAULTOWNER_ROLE")
  );
  await vault.grantRole(VAULTOWNER_ROLE, multisigWallet.target);

  console.log("VAULTOWNER_ROLE granted to MultiSigWalletB");
}

deployContracts();