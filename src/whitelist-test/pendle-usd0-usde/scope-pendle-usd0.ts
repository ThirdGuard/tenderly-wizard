import {
    ANY,
    APPROVAL_SIG,
    EMPTY_BYTES,
    EQUAL_TO,
    MANAGER_ROLE_ID,
    MULTISEND_ADDR,
    PENDLE_ROUTER_V4_ADDR,
    SAFE_OPERATION_DELEGATECALL,
    SECURITY_ROLE_ID,
    TYPE_STATIC,
    USDC_ADDR,
    ZERO_VALUE,
    OPTIONS_NONE,
    GP_V2_VAULT_RELAYER,
    CURVE_USDC_USD0_ADDR,
    USD0_ADDR,
    USD0_PP_ADDR,
    USYC_ADDR,
    MARKET_USD0_PP_27_MAR_2025_ADDR,
    PT_USD0_PP_27_MAR_2025_ADDR,
    YT_USD0_PP_27_MAR_2025_ADDR,
    SY_USD0_PP_27_MAR_2025_ADDR,
    INDEX_TOKEN_OUT_SWAP_PT_TO_TOKEN,
    DAI_ADDR,
    SUSDE_ADDR,
    USDE_ADDR,
    PENDLE_TOKEN_ADDR,
    MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR,
    PT_ETHENA_SUSDE_26_DEC_2024_ADDR,
    PT_ETHENA_SUSDE_27_MAR_2025_ADDR,
    SY_ETHENA_SUSDE_26_DEC_2024_ADDR,
    SY_ETHENA_SUSDE_27_MAR_2025_ADDR,
    YT_ETHENA_SUSDE_26_DEC_2024_ADDR,
    YT_ETHENA_SUSDE_27_MAR_2025_ADDR,
    MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR
} from "../constants"
import ROLES_V1_MASTER_COPY_ABI from "../../contracts/roles_v1.json"
import { createMultisendTx, getABICodedAddress } from "../utils";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// @ts-ignore
import { ethers } from "hardhat";
import { tokenApprovals } from "../token-approvals";

const usd0Encoded = getABICodedAddress(USD0_ADDR);
const usd0PPEncoded = getABICodedAddress(USD0_PP_ADDR);
const usycEncoded = getABICodedAddress(USYC_ADDR)
const usdcEncoded = getABICodedAddress(USDC_ADDR);
const usdeEncoded = getABICodedAddress(USDE_ADDR);
const daiEncoded = getABICodedAddress(DAI_ADDR);
const susdeEncoded = getABICodedAddress(SUSDE_ADDR);

// note: the pendle usd0 strategy uses the same pendle router v4 function as the pendle ethena strategy, so we will not overwrite them here
const pendleUsd0RoleDefinition = {
    // @note: allows user to swap from any PT to any token
    swapExactPtForToken: {
        functionSignature: ethers.utils.id("swapExactPtForToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: PENDLE_ROUTER_V4_ADDR,
    },
    // @note this lets a user burn their PT tokens in exchange for that PT's underlying token (for this strategy that would be sUSDe)
    redeemPyToToken: {
        functionSignature: ethers.utils.id("redeemPyToToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)))").substring(0, 10),
        contractAddr: PENDLE_ROUTER_V4_ADDR,
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
export class PendleUsd0Whitelist extends Whitelist {

    constructor(invRolesAddr: string, caller: SignerWithAddress) {
        super(invRolesAddr, caller);
    }
    async getFullScope(invSafeAddr: string) {
        const targetTokens = [USD0_ADDR, USD0_PP_ADDR, USDC_ADDR]
        const targetContracts = [CURVE_USDC_USD0_ADDR, PENDLE_ROUTER_V4_ADDR, PENDLE_TOKEN_ADDR]
        const targetUSD0_27_MAR_25 = [PT_USD0_PP_27_MAR_2025_ADDR, MARKET_USD0_PP_27_MAR_2025_ADDR, SY_USD0_PP_27_MAR_2025_ADDR, YT_USD0_PP_27_MAR_2025_ADDR]
        const targetSUSDE_26_DEC_24 = [SY_ETHENA_SUSDE_26_DEC_2024_ADDR, PT_ETHENA_SUSDE_26_DEC_2024_ADDR, YT_ETHENA_SUSDE_26_DEC_2024_ADDR, MARKET_ETHENA_SUSDE_26_DEC_2024_ADDR]
        const targetSUSDE_27_MAR_25 = [SY_ETHENA_SUSDE_27_MAR_2025_ADDR, PT_ETHENA_SUSDE_27_MAR_2025_ADDR, YT_ETHENA_SUSDE_27_MAR_2025_ADDR, MARKET_ETHENA_SUSDE_27_MAR_2025_ADDR]
        const targetsToScope = [
            ...targetTokens,
            ...targetContracts,
            ...targetUSD0_27_MAR_25,
            ...targetSUSDE_26_DEC_24,
            ...targetSUSDE_27_MAR_25,
        ];
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, MANAGER_ROLE_ID)
        const txs = [
            //bring all target contracts into scope as first step of roles whitelisting
            ...scopeTargetTxs,
            //whitelist all approvals
            await tokenApprovals(this.roles),
            ...await this.scopeSwapExactPtForToken(invSafeAddr),
            ...await this.scopeRedeemPyToToken(invSafeAddr)
        ].flat();
        return createMultisendTx(txs, MULTISEND_ADDR)
    }

    async build(acRolesAddr: string, invSafeAddr: string) {
        //get the bundle of whitelisting txs
        const metaTx = await this.getFullScope(invSafeAddr);

        //security needs to indirectly execute this bundle via acRoles
        const acRoles = new ethers.Contract(
            acRolesAddr,
            ROLES_V1_MASTER_COPY_ABI,
            this.caller
        );

        // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
        return await acRoles.populateTransaction.execTransactionWithRole(
            MULTISEND_ADDR,
            ZERO_VALUE,
            metaTx.data,
            SAFE_OPERATION_DELEGATECALL,
            SECURITY_ROLE_ID,
            true
        );
    }

    async execute(acRolesAddr: string, invSafeAddr: string) {
        const populatedTx = await this.build(acRolesAddr, invSafeAddr)
        const tx = await this.caller.sendTransaction({
            ...populatedTx,
        })
        console.log("Successfully executed Pendle USD0++ strategy whitelisting")
    }

    async scopeSwapExactPtForToken(invSafeAddr: string) {
        //set default scoping values
        let isScoped = Array(23).fill(false)
        let comparisonOperators = Array(23).fill(ANY)
        let comparisonValues = Array(23).fill(EMPTY_BYTES)

        //alter default above for scoping
        //scope the 1st occurence of 32 bytes in the data, 1st corresponding to receiver
        isScoped[0] = true
        // isScoped[9] = true

        //set 1st and 10th occurence of 32 bytes in the data to enforce equal to comparison
        comparisonOperators[0] = EQUAL_TO

        //set 1st occurence of 32 bytes in the data to equal a select value
        //set receiver to invSafeAddr
        comparisonValues[0] = getABICodedAddress(invSafeAddr)

        return await Promise.all(
            [
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
                this.roles.populateTransaction.scopeParameterAsOneOf(
                    MANAGER_ROLE_ID,
                    pendleUsd0RoleDefinition.swapExactPtForToken.contractAddr,
                    pendleUsd0RoleDefinition.swapExactPtForToken.functionSignature,
                    INDEX_TOKEN_OUT_SWAP_PT_TO_TOKEN,
                    TYPE_STATIC,
                    [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded, usd0Encoded, usd0PPEncoded]
                )])
    }

    async scopeRedeemPyToToken(invSafeAddr: string) {
        // const paramTypes = Array(14).fill(TYPE_STATIC)
        let isScoped = Array(14).fill(false)
        let comparisonOperators = Array(14).fill(ANY)
        let comparisonValues = Array(14).fill(EMPTY_BYTES)

        isScoped[0] = true
        // isScoped[9] = true

        comparisonOperators[0] = EQUAL_TO
        // comparisonOperators[9] = EQUAL_TO

        comparisonValues[0] = getABICodedAddress(invSafeAddr)
        // comparisonValues[9] = EMPTY_BYTES

        return await Promise.all(
            [
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
                this.roles.populateTransaction.scopeParameterAsOneOf(
                    MANAGER_ROLE_ID,
                    pendleUsd0RoleDefinition.redeemPyToToken.contractAddr,
                    pendleUsd0RoleDefinition.redeemPyToToken.functionSignature,
                    4,
                    TYPE_STATIC,
                    [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded, usd0Encoded, usd0PPEncoded]
                )])
    }

    // @note USYC component of strategy has been ignored due to the fact that client KYC for USYC is uncertain
    // @note the withdraw function automatically burns USYC and withdraws USDC to the caller address, so we are using the withdrawFor function instead
    // async scopeWithdrawTo(invSafeAddr: string) {
    //     return await this.roles.populateTransaction.scopeFunction(
    //         MANAGER_ROLE_ID,
    //         pendleUsd0RoleDefinition.withdrawTo.contractAddr,
    //         pendleUsd0RoleDefinition.withdrawTo.functionSignature,
    //         [true, false, false, false, false],
    //         [TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC],
    //         [EQUAL_TO, ANY, ANY, ANY, ANY],
    //         [getABICodedAddress(invSafeAddr), EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES],
    //         OPTIONS_NONE
    //     );
    // }

    // async scopeWithdraw(invSafeAddr: string) {
    //     return await this.roles.populateTransaction.scopeFunction(
    //         MANAGER_ROLE_ID,
    //         pendleUsd0RoleDefinition.withdrawTo.contractAddr,
    //         pendleUsd0RoleDefinition.withdrawTo.functionSignature,
    //         [true, false, false, false, false],
    //         [TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC],
    //         [EQUAL_TO, ANY, ANY, ANY, ANY],
    //         [getABICodedAddress(invSafeAddr), EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES],
    //         OPTIONS_NONE
    //     );
    // }

    // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    // async scopePermit(invSafeAddr: string) {
    //     return await this.roles.populateTransaction.scopeFunction(
    //         MANAGER_ROLE_ID,
    //         pendleUsd0RoleDefinition.permit.contractAddr,
    //         pendleUsd0RoleDefinition.permit.functionSignature,
    //         [false, true, false, false, false, false, false],
    //         [TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC],
    //         [ANY, EQUAL_TO, ANY, ANY, ANY, ANY, ANY],
    //         EMPTY_BYTES, [getABICodedAddress(invSafeAddr), EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES, EMPTY_BYTES],
    //         OPTIONS_NONE
    //     );
    // }

    // @note the deposit function automatically mints USYC to the caller address, so we are using the depositFor function instead
    // async scopeDepositFor(invSafeAddr: string) {
    //     return this.scopeAllowFunctions(
    //         pendleUsd0RoleDefinition.depositFor.contractAddr,
    //         [pendleUsd0RoleDefinition.depositFor.functionSignature],
    //         MANAGER_ROLE_ID
    //     )
    // }
}

