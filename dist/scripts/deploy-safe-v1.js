"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDeployerAsOwner = exports.addSafeSigners = exports.deploySafe = void 0;
const safe_master_copy_v1_json_1 = __importDefault(require("../contracts/safe_master_copy_v1.json"));
const safe_proxy_factory_v1_json_1 = __importDefault(require("../contracts/safe_proxy_factory_v1.json"));
const colors_1 = __importDefault(require("colors"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const util_1 = require("../utils/util");
const constants_1 = require("../utils/constants");
async function deploySafe(chainConfig, saltNonce) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const safeMaster = new hardhat_1.ethers.Contract(chainConfig.SAFE_MASTER_COPY_ADDR, safe_master_copy_v1_json_1.default, caller);
    const initializer = await safeMaster.populateTransaction.setup([caller.address], 1, //threshold
    hardhat_1.ethers.constants.AddressZero, "0x", chainConfig.DEFAULT_FALLBACK_HANDLER_ADDRESS, hardhat_1.ethers.constants.AddressZero, 0, hardhat_1.ethers.constants.AddressZero);
    const safeProxyFactory = new hardhat_1.ethers.Contract(chainConfig.SAFE_PROXY_FACTORY_ADDR, safe_proxy_factory_v1_json_1.default, caller);
    const txResponse = await safeProxyFactory.createProxyWithNonce(chainConfig.SAFE_MASTER_COPY_ADDR, initializer.data, saltNonce, {
        gasLimit: constants_1.GAS_LIMIT
    });
    const txReceipt = await txResponse.wait();
    const txData = txReceipt.events?.find((x) => x.event == "ProxyCreation");
    const deployedSafeAddress = txData?.args?.proxy; //?? ethers.constants.AddressZero
    // @todo check calculated safe address
    // check if address is matching predicted address before processing transaction
    if (deployedSafeAddress !== (await (0, util_1.predictSafeAddress)(safeProxyFactory, chainConfig.SAFE_MASTER_COPY_ADDR, initializer.data, saltNonce))) {
        throw new Error(`Safe address deployment unexpected, expected ${await (0, util_1.predictSafeAddress)(safeProxyFactory, chainConfig.SAFE_MASTER_COPY_ADDR, initializer.data, saltNonce)}, actual: ${deployedSafeAddress} `);
    }
    console.info(colors_1.default.green(`✅ Safe was deployed to ${deployedSafeAddress} `));
    return deployedSafeAddress;
}
exports.deploySafe = deploySafe;
// adds signers to a safe (only if they are uniquely new signers)
async function addSafeSigners(safeAddr, newOwners, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const safe = new hardhat_1.ethers.Contract(safeAddr, safe_master_copy_v1_json_1.default, caller);
    //check the owners being added are not already owners
    const currentOwners = await safe.getOwners();
    // Check if any of the new owners are already in the current owners list
    const hasCommonOwner = newOwners.some(newOwner => currentOwners.some(currentOwner => currentOwner.toLowerCase() === newOwner.toLowerCase()));
    if (!hasCommonOwner) {
        //get txs for adding owners
        const addOwnersTxs = await Promise.all(newOwners.map(async (owner) => {
            return await safe.populateTransaction.addOwnerWithThreshold(owner, 1);
        }));
        const metaTxs = (0, util_1.createMultisendTx)(addOwnersTxs, chainConfig.MULTISEND_ADDR);
        const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
        const addSignersTx = await safe.connect(caller).execTransaction(chainConfig.MULTISEND_ADDR, constants_1.tx.zeroValue, metaTxs.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
        const txReceipt = await addSignersTx.wait();
        const txData = txReceipt.events?.filter((x) => x.event === "AddedOwner");
        const ownersAddedFromEvent = txData.map((log) => log.args);
        console.info(`\n🔑 New owners added: ${ownersAddedFromEvent.join(", ")} on Safe: ${safeAddr} `);
    }
    else {
        console.info(`No new owners were added to Safe: ${safeAddr} as at least one owner you tried to add is already an owner on this Safe`);
    }
}
exports.addSafeSigners = addSafeSigners;
;
async function removeDeployerAsOwner(safeAddr, threshold) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const safe = new hardhat_1.ethers.Contract(safeAddr, safe_master_copy_v1_json_1.default, caller);
    const owners = await safe.getOwners();
    const isDeployerStillOwner = owners.some(owner => owner.toLowerCase() === caller.address.toLowerCase());
    if (isDeployerStillOwner) {
        // Find the index of the caller address
        const callerIndex = owners.findIndex(owner => owner === caller.address);
        const prevOwnerIndex = (callerIndex - 1 + owners.length) % owners.length;
        const prevOwner = owners[prevOwnerIndex];
        //now remove deployer as signer and apply the correct threshold
        const removeOwnersPopTx = await safe.populateTransaction.removeOwner(prevOwner, caller.address, threshold);
        const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
        await safe.connect(caller).execTransaction(safeAddr, constants_1.tx.zeroValue, removeOwnersPopTx.data, constants_1.tx.operation, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
        console.info(`\n🔒 Deployer: ${caller.address} was removed as an owner on Safe: ${safeAddr} `);
    }
    else {
        console.info(`Deployer ${caller.address} is not an owner on Safe: ${safeAddr} so we can't remove them as an owner`);
    }
}
exports.removeDeployerAsOwner = removeDeployerAsOwner;
