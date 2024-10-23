import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
    CURVE_3POOL_ADDR,
    SDAI_ADDR,
    LITE_PSM_USDC_A_ADDR,
    DAI_ADDR,
    USDC_ADDR,
    MANAGER_ROLE_ID,
    MULTISEND_ADDR,
    SAFE_OPERATION_DELEGATECALL,
    SECURITY_ROLE_ID,
    ZERO_VALUE,
    APPROVAL_SIG,
    TYPE_STATIC,
    EMPTY_BYTES,
    EQUAL_TO,
    ANY,
    OPTIONS_SEND,
    PSM_USDC_ADDR,
    JOIN_PSM_USDC_ADDR,
    GP_V2_VAULT_RELAYER,
    CURVE_USDC_USDE_ADDR,
    PENDLE_ROUTER_V4_ADDR,
} from "../constants";
import { createMultisendTx, getABICodedAddress } from "../utils";
import ROLES_V1_MASTER_COPY_ABI from "../../contracts/roles_v1.json"

const hre: HardhatRuntimeEnvironment = require("hardhat");

const curve3poolContractEncoded = getABICodedAddress(CURVE_3POOL_ADDR);
const sDaiAddrEncoded = getABICodedAddress(SDAI_ADDR);
const psmAddrEncoded = getABICodedAddress(PSM_USDC_ADDR);
const joinPsmAddrEncoded = getABICodedAddress(JOIN_PSM_USDC_ADDR)
const curveUsdcUsdeContractEncoded = getABICodedAddress(CURVE_USDC_USDE_ADDR)
const pendleRouterV4Encoded = getABICodedAddress(PENDLE_ROUTER_V4_ADDR)
const gpv2VaultRelayerEncoded = getABICodedAddress(GP_V2_VAULT_RELAYER)
const litePsmAddrEncoded = getABICodedAddress(LITE_PSM_USDC_A_ADDR);

const sDaiUpdateDefinition = {
    buyGem: {
        functionSignature: hre.ethers.utils
            .id("buyGem(address,uint256)")
            .substring(0, 10),
        contractAddr: LITE_PSM_USDC_A_ADDR,
    },
    sellGem: {
        functionSignature: hre.ethers.utils
            .id("sellGem(address,uint256)")
            .substring(0, 10),
        contractAddr: LITE_PSM_USDC_A_ADDR,
    }
};

//
export class SdaiUpdateWhitelist extends Whitelist {
    constructor(invRolesAddr: string, caller: SignerWithAddress) {
        super(invRolesAddr, caller);
    }

    async getFullScope(invSafeAddr: string) {
        // all targets need to be scoped first
        const targetsToScope = [
            LITE_PSM_USDC_A_ADDR,
        ];
        const scopeTargetTxs = await this.scopeTargets(
            targetsToScope,
            MANAGER_ROLE_ID
        );
        // build a multisend transaction bundle that can scope all functions & parameters
        const txs = [
            ...scopeTargetTxs,
            await this.scopeUSDCApprove(),
            await this.scopeDAIApproval(),
            await this.scopeBuyGem(invSafeAddr),
            await this.scopeSellGem(invSafeAddr),
        ];
        return createMultisendTx(txs, MULTISEND_ADDR);
    }

    async build(acRolesAddr: string, invSafeAddr: string) {
        //get the bundle of whitelisting txs
        const metaTx = await this.getFullScope(invSafeAddr)

        //security needs to indirectly execute this bundle via acRoles
        const acRoles = new hre.ethers.Contract(acRolesAddr, ROLES_V1_MASTER_COPY_ABI, this.caller)

        // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
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
        console.log("Successfully executed USDC sDai (Lite PSM USDC A) strategy whitelisting")
    }

    // function approve(address _spender, uint256 _value)
    async scopeUSDCApprove() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            USDC_ADDR,
            APPROVAL_SIG,
            0, // parameter index
            TYPE_STATIC,
            [
                curve3poolContractEncoded,
                joinPsmAddrEncoded,
                curveUsdcUsdeContractEncoded,
                pendleRouterV4Encoded,
                gpv2VaultRelayerEncoded,
                litePsmAddrEncoded
            ]
        );
    }

    // function approve(address usr, uint256 wad)
    async scopeDAIApproval() {
        // With the scopeParameterAsOneOf usage here role members can call approvals targetted at any of the encoded contract addresses provided below
        return await this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            DAI_ADDR,
            APPROVAL_SIG,
            0, //parameter index
            TYPE_STATIC,
            [
                curve3poolContractEncoded,
                sDaiAddrEncoded,
                psmAddrEncoded,
                pendleRouterV4Encoded,
                gpv2VaultRelayerEncoded,
                litePsmAddrEncoded
            ]
        );
    }

    // function buyGem(address usr, uint256 getAmt)
    async scopeBuyGem(invSafeAddr: string) {
        // This scoped function exchanges DAI for USDC on Maker's USDC-A PSM
        return await this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            sDaiUpdateDefinition.buyGem.contractAddr,
            sDaiUpdateDefinition.buyGem.functionSignature,
            [true, false],
            [TYPE_STATIC, TYPE_STATIC],
            [EQUAL_TO, ANY],
            [getABICodedAddress(invSafeAddr), EMPTY_BYTES],
            OPTIONS_SEND
        );
    }

    // function sellGem(address usr, uint256 getAmt)
    async scopeSellGem(invSafeAddr: string) {
        // This scoped function exchanges USDC for DAI on Maker's USDC-A PSM
        return await this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            sDaiUpdateDefinition.sellGem.contractAddr,
            sDaiUpdateDefinition.sellGem.functionSignature,
            [true, false],
            [TYPE_STATIC, TYPE_STATIC],
            [EQUAL_TO, ANY],
            [getABICodedAddress(invSafeAddr), EMPTY_BYTES],
            OPTIONS_SEND
        );
    }
}
