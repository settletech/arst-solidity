# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

# Generate Solidity Json files.
First, install the plugin into your existing hardhat repository using:

```shell
npm install --save-dev @xyrusworx/hardhat-solidity-json
```

To use it, simply extend your hardhat.config.ts (or js) like this:

```shell
// Typescript
import "@xyrusworx/hardhat-solidity-json";

// JavaScript
require("@xyrusworx/hardhat-solidity-json")
```

Then you may run:

```shell
npx hardhat solidity-json
```

This will generate in the artifacts folder files like:

```shell
artifacts/solidity-json/contracts/MyContract.sol.json
```
