import { BigNumberish, Contract, PopulatedTransaction, ethers } from "ethers";
import { MetaTransaction, encodeMulti } from "ethers-multisend";
import { formatBytes32String } from "ethers/lib/utils";
import { network } from "hardhat";

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
  multisendAddr: string,
): MetaTransaction {
  // console.log("encoding data");
  const safeTransactionData: MetaTransactionData[] = populatedTxs.map(
    (popTx) => ({
      to: popTx.to as string,
      value: popTx.value ? popTx.value.toString() : "0",
      data: popTx.data as string,
    }),
  );

  // console.log({ safeTransactionData });

  return encodeMulti(safeTransactionData, multisendAddr);
}

// When we have a single owner on a safe, the output of this function can be used as the signature parameter on a execTransaction call on a safe
export const getPreValidatedSignatures = (
  from: string,
  initialString = "0x",
): string => {
  return `${initialString}000000000000000000000000${from.replace(
    "0x",
    "",
  )}000000000000000000000000000000000000000000000000000000000000000001`;
};

// roles.scopeTarget helper function
export async function scopeTargets(
  targetAddrs: string[],
  roleId: `0x${string}`,
  roles: Contract,
) {
  const scopeTargetTxs = await Promise.all(
    targetAddrs.map(async (target) => {
      //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
      const tx = await roles.populateTransaction.scopeTarget(roleId, target);
      return tx;
    }),
  );
  return scopeTargetTxs;
}

// Helper to allows function calls without param scoping
export async function scopeAllowFunctions(
  target: string,
  sigs: string[],
  roleId: number,
  roles: Contract,
) {
  const scopeFuncsTxs = await Promise.all(
    sigs.map(async (sig) => {
      // allowFunction on Roles allows a role member to call the function in question with no paramter scoping
      const tx = await roles.populateTransaction.allowFunction(
        roleId,
        target,
        sig,
        ExecutionOptions.Both,
      );
      return tx;
    }),
  );
  return scopeFuncsTxs;
}

export const getABICodedAddress = (address: string) => {
  return ethers.utils.defaultAbiCoder.encode(["address"], [address]);
};

export function numberToBytes32(num: number): `0x${string}` {
  // Convert the number to a hex string
  let hexString = ethers.utils.hexlify(num);

  // Remove the "0x" prefix
  hexString = hexString.slice(2);

  // Pad the hex string to make sure it's 64 characters long (32 bytes)
  const paddedHexString = hexString.padStart(64, "0");

  // Add the "0x" prefix back
  return `0x${paddedHexString}`;
}

export const encodeBytes32String = formatBytes32String as (
  text: string,
) => `0x${string}`;

export const setERC20TokenBalances = async (
  tokenAddresses: string[],
  recipient: string,
  amount: BigNumberish
) =>
  tokenAddresses.forEach(
    async (tokenAddress) =>
      await setERC20TokenBalance(tokenAddress, recipient, amount)
  );

export const setERC20TokenBalance = async (
  token: string,
  address: string,
  amount: BigNumberish
) => {
  const value = ethers.BigNumber.from(amount).toHexString();
  await network.provider.request({
    method: "tenderly_setErc20Balance",
    params: [token, address, value.replace("0x0", "0x")],
  });
};