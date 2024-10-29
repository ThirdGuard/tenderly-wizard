"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWhitelistV2 = exports.Whitelist = exports.ExecutionOptions = void 0;
const ethers_1 = require("ethers");
const roles_v1_json_1 = __importDefault(require("../contracts/roles_v1.json"));
const roles_v2_json_1 = __importDefault(require("../contracts/roles_v2.json"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const zodiac_roles_sdk_1 = require("zodiac-roles-sdk");
const ethers_multisend_1 = require("ethers-multisend");
const constants_1 = require("../utils/constants");
const roles_chain_config_1 = require("../utils/roles-chain-config");
var ExecutionOptions;
(function (ExecutionOptions) {
    ExecutionOptions[ExecutionOptions["None"] = 0] = "None";
    ExecutionOptions[ExecutionOptions["Send"] = 1] = "Send";
    ExecutionOptions[ExecutionOptions["DelegateCall"] = 2] = "DelegateCall";
    ExecutionOptions[ExecutionOptions["Both"] = 3] = "Both";
})(ExecutionOptions = exports.ExecutionOptions || (exports.ExecutionOptions = {}));
class Whitelist {
    constructor(rolesAddr, rolesVersion, caller) {
        this.roles = new ethers_1.Contract(rolesAddr, rolesVersion === "v1" ? roles_v1_json_1.default : roles_v2_json_1.default);
        this.caller = caller;
    }
    // roles.scopeTarget helper function
    async scopeTargets(targetAddrs, roleId) {
        const scopeTargetTxs = await Promise.all(targetAddrs.map(async (target) => {
            //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
            const tx = await this.roles.populateTransaction.scopeTarget(roleId, target);
            return tx;
        }));
        return scopeTargetTxs;
    }
    // Helper to allows function calls without param scoping
    async scopeAllowFunctionsV1(target, sigs, roleId) {
        const scopeFuncsTxs = await Promise.all(sigs.map(async (sig) => {
            // scopeAllowFunction on Roles allows a role member to call the function in question with no paramter scoping
            const tx = await this.roles.populateTransaction.scopeAllowFunction(roleId, target, sig, ExecutionOptions.Both);
            return tx;
        }));
        return scopeFuncsTxs;
    }
    // Helper to allows function calls without param scoping
    async scopeAllowFunctionsV2(target, sigs, roleId) {
        const scopeFuncsTxs = await Promise.all(sigs.map(async (sig) => {
            // allowFunction on Roles allows a role member to call the function in question with no paramter scoping
            const tx = await this.roles.populateTransaction.allowFunction(roleId, target, sig, ExecutionOptions.Both);
            return tx;
        }));
        return scopeFuncsTxs;
    }
    // Helper for crafting erc20 approve related permissions
    async scopeFunctionERC20Approval(contractAddr, approvedSpender) {
        const scopedApproveFunctionTx = await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID_V2, contractAddr, constants_1.APPROVAL_SIG, [true, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY], [approvedSpender, constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
        return scopedApproveFunctionTx;
    }
}
exports.Whitelist = Whitelist;
/**
 * Executes whitelist permissions for a specific chain.
 * @note This function will work as long as it's connected to a Hardhat Tenderly testnet.
 * @param permissions Array of Permission objects to be executed
 * @param chainId The chain ID where the permissions will be applied
 * @returns Transaction receipt from the execution
 *
 */
async function executeWhitelistV2(permissions, chainId, rolesVersion) {
    const [_, securityEOAs, __] = await hardhat_1.ethers.getSigners();
    // get chain config
    const chainConfig = (0, roles_chain_config_1.getChainConfig)(chainId, rolesVersion);
    // Process the permissions
    const { targets } = (0, zodiac_roles_sdk_1.processPermissions)(permissions);
    // Apply the targets
    const calls = await (0, zodiac_roles_sdk_1.applyTargets)(constants_1.MANAGER_ROLE_ID_V2, targets, {
        chainId,
        address: process.env.ACCESS_CONTROL_ROLES,
        mode: "replace",
        log: console.debug,
        currentTargets: [],
    });
    console.log(`${calls.length} permissions to execute`);
    const multiSendTx = (0, ethers_multisend_1.encodeMulti)(calls.map((data) => {
        return {
            to: process.env.INVESTMENT_ROLES,
            value: "0",
            data,
        };
    }));
    // Security needs to indirectly execute this bundle via acRoles
    const acRoles = new ethers_1.Contract(process.env.ACCESS_CONTROL_ROLES, roles_v2_json_1.default, securityEOAs);
    // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
    return await acRoles.execTransactionWithRole(chainConfig.MULTISEND_ADDR, constants_1.ZERO_VALUE, multiSendTx.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.SECURITY_ROLE_ID_V2, true);
}
exports.executeWhitelistV2 = executeWhitelistV2;
