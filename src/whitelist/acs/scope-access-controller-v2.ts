import SAFE_MASTER_COPY_V2_ABI from "../../contracts/safe_master_copy_v2.json";
import ROLES_V2_ABI from "../../contracts/roles_v2.json";
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
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
import { RolesV2 } from "@gnosis-guild/zodiac";
import { Interface, Contract, hexlify, ContractRunner, Provider } from "ethers";

// Helper to ensure hex string type
function asHexString(value: string): `0x${string}` {
  return value as `0x${string}`;
}

// Make LedgerSigner compatible with ContractRunner by ensuring it has a provider
type CompatibleSigner = SignerWithAddress | (LedgerSigner & { provider: Provider | null });

const ROLES_FUNCTIONS_ALLOWED = [
  "revokeTarget",
  "scopeTarget",
  "allowFunction",
  "revokeFunction",
  "scopeFunction",
  "allowTarget",
] as const;

// Create an ethers Interface from the ABI to get function signatures
const rolesInterface = new Interface(ROLES_V2_ABI);

// this whitelisting class is used in the roles deployment so that security has the ability to scope functions
export class AccessControllerWhitelistV2 extends Whitelist {
  chainConfig: ChainConfig["v2"];
  constructor(acRolesAddr: string, caller: CompatibleSigner) {
    super(acRolesAddr, "v2", caller);
    const chainId = config.TENDERLY_FORK_ID;
    this.chainConfig = getChainConfig(chainId as ChainId, "v2");
  }

  // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
  async getFullScope(invRolesAddr: string) {
    // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
    // Must scopeTarget before roles.allowFunction can be called
    const roleId = asHexString(hexlify(SECURITY_ROLE_ID_V2).padEnd(66, '0'));
    const getScopedTargetTxs = await scopeTargetsV2(
      [invRolesAddr],
      roleId,
      this.roles as Contract & RolesV2
    );

    // Get the sighashs that need to be whitelisted
    const functionSigs = ROLES_FUNCTIONS_ALLOWED.map(func => {
      // Find the function fragment in the ABI
      const fragment = rolesInterface.getFunction(func);
      if (!fragment) {
        throw new Error(`Function ${func} not found in ABI`);
      }
      return fragment.selector;
    });

    const getScopedAllowFunctionTxs = await this.scopeAllowFunctionsV2(
      invRolesAddr,
      functionSigs,
      roleId
    );
    const txs = [...getScopedTargetTxs, ...getScopedAllowFunctionTxs];
    return createMultisendTx(txs, this.chainConfig.MULTISEND_ADDR);
  }

  async build(invRolesAddr: string, accessControlSafeAddr: string) {
    const metaTx = await this.getFullScope(invRolesAddr);
    // Use any for now since the contract type is complex
    const acSafe = new Contract(
      accessControlSafeAddr,
      SAFE_MASTER_COPY_V2_ABI,
      this.caller as any
    ) as any;
    const signature = getPreValidatedSignatures(await this.caller.getAddress());
    return await acSafe.execTransaction.populateTransaction(
      this.chainConfig.MULTISEND_ADDR,
      tx.zeroValue,
      metaTx.data,
      SAFE_OPERATION_DELEGATECALL.toString(),
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
