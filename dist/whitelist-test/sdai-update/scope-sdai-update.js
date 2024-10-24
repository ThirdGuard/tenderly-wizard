"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdaiUpdateWhitelist = void 0;
const whitelist_class_1 = require("../whitelist-class");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const roles_v1_json_1 = __importDefault(require("../../contracts/roles_v1.json"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const curve3poolContractEncoded = (0, utils_1.getABICodedAddress)(constants_1.CURVE_3POOL_ADDR);
const sDaiAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.SDAI_ADDR);
const psmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.PSM_USDC_ADDR);
const joinPsmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.JOIN_PSM_USDC_ADDR);
const curveUsdcUsdeContractEncoded = (0, utils_1.getABICodedAddress)(constants_1.CURVE_USDC_USDE_ADDR);
const pendleRouterV4Encoded = (0, utils_1.getABICodedAddress)(constants_1.PENDLE_ROUTER_V4_ADDR);
const gpv2VaultRelayerEncoded = (0, utils_1.getABICodedAddress)(constants_1.GP_V2_VAULT_RELAYER);
const litePsmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.LITE_PSM_USDC_A_ADDR);
const sDaiUpdateDefinition = {
    buyGem: {
        functionSignature: hardhat_1.ethers.utils
            .id("buyGem(address,uint256)")
            .substring(0, 10),
        contractAddr: constants_1.LITE_PSM_USDC_A_ADDR,
    },
    sellGem: {
        functionSignature: hardhat_1.ethers.utils
            .id("sellGem(address,uint256)")
            .substring(0, 10),
        contractAddr: constants_1.LITE_PSM_USDC_A_ADDR,
    }
};
//
class SdaiUpdateWhitelist extends whitelist_class_1.Whitelist {
    constructor(invRolesAddr, caller) {
        super(invRolesAddr, caller);
    }
    async getFullScope(invSafeAddr) {
        // all targets need to be scoped first
        const targetsToScope = [
            constants_1.LITE_PSM_USDC_A_ADDR,
        ];
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, constants_1.MANAGER_ROLE_ID);
        // build a multisend transaction bundle that can scope all functions & parameters
        const txs = [
            ...scopeTargetTxs,
            await this.scopeUSDCApprove(),
            await this.scopeDAIApproval(),
            await this.scopeBuyGem(invSafeAddr),
            await this.scopeSellGem(invSafeAddr),
        ];
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
            ...populatedTx
        });
        console.log("Successfully executed USDC sDai (Lite PSM USDC A) strategy whitelisting");
    }
    // function approve(address _spender, uint256 _value)
    async scopeUSDCApprove() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.USDC_ADDR, constants_1.APPROVAL_SIG, 0, // parameter index
        constants_1.TYPE_STATIC, [
            curve3poolContractEncoded,
            joinPsmAddrEncoded,
            curveUsdcUsdeContractEncoded,
            pendleRouterV4Encoded,
            gpv2VaultRelayerEncoded,
            litePsmAddrEncoded
        ]);
    }
    // function approve(address usr, uint256 wad)
    async scopeDAIApproval() {
        // With the scopeParameterAsOneOf usage here role members can call approvals targetted at any of the encoded contract addresses provided below
        return await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.DAI_ADDR, constants_1.APPROVAL_SIG, 0, //parameter index
        constants_1.TYPE_STATIC, [
            curve3poolContractEncoded,
            sDaiAddrEncoded,
            psmAddrEncoded,
            pendleRouterV4Encoded,
            gpv2VaultRelayerEncoded,
            litePsmAddrEncoded
        ]);
    }
    // function buyGem(address usr, uint256 getAmt)
    async scopeBuyGem(invSafeAddr) {
        // This scoped function exchanges DAI for USDC on Maker's USDC-A PSM
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, sDaiUpdateDefinition.buyGem.contractAddr, sDaiUpdateDefinition.buyGem.functionSignature, [true, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
    }
    // function sellGem(address usr, uint256 getAmt)
    async scopeSellGem(invSafeAddr) {
        // This scoped function exchanges USDC for DAI on Maker's USDC-A PSM
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, sDaiUpdateDefinition.sellGem.contractAddr, sDaiUpdateDefinition.sellGem.functionSignature, [true, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
    }
}
exports.SdaiUpdateWhitelist = SdaiUpdateWhitelist;
