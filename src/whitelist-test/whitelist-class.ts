// @ts-ignore
import { ethers } from "hardhat";
import ROLES_V1_MASTER_COPY_ABI from "../contracts/roles_v1.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import {
  ANY,
  APPROVAL_SIG,
  EMPTY_BYTES,
  EQUAL_TO,
  MANAGER_ROLE_ID,
  OPTIONS_SEND,
  TYPE_STATIC,
} from "./constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { Contract } from "ethers";


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
    this.roles = new ethers.Contract(rolesAddr, ROLES_V1_MASTER_COPY_ABI);
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
  async scopeAllowFunctions(target: string, sigs: string[], roleId: number) {
    const scopeFuncsTxs = await Promise.all(
      sigs.map(async (sig) => {
        // scopeAllowFunction on Roles allows a role member to call the function in question with no paramter scoping
        const tx = await this.roles.populateTransaction.scopeAllowFunction(
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
        MANAGER_ROLE_ID,
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
