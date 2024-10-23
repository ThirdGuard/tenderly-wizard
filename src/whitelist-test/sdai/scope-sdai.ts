
import { ANY, APPROVAL_SIG, CURVE_3POOL_ADDR, DAI_ADDR, EMPTY_BYTES, EQUAL_TO, JOIN_PSM_USDC_ADDR, MANAGER_ROLE_ID, MULTISEND_ADDR, OPTIONS_SEND, PSM_USDC_ADDR, SAFE_OPERATION_DELEGATECALL, SDAI_ADDR, SECURITY_ROLE_ID, TYPE_STATIC, USDC_ADDR, USDT_ADDR, ZERO_VALUE } from "../constants"
import ROLES_V1_MASTER_COPY_ABI from "../../contracts/roles_v1.json"
import { createMultisendTx, getABICodedAddress } from "../utils";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const hre: HardhatRuntimeEnvironment = require("hardhat");

const curve3poolContractEncoded = getABICodedAddress(CURVE_3POOL_ADDR);
const sDaiAddrEncoded = getABICodedAddress(SDAI_ADDR);
const psmAddrEncoded = getABICodedAddress(PSM_USDC_ADDR);
const joinPsmAddrEncoded = getABICodedAddress(JOIN_PSM_USDC_ADDR);

const sDaiRoleDefinition = {
    buyGem: {
        functionSignature: hre.ethers.utils.id("buyGem(address,uint256)").substring(0, 10),
        contractAddr: PSM_USDC_ADDR,
    },
    sellGem: {
        functionSignature: hre.ethers.utils.id("sellGem(address,uint256)").substring(0, 10),
        contractAddr: PSM_USDC_ADDR,
    },
    depositDai: {
        //function deposit(uint256 assets, address receiver)
        functionSignature: hre.ethers.utils.id("deposit(uint256,address)").substring(0, 10),
        contractAddr: SDAI_ADDR,
    },
    //function withdraw(uint256 assets, address receiver, address owner)
    withdrawDai: {
        functionSignature: hre.ethers.utils.id("withdraw(uint256,address,address)").substring(0, 10),
        contractAddr: SDAI_ADDR,
    },
    //function exchange(int128 i, int128 j,  int128 dx, uint256 min_dy)
    exchange: {
        functionSignature: hre.ethers.utils.id("exchange(int128,int128,uint256,uint256)").substring(0, 10),
        contractAddr: CURVE_3POOL_ADDR,
    },
};


// sdai whitelisting class contains all the whitelisting requirements needed by the manager to carry out the strategy
export class SdaiWhitelist extends Whitelist {

    constructor(invRolesAddr: string, caller: SignerWithAddress) {
        super(invRolesAddr, caller);
    }

    async getFullScope(invSafeAddr: string) {
        // all targets need to be scoped first
        const targetsToScope = [DAI_ADDR, USDC_ADDR, USDT_ADDR, CURVE_3POOL_ADDR, SDAI_ADDR, PSM_USDC_ADDR, JOIN_PSM_USDC_ADDR]
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, MANAGER_ROLE_ID)
        // build a multisend transaction bundle that can scope all functions & parameters
        const txs = [
            ...scopeTargetTxs,
            await this.scopeUSDCApprove(),
            await this.scopeUSDTApproval(),
            await this.scopeDAIApproval(),
            await this.scopeBuyGem(invSafeAddr),
            await this.scopeSellGem(invSafeAddr),
            await this.scopeSDAIDeposit(invSafeAddr),
            await this.scopeSDAIWithdraw(invSafeAddr),
            ...await this.scope3poolExchange(),
        ];
        return createMultisendTx(txs, MULTISEND_ADDR)
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
        console.log("Successfully executed sDai strategy whitelisting")
    }

    // function approve(address _spender, uint256 _value)
    async scopeUSDCApprove() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(
            MANAGER_ROLE_ID,
            USDC_ADDR,
            APPROVAL_SIG,
            0, //parameter index
            TYPE_STATIC,
            [
                curve3poolContractEncoded,
                joinPsmAddrEncoded,
            ]
        );
    }


    //function approve(address _spender, uint256 _value)
    async scopeUSDTApproval() {
        return await this.scopeFunctionERC20Approval(
            USDT_ADDR,
            curve3poolContractEncoded
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
            [curve3poolContractEncoded, sDaiAddrEncoded, psmAddrEncoded]
        );
    }

    // function buyGem(address usr, uint256 getAmt)
    async scopeBuyGem(invSafeAddr: string) {
        // This scoped function exchanges DAI for USDC on Maker's USDC-A PSM
        return await this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            sDaiRoleDefinition.buyGem.contractAddr,
            sDaiRoleDefinition.buyGem.functionSignature,
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
            sDaiRoleDefinition.sellGem.contractAddr,
            sDaiRoleDefinition.sellGem.functionSignature,
            [true, false],
            [TYPE_STATIC, TYPE_STATIC],
            [EQUAL_TO, ANY],
            [getABICodedAddress(invSafeAddr), EMPTY_BYTES],
            OPTIONS_SEND
        );
    }

    // function deposit(uint256 assets, address receiver)
    async scopeSDAIDeposit(invSafeAddr: string) {
        // This scoped function deposits DAI to receive sDAI
        return await this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            sDaiRoleDefinition.depositDai.contractAddr,
            sDaiRoleDefinition.depositDai.functionSignature,
            [false, true],
            [TYPE_STATIC, TYPE_STATIC],
            [ANY, EQUAL_TO],
            [EMPTY_BYTES, getABICodedAddress(invSafeAddr)],
            OPTIONS_SEND
        );
    }

    // function withdraw(uint256 assets, address receiver, address owner)
    async scopeSDAIWithdraw(invSafeAddr: string) {
        // This scoped function withdraws DAI by redeeming your sDAI
        return await this.roles.populateTransaction.scopeFunction(
            MANAGER_ROLE_ID,
            sDaiRoleDefinition.withdrawDai.contractAddr,
            sDaiRoleDefinition.withdrawDai.functionSignature,
            [false, true, true],
            [TYPE_STATIC, TYPE_STATIC, TYPE_STATIC],
            [ANY, EQUAL_TO, EQUAL_TO],
            [EMPTY_BYTES, getABICodedAddress(invSafeAddr), getABICodedAddress(invSafeAddr)],
            OPTIONS_SEND
        );
    }

    // function exchange(int128 i, int128 j, int128 dx, uint256 min_dy) 
    async scope3poolExchange() {
        // This scopedAllowFunction allows calls to 3pool exchange with any params
        return await this.scopeAllowFunctions(
            sDaiRoleDefinition.exchange.contractAddr,
            [sDaiRoleDefinition.exchange.functionSignature],
            MANAGER_ROLE_ID
        )
    }

}