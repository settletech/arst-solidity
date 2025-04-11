const hre = require('hardhat');
const { ethers, AbiCoder } = require('ethers');
require('dotenv').config();

const {
  RANDOM_STRING
} = process.env;
let salt;

const { abi: tokenABI, bytecode: tokenCreationCode } = require('../artifacts/contracts/StableToken.sol/StableToken.json');
const { abi: multisigABI, bytecode: multisigCreationCode } = require('../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json');
const { abi: vaultABI, bytecode: vaultCreationCode } = require('../artifacts/contracts/TokenVault.sol/TokenVault.json');


async function main() {
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    //Deploy the ContractFactory
    const ContractFactory = await hre.ethers.getContractFactory("ContractFactory", deployer);
    const factory = await ContractFactory.deploy();
    await factory.waitForDeployment();
    console.log("ContractFactory deployed at:", factory.target);

    const abi = new AbiCoder();

    // MultiSig Deployment
    /*
    ETH 0x8cAecf5643F42752D7B67D76944F3dE74e790Db3
    TRON TWnbi4WNkY1nTyeba2qwdQUVFjNbHBEfDk

    Negro 2
    ETH 0x3913C3ef42072f85F843FE96ED3b74b7b52C943F
    TRON TKKQvxwP3TTkvafj1pZdctrV1y1mHTArg7

    Negro 3
    ETH 0xB8Cc6Ea3CEdAf57818649D2b8B6297287c3fccF4
    TRON TGvSeRx1E7gJ6A874TYYBeX58JhvCt2X9h

    Celeste 1
    ETH 0xf4412888e36b454D6262Fbf68050C9246a48Cb92
    TRON TTpxqmERCpCWhrPxG5ekcFw9KRH2iZ3BMi

    Celeste 2
    ETH 0x4281Dcdf131D51BC23b2e8C7CD30829DE130bD7a
    TRON TLASYfePn1cKYzvJsueGFLz5ACQErXXUcM

    Gimer
    0xDa058764580d50AA1cfdae93430583cd4CdFc98a
    0xa623046B3Cb9619BACe903a8c6d7A1c0A6723c53

    Juan Pablo
    0xA84947d52236A17E90E27Ed1f3D9726a763421D9

    Eduardo
    0x5Ed9038803BD73bD85875A1a3149C505be773933
     */
    salt = getSalt(deployer, "MultiSig");
    const params = abi.encode(["address[]","uint256"],
        [
            [
                "0x8cAecf5643F42752D7B67D76944F3dE74e790Db3",
                "0x3913C3ef42072f85F843FE96ED3b74b7b52C943F",
                "0xB8Cc6Ea3CEdAf57818649D2b8B6297287c3fccF4", 
                "0xf4412888e36b454D6262Fbf68050C9246a48Cb92", 
                "0x4281Dcdf131D51BC23b2e8C7CD30829DE130bD7a"
            ], 2
        ]);
    
    const tx = await factory.deployContract(salt, multisigCreationCode, params);
    await tx.wait(1);

    const multiSigAddress = await factory.latestAddress(); 
    const multisig = new ethers.Contract(multiSigAddress, multisigABI, deployer);
    console.log("First MultiSig Owner: ", await multisig.owners(0));
    console.log("Confirmations: ", await multisig.numConfirmationsRequired());

    // Vault Deployment
    salt = getSalt(deployer, "Vault");
    const vaultParams = abi.encode(["address", ], [multiSigAddress]);
    const txVault = await factory.deployContract(salt, vaultCreationCode, vaultParams);
    await txVault.wait(1);

    const vaultAddress = await factory.latestAddress(); 
    const vault = new ethers.Contract(vaultAddress, vaultABI, deployer);

    // Token Deployment
    salt = getSalt(deployer, "StableToken");
    const tokenParams = abi.encode(["address", ], [vaultAddress]);
    const txToken = await factory.deployContract(salt, tokenCreationCode, tokenParams);
    await txToken.wait(1);

    const tokenAddress = await factory.latestAddress(); 
    const token = new ethers.Contract(tokenAddress, tokenABI, deployer);

    // Change Token Ownership
    // const txOwnership = await factory.changeTokenOwnership(tokenAddress, multiSigAddress);
    const txOwnership = await factory.changeTokenOwnership(tokenAddress, deployer.address);
    await txOwnership.wait(1);

    console.log("token Vault: ", await token.custodyVault());
    console.log("token Owner: ", await token.owner());
    
    console.log("- ContractFactory: ", factory.target);
    console.log("- MultiSigWallet: ", multiSigAddress);
    console.log("- TokenVault: ", vaultAddress);
    console.log("- StableToken:", tokenAddress);
}

async function getSalt(_signer, _contractName) {
    const deployerAddress = _signer.address;
    const deployerBytes = ethers.getBytes(deployerAddress).slice(0, 20);
    
    // This value must change on every Token deployment
    const randomString = RANDOM_STRING;
    const randomBytes = ethers.toUtf8Bytes(randomString);
    const contractName = ethers.toUtf8Bytes(_contractName);
    const concatenatedBytes = ethers.concat([deployerBytes, randomBytes, contractName]);
    
    return ethers.keccak256(concatenatedBytes);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
