"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CowswapWhitelist = void 0;
const roles_v1_json_1 = __importDefault(require("../../contracts/roles_v1.json"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const whitelist_class_1 = require("../whitelist-class");
const ethers_1 = require("ethers");
const usdcEncoded = (0, utils_1.getABICodedAddress)(constants_1.USDC_ADDR);
const usdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.USDE_ADDR);
const daiEncoded = (0, utils_1.getABICodedAddress)(constants_1.DAI_ADDR);
const sdaiEncoded = (0, utils_1.getABICodedAddress)(constants_1.SDAI_ADDR);
const susdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.SUSDE_ADDR);
const ENCODED_TOKEN_WHITELIST = [usdcEncoded, daiEncoded, sdaiEncoded, usdeEncoded, susdeEncoded];
const cowswapRoleDefinition = {
    //function note: allows swapping on cowswap, with the result of this function being sent to the cowswap trading API
    signOrder: {
        functionSignature: ethers_1.ethers.utils.id("signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)").substring(0, 10),
        contractAddr: constants_1.COWSWAP_ORDER_SIGNER,
    },
    //function note: allows cancelling a cowswap order before it is sent to the cowswap trading API
    unsignOrder: {
        functionSignature: ethers_1.ethers.utils.id("unsignOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32))").substring(0, 10),
        contractAddr: constants_1.COWSWAP_ORDER_SIGNER,
    }
};
// Cowswap whitelisting class contains all the whitelisting requirements needed by the manager to carry out cowswap swapping
class CowswapWhitelist extends whitelist_class_1.Whitelist {
    constructor(invRolesAddr, caller) {
        super(invRolesAddr, caller);
    }
    async getFullScope(invSafeAddr) {
        const targetsToScope = [constants_1.COWSWAP_ORDER_SIGNER];
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, constants_1.MANAGER_ROLE_ID);
        const txs = [
            //bring all target contracts into scope as first step of roles whitelisting
            ...scopeTargetTxs,
            await this.scopeSignOrder(invSafeAddr, ENCODED_TOKEN_WHITELIST),
            await this.scopeUnsignOrder(invSafeAddr, ENCODED_TOKEN_WHITELIST)
        ].flat();
        return (0, utils_1.createMultisendTx)(txs, constants_1.MULTISEND_ADDR);
    }
    async build(acRolesAddr, invSafeAddr) {
        const metaTx = await this.getFullScope(invSafeAddr);
        const acRoles = new ethers_1.ethers.Contract(acRolesAddr, roles_v1_json_1.default, this.caller);
        return await acRoles.populateTransaction.execTransactionWithRole(constants_1.MULTISEND_ADDR, constants_1.ZERO_VALUE, metaTx.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.SECURITY_ROLE_ID, true);
    }
    async execute(acRolesAddr, invSafeAddr) {
        const populatedTx = await this.build(acRolesAddr, invSafeAddr);
        const tx = await this.caller.sendTransaction({
            ...populatedTx
        });
        console.log("Successfully executed cowswap order signer whitelisting");
    }
    async scopeSignOrder(invSafeAddr, tokenWhitelist) {
        // encoding order for signOrder in 32 byte allocations. All parameters are statically encoded, so the struct is encoded in place with NO offset.
        // 0. function selector
        // 1. IERC20 sellToken;
        // 2. IERC20 buyToken;
        // 3. address receiver;
        // 4. uint256 sellAmount;
        // 5. uint256 buyAmount;
        // 6. uint32 validTo;
        // 7. bytes32 appData;
        // 8. uint256 feeAmount;
        // 9. bytes32 kind;
        // 10. bool partiallyFillable;
        // 11. bytes32 sellTokenBalance;
        // 12. bytes32 buyTokenBalance; 
        // 13. uint32 validDuration
        // 14. uint256 feeAmountBP
        //set default scoping values
        const totalStaticValues = 14;
        const paramTypes = Array(totalStaticValues).fill(constants_1.TYPE_STATIC);
        let isScoped = Array(totalStaticValues).fill(false);
        let comparisonOperators = Array(totalStaticValues).fill(constants_1.ANY);
        let comparisonValues = Array(totalStaticValues).fill(constants_1.EMPTY_BYTES);
        const sellTokenParameterIndex = 0; //1st 32 byte slot in the data
        const buyTokenParameterIndex = 1; //2nd 32 byte slot in the data
        const receiverParameterIndex = 2; //3rd 32 byte slot in the data
        //alter default above for specific scoping
        //scope receiver param
        isScoped[receiverParameterIndex] = true;
        //enforce equal to comparison for param
        comparisonOperators[receiverParameterIndex] = constants_1.EQUAL_TO;
        //set receiver to invSafeAddr
        comparisonValues[receiverParameterIndex] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        const scopeFunction = this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, cowswapRoleDefinition.signOrder.contractAddr, cowswapRoleDefinition.signOrder.functionSignature, isScoped, paramTypes, comparisonOperators, comparisonValues, constants_1.OPTIONS_DELEGATECALL);
        const scopeSellTokens = this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, cowswapRoleDefinition.signOrder.contractAddr, cowswapRoleDefinition.signOrder.functionSignature, sellTokenParameterIndex, constants_1.TYPE_STATIC, tokenWhitelist);
        const scopeBuyTokens = this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, cowswapRoleDefinition.signOrder.contractAddr, cowswapRoleDefinition.signOrder.functionSignature, buyTokenParameterIndex, constants_1.TYPE_STATIC, tokenWhitelist);
        return await Promise.all([scopeFunction, scopeSellTokens, scopeBuyTokens]);
    }
    async scopeUnsignOrder(invSafeAddr, encodedTokenWhitelist) {
        // encoding order for signOrder in 32 byte allocations
        // 0. function selector
        // 1. IERC20 sellToken;
        // 2. IERC20 buyToken;
        // 3. address receiver;
        // 4. uint256 sellAmount;
        // 5. uint256 buyAmount;
        // 6. uint32 validTo;
        // 7. bytes32 appData;
        // 8. uint256 feeAmount;
        // 9. bytes32 kind;
        // 10. bool partiallyFillable;
        // 11. bytes32 sellTokenBalance;
        // 12. bytes32 buyTokenBalance; 
        //set default scoping values
        const totalStaticValues = 12;
        const paramTypes = Array(totalStaticValues).fill(constants_1.TYPE_STATIC);
        let isScoped = Array(totalStaticValues).fill(false);
        let comparisonOperators = Array(totalStaticValues).fill(constants_1.ANY);
        let comparisonValues = Array(totalStaticValues).fill(constants_1.EMPTY_BYTES);
        const sellTokenParameterIndex = 0; //1st 32 byte slot in the data
        const buyTokenParameterIndex = 1; //2nd 32 byte slot in the data
        const receiverParameterIndex = 2; //3rd 32 byte slot in the data
        //alter default above for specific scoping
        //scope receiver param
        isScoped[receiverParameterIndex] = true;
        //enforce equal to comparison for param
        comparisonOperators[receiverParameterIndex] = constants_1.EQUAL_TO;
        //set receiver to invSafeAddr
        comparisonValues[receiverParameterIndex] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        const scopeFunction = this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, cowswapRoleDefinition.unsignOrder.contractAddr, cowswapRoleDefinition.unsignOrder.functionSignature, isScoped, paramTypes, comparisonOperators, comparisonValues, constants_1.OPTIONS_DELEGATECALL);
        const scopeSellTokens = this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, cowswapRoleDefinition.unsignOrder.contractAddr, cowswapRoleDefinition.unsignOrder.functionSignature, sellTokenParameterIndex, constants_1.TYPE_STATIC, encodedTokenWhitelist);
        const scopeBuyTokens = this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, cowswapRoleDefinition.unsignOrder.contractAddr, cowswapRoleDefinition.unsignOrder.functionSignature, buyTokenParameterIndex, constants_1.TYPE_STATIC, encodedTokenWhitelist);
        return await Promise.all([scopeFunction, scopeSellTokens, scopeBuyTokens]);
    }
}
exports.CowswapWhitelist = CowswapWhitelist;
