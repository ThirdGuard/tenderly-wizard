"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurveWhitelist = exports.curveRoleDefinition = void 0;
const constants_1 = require("../constants");
const roles_v1_json_1 = __importDefault(require("../../contracts/roles_v1.json"));
const utils_1 = require("../utils");
const whitelist_class_1 = require("../whitelist-class");
// @ts-ignore
const hardhat_1 = require("hardhat");
const constants_2 = require("./constants");
const token_approvals_1 = require("../token-approvals");
const curve3poolZapEncoded = (0, utils_1.getABICodedAddress)(constants_2.zap3Pool);
exports.curveRoleDefinition = {
    // function add_liquidity(address _pool, uint256[] _deposit_amounts, uint256 _min_mint_amount, address _receiver)
    addLiquidity3CRV: {
        functionSignature: hardhat_1.ethers.utils
            .id("add_liquidity(address,uint256[4],uint256,address)")
            .substring(0, 10),
        contractAddr: constants_2.zap3Pool,
    },
    // function add_liquidity(address _pool, uint256[] _deposit_amounts, uint256 _min_mint_amount, address _receiver)
    addLiquidityFRAXBP: {
        functionSignature: hardhat_1.ethers.utils
            .id("add_liquidity(address,uint256[3],uint256,address)")
            .substring(0, 10),
        contractAddr: constants_2.zapFraxPool,
    },
    removeLiquidity3CRV: {
        // function remove_liquidity_one_coin(address _pool,uint256 _burn_amount,int128 i,uint256 _min_amount, address _receiver)
        functionSignature: hardhat_1.ethers.utils
            .id("remove_liquidity_one_coin(address,uint256,int128,uint256,address)")
            .substring(0, 10),
        contractAddr: constants_2.zap3Pool,
    },
    removeLiquidityFRAXBP: {
        // function remove_liquidity_one_coin(address _pool,uint256 _burn_amount,int128 i,uint256 _min_amount, address _receiver)
        functionSignature: hardhat_1.ethers.utils
            .id("remove_liquidity_one_coin(address,uint256,int128,uint256,address)")
            .substring(0, 10),
        contractAddr: constants_2.zapFraxPool,
    },
    // function deposit(uint256 _pid, uint256 _amount, bool _stake)
    depositLp: {
        functionSignature: hardhat_1.ethers.utils
            .id("deposit(uint256,uint256,bool)")
            .substring(0, 10),
        contractAddr: constants_2.convexBooster,
    },
    //function exchange(int128 i, int128 j,  int128 dx, uint256 min_dy)
    exchange: {
        functionSignature: hardhat_1.ethers.utils.id("exchange(int128,int128,uint256,uint256)").substring(0, 10),
        contractAddr: constants_1.CURVE_3POOL_ADDR,
    },
    //@note everything below would need to be in another "update" when we add more pools to the strategy
    // function withdrawAllAndUnwrap(bool claim)
    withdrawLpAndClaim: {
        functionSignature: hardhat_1.ethers.utils
            .id("withdrawAllAndUnwrap(bool)")
            .substring(0, 10),
        //@note this would be varying based on the number of pools entered
        contractAddr: constants_1.MIM_CRV_REWARDS_ADDR,
    },
    withdrawAndUnWrap: {
        functionSignature: hardhat_1.ethers.utils
            .id("withdrawAndUnwrap(uint256,bool)")
            .substring(0, 10),
        //@note this would be varying based on the number of pools entered
        contractAddr: constants_1.MIM_CRV_REWARDS_ADDR,
    },
    //@note this would be varying based on the number of pools entered
    getReward: {
        functionSignature: hardhat_1.ethers.utils.id("getReward()").substring(0, 10),
        contractAddr: constants_1.MIM_CRV_REWARDS_ADDR,
    },
};
// Curve whitelisting class contains all the whitelisting requirements needed by the manager to carry out the strategy
class CurveWhitelist extends whitelist_class_1.Whitelist {
    constructor(invRolesAddr, caller) {
        super(invRolesAddr, caller);
    }
    async getFullScope(invSafeAddr) {
        // all targets need to be scoped first
        const targetLpTokens = [constants_1.MIM_LP_ADDR, constants_1.MIM_LP_ADDR]; //@audit-info need to add other pools (one of scoping fails with a single param)
        const targetTokens = [constants_1.DAI_ADDR, constants_1.USDC_ADDR, constants_1.USDT_ADDR, constants_1.MIM_LP_ADDR, constants_1.MIM_ADDR, constants_1.FXS_ADDR, constants_1.CRV_ADDR, constants_1.CVX_ADDR];
        const targetContracts = [constants_2.zap3Pool, constants_2.zapFraxPool, constants_2.convexBooster, constants_1.MIM_CRV_REWARDS_ADDR];
        const targetsToScope = [
            ...targetTokens,
            ...targetLpTokens,
            ...targetContracts,
        ];
        const scopeTargetTxs = await this.scopeTargets(targetsToScope, constants_1.MANAGER_ROLE_ID);
        // build a multisend transaction bundle that can scope all functions & parameters
        const txs = [
            ...scopeTargetTxs,
            await (0, token_approvals_1.tokenApprovals)(this.roles),
            await this.scopeMIMLPApprovals(),
            await this.scopeAddLiquidityZap(invSafeAddr, targetLpTokens),
            await this.scopeRemoveLiquidityZap(invSafeAddr, targetLpTokens),
            await this.scopeDepositLiquidityConvex(),
            await this.scopeWithdrawAllAndUnwrap(),
            await this.scopeWithdrawAndUnwrap(),
            await this.scopeGetRewardConvex(),
            ...await this.scope3poolExchange(),
        ].flat();
        return (0, utils_1.createMultisendTx)(txs, constants_1.MULTISEND_ADDR);
    }
    async build(acRolesAddr, invSafeAddr) {
        //get the bundle of whitelisting txs
        const metaTx = await this.getFullScope(invSafeAddr);
        //security needs to indirectly execute this bundle via acRoles
        const acRoles = new hardhat_1.ethers.Contract(acRolesAddr, roles_v1_json_1.default, this.caller);
        // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
        return await acRoles.populateTransaction.execTransactionWithRole(constants_1.MULTISEND_ADDR, constants_1.ZERO_VALUE, metaTx.data, constants_1.SAFE_OPERATION_DELEGATECALL, constants_1.SECURITY_ROLE_ID, true, { gasLimit: 1000000 });
    }
    async execute(acRolesAddr, invSafeAddr) {
        const populatedTx = await this.build(acRolesAddr, invSafeAddr);
        const tx = await this.caller.sendTransaction({
            ...populatedTx,
            gasLimit: 5000000,
        });
        console.log("Successfully executed MIM/3POOL Convex strategy whitelisting");
    }
    async scopeMIMLPApprovals() {
        const scopeParameterAsOneOf = await this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, constants_1.MIM_LP_ADDR, constants_1.APPROVAL_SIG, 0, //parameter index
        constants_1.TYPE_STATIC, [curve3poolZapEncoded, (0, utils_1.getABICodedAddress)(constants_2.convexBooster)]);
        return scopeParameterAsOneOf;
    }
    async scopeAddLiquidityZap(invSafeAddr, pools) {
        const scopeFunctionPromise = this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.addLiquidity3CRV.contractAddr, exports.curveRoleDefinition.addLiquidity3CRV.functionSignature, [false, false, false, false, false, false, true], [
            constants_1.TYPE_STATIC,
            constants_1.TYPE_STATIC,
            constants_1.TYPE_STATIC,
            constants_1.TYPE_STATIC,
            constants_1.TYPE_STATIC,
            constants_1.TYPE_STATIC,
            constants_1.TYPE_STATIC,
        ], [constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.EQUAL_TO], [
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            (0, utils_1.getABICodedAddress)(invSafeAddr),
        ], constants_1.OPTIONS_NONE);
        const poolArray = pools.map((pool) => (0, utils_1.getABICodedAddress)(pool));
        const scopeParameterAsOneOfPromise = this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.addLiquidity3CRV.contractAddr, exports.curveRoleDefinition.addLiquidity3CRV.functionSignature, 0, //parameter index
        constants_1.TYPE_STATIC, poolArray);
        return Promise.all([scopeFunctionPromise, scopeParameterAsOneOfPromise]);
    }
    async scopeRemoveLiquidityZap(invSafeAddr, pools) {
        // function remove_liquidity_one_coin(address _pool,uint256 _burn_amount,int128 i,uint256 _min_amount, address _receiver)
        const scopeFunctionPromise = this.roles.populateTransaction.scopeFunction(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.removeLiquidity3CRV.contractAddr, exports.curveRoleDefinition.removeLiquidity3CRV.functionSignature, [false, false, false, false, true], [constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC, constants_1.TYPE_STATIC], [constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.ANY, constants_1.EQUAL_TO], [
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            constants_1.EMPTY_BYTES,
            (0, utils_1.getABICodedAddress)(invSafeAddr),
        ], constants_1.OPTIONS_NONE);
        const poolArray = pools.map((pool) => (0, utils_1.getABICodedAddress)(pool));
        const scopeParameterAsOneOfPromise = this.roles.populateTransaction.scopeParameterAsOneOf(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.removeLiquidity3CRV.contractAddr, exports.curveRoleDefinition.removeLiquidity3CRV.functionSignature, 0, //parameter index
        constants_1.TYPE_STATIC, poolArray);
        return Promise.all([scopeFunctionPromise, scopeParameterAsOneOfPromise]);
    }
    //scope convex desposit target
    // not safe to scope pool1d
    // scope params
    // poolId => true
    // amount => false
    // stake => true
    async scopeDepositLiquidityConvex() {
        const scopeFunctionPromise = this.roles.populateTransaction.scopeAllowFunction(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.depositLp.contractAddr, exports.curveRoleDefinition.depositLp.functionSignature, constants_1.OPTIONS_DELEGATECALL);
        return Promise.all([scopeFunctionPromise]);
    }
    async scopeGetRewardConvex() {
        const scopeFunctionPromise = this.roles.populateTransaction.scopeAllowFunction(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.getReward.contractAddr, exports.curveRoleDefinition.getReward.functionSignature, constants_1.OPTIONS_DELEGATECALL);
        return Promise.all([scopeFunctionPromise]);
    }
    async scopeWithdrawAndUnwrap() {
        const scopeFunctionPromise = this.roles.populateTransaction.scopeAllowFunction(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.withdrawAndUnWrap.contractAddr, exports.curveRoleDefinition.withdrawAndUnWrap.functionSignature, constants_1.OPTIONS_DELEGATECALL);
        return Promise.all([scopeFunctionPromise]);
    }
    async scopeWithdrawAllAndUnwrap() {
        const scopeFunctionPromise = this.roles.populateTransaction.scopeAllowFunction(constants_1.MANAGER_ROLE_ID, exports.curveRoleDefinition.withdrawLpAndClaim.contractAddr, exports.curveRoleDefinition.withdrawLpAndClaim.functionSignature, constants_1.OPTIONS_DELEGATECALL);
        return Promise.all([scopeFunctionPromise]);
    }
    // function add_liquidity(address _pool, uint256[] _deposit_amounts, uint256 _min_mint_amount, address _receiver)
    // async scopeAddLiquidityReceiver(invSafeAddr: string) {
    //     return await this.roles.populateTransaction.scopeParameter(
    //         MANAGER_ROLE_ID,
    //         curveRoleDefinition.addLiquidity3CRV.contractAddr,
    //         curveRoleDefinition.addLiquidity3CRV.functionSignature,
    //         3, //parameter index
    //         TYPE_STATIC,
    //         EQUAL_TO,
    //         getABICodedAddress(invSafeAddr)
    //     );
    // }
    //@note this was initially in sdai but has been moved here.
    // function exchange(int128 i, int128 j, int128 dx, uint256 min_dy)
    async scope3poolExchange() {
        // This scopedAllowFunction allows calls to 3pool exchange with any params
        return await this.scopeAllowFunctions(exports.curveRoleDefinition.exchange.contractAddr, [exports.curveRoleDefinition.exchange.functionSignature], constants_1.MANAGER_ROLE_ID);
    }
}
exports.CurveWhitelist = CurveWhitelist;
