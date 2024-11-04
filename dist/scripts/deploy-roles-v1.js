"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployAccessControlSystemV1 = exports.assignRoles = exports.setRolesMultisend = exports.enableRolesModifier = exports.deployRoles = void 0;
const safe_master_copy_v1_json_1 = __importDefault(require("../contracts/safe_master_copy_v1.json"));
const roles_v1_json_1 = __importDefault(require("../contracts/roles_v1.json"));
const scope_access_controller_v1_1 = require("../whitelist/acs/scope-access-controller-v1");
const colors_1 = __importDefault(require("colors"));
const deploy_safe_v1_1 = require("./deploy-safe-v1");
const constants_1 = require("../utils/constants");
// @ts-ignore
const hardhat_1 = require("hardhat");
const util_1 = require("../utils/util");
const roles_chain_config_1 = require("../utils/roles-chain-config");
const ethers_1 = require("ethers");
const zodiac_1 = require("@gnosis-guild/zodiac");
//@dev note that hardhat struggles with nested contracts. When we call a Safe to interact with Roles, only events from the Safe can be detected.
async function deployRoles(owner, avatar, target, proxied, chainId, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    if (proxied) {
        // const abiCoder = utils.defaultAbiCoder;
        // const encoded = abiCoder.encode(
        //   ["address", "address", "address"],
        //   [owner, avatar, target]
        // );
        // console.log("owner:", owner);
        // console.log("avatar:", avatar);
        // console.log("target:", target);
        // get expected Module Address and transaction
        const { expectedModuleAddress, transaction } = await (0, zodiac_1.deployAndSetUpModule)(zodiac_1.KnownContracts.ROLES_V1, {
            types: ["address", "address", "address"],
            values: [owner, avatar, target],
        }, caller.provider, chainId, util_1.SALT);
        const adx = await (0, util_1.predictRolesModAddress)(caller, owner, avatar, target);
        console.log(`prediected roles address: ${adx}`);
        // check if address is matching predicted address before processing transaction
        if (expectedModuleAddress !== (await (0, util_1.predictRolesModAddress)(caller, owner, avatar, target))) {
            throw new Error(`Roles mod address deployment unexpected, expected ${(0, util_1.predictRolesModAddress)(caller, owner, avatar, target)}, actual: ${expectedModuleAddress}`);
        }
        // const rolesMaster = new Contract(
        //   chainConfig.ROLES_MASTER_COPY_ADDR,
        //   ROLES_V1_MASTER_COPY_ABI,
        //   caller
        // );
        // const initParams = await rolesMaster.populateTransaction.setUp(encoded);
        // const tsSalt = new Date().getTime(); // salt must be the same
        // const safeModuleProxyFactory = new Contract(
        //   chainConfig.SAFE_MODULE_PROXY_FACTORY_ADDR,
        //   SAFE_MODULE_PROXY_FACTORY_ABI,
        //   caller
        // );
        // const deployModTx = await safeModuleProxyFactory.deployModule(
        //   chainConfig.ROLES_MASTER_COPY_ADDR,
        //   initParams.data as string,
        //   tsSalt
        // );
        // const txReceipt = await deployModTx.wait();
        // const txData = txReceipt.events?.find(
        //   (x: any) => x.event == "ModuleProxyCreation"
        // );
        // const rolesModAddress = txData?.args?.proxy;
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
    const Permissions = await hardhat_1.ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy();
    const Roles = await hardhat_1.ethers.getContractFactory("Roles", {
        libraries: {
            Permissions: permissions.address,
        },
    });
    const roles = await Roles.deploy(owner, avatar, target);
    console.info("Modifier deployed to:", roles.address, "\n");
    return roles.address;
}
exports.deployRoles = deployRoles;
//If the roles module is not already enabled on Safe, enable it
async function enableRolesModifier(safeAddr, rolesAddr) {
    const [caller] = await hardhat_1.ethers.getSigners();
    const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
    const invSafe = new ethers_1.Contract(safeAddr, safe_master_copy_v1_json_1.default, caller);
    const enabled = await invSafe.isModuleEnabled(rolesAddr);
    console.log(`ℹ️  Roles modifier: ${rolesAddr} is enabled on safe: ${safeAddr} ${enabled}`);
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
    const roles = new ethers_1.Contract(rolesAddr, roles_v1_json_1.default, caller);
    const multisendOnRecord = await roles.multisend();
    //If no MS on record, submit a tx to write one on record
    if (multisendOnRecord === ethers_1.constants.AddressZero) {
        const setMsPopTx = await roles.populateTransaction.setMultisend(chainConfig.MULTISEND_ADDR);
        const safe = new ethers_1.Contract(safeAddr, safe_master_copy_v1_json_1.default, caller);
        const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
        await safe.execTransaction(rolesAddr, constants_1.tx.zeroValue, setMsPopTx.data, constants_1.tx.operation, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
        console.info(colors_1.default.blue(`ℹ️  Multisend has been set to: ${chainConfig.MULTISEND_ADDR}`));
    }
    else {
        console.info(`Multisend has already been previously set to: ${multisendOnRecord}`);
    }
}
exports.setRolesMultisend = setRolesMultisend;
// assign a role to a array of members addresses attached to a role id policy
async function assignRoles(safeAddr, rolesAddr, memberAddrs, roleId, chainConfig) {
    const [caller] = await hardhat_1.ethers.getSigners();
    // assign manager a role (becomes a member of role:manager_role_id)
    const roles = new ethers_1.Contract(rolesAddr, roles_v1_json_1.default, caller);
    const signature = (0, util_1.getPreValidatedSignatures)(caller.address);
    const acSafe = new ethers_1.Contract(safeAddr, safe_master_copy_v1_json_1.default, caller);
    const assignRolesPopTx = await Promise.all(memberAddrs.map(async (memberAddr) => {
        return await roles.populateTransaction.assignRoles(memberAddr, [roleId], [true]);
    }));
    const metaTxs = (0, util_1.createMultisendTx)(assignRolesPopTx, chainConfig.MULTISEND_ADDR);
    await acSafe.execTransaction(chainConfig.MULTISEND_ADDR, constants_1.tx.zeroValue, metaTxs.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
    console.info(colors_1.default.blue(`Role member: ${memberAddrs.toString()} has been assigned role id: ${roleId}`));
}
exports.assignRoles = assignRoles;
// this will deploy the entire system from scratch, WITHOUT any investment manager permissions
const deployAccessControlSystemV1 = async (chainId, options, deployed) => {
    // get chain config for multichain deploy
    const chainConfig = (0, roles_chain_config_1.getChainConfig)(chainId, "v1");
    console.log(constants_1.SALTS.safes);
    //Deploy both safes
    const accessControlSafeAddr = deployed?.acSafeAddr || (await (0, deploy_safe_v1_1.deploySafe)(chainConfig, constants_1.SALTS.safes.accessControl));
    const investmentSafeAddr = deployed?.invSafeAddr || (await (0, deploy_safe_v1_1.deploySafe)(chainConfig, constants_1.SALTS.safes.investment));
    // //Deploy and enable a Roles modifier on the investment safe
    const invRolesAddr = deployed?.invRolesAddr ||
        (await deployRoles(accessControlSafeAddr, investmentSafeAddr, investmentSafeAddr, options.proxied, chainId, chainConfig));
    await enableRolesModifier(investmentSafeAddr, invRolesAddr);
    //Set the multisend address on roles so that manager can send multisend txs later on
    await setRolesMultisend(accessControlSafeAddr, invRolesAddr, chainConfig);
    //Deploy and enable a Roles modifier on the access control safe
    const acRolesAddr = deployed?.acRolesAddr ||
        (await deployRoles(accessControlSafeAddr, accessControlSafeAddr, accessControlSafeAddr, options.proxied, chainId, chainConfig));
    await enableRolesModifier(accessControlSafeAddr, acRolesAddr);
    //Set the multisend address on roles so that manager can send multisend txs later on
    await setRolesMultisend(accessControlSafeAddr, acRolesAddr, chainConfig);
    //Grant an access controller role to Security EOA's
    await assignRoles(accessControlSafeAddr, acRolesAddr, options.securityEOAs, constants_1.SECURITY_ROLE_ID_V1, chainConfig);
    // Populate this role for Security so they can call whitelisting related functions on investment roles
    const [caller] = await hardhat_1.ethers.getSigners();
    const accessControllerWhitelist = new scope_access_controller_v1_1.AccessControllerWhitelistV1(acRolesAddr, caller);
    await accessControllerWhitelist.execute(invRolesAddr, accessControlSafeAddr);
    //Grant a role to the investment managers EOAs
    //the idea would be that each strategy would be transacted on by 1 EOA
    await assignRoles(accessControlSafeAddr, invRolesAddr, options.managerEOAs, constants_1.MANAGER_ROLE_ID_V1, chainConfig);
    // Add signers
    await (0, deploy_safe_v1_1.addSafeSigners)(investmentSafeAddr, options.sysAdminAddresses, chainConfig);
    await (0, deploy_safe_v1_1.addSafeSigners)(accessControlSafeAddr, options.sysAdminAddresses, chainConfig);
    //Remove the deployer address as owner and rewrite signing threshold
    await (0, deploy_safe_v1_1.removeDeployerAsOwner)(investmentSafeAddr, options.invSafeThreshold);
    await (0, deploy_safe_v1_1.removeDeployerAsOwner)(accessControlSafeAddr, options.acSafeThreshold);
    return {
        acSafe: accessControlSafeAddr,
        invSafe: investmentSafeAddr,
        invRoles: invRolesAddr,
        acRoles: acRolesAddr,
    };
};
exports.deployAccessControlSystemV1 = deployAccessControlSystemV1;
