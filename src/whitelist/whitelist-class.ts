import { Contract, Provider } from "ethers";
import ROLES_V1_MASTER_COPY_ABI from "../contracts/roles_v1.json";
import ROLES_V2_MASTER_COPY_ABI from "../contracts/roles_v2.json";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

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
  GAS_LIMIT,
  MANAGER_ROLE_ID_V2,
  OPTIONS_SEND,
  SAFE_OPERATION_DELEGATECALL,
  SECURITY_ROLE_ID_V2,
  TYPE_STATIC,
  ZERO_VALUE,
} from "../utils/constants";
import { getChainConfig } from "../utils/roles-chain-config";
import { RolesVersion } from "../utils/types";
import config from "../env-config";
import { RolesV1, RolesV2 } from "@gnosis-guild/zodiac";

export enum ExecutionOptions {
  None,
  Send,
  DelegateCall,
  Both,
}

// Make LedgerSigner compatible with ContractRunner by ensuring it has a provider
type CompatibleSigner = SignerWithAddress | (LedgerSigner & { provider: Provider | null });

export class Whitelist {
  roles: RolesV2 | RolesV1;
  caller: CompatibleSigner;
  constructor(
    rolesAddr: string,
    rolesVersion: RolesVersion,
    caller: CompatibleSigner
  ) {
    if (rolesVersion === "v1") {
      this.roles = new Contract(
        rolesAddr,
        ROLES_V1_MASTER_COPY_ABI,
        caller as any
      ) as unknown as RolesV1;
    } else {
      this.roles = new Contract(
        rolesAddr,
        ROLES_V2_MASTER_COPY_ABI,
        caller as any
      ) as unknown as RolesV2;
    }

    this.caller = caller;
  }

  // roles.scopeTarget helper function
  async scopeTargets(targetAddrs: string[], roleId: number) {
    const scopeTargetTxs = await Promise.all(
      targetAddrs.map(async target => {
        //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
        const tx = await (this.roles as RolesV1).scopeTarget.populateTransaction(
          roleId,
          target
        );
        return tx;
      })
    );
    return scopeTargetTxs;
  }

  // Helper to allows function calls without param scoping
  async scopeAllowFunctionsV1(target: string, sigs: string[], roleId: number) {
    const scopeFuncsTxs = await Promise.all(
      sigs.map(async sig => {
        // scopeAllowFunction on Roles allows a role member to call the function in question with no paramter scoping
        const tx = await (this.roles as RolesV1).scopeAllowFunction.populateTransaction(
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

  // Helper to allows function calls without param scoping
  async scopeAllowFunctionsV2(
    target: string,
    sigs: string[],
    roleId: `0x${string}`
  ) {
    const scopeFuncsTxs = await Promise.all(
      sigs.map(async sig => {
        // allowFunction on Roles allows a role member to call the function in question with no paramter scoping
        const tx = await (this.roles as RolesV2).allowFunction.populateTransaction(
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
      await (this.roles as RolesV1).scopeFunction.populateTransaction(
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

// // Helper to assert a string is a hex address
// export function asHexString(address: string): `0x${string}` {
//   if (!address.startsWith("0x")) throw new Error("Address must start with 0x");
//   if (address.length !== 42) throw new Error("Address must be 42 characters");
//   return address as `0x${string}`;
// }

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
  chainId: ChainId,
  rolesVersion: RolesVersion
) {
  const [
    caller,
    manager,
    dummyOwnerOne,
    dummyOwnerTwo,
    dummyOwnerThree,
    security,
  ] = await ethers.getSigners();

  // get chain config
  const chainConfig = getChainConfig(chainId, rolesVersion);

  // Process the permissions
  const { targets } = processPermissions(permissions);

  // Apply the targets
  const calls = await applyTargets(
    MANAGER_ROLE_ID_V2 as `0x${string}`, targets, {
    chainId,
    address: config.ACCESS_CONTROL_ROLES_ADDRESS! as `0x${string}`,
    mode: "replace", // or "extend" or "remove"
    log: console.debug,
    currentTargets: [],
  });

  console.log(`${calls.length} permissions to execute`);
  const multiSendTx = encodeMulti(
    calls.map((data) => {
      return {
        to: config.INVESTMENT_ROLES_ADDRESS! as `0x${string}`,
        value: "0",
        data: data as `0x${string}`,
      };
    })
  );

  // Security needs to indirectly execute this bundle via acRoles
  if (!config.ACCESS_CONTROL_ROLES_ADDRESS) throw new Error("ACCESS_CONTROL_ROLES_ADDRESS is undefined");
  const acRoles = new Contract(
    config.ACCESS_CONTROL_ROLES_ADDRESS! as `0x${string}`,
    ROLES_V2_MASTER_COPY_ABI,
    security
  );

  // role members wishing to transact as the Safe will always have to call via execTransactionWithRole
  const tx = await acRoles.execTransactionWithRole(
    chainConfig.MULTISEND_ADDR,
    ZERO_VALUE,
    multiSendTx.data,
    SAFE_OPERATION_DELEGATECALL,
    SECURITY_ROLE_ID_V2,
    true,
    {
      gasLimit: GAS_LIMIT,
    }
  );

  const receipt = await tx.wait();
  console.log("Whitelist executed successfully", receipt);
}
