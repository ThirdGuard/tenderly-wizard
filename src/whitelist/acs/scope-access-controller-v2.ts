import SAFE_MASTER_COPY_V2_ABI from "../../contracts/safe_master_copy_v2.json";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { LedgerSigner } from "@anders-t/ethers-ledger";
// @ts-ignore
import { ethers } from "hardhat";
import {
  createMultisendTx,
  getPreValidatedSignatures,
  scopeTargetsV2,
} from "../../utils/util";
import {
  GAS_LIMIT,
  SAFE_OPERATION_DELEGATECALL,
  SECURITY_ROLE_ID_V2,
  tx,
} from "../../utils/constants";
import { ChainConfig } from "../../utils/types";
import { ChainId } from "zodiac-roles-sdk/.";
import { getChainConfig } from "../../utils/roles-chain-config";
import config from "../../env-config";

const ROLES_FUNCTIONS_ALLOWED = [
  "revokeTarget",
  "scopeTarget",
  "allowFunction",
  "revokeFunction",
  "scopeFunction",
  "allowTarget",
];

// this whitelisting class is used in the roles deployment so that security has the ability to scope functions
export class AccessControllerWhitelistV2 extends Whitelist {
  chainConfig: ChainConfig["v2"];
  constructor(acRolesAddr: string, caller: SignerWithAddress | LedgerSigner) {
    super(acRolesAddr, "v2", caller);
    const chainId = config.TENDERLY_FORK_ID;
    this.chainConfig = getChainConfig(chainId as ChainId, "v2");
  }

  // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
  async getFullScope(invRolesAddr: string) {
    // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
    // Must scopeTarget before roles.allowFunction can be called

    const getScopedTargetTxs = await scopeTargetsV2(
      [invRolesAddr],
      SECURITY_ROLE_ID_V2,
      this.roles
    );
    // Get the sighashs that need to be whitelisted
    const functionSigs = ROLES_FUNCTIONS_ALLOWED.map(func =>
      this.roles.interface.getSighash(func)
    );
    const getScopedAllowFunctionTxs = await this.scopeAllowFunctionsV2(
      invRolesAddr,
      functionSigs,
      SECURITY_ROLE_ID_V2
    );
    const txs = [...getScopedTargetTxs, ...getScopedAllowFunctionTxs];
    return createMultisendTx(txs, this.chainConfig.MULTISEND_ADDR);
  }

  async build(invRolesAddr: string, accessControlSafeAddr: string) {
    const metaTx = await this.getFullScope(invRolesAddr);
    const acSafe = new ethers.Contract(
      accessControlSafeAddr,
      SAFE_MASTER_COPY_V2_ABI,
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
