import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish, Contract, PopulatedTransaction, Signer, Wallet, ethers } from "ethers";
import { MetaTransaction, encodeMulti } from "ethers-multisend"
import { GAS_LIMIT } from "./constants";

export enum OperationType {
  Call,
  DelegateCall,
}

export enum ExecutionOptions {
  None,
  Send,
  DelegateCall,
  Both,
}

export interface MetaTransactionData {
  to: string;
  value: string;
  data: string;
  operation?: OperationType;
}

// Encodes multiple transactions so we can then use a Safe with multisend for atomic transacting
export function createMultisendTx(
  populatedTxs: PopulatedTransaction[],
  multisendAddr: string
): MetaTransaction {
  const safeTransactionData: MetaTransactionData[] = populatedTxs.map(
    (popTx) => ({
      to: popTx.to as string,
      value: popTx.value ? popTx.value.toString() : "0",
      data: popTx.data as string,
    })
  );

  return encodeMulti(safeTransactionData, multisendAddr);
}

// When we have a single owner on a safe, the output of this function can be used as the signature parameter on a execTransaction call on a safe
export const getPreValidatedSignatures = (
  from: string,
  initialString: string = "0x"
): string => {
  return `${initialString}000000000000000000000000${from.replace(
    "0x",
    ""
  )}000000000000000000000000000000000000000000000000000000000000000001`;
};

// roles.scopeTarget helper function
export async function scopeTargets(
  targetAddrs: string[],
  roleId: number,
  roles: Contract
) {
  const scopeTargetTxs = await Promise.all(
    targetAddrs.map(async (target) => {
      //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
      const tx = await roles.populateTransaction.scopeTarget(roleId, target);
      return tx;
    })
  );
  return scopeTargetTxs;
}

// Helper to allows function calls without param scoping
export async function scopeAllowFunctions(
  target: string,
  sigs: string[],
  roleId: number,
  roles: Contract
) {
  const scopeFuncsTxs = await Promise.all(
    sigs.map(async (sig) => {
      // scopeAllowFunction on Roles allows a role member to call the function in question with no paramter scoping
      const tx = await roles.populateTransaction.scopeAllowFunction(
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

export const getABICodedAddress = (address: string) => {
  return ethers.utils.defaultAbiCoder.encode(["address"], [address]);
};



export const signAndExecutePermitUSYC = async (signer: SignerWithAddress, spender: string, value: BigNumberish) => {
  // Create contract instance
  const usyc = new Contract('USYC_ADDR', 'USYC_ABI', signer);

  // @todo get nonce
  // @audit might need to switch for nonces funtion
  const nonce: BigNumber = await usyc.nonces(signer.address)

  // Prepare permit data
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now


  const permitData = {
    owner: signer.address,
    spender,
    value: ethers.utils.parseUnits(value.toString(), 18), // Assuming 18 decimals
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
    chainId: 1, // Replace with the correct chain ID
    verifyingContract: 'USYC_ADDR'
  }

  const signature = await signer._signTypedData(domain, types, permitData);

  // Split the signature
  const { v, r, s } = ethers.utils.splitSignature(signature);

  // Execute the permit function
  const tx = await usyc.permit(
    permitData.owner,
    permitData.spender,
    permitData.value,
    permitData.deadline,
    v,
    r,
    s,
    {
      gasLimit: GAS_LIMIT
    }
  );

  // Wait for the transaction to be mined
  const receipt = await tx.wait();

  return {
    v, r, s
  };
}