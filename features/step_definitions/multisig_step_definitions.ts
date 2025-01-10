import { strict as assert } from 'assert';
import { Given, When, Then, BeforeStep, Before } from "@cucumber/cucumber";
import { MultiSigWallet } from '../../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { getScenariosData } from './common';

let defaultMultisig: MultiSigWallet;
let users: HardhatEthersSigner[];
let multisigOwners: HardhatEthersSigner[];

Before(async () => {
    const { defaultMultisig: dm, users: us, multisigOwners: mo } = await getScenariosData();
    users = us;
    defaultMultisig = dm!;
    multisigOwners = mo;
})

Given("I am Tron User", async function () {
    this.user = users[0];
})

When("I call getOwners function in Multisig", async function () {
    this.owners = await defaultMultisig.getOwners();
})

Then("I should get the complete list of owners of the MultiSig contract", async function () {
    // Default Multisig deployed has 3 owners
    assert.equal(this.owners.length, 3);
})

Given("I am Owner of Multisig contract", async function() {
    this.user = multisigOwners[0];
})

Then("I should see my account as one of the owners of the contract", async function() {
    let ownersAddresses: string[] = this.owners;
    let ownerToFind: HardhatEthersSigner = this.user;
    const foundOwnerAddress = ownersAddresses.find((o) => o == ownerToFind.address);
    assert.equal(ownerToFind.address, foundOwnerAddress);
})