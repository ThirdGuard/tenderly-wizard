"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendleEthenaWhitelist = void 0;
const constants_1 = require("../constants");
const roles_v1_json_1 = __importDefault(require("../../contracts/roles_v1.json"));
const utils_1 = require("../utils");
const whitelist_class_1 = require("../whitelist-class");
// @ts-ignore
const hardhat_1 = require("hardhat");
// const hre: HardhatRuntimeEnvironment = require("hardhat");
const curveUsdcUsdeContractEncoded = (0, utils_1.getABICodedAddress)(constants_1.CURVE_USDC_USDE_ADDR);
const pendleRouterV4Encoded = (0, utils_1.getABICodedAddress)(constants_1.PENDLE_ROUTER_V4_ADDR);
const curve3poolContractEncoded = (0, utils_1.getABICodedAddress)(constants_1.CURVE_3POOL_ADDR);
const sDaiAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.SDAI_ADDR);
const psmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.PSM_USDC_ADDR);
const joinPsmAddrEncoded = (0, utils_1.getABICodedAddress)(constants_1.JOIN_PSM_USDC_ADDR);
const usdcEncoded = (0, utils_1.getABICodedAddress)(constants_1.USDC_ADDR);
const usdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.USDE_ADDR);
const daiEncoded = (0, utils_1.getABICodedAddress)(constants_1.DAI_ADDR);
const susdeEncoded = (0, utils_1.getABICodedAddress)(constants_1.SUSDE_ADDR);
const gpv2VaultRelayerEncoded = (0, utils_1.getABICodedAddress)(constants_1.GP_V2_VAULT_RELAYER);
const pendleEthenaRoleDefinition = {
    //function note: allows swapping between USDe <> USDC. USDe is a stablecoin backed by derivatives run by Ethena
    exchangeUsdc: {
        functionSignature: hardhat_1.ethers.utils.id("exchange(int128,int128,uint256,uint256)").substring(0, 10),
        contractAddr: constants_1.CURVE_USDC_USDE_ADDR,
    },
    //function note: allows user to swap from any token to any Pendle PT. A PT is a token that allows you to earn fixed interest by just holding it
    swapExactTokenForPt: {
        functionSignature: hardhat_1.ethers.utils.id("swapExactTokenForPt(address,address,uint256,(uint256,uint256,uint256,uint256,uint256),(address,uint256,address,address,(uint8,address,bytes,bool)),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows user to swap from any PT to any token
    swapExactPtForToken: {
        functionSignature: hardhat_1.ethers.utils.id("swapExactPtForToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP, by providing a token and a PT as input
    addLiquidityDualTokenAndPt: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquidityDualTokenAndPt(address,address,(address,uint256,address,address,(uint8,address,bytes,bool)),uint256,uint256)").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP, by providing an SY token and a PT as input
    addLiquidityDualSyAndPt: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquidityDualSyAndPt(address,address,uint256,uint256,uint256)").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP, by providing only a PT as input
    addLiquiditySinglePt: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquiditySinglePt(address,address,uint256,uint256,(uint256,uint256,uint256,uint256,uint256),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP, by providing only a single token as input
    addLiquiditySingleToken: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquiditySingleToken(address,address,uint256,(uint256,uint256,uint256,uint256,uint256),(address,uint256,address,address,(uint8,address,bytes,bool)),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP, by providing only a single SY token as input
    addLiquiditySingleSy: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquiditySingleSy(address,address,uint256,uint256,(uint256,uint256,uint256,uint256,uint256),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP their PT but keep their corresponding YT
    addLiquiditySingleTokenKeepYt: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquiditySingleTokenKeepYt(address,address,uint256,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to LP their PT but keep their corresponding YT
    addLiquiditySingleSyKeepYt: {
        functionSignature: hardhat_1.ethers.utils.id("addLiquiditySingleSyKeepYt(address,address,uint256,uint256,uint256)").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //fuction note: allows a user to remove their LP and receive both SY token and PT as output
    removeLiquidityDualSyAndPt: {
        functionSignature: hardhat_1.ethers.utils.id("removeLiquidityDualSyAndPt(address,address,uint256,uint256,uint256)").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to remove their LP for PT as output.
    removeLiquiditySinglePt: {
        functionSignature: hardhat_1.ethers.utils.id("removeLiquiditySinglePt(address,address,uint256,uint256,(uint256,uint256,uint256,uint256,uint256),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to remove their LP for token as output.
    removeLiquiditySingleToken: {
        functionSignature: hardhat_1.ethers.utils.id("removeLiquiditySingleToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)),(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to remove their LP for SY token as output.
    removeLiquiditySingleSy: {
        functionSignature: hardhat_1.ethers.utils.id("removeLiquiditySingleSy(address,address,uint256,uint256,(address,uint256,((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],((uint256,uint256,uint256,uint8,address,address,address,address,uint256,uint256,uint256,bytes),bytes,uint256)[],bytes))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: allows a user to claim their farmed token rewards earned for being an LP
    redeemDueInterestAndRewards: {
        functionSignature: hardhat_1.ethers.utils.id("redeemDueInterestAndRewards(address,address[],address[],address[])").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    //function note: this lets a user burn their PT tokens in exchange for that PT's underlying token (for this strategy that would be sUSDe)
    redeemPyToToken: {
        functionSignature: hardhat_1.ethers.utils.id("redeemPyToToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    // function note: this lets the user burn thier SY tokens in exchange for the underlying asset
    redeemSyToToken: {
        functionSignature: hardhat_1.ethers.utils.id("redeemSyToToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)))").substring(0, 10),
        contractAddr: constants_1.PENDLE_ROUTER_V4_ADDR,
    },
    // function note: this starts the unstaking process sUSDe -> USDe
    cooldownShares: {
        functionSignature: hardhat_1.ethers.utils.id("cooldownShares(uint256)").substring(0, 10),
        contractAddr: constants_1.SUSDE_ADDR,
    },
    // function note: this completes the unstaking process sUSDe -> USDe
    unstake: {
        functionSignature: hardhat_1.ethers.utils.id("unstake(address)").substring(0, 10),
        contractAddr: constants_1.SUSDE_ADDR,
    },
    // function note: this allows staking USDe -> sUSDe
    deposit: {
        functionSignature: hardhat_1.ethers.utils.id("deposit(uint256,address)").substring(0, 10),
        contractAddr: constants_1.SUSDE_ADDR,
    },
};
// Pendle USDE whitelisting class contains all the whitelisting requirements needed by the manager to carry out the strategy
class PendleEthenaWhitelist extends whitelist_class_1.Whitelist {
    constructor(invRolesAddr, caller) {
        super(invRolesAddr, caller);
    }
    async getFullScope(invSafeAddr) {
        const targetsToScope = [constants_1.USDE_ADDR, constants_1.SUSDE_ADDR, constants_1.USDC_ADDR, constants_1.CURVE_USDC_USDE_ADDR, constants_1.PT_ETHENA_SUSDE_24_OCT_2024_ADDR, constants_1.PENDLE_ROUTER_V4_ADDR, constants_1.MARKET_ETHENA_SUSDE_24_OCT_2024_ADDR, constants_1.SY_SUSDE_ADDR, constants_1.YT_ETHENA_SUSDE_24_OCT_2024_ADDR];
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, constants_1.MANAGER_ROLE_ID);
        const txs = [
            //bring all target contracts into scope as first step of roles whitelisting
            ...scopeTargetTxs,
            //whitelist via flexible scopeAllowFunction
            ...await this.scopeExchangeUsdc(),
            //whitelist all approvals
            await this.scopeUsdcApprovalTargetAsOneOf(),
            await this.scopeDaiApprovalTargetAsOneOf(),
            await this.scopeUsdeApprovalTargetAsOneOf(),
            await this.scopePtSusdeApprove(),
            await this.scopeSusdeApprove(),
            await this.scopeMarketApprove(),
            await this.scopeSySusdeApprove(),
            await this.scopeYtSusdeApprove(),
            //whitelist pendle actions, all scoped to ensure receiver == invSafe
            await this.scopeSwapExactTokenForPt(invSafeAddr),
            await this.scopeSwapExactPtForToken(invSafeAddr),
            await this.scopeAddLiquiditySinglePt(invSafeAddr),
            await this.scopeAddLiquiditySingleToken(invSafeAddr),
            await this.scopeAddLiquiditySingleSy(invSafeAddr),
            await this.scopeAddLiquidityDualTokenAndPt(invSafeAddr),
            await this.scopeAddLiquiditySingleTokenKeepYt(invSafeAddr),
            await this.scopeAddLiquiditySingleSyKeepYt(invSafeAddr),
            await this.scopeRemoveLiquidityDualSyAndPt(invSafeAddr),
            await this.scopeRemoveLiquiditySinglePt(invSafeAddr),
            await this.scopeRemoveLiquiditySingleToken(invSafeAddr),
            await this.scopeRemoveLiquiditySingleSy(invSafeAddr),
            await this.scopeRedeemPyToToken(invSafeAddr),
            await this.scopeRedeemDueInterestAndRewards(invSafeAddr),
            await this.scopeRedeemSyToToken(invSafeAddr),
            //whitelist direct sUSDe Ethena actions
            await this.scopeCooldownShares(),
            await this.scopeUnstake(invSafeAddr),
            await this.scopeDeposit(invSafeAddr)
        ].flat();
        return (0, utils_1.createMultisendTx)(txs, constants_1.MULTISEND_ADDR);
    }
    async build(acRolesAddr, invSafeAddr) {
        const metaTx = await this.getFullScope(invSafeAddr);
        const acRoles = new hardhat_1.ethers.Contract(acRolesAddr, roles_v1_json_1.default, this.caller);
        return await acRoles.populateTransaction.execTransactionWithRole(constants_1.MULTISEND_ADDR, constants_1.ZERO_VALUE, metaTx.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.SECURITY_ROLE_ID, true);
    }
    async execute(acRolesAddr, invSafeAddr) {
        const populatedTx = await this.build(acRolesAddr, invSafeAddr);
        const tx = await this.caller.sendTransaction({
            ...populatedTx
        });
        console.log("Successfully executed Pendle USDE strategy whitelisting");
    }
    async scopeExchangeUsdc() {
        //no granular scoping here needed as params are just the tokens being swapped (i,j) and the amounts (dx, min_dy)
        //so we use scopeAllow
        return await this.scopeAllowFunctions(pendleEthenaRoleDefinition.exchangeUsdc.contractAddr, [pendleEthenaRoleDefinition.exchangeUsdc.functionSignature], constants_1.MANAGER_ROLE_ID);
    }
    async scopeMarketApprove() {
        return await this.scopeFunctionERC20Approval(constants_1.MARKET_ETHENA_SUSDE_24_OCT_2024_ADDR, pendleRouterV4Encoded);
    }
    async scopePtSusdeApprove() {
        return await this.scopeFunctionERC20Approval(constants_1.PT_ETHENA_SUSDE_24_OCT_2024_ADDR, pendleRouterV4Encoded);
    }
    async scopeYtSusdeApprove() {
        return await this.scopeFunctionERC20Approval(constants_1.YT_ETHENA_SUSDE_24_OCT_2024_ADDR, pendleRouterV4Encoded);
    }
    async scopeUsdeApprovalTargetAsOneOf() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.USDE_ADDR, constants_1.APPROVAL_SIG, 0, constants_1.TYPE_STATIC, [curveUsdcUsdeContractEncoded, pendleRouterV4Encoded, gpv2VaultRelayerEncoded, susdeEncoded]);
    }
    async scopeSusdeApprove() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.SUSDE_ADDR, constants_1.APPROVAL_SIG, 0, constants_1.TYPE_STATIC, [pendleRouterV4Encoded, gpv2VaultRelayerEncoded]);
    }
    async scopeDaiApprovalTargetAsOneOf() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.DAI_ADDR, constants_1.APPROVAL_SIG, 0, constants_1.TYPE_STATIC, [curve3poolContractEncoded, sDaiAddrEncoded, psmAddrEncoded, pendleRouterV4Encoded, gpv2VaultRelayerEncoded]);
    }
    async scopeSySusdeApprove() {
        //allows approval on pendle router
        return await this.scopeFunctionERC20Approval(constants_1.SY_SUSDE_ADDR, pendleRouterV4Encoded);
    }
    async scopeUsdcApprovalTargetAsOneOf() {
        return await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.USDC_ADDR, constants_1.APPROVAL_SIG, 0, constants_1.TYPE_STATIC, 
        //note that the the first two addresses here correspond to the initial sDAI strategy, ensuring those permissions aren't overwritten
        [curve3poolContractEncoded, joinPsmAddrEncoded, curveUsdcUsdeContractEncoded, pendleRouterV4Encoded, gpv2VaultRelayerEncoded]);
    }
    async scopeSwapExactTokenForPt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.swapExactTokenForPt.contractAddr, pendleEthenaRoleDefinition.swapExactTokenForPt.functionSignature, [true, false, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
    }
    // add liquidity functions
    async scopeAddLiquidityDualTokenAndPt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.addLiquidityDualTokenAndPt.contractAddr, pendleEthenaRoleDefinition.addLiquidityDualTokenAndPt.functionSignature, [true, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
    }
    async scopeAddLiquiditySinglePt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.addLiquiditySinglePt.contractAddr, pendleEthenaRoleDefinition.addLiquiditySinglePt.functionSignature, [true, false, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    async scopeAddLiquiditySingleToken(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.addLiquiditySingleToken.contractAddr, pendleEthenaRoleDefinition.addLiquiditySingleToken.functionSignature, [true, false, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
    }
    async scopeAddLiquiditySingleSy(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.addLiquiditySingleSy.contractAddr, pendleEthenaRoleDefinition.addLiquiditySingleSy.functionSignature, [true, false, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    async scopeAddLiquiditySingleTokenKeepYt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.addLiquiditySingleTokenKeepYt.contractAddr, pendleEthenaRoleDefinition.addLiquiditySingleTokenKeepYt.functionSignature, [true, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_SEND);
    }
    async scopeAddLiquiditySingleSyKeepYt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.addLiquiditySingleSyKeepYt.contractAddr, pendleEthenaRoleDefinition.addLiquiditySingleSyKeepYt.functionSignature, [true, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    // remove liquidity functions
    async scopeRemoveLiquidityDualSyAndPt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.removeLiquidityDualSyAndPt.contractAddr, pendleEthenaRoleDefinition.removeLiquidityDualSyAndPt.functionSignature, [true, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    async scopeRemoveLiquiditySinglePt(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.removeLiquiditySinglePt.contractAddr, pendleEthenaRoleDefinition.removeLiquiditySinglePt.functionSignature, [true, false, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    async scopeRemoveLiquiditySingleToken(invSafeAddr) {
        const paramTypes = Array(24).fill(constants_1.TYPE_STATIC);
        let isScoped = Array(24).fill(false);
        let comparisonOperators = Array(24).fill(constants_1.ANY);
        let comparisonValues = Array(24).fill(constants_1.EMPTY_BYTES);
        isScoped[0] = true;
        comparisonOperators[0] = constants_1.EQUAL_TO;
        comparisonValues[0] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        return await Promise.all([await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.removeLiquiditySingleToken.contractAddr, pendleEthenaRoleDefinition.removeLiquiditySingleToken.functionSignature, isScoped, paramTypes, comparisonOperators, comparisonValues, constants_1.OPTIONS_NONE),
            this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.removeLiquiditySingleToken.contractAddr, pendleEthenaRoleDefinition.removeLiquiditySingleToken.functionSignature, constants_1.INDEX_TOKEN_OUT_REMOVE_LIQUIDITY_SINGLE_TOKEN, constants_1.TYPE_STATIC, [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded])]);
    }
    async scopeRemoveLiquiditySingleSy(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.removeLiquiditySingleSy.contractAddr, pendleEthenaRoleDefinition.removeLiquiditySingleSy.functionSignature, [true, false, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    // Redeem functions
    async scopeRedeemDueInterestAndRewards(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.redeemDueInterestAndRewards.contractAddr, pendleEthenaRoleDefinition.redeemDueInterestAndRewards.functionSignature, [true, false, false, false], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.EQUAL_TO, constants_1.ANY, constants_1.ANY, constants_1.ANY], [(0, utils_1.getABICodedAddress)(invSafeAddr), constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES, constants_1.EMPTY_BYTES], constants_1.OPTIONS_NONE);
    }
    async scopeRedeemPyToToken(invSafeAddr) {
        const paramTypes = Array(14).fill(constants_1.TYPE_STATIC);
        let isScoped = Array(14).fill(false);
        let comparisonOperators = Array(14).fill(constants_1.ANY);
        let comparisonValues = Array(14).fill(constants_1.EMPTY_BYTES);
        isScoped[0] = true;
        // isScoped[9] = true
        comparisonOperators[0] = constants_1.EQUAL_TO;
        // comparisonOperators[9] = EQUAL_TO
        comparisonValues[0] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        // comparisonValues[9] = EMPTY_BYTES
        return await Promise.all([await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.redeemPyToToken.contractAddr, pendleEthenaRoleDefinition.redeemPyToToken.functionSignature, isScoped, paramTypes, comparisonOperators, comparisonValues, constants_1.OPTIONS_NONE),
            this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.redeemPyToToken.contractAddr, pendleEthenaRoleDefinition.redeemPyToToken.functionSignature, 4, constants_1.TYPE_STATIC, [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded])]);
    }
    async scopeRedeemSyToToken(invSafeAddr) {
        //set default scoping values
        const paramTypes = Array(14).fill(constants_1.TYPE_STATIC);
        let isScoped = Array(14).fill(false);
        let comparisonOperators = Array(14).fill(constants_1.ANY);
        let comparisonValues = Array(14).fill(constants_1.EMPTY_BYTES);
        //alter default above for scoping
        //scope the 1st and 10th occurence of 32 bytes in the data, 1st corresponding to receiver, 10th to SwapType
        isScoped[0] = true;
        isScoped[constants_1.INDEX_SWAP_TYPE_REDEEM_SY_TO_TOKEN] = true;
        //set 1st and 10th occurence of 32 bytes in the data to enforce equal to comparison
        comparisonOperators[0] = constants_1.EQUAL_TO;
        comparisonOperators[constants_1.INDEX_SWAP_TYPE_REDEEM_SY_TO_TOKEN] = constants_1.EQUAL_TO;
        //set 1st and 10th occurence of 32 bytes in the data to equal a select value
        //set receiver to invSafeAddr
        comparisonValues[0] = (0, utils_1.getABICodedAddress)(invSafeAddr);
        //set SwapType enum to 0. Meaning no aggregator swap is allowed
        //if you change this to 0x0000000000000000000000000000000000000000000000000000000000000001, representing a kyberswap swap it will fail
        comparisonValues[constants_1.INDEX_SWAP_TYPE_REDEEM_SY_TO_TOKEN] = constants_1.EMPTY_BYTES;
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.redeemSyToToken.contractAddr, pendleEthenaRoleDefinition.redeemSyToToken.functionSignature, isScoped, paramTypes, comparisonOperators, comparisonValues, constants_1.OPTIONS_NONE);
    }
    async scopeSwapExactPtForToken(invSafeAddr) {
        //set default scoping values
        const paramTypes = Array(23).fill(constants_1.TYPE_STATIC);
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
        return await Promise.all([await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.swapExactPtForToken.contractAddr, pendleEthenaRoleDefinition.swapExactPtForToken.functionSignature, isScoped, paramTypes, comparisonOperators, comparisonValues, constants_1.OPTIONS_NONE),
            this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.swapExactPtForToken.contractAddr, pendleEthenaRoleDefinition.swapExactPtForToken.functionSignature, constants_1.INDEX_TOKEN_OUT_SWAP_PT_TO_TOKEN, constants_1.TYPE_STATIC, [usdcEncoded, daiEncoded, usdeEncoded, susdeEncoded])]);
    }
    async scopeCooldownShares() {
        //no granular scoping here needed as params are just the tokens being withdrawn
        //so we use scopeAllow
        return await this.scopeAllowFunctions(pendleEthenaRoleDefinition.cooldownShares.contractAddr, [pendleEthenaRoleDefinition.cooldownShares.functionSignature], constants_1.MANAGER_ROLE_ID);
    }
    async scopeUnstake(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.unstake.contractAddr, pendleEthenaRoleDefinition.unstake.functionSignature, [true], [constants_1.TYPE_STATIC], [constants_1.EQUAL_TO], [(0, utils_1.getABICodedAddress)(invSafeAddr)], constants_1.OPTIONS_NONE);
    }
    async scopeDeposit(invSafeAddr) {
        return await this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, pendleEthenaRoleDefinition.deposit.contractAddr, pendleEthenaRoleDefinition.deposit.functionSignature, [false, true], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.ANY, constants_1.EQUAL_TO], [constants_1.EMPTY_BYTES, (0, utils_1.getABICodedAddress)(invSafeAddr)], constants_1.OPTIONS_NONE);
    }
}
exports.PendleEthenaWhitelist = PendleEthenaWhitelist;
