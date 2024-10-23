import { HardhatRuntimeEnvironment } from "hardhat/types";

import SAFE_MASTER_COPY_ABI from "../../contracts/safe_master_copy_v1.json"
import { Whitelist } from "../whitelist-class";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { createMultisendTx, getPreValidatedSignatures, scopeTargets } from "../utils";
import { MULTISEND_ADDR, SAFE_OPERATION_DELEGATECALL, SECURITY_ROLE_ID, tx } from "../constants";

const hre: HardhatRuntimeEnvironment = require("hardhat");

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
export class AccessControllerWhitelist extends Whitelist {

    constructor(acRolesAddr: string, caller: SignerWithAddress | LedgerSigner) {
        super(acRolesAddr, caller);
    }

    // Allow the security team to call all the functions listed in `ROLES_FUNCTIONS_ALLOWED`on the investment roles modifier
    async getFullScope(invRolesAddr: string) {
        // Nested roles usage here can be confusing. The invRoles is the target that is scoped on the acRoles
        // Must scopeTarget before roles.scopeAllowFunction can be called
        const getScopedTargetTxs = await scopeTargets([invRolesAddr], SECURITY_ROLE_ID, this.roles)
        // Get the sighashs that need to be whitelisted
        const functionSigs = ROLES_FUNCTIONS_ALLOWED.map(func => this.roles.interface.getSighash(func))
        const getScopedAllowFunctionTxs = await this.scopeAllowFunctions(invRolesAddr, functionSigs, SECURITY_ROLE_ID)
        const txs = [
            ...getScopedTargetTxs,
            ...getScopedAllowFunctionTxs
        ];
        return createMultisendTx(txs, MULTISEND_ADDR)
    }

    async build(invRolesAddr: string, accessControlSafeAddr: string) {
        const metaTx = await this.getFullScope(invRolesAddr);
        const acSafe = new hre.ethers.Contract(accessControlSafeAddr, SAFE_MASTER_COPY_ABI, this.caller)
        const signature = getPreValidatedSignatures(await this.caller.getAddress())
        return await acSafe.populateTransaction.execTransaction(
            MULTISEND_ADDR,
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
        const populatedTx = await this.build(invRolesAddr, accessControlSafeAddr)
        const tx = await this.caller.sendTransaction({
            ...populatedTx
        })
        console.log("Successfully executed Security's access control related whitelisting")
    }
}