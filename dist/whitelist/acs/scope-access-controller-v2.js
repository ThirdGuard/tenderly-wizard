"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControllerWhitelistV2 = void 0;
const safe_master_copy_v2_json_1 = __importDefault(require("../../contracts/safe_master_copy_v2.json"));
const whitelist_class_1 = require("../whitelist-class");
// @ts-ignore
const hardhat_1 = require("hardhat");
const util_1 = require("../../utils/util");
const constants_1 = require("../../utils/constants");
const roles_chain_config_1 = require("../../utils/roles-chain-config");
const ROLES_FUNCTIONS_ALLOWED = [
    "revokeTarget",
    "scopeTarget",
    "allowFunction",
    "revokeFunction",
    "scopeFunction",
    "allowTarget",
];
// this whitelisting class is used in the roles deployment so that security has the ability to scope functions
class AccessControllerWhitelistV2 extends whitelist_class_1.Whitelist {
    constructor(acRolesAddr, caller) {
        super(acRolesAddr, "v2", caller);
        const chainId = parseInt(process.env.TENDERLY_FORK_ID || "1", 10);
        this.chainConfig = (0, roles_chain_config_1.getChainConfig)(chainId, "v2");
    }
    // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
    async getFullScope(invRolesAddr) {
        // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
        // Must scopeTarget before roles.allowFunction can be called
        const getScopedTargetTxs = await (0, util_1.scopeTargetsV2)([invRolesAddr], constants_1.SECURITY_ROLE_ID_V2, this.roles);
        // Get the sighashs that need to be whitelisted
        const functionSigs = ROLES_FUNCTIONS_ALLOWED.map((func) => this.roles.interface.getSighash(func));
        const getScopedAllowFunctionTxs = await this.scopeAllowFunctionsV2(invRolesAddr, functionSigs, constants_1.SECURITY_ROLE_ID_V2);
        const txs = [...getScopedTargetTxs, ...getScopedAllowFunctionTxs];
        return (0, util_1.createMultisendTx)(txs, this.chainConfig.MULTISEND_ADDR);
    }
    async build(invRolesAddr, accessControlSafeAddr) {
        const metaTx = await this.getFullScope(invRolesAddr);
        const acSafe = new hardhat_1.ethers.Contract(accessControlSafeAddr, safe_master_copy_v2_json_1.default, this.caller);
        const signature = (0, util_1.getPreValidatedSignatures)(await this.caller.getAddress());
        return await acSafe.populateTransaction.execTransaction(this.chainConfig.MULTISEND_ADDR, constants_1.tx.zeroValue, metaTx.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.tx.avatarTxGas, constants_1.tx.baseGas, constants_1.tx.gasPrice, constants_1.tx.gasToken, constants_1.tx.refundReceiver, signature);
    }
    async execute(invRolesAddr, accessControlSafeAddr) {
        const populatedTx = await this.build(invRolesAddr, accessControlSafeAddr);
        const tx = await this.caller.sendTransaction({
            ...populatedTx,
            gasLimit: constants_1.GAS_LIMIT,
        });
        console.log("Successfully executed Security's access control related whitelisting");
    }
}
exports.AccessControllerWhitelistV2 = AccessControllerWhitelistV2;
