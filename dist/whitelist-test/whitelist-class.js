"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Whitelist = exports.ExecutionOptions = void 0;
// @ts-ignore
const hardhat_1 = require("hardhat");
const roles_v1_json_1 = __importDefault(require("../contracts/roles_v1.json"));
const constants_1 = require("./constants");
var ExecutionOptions;
(function (ExecutionOptions) {
    ExecutionOptions[ExecutionOptions["None"] = 0] = "None";
    ExecutionOptions[ExecutionOptions["Send"] = 1] = "Send";
    ExecutionOptions[ExecutionOptions["DelegateCall"] = 2] = "DelegateCall";
    ExecutionOptions[ExecutionOptions["Both"] = 3] = "Both";
})(ExecutionOptions = exports.ExecutionOptions || (exports.ExecutionOptions = {}));
class Whitelist {
    constructor(rolesAddr, caller) {
        this.roles = new hardhat_1.ethers.Contract(rolesAddr, roles_v1_json_1.default);
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
    async scopeAllowFunctions(target, sigs, roleId) {
        const scopeFuncsTxs = await Promise.all(sigs.map(async (sig) => {
            // scopeAllowFunction on Roles allows a role member to call the function in question with no paramter scoping
            const tx = await this.roles.populateTransaction.scopeAllowFunction(roleId, target, sig, ExecutionOptions.Both);
            return tx;
        }));
        return scopeFuncsTxs;
    }
    // Helper for crafting erc20 approve related permissions
    async scopeFunctionERC20Approval(contractAddr, approvedSpender) {
        const scopedApproveFunctionTx = await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, contractAddr, constants_1.APPROVAL_SIG, [true, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY], [approvedSpender, constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
        return scopedApproveFunctionTx;
    }
}
exports.Whitelist = Whitelist;
