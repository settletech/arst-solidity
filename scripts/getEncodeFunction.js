const hre = require('hardhat');
const { ethers, AbiCoder } = require('ethers');
require('dotenv').config();

const {
  RANDOM_STRING,
  PRIVATE_KEY,
  SEPOLIA_RPC_URL
} = process.env;
let salt;

const TEN_ETHER = ethers.parseEther("10");
const VAULT_TRANSFER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VAULT_TRANSFER_ROLE"));
/*
[
    "0x8cAecf5643F42752D7B67D76944F3dE74e790Db3",
    "0x3913C3ef42072f85F843FE96ED3b74b7b52C943F",
    "0xB8Cc6Ea3CEdAf57818649D2b8B6297287c3fccF4", 
    "0xf4412888e36b454D6262Fbf68050C9246a48Cb92", 
    "0x4281Dcdf131D51BC23b2e8C7CD30829DE130bD7a", 
    "0xDa058764580d50AA1cfdae93430583cd4CdFc98a", 
    "0x37830533FDD0ED0C389BFB10D37FBC08F4A39601",
    "0x5Ed9038803BD73bD85875A1a3149C505be773933"
] 
*/


async function main() {
    const ABI = ["function grantRole(bytes32 role, address account)"];
    const valueHex = new ethers.Interface(ABI);
    const functionData = valueHex.encodeFunctionData(
        "grantRole", [VAULT_TRANSFER_ROLE, "0xDa058764580d50AA1cfdae93430583cd4CdFc98a"]
    );

    console.log("VAULT_TRANSFER_ROLE: ", VAULT_TRANSFER_ROLE);
    console.log("\nfunction Data: ", functionData);

    const vaultAddress = "0x45AEf39988F63F928d56884045708B84e2707577";
    const mintABI = ["function mint(address to, uint256 amount)"];
    const valueHexMint = new ethers.Interface(mintABI);
    const mintData = valueHexMint.encodeFunctionData("mint", [vaultAddress, TEN_ETHER]);

    console.log("\nmintData", mintData)

    // Adding Owner
    const ownerABI = ["function addOwner(address _owner)"];

    const valueHexOwner = new ethers.Interface(ownerABI);
    const addOwnerData = valueHexOwner.encodeFunctionData("addOwner", [
        "0xA84947d52236A17E90E27Ed1f3D9726a763421D9"
    ]);

    console.log("\naddOwnerData", addOwnerData)

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
