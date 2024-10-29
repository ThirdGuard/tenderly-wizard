"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControllerWhitelistV1 = void 0;
const safe_master_copy_v1_json_1 = __importDefault(require("../../contracts/safe_master_copy_v1.json"));
const whitelist_class_1 = require("../whitelist-class");
// @ts-ignore
const hardhat_1 = require("hardhat");
const util_1 = require("../../utils/util");
const constants_1 = require("../../utils/constants");
const roles_chain_config_1 = require("../../utils/roles-chain-config");
const ROLES_FUNCTIONS_ALLOWED = [
    "revokeTarget",
    "scopeTarget",
    "scopeAllowFunction",
    "scopeRevokeFunction",
    "scopeFunction",
    "scopeFunctionExecutionOptions",
    "scopeParameter",
    "scopeParameterAsOneOf",
    "unscopeParameter",
    "allowTarget"
];
// this whitelisting class is used in the roles deployment so that security has the ability to scope functions
class AccessControllerWhitelistV1 extends whitelist_class_1.Whitelist {
    constructor(acRolesAddr, caller) {
        super(acRolesAddr, "v1", caller);
        const chainId = parseInt(process.env.TENDERLY_FORK_ID || "1", 10);
        this.chainConfig = (0, roles_chain_config_1.getChainConfig)(chainId, "v1");
    }
    // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
    async getFullScope(invRolesAddr) {
        // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
        // Must scopeTarget before roles.scopeAllowFunction can be called
        const getScopedTargetTxs = await (0, util_1.scopeTargetsV1)([invRolesAddr], constants_1.SECURITY_ROLE_ID_V1, this.roles);
        // Get the sighashs that need to be whitelisted
        const functionSigs = ROLES_FUNCTIONS_ALLOWED.map(func => this.roles.interface.getSighash(func));
        const getScopedAllowFunctionTxs = await this.scopeAllowFunctionsV1(invRolesAddr, functionSigs, constants_1.SECURITY_ROLE_ID_V1);
        const txs = [
            ...getScopedTargetTxs,
            ...getScopedAllowFunctionTxs
        ];
        return (0, util_1.createMultisendTx)(txs, this.chainConfig.MULTISEND_ADDR);
    }
    async build(invRolesAddr, accessControlSafeAddr) {
        const metaTx = await this.getFullScope(invRolesAddr);
        const acSafe = new hardhat_1.ethers.Contract(accessControlSafeAddr, safe_master_copy_v1_json_1.default, this.caller);
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
exports.AccessControllerWhitelistV1 = AccessControllerWhitelistV1;
