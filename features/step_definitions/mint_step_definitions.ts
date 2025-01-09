import * as assert from 'assert';
import { Before, Then, When } from "@cucumber/cucumber";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MultiSigWallet, StableToken } from "../../typechain-types";
import { getScenariosData } from "./common";
import { BytesLike, Contract, EventLog, isError } from 'ethers';

let users: HardhatEthersSigner[] = [];
let defaultStableToken: StableToken;
let defaultMultisig: MultiSigWallet;
let tokenContract: Contract
let multisigContract: Contract

Before(async () => {
    const { 
        defaultStableToken: dst, 
        defaultMultisig: dm, 
        users: us,
        tokenContact: tc,
        multisigContract: mc
    } = await getScenariosData();

    users = us;
    defaultStableToken = dst!;
    defaultMultisig = dm!;
    tokenContract = tc!
    multisigContract = mc!
})

When('I call submitTransaction with the address of the ARST token, value {int} and data encoded correctly as EVM protocol defines', async function (intValue) {
    const stableTokenAddr = await defaultStableToken.getAddress();
    const tokenReceiverAddr = users[1].address;
    const abiEncodedData = defaultStableToken.interface
        .encodeFunctionData("mint", [tokenReceiverAddr, 100]);
    await (await defaultMultisig.submitTransaction(stableTokenAddr, intValue, abiEncodedData)).wait();
    this.events = await multisigContract.queryFilter("SubmitTransaction", -1);
});

Then('the transaction should be queued', async function () {
    const transactionCount = await defaultMultisig.getTransactionCount();
    assert.equal(transactionCount, 1);
});

Then('an event SubmitTransaction should be emitted', function () {
    assert.equal(this.events.length, 1);
    const [ event ] = this.events as EventLog[];
    assert.equal(event.fragment.name, 'SubmitTransaction');
});

When('I call function mint in StableToken with receiver address and amount', async function () {
    // Defines a function that calls the contract function that will revert
    // to execute later in the "Then" step in order to assert the error
    this.fnWillRevert = async () => {
        await defaultStableToken.connect(users[0]).mint(users[1].address, 100);
    }
});

Then('the transaction should revert', async function () {
    await assert.rejects(
        this.fnWillRevert(),
        (err) => {
            const decodedError = tokenContract.interface.parseError((err as any).data as BytesLike);
            if (
                decodedError?.name === 'OwnableUnauthorizedAccount'
                && decodedError.args.includes(users[0].address)
            ) {
                return true
            }
            return false;
        },
    );   
});