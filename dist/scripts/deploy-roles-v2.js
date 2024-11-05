"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployAccessControlSystemV2 = exports.assignRoles = exports.setRolesUnwrapper = exports.setRolesMultisend = exports.enableRolesModifier = exports.deployRolesV2 = void 0;
const safe_master_copy_v2_json_1 = __importDefault(require("../contracts/safe_master_copy_v2.json"));
const roles_v2_json_1 = __importDefault(require("../contracts/roles_v2.json"));
const util_1 = require("../utils/util");
const colors_1 = __importDefault(require("colors"));
const deploy_safe_v2_1 = require("./deploy-safe-v2");
// @ts-ignore
const hardhat_1 = require("hardhat");
const EIP2470_1 = require("./EIP2470");
const constants_1 = require("../utils/constants");
const roles_chain_config_1 = require("../utils/roles-chain-config");
const scope_access_controller_v2_1 = require("../whitelist/acs/scope-access-controller-v2");
const zodiac_1 = require("@gnosis-guild/zodiac");
//@dev note that hardhat struggles with nested contracts. When we call a Safe to interact with Roles, only events from the Safe can be detected.
const ZeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const SaltZero = "0x0000000000000000000000000000000000000000000000000000000000000000";
async function deployRolesV2(owner, avatar, target, proxied, chainId, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    if (proxied) {
        // const abiCoder = ethers.utils.defaultAbiCoder;
        // const encoded = abiCoder.encode(
        //   ["address", "address", "address"],
        //   [owner, avatar, target],
        // );
        const { expectedModuleAddress, transaction } = await (0, zodiac_1.deployAndSetUpModule)(zodiac_1.KnownContracts.ROLES_V2, {
            types: ["address", "address", "address"],
            values: [owner, avatar, target],
        }, caller.provider, chainId, util_1.SALT);
        const predictedRolesAddress = await (0, util_1.predictRolesModAddress)(caller, owner, avatar, target, "v2");
        console.log(`prediected roles address: ${predictedRolesAddress}`);
        // check if address is matching predicted address before processing transaction
        if (expectedModuleAddress !== predictedRolesAddress) {
            throw new Error(`Roles mod address deployment unexpected, expected ${util_1.predictRolesModAddress}, actual: ${expectedModuleAddress}`);
        }
        // const rolesMaster = new ethers.Contract(
        //   chainConfig.ROLES_MASTER_COPY_ADDR,
        //   ROLES_V2_MASTER_COPY_ABI,
        //   caller,
        // );
        // const initParams = await rolesMaster.populateTransaction.setUp(encoded);
        // const tsSalt = new Date().getTime();
        // const safeModuleProxyFactory = new ethers.Contract(
        //   chainConfig.SAFE_MODULE_PROXY_FACTORY_ADDR,
        //   SAFE_MODULE_PROXY_FACTORY_ABI,
        //   caller,
        // );
        // const deployModTx = await safeModuleProxyFactory.deployModule(
        //   chainConfig.ROLES_MASTER_COPY_ADDR,
        //   initParams.data as string,
        //   tsSalt,
        // );
        // const txReceipt = await deployModTx.wait();
        // const txData = txReceipt.events?.find(
        //   (x: any) => x.event == "ModuleProxyCreation",
        // );
        // const rolesModAddress = txData?.args?.proxy;
        // console.info(
        //   colors.green(
        //     `✅ Roles was deployed via proxy factory to ${rolesModAddress}`,
        //   ),
        // );
        // return rolesModAddress;
        try {
            await caller.sendTransaction(transaction);
            console.info(colors_1.default.green(`✅ Roles was deployed via proxy factory to ${expectedModuleAddress}`));
            return expectedModuleAddress;
        }
        catch (e) {
            console.error(e);
            throw new Error(`Roles mod address deployment failed: ${e}`);
        }
    }
    //   const Permissions = await ethers.getContractFactory("Permissions");
    //   const permissions = await Permissions.deploy();
    const salt = ZeroHash;
    const Packer = await hardhat_1.ethers.getContractFactory("Packer");
    const packerLibraryAddress = await (0, EIP2470_1.deployViaFactory)(Packer.bytecode, salt, caller, "Packer");
    const Integrity = await hardhat_1.ethers.getContractFactory("Integrity");
    const integrityLibraryAddress = await (0, EIP2470_1.deployViaFactory)(Integrity.bytecode, salt, caller, "Integrity");
    const Roles = await hardhat_1.ethers.getContractFactory("Roles", {
        libraries: {
            Integrity: integrityLibraryAddress,
            Packer: packerLibraryAddress,
        },
    });
    const roles = await Roles.deploy(owner, avatar, target);
    await roles.connect(caller).deployed();
    //  const rolesAddress = await deployRolesV2(owner, avatar, target, proxied);
    console.info("Modifier deployed to:", roles.address, "\n");
    return roles.address;
}
exports.deployRolesV2 = deployRolesV2;
//If the roles module is not already enabled on Safe, enable it
async function enableRolesModifier(safeAddr, rolesAddr) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
    //investment safe
    const invSafe = new hardhat_1.ethers.Contract(safeAddr, safe_master_copy_v2_json_1.default, caller);
    const enabled = await invSafe.isModuleEnabled(rolesAddr);
    if (!enabled) {
        const enable = await invSafe.populateTransaction.enableModule(rolesAddr);
        const enableTx = await invSafe.execTransaction(safeAddr, constants_1.tx.zeroValue, enable.data ?? "", constants_1.tx.operation, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
        const txReceipt = await enableTx.wait();
        const txData = txReceipt.events?.find((x) => x.event == "EnabledModule");
        const moduleEnabledFromEvent = txData?.args?.module;
        console.info(colors_1.default.blue(`ℹ️  Roles modifier: ${moduleEnabledFromEvent} has been enabled on safe: ${safeAddr}`));
    }
    else {
        console.info(`Roles modifier: ${rolesAddr} was already enabled on safe: ${safeAddr}`);
    }
}
exports.enableRolesModifier = enableRolesModifier;
// sets the address of the multisend contract
async function setRolesMultisend(safeAddr, rolesAddr, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const roles = new hardhat_1.ethers.Contract(rolesAddr, roles_v2_json_1.default, caller);
    const multisendOnRecord = await roles.multisend();
    //If no MS on record, submit a tx to write one on record
    if (multisendOnRecord === hardhat_1.ethers.constants.AddressZero) {
        const setMsPopTx = await roles.populateTransaction.setMultisend(chainConfig.MULTISEND_ADDR);
        const safe = new hardhat_1.ethers.Contract(safeAddr, safe_master_copy_v2_json_1.default, caller);
        const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
        await safe.execTransaction(rolesAddr, constants_1.tx.zeroValue, setMsPopTx.data, constants_1.tx.operation, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
        console.info(colors_1.default.blue(`ℹ️  Multisend has been set to: ${chainConfig.MULTISEND_ADDR}`));
    }
    else {
        console.info(`Multisend has already been previously set to: ${multisendOnRecord}`);
    }
}
exports.setRolesMultisend = setRolesMultisend;
async function setRolesUnwrapper(safeAddr, rolesAddr, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const roles = new hardhat_1.ethers.Contract(rolesAddr, roles_v2_json_1.default, caller);
    const setMsPopTx = await roles.populateTransaction.setTransactionUnwrapper(chainConfig.MULTISEND_ADDR, chainConfig.MULTISEND_SELECTOR, chainConfig.DEFAULT_UNWRAPPER_ADDR);
    const safe = new hardhat_1.ethers.Contract(safeAddr, safe_master_copy_v2_json_1.default, caller);
    const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
    await safe.execTransaction(rolesAddr, constants_1.tx.zeroValue, setMsPopTx.data, constants_1.tx.operation, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
    console.info(colors_1.default.blue(`ℹ️  Multisend has been set to: ${chainConfig.MULTISEND_ADDR}`));
    // return { adapter };
}
exports.setRolesUnwrapper = setRolesUnwrapper;
// assign a role to a array of members addresses attached to a role id policy
async function assignRoles(safeAddr, rolesAddr, memberAddrs, roleId, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    // assign manager a role (becomes a member of role:manager_role_id)
    const roles = new hardhat_1.ethers.Contract(rolesAddr, roles_v2_json_1.default, caller);
    const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
    const acSafe = new hardhat_1.ethers.Contract(safeAddr, safe_master_copy_v2_json_1.default, caller);
    const assignRolesPopTx = await Promise.all(memberAddrs.map(async (memberAddr) => {
        return await roles.populateTransaction.assignRoles(memberAddr, [roleId], [true]);
    }));
    const metaTxs = (0, util_1.createMultisendTx)(assignRolesPopTx, chainConfig.MULTISEND_ADDR);
    await acSafe.execTransaction(chainConfig.MULTISEND_ADDR, constants_1.tx.zeroValue, metaTxs.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
    console.info(colors_1.default.blue(`Role member: ${memberAddrs.toString()} has been assigned role id: ${roleId} (default)`));
}
exports.assignRoles = assignRoles;
// this will deploy the entire system from scratch, WITHOUT any investment manager permissions
const deployAccessControlSystemV2 = async (chainId, options, deployed) => {
    // get chain config for multichain deploy
    const chainConfig = (0, roles_chain_config_1.getChainConfig)(chainId, "v2");
    //Deploy both safes
    const accessControlSafeAddr = deployed?.acSafeAddr || (await (0, deploy_safe_v2_1.deploySafeV2)(chainConfig, constants_1.SALTS.safes.accessControl));
    const investmentSafeAddr = deployed?.invSafeAddr || (await (0, deploy_safe_v2_1.deploySafeV2)(chainConfig, constants_1.SALTS.safes.investment));
    // //Deploy and enable a Roles modifier on the investment safe
    const invRolesAddr = deployed?.invRolesAddr ||
        (await deployRolesV2(accessControlSafeAddr, investmentSafeAddr, investmentSafeAddr, options.proxied, chainId, chainConfig));
    await enableRolesModifier(investmentSafeAddr, invRolesAddr);
    //Set the multisend address on roles so that manager can send multisend txs later on
    // await setRolesMultisend(accessControlSafeAddr, invRolesAddr);
    await setRolesUnwrapper(accessControlSafeAddr, invRolesAddr, chainConfig);
    //Deploy and enable a Roles modifier on the access control safe
    const acRolesAddr = deployed?.acRolesAddr ||
        (await deployRolesV2(accessControlSafeAddr, accessControlSafeAddr, accessControlSafeAddr, options.proxied, chainId, chainConfig));
    await enableRolesModifier(accessControlSafeAddr, acRolesAddr);
    // //Set the multisend address on roles so that manager can send multisend txs later on
    // await setRolesMultisend(accessControlSafeAddr, acRolesAddr);
    await setRolesUnwrapper(accessControlSafeAddr, acRolesAddr, chainConfig);
    //Grant an access controller role to Security EOA's
    await assignRoles(accessControlSafeAddr, acRolesAddr, options.securityEOAs, constants_1.SECURITY_ROLE_ID_V2, chainConfig);
    // Populate this role for Security so they can call whitelisting related functions on investment roles
    const [caller] = await hardhat_1.ethers.getSigners();
    const accessControllerWhitelist = new scope_access_controller_v2_1.AccessControllerWhitelistV2(acRolesAddr, caller);
    await accessControllerWhitelist.execute(invRolesAddr, accessControlSafeAddr);
    //Grant a role to the investment managers EOAs
    //the idea would be that each strategy would be transacted on by 1 EOA
    await assignRoles(accessControlSafeAddr, invRolesAddr, options.managerEOAs, constants_1.MANAGER_ROLE_ID_V2, chainConfig);
    // // Add signers
    await (0, deploy_safe_v2_1.addSafeSigners)(investmentSafeAddr, options.sysAdminAddresses, chainConfig);
    await (0, deploy_safe_v2_1.addSafeSigners)(accessControlSafeAddr, options.sysAdminAddresses, chainConfig);
    // //Remove the deployer address as owner and rewrite signing threshold
    // await removeDeployerAsOwner(investmentSafeAddr, 0);
    // await removeDeployerAsOwner(accessControlSafeAddr, 0);
    return {
        acSafe: accessControlSafeAddr,
        invSafe: investmentSafeAddr,
        invRoles: invRolesAddr,
        acRoles: acRolesAddr,
    };
};
exports.deployAccessControlSystemV2 = deployAccessControlSystemV2;
