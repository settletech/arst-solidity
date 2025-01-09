const { TronWeb, utils } = require('tronweb')
import * as MultiSigArtifacts from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import * as StableTokenArtifacts from "../artifacts/contracts/StableToken.sol/StableToken.json";

const fullNode = 'https://api.nileex.io';
const solidityNode = 'https://api.nileex.io';
const eventServer = 'https://api.nileex.io';
const privateKey = 'f3b615ece4a9685acae137774ea23b0534a35c7ee49dba3df805637d4a8ba9d6'; // TK1pZJhv9nQzcQauyYLWSJ23FjhZxmYPsz

const main = async () => {
    console.log(TronWeb.address.toHex('TU8bY3WLhL3xgfLDhuyPbaGLiDNAioEufe'));
    // const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    // const stableTokenAddress = 'TASKDzAvvhNBtaxGGdB1fgXPNeRgPr96eE';
    // const stableToken = await tronWeb.contract(StableTokenArtifacts.abi, stableTokenAddress);
    // const recipientAddress = "TU8bY3WLhL3xgfLDhuyPbaGLiDNAioEufe"; // JP
    // const amountToMint = 1_000_000;
    // const amountToMintWithDecimals = TronWeb
    //     .toBigNumber(amountToMint)
    //     .multipliedBy(10 ** 18);
    // const dataMint = stableToken.mint(recipientAddress, amountToMint);
    // const dataMint = utils.abi.encodeParamsV2ByABI(StableTokenArtifacts.abi.find(e => e.name === 'mint'), [recipientAddress, amountToMint]);
    // console.log(dataMint);
}

main().then(() => console.log('Executed!'));