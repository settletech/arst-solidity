import type * as ethers from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MultiSigWallet, StableToken } from "../../typechain-types";
import { ethers as hhEthers } from "hardhat";

import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

async function deployContractFixture() {
    const users: HardhatEthersSigner[] = await hhEthers.getSigners();
    const MultiSigWalletFactory = await hhEthers.getContractFactory("MultiSigWallet");
    const [user1, user2, user3] = users; // First 3 users of Multisig will be owners
    const defaultMultisig: MultiSigWallet = await MultiSigWalletFactory.deploy([user1.address, user2.address, user3.address], 1) as unknown as MultiSigWallet;
    const multisigContract: ethers.Contract = await hhEthers.getContractAt("MultiSigWallet", await defaultMultisig.getAddress());

    const TokenFactory = await hhEthers.getContractFactory("StableToken");
    const defaultStableToken: StableToken = await TokenFactory.connect(user1).deploy() as unknown as StableToken;
    const tokenContact: ethers.Contract = await hhEthers.getContractAt("StableToken", await defaultStableToken.getAddress());

    return { users, defaultMultisig, defaultStableToken, tokenContact, multisigContract }
}

export async function getScenariosData() {
    return loadFixture(deployContractFixture);
}