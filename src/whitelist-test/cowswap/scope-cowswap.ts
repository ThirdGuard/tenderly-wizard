
import ROLES_V1_MASTER_COPY_ABI from "../../contracts/roles_v1.json"
import { ANY, COWSWAP_ORDER_SIGNER, DAI_ADDR, EMPTY_BYTES, EQUAL_TO, MANAGER_ROLE_ID, MULTISEND_ADDR, OPTIONS_DELEGATECALL, SAFE_OPERATION_DELEGATECALL, SDAI_ADDR, SECURITY_ROLE_ID, SUSDE_ADDR, TYPE_STATIC, USDC_ADDR, USDE_ADDR, ZERO_VALUE } from "../constants";
import { createMultisendTx, getABICodedAddress } from "../utils";

import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "ethers";

const usdcEncoded = getABICodedAddress(USDC_ADDR);
const usdeEncoded = getABICodedAddress(USDE_ADDR);
const daiEncoded = getABICodedAddress(DAI_ADDR);
const sdaiEncoded = getABICodedAddress(SDAI_ADDR);
const susdeEncoded = getABICodedAddress(SUSDE_ADDR);
const ENCODED_TOKEN_WHITELIST = [usdcEncoded, daiEncoded, sdaiEncoded, usdeEncoded, susdeEncoded]

const cowswapRoleDefinition = {
    //function note: allows swapping on cowswap, with the result of this function being sent to the cowswap trading API
    signOrder: {
        functionSignature: ethers.utils.id("signOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32),uint32,uint256)").substring(0, 10),
        contractAddr: COWSWAP_ORDER_SIGNER,
    },
    //function note: allows cancelling a cowswap order before it is sent to the cowswap trading API
    unsignOrder: {
        functionSignature: ethers.utils.id("unsignOrder((address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32))").substring(0, 10),
        contractAddr: COWSWAP_ORDER_SIGNER,
    }
};

// Cowswap whitelisting class contains all the whitelisting requirements needed by the manager to carry out cowswap swapping
export class CowswapWhitelist extends Whitelist {

    constructor(invRolesAddr: string, caller: SignerWithAddress) {
        super(invRolesAddr, caller);
    }

    async getFullScope(invSafeAddr: string) {
        const targetsToScope = [COWSWAP_ORDER_SIGNER]
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, MANAGER_ROLE_ID)
        const txs = [
            //bring all target contracts into scope as first step of roles whitelisting
            ...scopeTargetTxs,
            await this.scopeSignOrder(invSafeAddr, ENCODED_TOKEN_WHITELIST),
            await this.scopeUnsignOrder(invSafeAddr, ENCODED_TOKEN_WHITELIST)
        ].flat();
        return createMultisendTx(txs, MULTISEND_ADDR)
    }

    async build(acRolesAddr: string, invSafeAddr: string) {
        const metaTx = await this.getFullScope(invSafeAddr)
        const acRoles = new ethers.Contract(acRolesAddr, ROLES_V1_MASTER_COPY_ABI, this.caller)
        return await acRoles.populateTransaction.execTransactionWithRole(
            MULTISEND_ADDR,
            ZERO_VALUE,
            metaTx.data,
            SAFE_OPERATION_DELEGATECALL,
            SECURITY_ROLE_ID,
            true
        )
    }

    async execute(acRolesAddr: string, invSafeAddr: string) {
        const populatedTx = await this.build(acRolesAddr, invSafeAddr)
        const tx = await this.caller.sendTransaction({
            ...populatedTx
        })
        console.log("Successfully executed cowswap order signer whitelisting")
    }

    async scopeSignOrder(invSafeAddr: string, tokenWhitelist: string[]) {
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
        const totalStaticValues = 14
        const paramTypes = Array(totalStaticValues).fill(TYPE_STATIC)
        let isScoped = Array(totalStaticValues).fill(false)
        let comparisonOperators = Array(totalStaticValues).fill(ANY)
        let comparisonValues = Array(totalStaticValues).fill(EMPTY_BYTES)
        const sellTokenParameterIndex = 0 //1st 32 byte slot in the data
        const buyTokenParameterIndex = 1 //2nd 32 byte slot in the data
        const receiverParameterIndex = 2 //3rd 32 byte slot in the data

        //alter default above for specific scoping
        //scope receiver param
        isScoped[receiverParameterIndex] = true

        //enforce equal to comparison for param
        comparisonOperators[receiverParameterIndex] = EQUAL_TO

        //set receiver to invSafeAddr
        comparisonValues[receiverParameterIndex] = getABICodedAddress(invSafeAddr)

        const scopeFunction = this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            cowswapRoleDefinition.signOrder.contractAddr,
            cowswapRoleDefinition.signOrder.functionSignature,
            isScoped,
            paramTypes,
            comparisonOperators,
            comparisonValues,
            OPTIONS_DELEGATECALL
        )

        const scopeSellTokens = this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            cowswapRoleDefinition.signOrder.contractAddr,
            cowswapRoleDefinition.signOrder.functionSignature,
            sellTokenParameterIndex,
            TYPE_STATIC,
            tokenWhitelist
        )

        const scopeBuyTokens = this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            cowswapRoleDefinition.signOrder.contractAddr,
            cowswapRoleDefinition.signOrder.functionSignature,
            buyTokenParameterIndex,
            TYPE_STATIC,
            tokenWhitelist
        )
        return await Promise.all([scopeFunction, scopeSellTokens, scopeBuyTokens])
    }

    async scopeUnsignOrder(invSafeAddr: string, encodedTokenWhitelist: string[]) {
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
        const totalStaticValues = 12
        const paramTypes = Array(totalStaticValues).fill(TYPE_STATIC)
        let isScoped = Array(totalStaticValues).fill(false)
        let comparisonOperators = Array(totalStaticValues).fill(ANY)
        let comparisonValues = Array(totalStaticValues).fill(EMPTY_BYTES)
        const sellTokenParameterIndex = 0 //1st 32 byte slot in the data
        const buyTokenParameterIndex = 1 //2nd 32 byte slot in the data
        const receiverParameterIndex = 2 //3rd 32 byte slot in the data

        //alter default above for specific scoping
        //scope receiver param
        isScoped[receiverParameterIndex] = true

        //enforce equal to comparison for param
        comparisonOperators[receiverParameterIndex] = EQUAL_TO

        //set receiver to invSafeAddr
        comparisonValues[receiverParameterIndex] = getABICodedAddress(invSafeAddr)

        const scopeFunction = this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            cowswapRoleDefinition.unsignOrder.contractAddr,
            cowswapRoleDefinition.unsignOrder.functionSignature,
            isScoped,
            paramTypes,
            comparisonOperators,
            comparisonValues,
            OPTIONS_DELEGATECALL
        )

        const scopeSellTokens = this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            cowswapRoleDefinition.unsignOrder.contractAddr,
            cowswapRoleDefinition.unsignOrder.functionSignature,
            sellTokenParameterIndex,
            TYPE_STATIC,
            encodedTokenWhitelist
        )

        const scopeBuyTokens = this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            cowswapRoleDefinition.unsignOrder.contractAddr,
            cowswapRoleDefinition.unsignOrder.functionSignature,
            buyTokenParameterIndex,
            TYPE_STATIC,
            encodedTokenWhitelist
        )
        return await Promise.all([scopeFunction, scopeSellTokens, scopeBuyTokens])
    }
}