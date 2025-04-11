import { task } from "hardhat/config";
import { utils } from "tronweb";

task(
  "TronWalletFormatter",
  "Convert Base58 wallet address from Tron to Ethereum format"
)
  .addPositionalParam("tronAddress")
  .setAction(async ({ tronAddress }) => {
    if (!utils.crypto.isAddressValid(tronAddress)) {
      return console.log("Invalid Tron address");
    }

    console.log(utils.address.toHex(tronAddress));
  });

task(
  "HexWalletFormatter",
  "Convert Hex format wallet address from Ethereum to Tron format (Base58)"
)
  .addPositionalParam("hexAddress")
  .setAction(async ({ hexAddress }) => {
    if (!utils.isHex(hexAddress)) {
      return console.log("Invalid Hex address");
    }

    console.log(utils.address.fromHex(hexAddress));
  });
