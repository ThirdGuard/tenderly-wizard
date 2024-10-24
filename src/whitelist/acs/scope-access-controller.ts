import SAFE_MASTER_COPY_V1_ABI from "../../contracts/safe_master_copy_v1.json";
import SAFE_MASTER_COPY_V2_ABI from "../../contracts/safe_master_copy_v2.json";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { LedgerSigner } from "@anders-t/ethers-ledger";
// @ts-ignore
import { ethers } from "hardhat";
import { createMultisendTx, getPreValidatedSignatures, scopeTargets } from "../../utils/util";
import { BASE_MULTISEND_ADDR, GAS_LIMIT, SAFE_OPERATION_DELEGATECALL, SECURITY_ROLE_ID_V2, tx } from "../../utils/constants";
import { RolesVersion } from "../../utils/types";

const ROLES_FUNCTIONS_ALLOWED = [
  "revokeTarget",
  "scopeTarget",
  "allowFunction",
  "revokeFunction",
  "scopeFunction",
  //   "scopeFunctionExecutionOptions",
  //   "scopeParameter",
  //   "scopeParameterAsOneOf",
  //   "unscopeParameter",
  "allowTarget",
];

// this whitelisting class is used in the roles deployment so that security has the ability to scope functions
export class AccessControllerWhitelist extends Whitelist {
  rolesVersion: RolesVersion;
  constructor(acRolesAddr: string, caller: SignerWithAddress | LedgerSigner, rolesVersion: RolesVersion) {
    super(acRolesAddr, caller);
    this.rolesVersion = rolesVersion;
  }

  // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
  async getFullScope(invRolesAddr: string) {
    // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
    // Must scopeTarget before roles.allowFunction can be called
    const getScopedTargetTxs = await scopeTargets(
      [invRolesAddr],
      SECURITY_ROLE_ID_V2,
      this.roles
    );
    // Get the sighashs that need to be whitelisted
    const functionSigs = ROLES_FUNCTIONS_ALLOWED.map((func) =>
      this.roles.interface.getSighash(func)
    );
    const getScopedAllowFunctionTxs = await this.scopeAllowFunctions(
      invRolesAddr,
      functionSigs,
      SECURITY_ROLE_ID_V2
    );
    const txs = [...getScopedTargetTxs, ...getScopedAllowFunctionTxs];
    return createMultisendTx(txs, BASE_MULTISEND_ADDR);
  }

  async build(invRolesAddr: string, accessControlSafeAddr: string) {
    const metaTx = await this.getFullScope(invRolesAddr);
    const acSafe = new ethers.Contract(
      accessControlSafeAddr,
      this.rolesVersion === 'v1' ? SAFE_MASTER_COPY_V1_ABI : SAFE_MASTER_COPY_V2_ABI,
      this.caller
    );
    const signature = getPreValidatedSignatures(await this.caller.getAddress());
    return await acSafe.populateTransaction.execTransaction(
      BASE_MULTISEND_ADDR,
      tx.zeroValue,
      metaTx.data,
      SAFE_OPERATION_DELEGATECALL,
      tx.avatarTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      signature
    );
  }

  async execute(invRolesAddr: string, accessControlSafeAddr: string) {
    const populatedTx = await this.build(invRolesAddr, accessControlSafeAddr);
    const tx = await this.caller.sendTransaction({
      ...populatedTx,
      gasLimit: GAS_LIMIT,
    });
    console.log(
      "Successfully executed Security's access control related whitelisting"
    );
  }
}
