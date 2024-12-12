const { TronWeb } = require('tronweb')
import * as artifacts from '../artifacts/contracts/StableToken.sol/StableToken.json'; 

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const privateKey = ''; // TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
const contractAddress = 'TNEgSFnihm7ksLzT1L8og4rAPgPTXJq4oT';
const myAddress = tronWeb.address.fromPrivateKey(privateKey); 

async function interactWithContract() {
  const contract = await tronWeb.contract(artifacts.abi, contractAddress);
  try {
    // // 1. Get Token Details
    // const name = await contract.name().call();
    // const symbol = await contract.symbol().call();
    // const totalSupply = await contract.totalSupply().call();
    // console.log('Name:', name);
    // console.log('Symbol:', symbol);
    // console.log('Total Supply:', totalSupply.toString());

    // // 2. Mint Tokens (only if the account has the MINTER_ROLE)
    // const amountToMint = 1000000000;
    // const amountToMintWithDecimals = tronWeb.toBigNumber(amountToMint).multipliedBy(10 ** 18); // Multiply by 10^18
    // console.log("Minting amount:", amountToMintWithDecimals.toString());
    // await contract.mint(myAddress, amountToMint).send({
    //     feeLimit: 10000000000,
    //   shouldPollResponse: true, // Poll for transaction confirmation
    // });
    // console.log(`Minted ${amountToMint} tokens`);

    // 3. Transfer Tokens
    const recipientAddress = 'TKSBtpcknEYtocLhYNE6jG62xqHwvFs6gc'; // Gimer
    // const recipientAddress = 'TU8bY3WLhL3xgfLDhuyPbaGLiDNAioEufe'; // JP
    const amountToTransfer = 100;

    const myBalance = await contract.balanceOf(myAddress).call(); 
    console.log("My balance:", myBalance.toString());

    const amountToTransferWithDecimals = tronWeb.toBigNumber(amountToTransfer).multipliedBy(10 ** 18);

    await contract.transfer(recipientAddress, amountToTransfer).send({
      feeLimit: 1000000000,
      shouldPollResponse: true,
    });
    console.log(`Transferred ${amountToTransfer} tokens to ${recipientAddress}`);

    // // 4. Burn Tokens
    // const amountToBurn = 200;
    // await contract.burn(myAddress, amountToBurn).send({
    //   feeLimit: 1000000000,
    //   shouldPollResponse: true,
    // });
    // console.log(`Burned ${amountToBurn} tokens`);

    // // 5. Pause and Unpause (only owner)
    // await contract.pause().send({
    //   feeLimit: 1000000000,
    //   shouldPollResponse: true,
    // });
    // console.log('Contract paused');

    // await contract.unpause().send({
    //   feeLimit: 1000000000,
    //   shouldPollResponse: true,
    // });
    // console.log('Contract unpaused');

    // // 6. Add Minter (only owner)
    // const newMinterAddress = 'TKSBtpcknEYtocLhYNE6jG62xqHwvFs6gc'; 
    // await contract.addMinter(newMinterAddress).send({
    //   feeLimit: 1000000000,
    //   shouldPollResponse: true,
    // });
    // console.log(`Added ${newMinterAddress} as a minter`);

    // // 7. Transfer Ownership (only owner)
    // const newOwnerAddress = 'NEW_OWNER_ADDRESS';
    // await contract.transferOwnership(newOwnerAddress).send({
    //   feeLimit: 1000000000,
    //   shouldPollResponse: true,
    // });
    // console.log(`Transferred ownership to ${newOwnerAddress}`);

  } catch (error) {
    console.error('Error interacting with contract:', error);
  }
}

interactWithContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });