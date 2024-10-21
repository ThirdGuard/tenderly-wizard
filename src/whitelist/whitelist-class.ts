import { Contract } from "ethers";
import ROLES_V2_MASTER_COPY_ABI from "../contracts/roles_v2.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { LedgerSigner } from "@anders-t/ethers-ledger";
// @ts-ignore
import { ethers } from "hardhat";
import {
  ChainId,
  Permission,
  applyTargets,
  processPermissions,
} from "zodiac-roles-sdk";
import { encodeMulti } from "ethers-multisend";
import {
  ANY,
  APPROVAL_SIG,
  EMPTY_BYTES,
  EQUAL_TO,
  MANAGER_ROLE_ID_V2,
  OPTIONS_SEND,
  SAFE_OPERATION_DELEGATECALL,
  SECURITY_ROLE_ID_V2,
  TYPE_STATIC,
  ZERO_VALUE,
} from "../utils/constants";
import { getChainConfig } from "../utils/roles-chain-config";

export enum ExecutionOptions {
  None,
  Send,
  DelegateCall,
  Both,
}

export class Whitelist {
  roles: Contract;
  caller: SignerWithAddress | LedgerSigner;
  constructor(rolesAddr: string, caller: SignerWithAddress | LedgerSigner) {
    this.roles = new Contract(rolesAddr, ROLES_V2_MASTER_COPY_ABI);
    this.caller = caller;
  }

  // roles.scopeTarget helper function
  async scopeTargets(targetAddrs: string[], roleId: number) {
    const scopeTargetTxs = await Promise.all(
      targetAddrs.map(async (target) => {
        //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
        const tx = await this.roles.populateTransaction.scopeTarget(
          roleId,
          target
        );
        return tx;
      })
    );
    return scopeTargetTxs;
  }

  // Helper to allows function calls without param scoping
  async scopeAllowFunctions(
    target: string,
    sigs: string[],
    roleId: `0x${string}`
  ) {
    const scopeFuncsTxs = await Promise.all(
      sigs.map(async (sig) => {
        // allowFunction on Roles allows a role member to call the function in question with no paramter scoping
        const tx = await this.roles.populateTransaction.allowFunction(
          roleId,
          target,
          sig,
          ExecutionOptions.Both
        );
        return tx;
      })
    );
    return scopeFuncsTxs;
  }

  // Helper for crafting erc20 approve related permissions
  async scopeFunctionERC20Approval(
    contractAddr: string,
    approvedSpender: string
  ) {
    const scopedApproveFunctionTx =
      await this.roles.populateTransaction.scopeFunction(
        MANAGER_ROLE_ID_V2,
        contractAddr,
        APPROVAL_SIG,
        [true, false],
        [TYPE_STATIC, TYPE_STATIC],
        [EQUAL_TO, ANY],
        [approvedSpender, EMPTY_BYTES],
        OPTIONS_SEND
      );
    return scopedApproveFunctionTx;
  }
}

/**
 * Executes whitelist permissions for a specific chain.
 * @note This function will work as long as it's connected to a Hardhat Tenderly testnet.
 * @param permissions Array of Permission objects to be executed
 * @param chainId The chain ID where the permissions will be applied
 * @returns Transaction receipt from the execution
 *
 */
export async function executeWhitelistV2(
  permissions: Permission[],
  chainId: ChainId
) {
  const [_, securityEOAs, __] = await ethers.getSigners();

  // get chain config
  const chainConfig = getChainConfig(chainId);

  // Process the permissions
  const { targets } = processPermissions(permissions);

  // Apply the targets
  const calls = await applyTargets(MANAGER_ROLE_ID_V2, targets, {
    chainId,
    address: process.env.ACCESS_CONTROL_ROLES as `0x${string}`,
    mode: "replace", // or "extend" or "remove"
    log: console.debug,
    currentTargets: [],
  });

  console.log(`${calls.length} permissions to execute`);

  const multiSendTx = encodeMulti(
    calls.map((data: `0x${string}`) => {
      return {
        to: process.env.INVESTMENT_ROLES,
        value: "0",
        data,
      };
    })
  );

  //security needs to indirectly execute this bundle via acRoles
  const acRoles = new Contract(
    process.env.ACCESS_CONTROL_ROLES!,
    ROLES_V2_MASTER_COPY_ABI,
    securityEOAs
  );

  // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
  return await acRoles.execTransactionWithRole(
    chainConfig.MULTISEND_ADDR,
    ZERO_VALUE,
    multiSendTx.data,
    SAFE_OPERATION_DELEGATECALL,
    SECURITY_ROLE_ID_V2,
    true
  );
}
