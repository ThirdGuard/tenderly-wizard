"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAndExecutePermitUSYC = exports.getABICodedAddress = exports.scopeAllowFunctions = exports.scopeTargets = exports.getPreValidatedSignatures = exports.createMultisendTx = exports.ExecutionOptions = exports.OperationType = void 0;
const ethers_1 = require("ethers");
const ethers_multisend_1 = require("ethers-multisend");
const constants_1 = require("./constants");
var OperationType;
(function (OperationType) {
    OperationType[OperationType["Call"] = 0] = "Call";
    OperationType[OperationType["DelegateCall"] = 1] = "DelegateCall";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
var ExecutionOptions;
(function (ExecutionOptions) {
    ExecutionOptions[ExecutionOptions["None"] = 0] = "None";
    ExecutionOptions[ExecutionOptions["Send"] = 1] = "Send";
    ExecutionOptions[ExecutionOptions["DelegateCall"] = 2] = "DelegateCall";
    ExecutionOptions[ExecutionOptions["Both"] = 3] = "Both";
})(ExecutionOptions = exports.ExecutionOptions || (exports.ExecutionOptions = {}));
// Encodes multiple transactions so we can then use a Safe with multisend for atomic transacting
function createMultisendTx(populatedTxs, multisendAddr) {
    const safeTransactionData = populatedTxs.map((popTx) => ({
        to: popTx.to,
        value: popTx.value ? popTx.value.toString() : "0",
        data: popTx.data,
    }));
    return (0, ethers_multisend_1.encodeMulti)(safeTransactionData, multisendAddr);
}
exports.createMultisendTx = createMultisendTx;
// When we have a single owner on a safe, the output of this function can be used as the signature parameter on a execTransaction call on a safe
const getPreValidatedSignatures = (from, initialString = "0x") => {
    return `${initialString}000000000000000000000000${from.replace("0x", "")}000000000000000000000000000000000000000000000000000000000000000001`;
};
exports.getPreValidatedSignatures = getPreValidatedSignatures;
// roles.scopeTarget helper function
async function scopeTargets(targetAddrs, roleId, roles) {
    const scopeTargetTxs = await Promise.all(targetAddrs.map(async (target) => {
        //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
        const tx = await roles.populateTransaction.scopeTarget(roleId, target);
        return tx;
    }));
    return scopeTargetTxs;
}
exports.scopeTargets = scopeTargets;
// Helper to allows function calls without param scoping
async function scopeAllowFunctions(target, sigs, roleId, roles) {
    const scopeFuncsTxs = await Promise.all(sigs.map(async (sig) => {
        // scopeAllowFunction on Roles allows a role member to call the function in question with no paramter scoping
        const tx = await roles.populateTransaction.scopeAllowFunction(roleId, target, sig, ExecutionOptions.Both);
        return tx;
    }));
    return scopeFuncsTxs;
}
exports.scopeAllowFunctions = scopeAllowFunctions;
const getABICodedAddress = (address) => {
    return ethers_1.ethers.utils.defaultAbiCoder.encode(["address"], [address]);
};
exports.getABICodedAddress = getABICodedAddress;
const signAndExecutePermitUSYC = async (signer, spender, value) => {
    // Create contract instance
    const usyc = new ethers_1.Contract('USYC_ADDR', 'USYC_ABI', signer);
    // @todo get nonce
    // @audit might need to switch for nonces funtion
    const nonce = await usyc.nonces(signer.address);
    // Prepare permit data
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const permitData = {
        owner: signer.address,
        spender,
        value: ethers_1.ethers.utils.parseUnits(value.toString(), 18),
        nonce: nonce.add(1),
        deadline
    };
    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };
    const domain = {
        chainId: 1,
        verifyingContract: 'USYC_ADDR'
    };
    const signature = await signer._signTypedData(domain, types, permitData);
    // Split the signature
    const { v, r, s } = ethers_1.ethers.utils.splitSignature(signature);
    // Execute the permit function
    const tx = await usyc.permit(permitData.owner, permitData.spender, permitData.value, permitData.deadline, v, r, s, {
        gasLimit: constants_1.GAS_LIMIT
    });
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    return {
        v, r, s
    };
};
exports.signAndExecutePermitUSYC = signAndExecutePermitUSYC;
