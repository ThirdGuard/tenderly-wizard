import {
  ANY,
  APPROVAL_SIG,
  CURVE_3POOL_ADDR,
  DAI_ADDR,
  EMPTY_BYTES,
  EQUAL_TO,
  JOIN_PSM_USDC_ADDR,
  MANAGER_ROLE_ID,
  MIM_LP_ADDR,
  MULTISEND_ADDR,
  OPTIONS_DELEGATECALL,
  OPTIONS_NONE,
  OPTIONS_SEND,
  PSM_USDC_ADDR,
  SAFE_OPERATION_DELEGATECALL,
  SDAI_ADDR,
  SECURITY_ROLE_ID,
  TYPE_STATIC,
  USDC_ADDR,
  USDT_ADDR,
  ZERO_VALUE,
  MIM_CRV_REWARDS_ADDR,
  MIM_ADDR,
  CRV_ADDR,
  CVX_ADDR,
  FXS_ADDR
} from "../constants";
import ROLES_V1_MASTER_COPY_ABI from "../../contracts/roles_v1.json";
import {
  createMultisendTx,
  getABICodedAddress,
} from "../utils";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { ethers } from "hardhat";
import {
  convexBooster,
  zap3Pool,
  zapFraxPool,
} from "./constants";
import { float } from "hardhat/internal/core/params/argumentTypes";
import { tokenApprovals } from "../token-approvals";

const curve3poolZapEncoded = getABICodedAddress(zap3Pool);

export const curveRoleDefinition = {
  // function add_liquidity(address _pool, uint256[] _deposit_amounts, uint256 _min_mint_amount, address _receiver)
  addLiquidity3CRV: {
    functionSignature: ethers.utils
      .id("add_liquidity(address,uint256[4],uint256,address)")
      .substring(0, 10),
    contractAddr: zap3Pool,
  },
  // function add_liquidity(address _pool, uint256[] _deposit_amounts, uint256 _min_mint_amount, address _receiver)
  addLiquidityFRAXBP: {
    functionSignature: ethers.utils
      .id("add_liquidity(address,uint256[3],uint256,address)")
      .substring(0, 10),
    contractAddr: zapFraxPool,
  },
  removeLiquidity3CRV: {
    // function remove_liquidity_one_coin(address _pool,uint256 _burn_amount,int128 i,uint256 _min_amount, address _receiver)
    functionSignature: ethers.utils
      .id("remove_liquidity_one_coin(address,uint256,int128,uint256,address)")
      .substring(0, 10),
    contractAddr: zap3Pool,
  },
  removeLiquidityFRAXBP: {
    // function remove_liquidity_one_coin(address _pool,uint256 _burn_amount,int128 i,uint256 _min_amount, address _receiver)
    functionSignature: ethers.utils
      .id("remove_liquidity_one_coin(address,uint256,int128,uint256,address)")
      .substring(0, 10),
    contractAddr: zapFraxPool,
  },
  // function deposit(uint256 _pid, uint256 _amount, bool _stake)
  depositLp: {
    functionSignature: ethers.utils
      .id("deposit(uint256,uint256,bool)")
      .substring(0, 10),
    contractAddr: convexBooster,
  },

  //function exchange(int128 i, int128 j,  int128 dx, uint256 min_dy)
  exchange: {
    functionSignature: ethers.utils.id("exchange(int128,int128,uint256,uint256)").substring(0, 10),
    contractAddr: CURVE_3POOL_ADDR,
  },

  //@note everything below would need to be in another "update" when we add more pools to the strategy
  // function withdrawAllAndUnwrap(bool claim)
  withdrawLpAndClaim: {
    functionSignature: ethers.utils
      .id("withdrawAllAndUnwrap(bool)")
      .substring(0, 10),
    //@note this would be varying based on the number of pools entered
    contractAddr: MIM_CRV_REWARDS_ADDR,
  },

  withdrawAndUnWrap: {
    functionSignature: ethers.utils
      .id("withdrawAndUnwrap(uint256,bool)")
      .substring(0, 10),
    //@note this would be varying based on the number of pools entered
    contractAddr: MIM_CRV_REWARDS_ADDR,
  },

  //@note this would be varying based on the number of pools entered
  getReward: {
    functionSignature: ethers.utils.id("getReward()").substring(0, 10),
    contractAddr: MIM_CRV_REWARDS_ADDR,
  },
};

// Curve whitelisting class contains all the whitelisting requirements needed by the manager to carry out the strategy
export class CurveWhitelist extends Whitelist {
  constructor(invRolesAddr: string, caller: SignerWithAddress) {
    super(invRolesAddr, caller);
  }

  async getFullScope(invSafeAddr: string) {
    // all targets need to be scoped first
    const targetLpTokens = [MIM_LP_ADDR, MIM_LP_ADDR]; //@audit-info need to add other pools (one of scoping fails with a single param)
    const targetTokens = [DAI_ADDR, USDC_ADDR, USDT_ADDR, MIM_LP_ADDR, MIM_ADDR, FXS_ADDR, CRV_ADDR, CVX_ADDR];
    const targetContracts = [zap3Pool, zapFraxPool, convexBooster, MIM_CRV_REWARDS_ADDR];
    const targetsToScope = [
      ...targetTokens,
      ...targetLpTokens,
      ...targetContracts,
    ];
    const scopeTargetTxs = await this.scopeTargets(
      targetsToScope,
      MANAGER_ROLE_ID
    );
    // build a multisend transaction bundle that can scope all functions & parameters
    const txs = [
      ...scopeTargetTxs,
      await tokenApprovals(this.roles),
      await this.scopeMIMLPApprovals(),
      await this.scopeAddLiquidityZap(invSafeAddr, targetLpTokens),
      await this.scopeRemoveLiquidityZap(invSafeAddr, targetLpTokens),
      await this.scopeDepositLiquidityConvex(),
      await this.scopeWithdrawAllAndUnwrap(),
      await this.scopeWithdrawAndUnwrap(),
      await this.scopeGetRewardConvex(),
      ...await this.scope3poolExchange(),
    ].flat();
    return createMultisendTx(txs, MULTISEND_ADDR);
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
      true,
      { gasLimit: 1000000 }
    );
  }

  async execute(acRolesAddr: string, invSafeAddr: string) {
    const populatedTx = await this.build(acRolesAddr, invSafeAddr);
    const tx = await this.caller.sendTransaction({
      ...populatedTx,
      gasLimit: 5000000,
    });
    console.log("Successfully executed MIM/3POOL Convex strategy whitelisting");
  }

  async scopeMIMLPApprovals() {
    const scopeParameterAsOneOf =
      await this.roles.populateTransaction.scopeParameterAsOneOf(
        MANAGER_ROLE_ID,
        MIM_LP_ADDR,
        APPROVAL_SIG,
        0, //parameter index
        TYPE_STATIC,
        [curve3poolZapEncoded, getABICodedAddress(convexBooster)]
      );

    return scopeParameterAsOneOf;
  }


  async scopeAddLiquidityZap(invSafeAddr: string, pools: string[]) {
    const scopeFunctionPromise = this.roles.populateTransaction.scopeFunction(
      MANAGER_ROLE_ID,
      curveRoleDefinition.addLiquidity3CRV.contractAddr,
      curveRoleDefinition.addLiquidity3CRV.functionSignature,
      [false, false, false, false, false, false, true],
      [
        TYPE_STATIC,
        TYPE_STATIC,
        TYPE_STATIC,
        TYPE_STATIC,
        TYPE_STATIC,
        TYPE_STATIC,
        TYPE_STATIC,
      ],
      [ANY, ANY, ANY, ANY, ANY, ANY, EQUAL_TO],
      [
        EMPTY_BYTES,
        EMPTY_BYTES,
        EMPTY_BYTES,
        EMPTY_BYTES,
        EMPTY_BYTES,
        EMPTY_BYTES,
        getABICodedAddress(invSafeAddr),
      ],
      OPTIONS_NONE
    );

    const poolArray = pools.map((pool) => getABICodedAddress(pool));
    const scopeParameterAsOneOfPromise =
      this.roles.populateTransaction.scopeParameterAsOneOf(
        MANAGER_ROLE_ID,
        curveRoleDefinition.addLiquidity3CRV.contractAddr,
        curveRoleDefinition.addLiquidity3CRV.functionSignature,
        0, //parameter index
        TYPE_STATIC,
        poolArray
      );

    return Promise.all([scopeFunctionPromise, scopeParameterAsOneOfPromise]);
  }

  async scopeRemoveLiquidityZap(invSafeAddr: string, pools: string[]) {
    // function remove_liquidity_one_coin(address _pool,uint256 _burn_amount,int128 i,uint256 _min_amount, address _receiver)
    const scopeFunctionPromise = this.roles.populateTransaction.scopeFunction(
      MANAGER_ROLE_ID,
      curveRoleDefinition.removeLiquidity3CRV.contractAddr,
      curveRoleDefinition.removeLiquidity3CRV.functionSignature,
      [false, false, false, false, true],
      [TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC, TYPE_STATIC],
      [ANY, ANY, ANY, ANY, EQUAL_TO],
      [
        EMPTY_BYTES,
        EMPTY_BYTES,
        EMPTY_BYTES,
        EMPTY_BYTES,
        getABICodedAddress(invSafeAddr),
      ],
      OPTIONS_NONE
    );

    const poolArray = pools.map((pool) => getABICodedAddress(pool));
    const scopeParameterAsOneOfPromise =
      this.roles.populateTransaction.scopeParameterAsOneOf(
        MANAGER_ROLE_ID,
        curveRoleDefinition.removeLiquidity3CRV.contractAddr,
        curveRoleDefinition.removeLiquidity3CRV.functionSignature,
        0, //parameter index
        TYPE_STATIC,
        poolArray
      );

    return Promise.all([scopeFunctionPromise, scopeParameterAsOneOfPromise]);
  }

  //scope convex desposit target
  // not safe to scope pool1d
  // scope params
  // poolId => true
  // amount => false
  // stake => true
  async scopeDepositLiquidityConvex() {
    const scopeFunctionPromise =
      this.roles.populateTransaction.scopeAllowFunction(
        MANAGER_ROLE_ID,
        curveRoleDefinition.depositLp.contractAddr,
        curveRoleDefinition.depositLp.functionSignature,
        OPTIONS_DELEGATECALL
      );

    return Promise.all([scopeFunctionPromise]);
  }

  async scopeGetRewardConvex() {
    const scopeFunctionPromise =
      this.roles.populateTransaction.scopeAllowFunction(
        MANAGER_ROLE_ID,
        curveRoleDefinition.getReward.contractAddr,
        curveRoleDefinition.getReward.functionSignature,
        OPTIONS_DELEGATECALL
      );

    return Promise.all([scopeFunctionPromise]);
  }

  async scopeWithdrawAndUnwrap() {
    const scopeFunctionPromise =
      this.roles.populateTransaction.scopeAllowFunction(
        MANAGER_ROLE_ID,
        curveRoleDefinition.withdrawAndUnWrap.contractAddr,
        curveRoleDefinition.withdrawAndUnWrap.functionSignature,
        OPTIONS_DELEGATECALL
      );

    return Promise.all([scopeFunctionPromise]);
  }

  async scopeWithdrawAllAndUnwrap() {
    const scopeFunctionPromise =
      this.roles.populateTransaction.scopeAllowFunction(
        MANAGER_ROLE_ID,
        curveRoleDefinition.withdrawLpAndClaim.contractAddr,
        curveRoleDefinition.withdrawLpAndClaim.functionSignature,
        OPTIONS_DELEGATECALL
      );

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
    return await this.scopeAllowFunctions(
      curveRoleDefinition.exchange.contractAddr,
      [curveRoleDefinition.exchange.functionSignature],
      MANAGER_ROLE_ID
    )
  }
}
