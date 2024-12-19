const { TronWeb } = require('tronweb')
import * as artifacts from '../artifacts/contracts/TestToken.sol/TestToken.json';

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const privateKey = ''; // TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
const contractAddress = 'TWep3C2CDHqtVFSLnGQ4Eiy4S3fg8awdoi';
async function getTokenDetails() {
  try {
    const contract = await tronWeb.contract().at(contractAddress);
    const decimals = await contract.decimals().call();
    const name = await contract.name().call();
    const symbol = await contract.symbol().call();
    const totalSupply = await contract.totalSupply().call();
    console.log('Decimals:', decimals.toString());
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Total Supply:', tronWeb.toBigNumber(totalSupply).toString());
  } catch (error) {
    console.error('Error fetching token details:', error);
  }
}
getTokenDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });