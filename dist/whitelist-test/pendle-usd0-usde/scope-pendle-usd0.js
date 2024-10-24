"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendleUsd0Whitelist = void 0;
const constants_1 = require("../constants");
const roles_v1_json_1 = __importDefault(require("../../contracts/roles_v1.json"));
const utils_1 = require("../utils");
const whitelist_class_1 = require("../whitelist-class");
// @ts-ignore
const hardhat_1 = require("hardhat");
const token_approvals_1 = require("../token-approvals");
const usd0Encoded = (0, utils_1.getABICodedAddress)(constants_1.USD0_ADDR);
const usd0PPEncoded = (0, utils_1.getABICodedAddress)(constants_1.USD0_PP_ADDR);
const usycEncoded = (0, utils_1.getABICodedAddress)(constants_1.USYC_ADDR);
const usdcEncoded = (0, utils_1.getABICodedAddress)(constants_1.USDC_ADDR);
const usdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.USDE_ADDR);
const daiEncoded = (0, utils_1.getABICodedAddress)(constants_1.DAI_ADDR);
const susdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.SUSDE_ADDR);
// note: the pendle usd0 strategy uses the same pendle router v4 function as the pendle ethena strategy, so we will not overwrite them here
const pendleUsd0RoleDefinition = {
    // @note: allows user to swap from any PT to any token
    swapExactPtForToken: {
        functionSignature: hardhat_1.ethers.utils.id("swapExactPtForToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    // @note this lets a user burn their PT tokens in exchange for that PT's underlying token (for this strategy that would be sUSDe)
    redeemPyToToken: {
        functionSignature: hardhat_1.ethers.utils.id("redeemPyToToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    // @note this may be implemented in future, pending client KYC verification
    // @note allows spender to burn / redeem USYC on behalf of owner
    // permit: {
    //     functionSignature: ethers.utils.id("permit(address,address,uint256,uint256,uint8,bytes32,bytes32)").substring(0, 10),
    //     contractAddr: USYC_ADDR,
    // },
    // // @note this burns RWC token and withdraws the underlying token USYC (RWC token) -> USDC
    // withdrawTo: {
    //     functionSignature: ethers.utils.id("withdrawTo(address,uint256,uint8,bytes32,bytes32)").substring(0, 10),
    //     contractAddr: USYC_ADDR,
    // },
    // // @note this deposits a stable coin and mints RWC token ANY STABLECOIN -> USYC (RWC token)
    // depositFor: {
    //     functionSignature: ethers.utils.id("depositFor(address,uint256)").substring(0, 10),
    //     contractAddr: USYC_ADDR,
    // },
};
// Pendle USD0++ whitelisting class contains all the whitelisting requirements needed by the manager to carry out the strategy
class PendleUsd0Whitelist extends whitelist_class_1.Whitelist {
    constructor(invRolesAddr, caller) {
        super(invRolesAddr, caller);
    }
    async getFullScope(invSafeAddr) {
        const targetTokens = [constants_1.USD0_ADDR, constants_1.USD0_PP_ADDR, constants_1.USDC_ADDR];
        const targetContracts = [constants_1.CURVE_USDC_USD0_ADDR, constants_1.PENDLE_ROUTER_V4_ADDR, constants_1.PENDLE_TOKEN_ADDR];
        const targetUSD0_27_MAR_25 = [constants_1.PT_USD0_PP_27_MAR_2025_ADDR, constants_1.MARKET_USD0_PP_27_MAR_2025_ADDR, constants_1.SY_USD0_PP_27_MAR_2025_ADDR, constants_1.YT_USD0_PP_27_MAR_2025_ADDR];
        const targetSUSDE_26_DEC_24 = [constants_1.SY_ETHENA_SUSDE_26_DEC_2024_ADDR, constants_1.PT_ETHENA_SUSDE_26_DEC_2024_ADDR, constants_1.YT_ETHENA_SUSDE_26_DEC_2024_ADDR, constants_1.MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR];
        const targetSUSDE_27_MAR_25 = [constants_1.SY_ETHENA_SUSDE_27_MAR_2025_ADDR, constants_1.PT_ETHENA_SUSDE_27_MAR_2025_ADDR, constants_1.YT_ETHENA_SUSDE_27_MAR_2025_ADDR, constants_1.MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR];
        const targetsToScope = [
            ...targetTokens,
            ...targetContracts,
            ...targetUSD0_27_MAR_25,
            ...targetSUSDE_26_DEC_24,
            ...targetSUSDE_27_MAR_25,
        ];
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, constants_1.MANAGER_ROLE_ID);
        const txs = [
            //bring all target contracts into scope as first step of roles whitelisting
            ...scopeTargetTxs,
            //whitelist all approvals
            await (0, token_approvals_1.tokenApprovals)(this.roles),
            ...await this.scopeSwapExactPtForToken(invSafeAddr),
            ...await this.scopeRedeemPyToToken(invSafeAddr)
        ].flat();
        return (0, utils_1.createMultisendTx)(txs, constants_1.MULTISEND_ADDR);
    }
    async build(acRolesAddr, invSafeAddr) {
        //get the bundle of whitelisting txs
        const metaTx = await this.getFullScope(invSafeAddr);
        //security needs to indirectly execute this bundle via acRoles
        const acRoles = new hardhat_1.ethers.Contract(acRolesAddr, roles_v1_json_1.default, this.caller);
        // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
        return await acRoles.populateTransaction.execTransactionWithRole(constants_1.MULTISEND_ADDR, constants_1.ZERO_VALUE, metaTx.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.SECURITY_ROLE_ID, true);
    }
    async execute(acRolesAddr, invSafeAddr) {
        const populatedTx = await this.build(acRolesAddr, invSafeAddr);
        const tx = await this.caller.sendTransaction({
            ...populatedTx,
        });
        console.log("Successfully executed Pendle USD0++ strategy whitelisting");
    }
    async scopeSwapExactPtForToken(invSafeAddr) {
        //set default scoping values
        let isScoped = Array(23).fill(false);
        let comparisonOperators = Array(23).fill(constants_1.ANY);
        let comparisonValues = Array(23).fill(constants_1.EMPTY_BYTES);
        //alter default above for scoping
        //scope the 1st occurence of 32 bytes in the data, 1st corresponding to receiver
        isScoped[0] = true;
        // isScoped[9] = true
        //set 1st and 10th occurence of 32 bytes in the data to enforce equal to comparison
        comparisonOperators[0] = constants_1.EQUAL_TO;
        //set 1st occurence of 32 bytes in the data to equal a select value
        //set receiver to invSafeAddr
        comparisonValues[0] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        return await Promise.all([
            //@note given previous pendle whitelisting this scopeFunction is not necessary
            // await this.roles.populateTransaction.scopeFunction(
            //     MANAGER_ROLE_ID,
            //     pendleUsd0RoleDefinition.swapExactPtForToken.contractAddr,
            //     pendleUsd0RoleDefinition.swapExactPtForToken.functionSignature,
            //     isScoped,
            //     paramTypes,
            //     comparisonOperators,
            //     comparisonValues,
            //     OPTIONS_NONE
            // ),
            this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, pendleUsd0RoleDefinition.swapExactPtForToken.contractAddr, pendleUsd0RoleDefinition.swapExactPtForToken.functionSignature, constants_1.INDEX_TOKEN_OUT_SWAP_PT_TO_TOKEN, constants_1.TYPE_STATIC, [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded, usd0Encoded, usd0PPEncoded])
        ]);
    }
    async scopeRedeemPyToToken(invSafeAddr) {
        // const paramTypes = Array(14).fill(TYPE_STATIC)
        let isScoped = Array(14).fill(false);
        let comparisonOperators = Array(14).fill(constants_1.ANY);
        let comparisonValues = Array(14).fill(constants_1.EMPTY_BYTES);
        isScoped[0] = true;
        // isScoped[9] = true
        comparisonOperators[0] = constants_1.EQUAL_TO;
        // comparisonOperators[9] = EQUAL_TO
        comparisonValues[0] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        // comparisonValues[9] = EMPTY_BYTES
        return await Promise.all([
            //@note given previous pendle whitelisting this scopeFunction is not necessary
            // await this.roles.populateTransaction.scopeFunction(
            //     MANAGER_ROLE_ID,
            //     pendleUsd0RoleDefinition.redeemPyToToken.contractAddr,
            //     pendleUsd0RoleDefinition.redeemPyToToken.functionSignature,
            //     isScoped,
            //     paramTypes,
            //     comparisonOperators,
            //     comparisonValues,
            //     OPTIONS_NONE
            // ),
            this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, pendleUsd0RoleDefinition.redeemPyToToken.contractAddr, pendleUsd0RoleDefinition.redeemPyToToken.functionSignature, 4, constants_1.TYPE_STATIC, [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded, usd0Encoded, usd0PPEncoded])
        ]);
    }
}
exports.PendleUsd0Whitelist = PendleUsd0Whitelist;
