import SAFE_MASTER_COPY_V1_ABI from "../../contracts/safe_master_copy_v1.json";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { LedgerSigner } from "@anders-t/ethers-ledger";
// @ts-ignore
import { ethers } from "hardhat";
import { createMultisendTx, getPreValidatedSignatures, scopeTargetsV1 } from "../../utils/util";
import { GAS_LIMIT, SAFE_OPERATION_DELEGATECALL, SECURITY_ROLE_ID_V1, tx } from "../../utils/constants";
import { getChainConfig } from "../../utils/roles-chain-config";
import { ChainConfig } from "../../utils/types";
import { ChainId } from "zodiac-roles-sdk/.";

const ROLES_FUNCTIONS_ALLOWED = [
  "revokeTarget",
  "scopeTarget",
  "scopeAllowFunction",
  "scopeRevokeFunction",
  "scopeFunction",
  "scopeFunctionExecutionOptions",
  "scopeParameter",
  "scopeParameterAsOneOf",
  "unscopeParameter",
  "allowTarget"
]


// this whitelisting class is used in the roles deployment so that security has the ability to scope functions
export class AccessControllerWhitelistV1 extends Whitelist {
  chainConfig: ChainConfig["v1"];
  constructor(acRolesAddr: string, caller: SignerWithAddress | LedgerSigner) {
    super(acRolesAddr, "v1", caller);
    const chainId = parseInt(process.env.TENDERLY_FORK_ID || "1", 10)
    this.chainConfig = getChainConfig(chainId as ChainId, "v1");
  }

  // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
  async getFullScope(invRolesAddr: string) {
    // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
    // Must scopeTarget before roles.scopeAllowFunction can be called
    const getScopedTargetTxs = await scopeTargetsV1([invRolesAddr], SECURITY_ROLE_ID_V1, this.roles)
    // Get the sighashs that need to be whitelisted
    const functionSigs = ROLES_FUNCTIONS_ALLOWED.map(func => this.roles.interface.getSighash(func))
    const getScopedAllowFunctionTxs = await this.scopeAllowFunctionsV1(invRolesAddr, functionSigs, SECURITY_ROLE_ID_V1)
    const txs = [
      ...getScopedTargetTxs,
      ...getScopedAllowFunctionTxs
    ];
    return createMultisendTx(txs, this.chainConfig.MULTISEND_ADDR)
  }

  async build(invRolesAddr: string, accessControlSafeAddr: string) {
    const metaTx = await this.getFullScope(invRolesAddr);
    const acSafe = new ethers.Contract(
      accessControlSafeAddr,
      SAFE_MASTER_COPY_V1_ABI,
      this.caller
    );
    const signature = getPreValidatedSignatures(await this.caller.getAddress());
    return await acSafe.populateTransaction.execTransaction(
      this.chainConfig.MULTISEND_ADDR,
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
