const { ethers } = require("hardhat");

async function main() {
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    //Deploy the ContractFactory
    const ContractFactory = await ethers.getContractFactory("ContractFactory");
    const factory = await ContractFactory.deploy();
    await factory.waitForDeployment();
    console.log("ContractFactory deployed at:", factory.target);

    // Parameters for MultiSigWallet
    const owners = [
        "0x8cAecf5643F42752D7B67D76944F3dE74e790Db3", // Negro
        "0xf4412888e36b454D6262Fbf68050C9246a48Cb92"  // Celeste
    ];
    const numConfirmationsRequired = 1;
    const multiSigSalt = ethers.keccak256(ethers.toUtf8Bytes("multiSigSalt")); // Unique salt for MultiSigWallet

    // Compute and deploy MultiSigWallet
    const computedMultiSigAddress = await factory.computeMultiSigWalletAddress(
        multiSigSalt,
        owners,
        numConfirmationsRequired
    );
    console.log("Computed MultiSigWallet address:", computedMultiSigAddress);

    await factory.deployMultiSigWallet(multiSigSalt, owners, numConfirmationsRequired);
    console.log("MultiSigWallet deployed at:", computedMultiSigAddress);

    // Parameters for TokenVault
    const vaultSalt = ethers.keccak256(ethers.toUtf8Bytes("vaultSalt")); // Unique salt for TokenVault
    const computedVaultAddress = await factory.computeVaultAddress(vaultSalt, computedMultiSigAddress);
    console.log("Computed TokenVault address:", computedVaultAddress);

    await factory.deployVault(vaultSalt, computedMultiSigAddress);
    console.log("TokenVault deployed at:", computedVaultAddress);

    // Parameters for StableToken
    const tokenSalt = ethers.keccak256(ethers.toUtf8Bytes("tokenSalt")); // Unique salt for StableToken
    const computedTokenAddress = await factory.computeTokenAddress(tokenSalt, computedVaultAddress);
    console.log("Computed StableToken address:", computedTokenAddress);

    await factory.deployToken(tokenSalt, computedVaultAddress);
    console.log("StableToken deployed at:", computedTokenAddress);


    console.log("\nDeployment Summary:");
    console.log("- ContractFactory:", factory.address);
    console.log("- MultiSigWallet:", computedMultiSigAddress);
    console.log("- TokenVault:", computedVaultAddress);
    console.log("- StableToken:", computedTokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
