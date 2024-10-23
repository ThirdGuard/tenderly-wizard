"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDeployAddress = exports.deployViaFactory = void 0;
const assert_1 = __importDefault(require("assert"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const GAS_LIMIT_FACTOR = {
    42161: 15,
};
async function deployViaFactory(initCode, salt, deployer, displayName, gasLimit = 10000000) {
    await maybeDeployFactory(deployer);
    const provider = deployer.provider;
    (0, assert_1.default)(provider);
    const { chainId } = await provider.getNetwork();
    const gasLimitFactor = GAS_LIMIT_FACTOR[chainId] || 1;
    const factory = new ethers_1.Contract(factoryInfo.address, [
        "function deploy(bytes memory _initCode, bytes32 _salt) public returns (address payable createdContract)",
    ], deployer);
    const computedAddress = (0, exports.calculateDeployAddress)(initCode, salt);
    if ((await provider.getCode(computedAddress)) != "0x") {
        console.log(`✔ ${displayName || "Singleton"} already deployed to: ${computedAddress}`);
        return computedAddress;
    }
    const receipt = await (await factory.deploy(initCode, salt, {
        gasLimit: gasLimit * gasLimitFactor,
    })).wait();
    if ((receipt === null || receipt === void 0 ? void 0 : receipt.status) == 1) {
        console.log(`\x1B[32m✔ ${displayName || "Singleton"} deployed to: ${computedAddress} 🎉\x1B[0m `);
    }
    else {
        console.log(`\x1B[31m✘ ${displayName || "Singleton"} deployment failed.\x1B[0m`);
    }
    return computedAddress;
}
exports.deployViaFactory = deployViaFactory;
const calculateDeployAddress = (initCode, salt) => {
    return (0, utils_1.getCreate2Address)(factoryInfo.address, salt, (0, utils_1.keccak256)(initCode));
};
exports.calculateDeployAddress = calculateDeployAddress;
const factoryInfo = {
    address: "0xce0042b868300000d44a59004da54a005ffdcf9f",
    deployer: "0xBb6e024b9cFFACB947A71991E386681B1Cd1477D",
    transaction: "0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470",
};
/**
 * If it is not deployed on the network, deploys the singleton factory contract
 *
 * https://eips.ethereum.org/EIPS/eip-2470
 */
async function maybeDeployFactory(signer) {
    const { provider } = signer;
    (0, assert_1.default)(provider);
    // check if singleton factory is deployed.
    if ((await provider.getCode(factoryInfo.address)) === "0x") {
        // fund the singleton factory deployer account
        await signer.sendTransaction({
            to: factoryInfo.deployer,
            value: (0, utils_1.parseEther)("0.0247"),
        });
        // deploy the singleton factory
        const receipt = await (await provider.sendTransaction(factoryInfo.transaction)).wait();
        if ((receipt === null || receipt === void 0 ? void 0 : receipt.status) != 1) {
            throw Error("EIP2470 SingletonFactory could not be deployed to correct address, deployment haulted.");
        }
    }
}
