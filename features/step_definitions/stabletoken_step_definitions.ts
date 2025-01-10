import { strict as assert } from 'assert';
import { Before, BeforeStep, Given, Then, When } from '@cucumber/cucumber';
import { getScenariosData } from './common';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { MultiSigWallet, StableToken } from '../../typechain-types';

let users: HardhatEthersSigner[] = [];
let defaultStableToken: StableToken;
let defaultMultisig: MultiSigWallet;

Before(async () => {
    const { defaultStableToken: dst, defaultMultisig: dm, users: us } = await getScenariosData();
    users = us;
    defaultStableToken = dst!;
    defaultMultisig = dm!;
})

Given('I deployed the Token contract', function () {
    this.tokenOwner = users[0];
});

Given('I transfered the ownership to the Multisig', async function () {
    await defaultStableToken.connect(this.tokenOwner)
        .transferOwnership(await defaultMultisig.getAddress())
});

When('I call owner public view in Token contract', async function () {
    this.stableTokenOwner = await defaultStableToken!.owner();
});

Then('I should see my address as contract owner', function () {
    assert.equal(users[0].address, this.stableTokenOwner);
});

Then('I should see the address of the Multisig contract as contract owner', async function () {
    const multisigAddr = await defaultMultisig.getAddress();
    const tokenOwnerAddr = await defaultStableToken.owner();
    assert.equal(multisigAddr, tokenOwnerAddr);
});

Then('I should NOT see my address as contract owner', async function () {
    const tokenOwnerAddr = await defaultStableToken.owner()
    const oldOwnerAddr = this.tokenOwner;
    assert.notEqual(tokenOwnerAddr, oldOwnerAddr);
});