import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  BigNumber,
  BigNumberish,
  Contract,
  PopulatedTransaction,
  utils,
} from "ethers";
import { MetaTransaction, encodeMulti } from "ethers-multisend";
import { defaultAbiCoder, formatBytes32String } from "ethers/lib/utils";
import fs from "fs";
import path from "path";
// @ts-ignore
import { ethers, network } from "hardhat";
import { Project, ClassDeclaration, SyntaxKind } from "ts-morph";
import config from "../env-config";
import {
  calculateProxyAddress,
  ContractAddresses,
  ContractFactories,
  KnownContracts,
} from "@gnosis-guild/zodiac";
import { RolesVersion } from "./types";

export const SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

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

/**
 * Encodes multiple transactions so we can then use a Safe with multisend for atomic transacting
 * @param {PopulatedTransaction[]} populatedTxs - Array of populated transactions
 * @param {string} multisendAddr - Address of the multisend contract
 * @returns {MetaTransaction} Encoded multi-transaction
 */
export function createMultisendTx(
  populatedTxs: PopulatedTransaction[],
  multisendAddr: string
): MetaTransaction {
  const safeTransactionData: MetaTransactionData[] = populatedTxs.map(
    popTx => ({
      to: popTx.to as string,
      value: popTx.value ? popTx.value.toString() : "0",
      data: popTx.data as string,
    })
  );

  return encodeMulti(safeTransactionData, multisendAddr);
}

/**
 * Generates pre-validated signatures for a single owner on a safe
 * @param {string} from - Address of the signer
 * @param {string} [initialString="0x"] - Initial string to prepend
 * @returns {string} Pre-validated signature string
 */
export const getPreValidatedSignatures = (
  from: string,
  initialString = "0x"
): string => {
  return `${initialString}000000000000000000000000${from.replace(
    "0x",
    ""
  )}000000000000000000000000000000000000000000000000000000000000000001`;
};

/**
 * Helper function to scope targets in roles contract v1
 * @param {string[]} targetAddrs - Array of target addresses
 * @param {number} roleId - Role ID
 * @param {Contract} roles - Roles contract instance
 * @returns {Promise<PopulatedTransaction[]>} Array of populated transactions
 */
export async function scopeTargetsV1(
  targetAddrs: string[],
  roleId: number,
  roles: Contract
) {
  const scopeTargetTxs = await Promise.all(
    targetAddrs.map(async target => {
      //Before granular function/parameter whitelisting can occur, you need to bring a target contract into 'scope' via scopeTarget
      const tx = await roles.populateTransaction.scopeTarget(roleId, target);
      return tx;
    })
  );
  return scopeTargetTxs;
}

/**
 * Helper function to scope targets in roles contract v2
 * @param {string[]} targetAddrs - Array of target addresses
 * @param {`0x${string}`} roleId - Role ID
 * @param {Contract} roles - Roles contract instance
 * @returns {Promise<PopulatedTransaction[]>} Array of populated transactions
 */
export async function scopeTargetsV2(
  targetAddrs: string[],
  roleId: `0x${string}`,
  roles: Contract
) {
  const scopeTargetTxs = await Promise.all(
    targetAddrs.map(async target => {
      const tx = await roles.populateTransaction.scopeTarget(roleId, target);
      return tx;
    })
  );
  return scopeTargetTxs;
}

/**
 * Helper to allow function calls without param scoping
 * @param {string} target - Target contract address
 * @param {string[]} sigs - Array of function signatures
 * @param {number} roleId - Role ID
 * @param {Contract} roles - Roles contract instance
 * @returns {Promise<PopulatedTransaction[]>} Array of populated transactions
 */
export async function scopeAllowFunctions(
  target: string,
  sigs: string[],
  roleId: number,
  roles: Contract
) {
  const scopeFuncsTxs = await Promise.all(
    sigs.map(async sig => {
      const tx = await roles.populateTransaction.allowFunction(
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

/**
 * Encodes an address as ABI
 * @param {string} address - Address to encode
 * @returns {string} ABI encoded address
 */
export const getABICodedAddress = (address: string) =>
  utils.defaultAbiCoder.encode(["address"], [address]);

/**
 * Converts a number to bytes32 format
 * @param {number} num - Number to convert
 * @returns {`0x${string}`} Bytes32 representation of the number
 */
export function numberToBytes32(num: number): `0x${string}` {
  let hexString = utils.hexlify(num);
  hexString = hexString.slice(2);
  const paddedHexString = hexString.padStart(64, "0");
  return `0x${paddedHexString}`;
}

/**
 * Encodes a string to bytes32 format
 * @param {string} text - String to encode
 * @returns {`0x${string}`} Bytes32 representation of the string
 */
export const encodeBytes32String = formatBytes32String as (
  text: string
) => `0x${string}`;

/**
 * Sets ERC20 token balances for multiple tokens and a single recipient
 * @param {string[]} tokenAddresses - Array of token addresses
 * @param {string} recipient - Address of the recipient
 * @param {BigNumberish} amount - Amount to set for each token
 * @returns {Promise<void>}
 */
export const setERC20TokenBalances = async (
  tokenAddresses: string[],
  recipient: string,
  amount: BigNumberish
) =>
  tokenAddresses.forEach(
    async tokenAddress =>
      await setERC20TokenBalance(tokenAddress, recipient, amount)
  );

/**
 * Sets ERC20 token balance for a single token and recipient
 * @param {string} token - Token address
 * @param {string} address - Recipient address
 * @param {BigNumberish} amount - Amount to set
 * @returns {Promise<void>}
 */
export const setERC20TokenBalance = async (
  token: string,
  address: string,
  amount: BigNumberish
) => {
  const value = BigNumber.from(amount).toHexString();
  await network.provider.request({
    method: "tenderly_setErc20Balance",
    params: [token, address, value.replace("0x0", "0x")],
  });
};

/**
 * Sets gas balance for multiple addresses
 * @returns {Promise<void>}
 */
export async function setGas() {
  const { VIRTUAL_MAINNET_RPC } = config;
  let caller: SignerWithAddress;
  let manager: SignerWithAddress;
  let dummyOwnerOne: SignerWithAddress;
  let dummyOwnerTwo: SignerWithAddress;
  let dummyOwnerThree: SignerWithAddress;
  let security: SignerWithAddress;
  [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] =
    await ethers.getSigners();
  const provider = new ethers.providers.JsonRpcProvider(VIRTUAL_MAINNET_RPC);
  await provider.send("tenderly_setBalance", [
    caller.address,
    "0x8AC7230489E80000",
  ]);
  await provider.send("tenderly_setBalance", [
    manager.address,
    "0x8AC7230489E80000",
  ]);
  await provider.send("tenderly_setBalance", [
    security.address,
    "0x8AC7230489E80000",
  ]);
  await provider.send("tenderly_setBalance", [
    dummyOwnerOne.address,
    "0x8AC7230489E80000",
  ]);
  await provider.send("tenderly_setBalance", [
    dummyOwnerTwo.address,
    "0xDE0B6B3A7640000",
  ]);
  await provider.send("tenderly_setBalance", [
    dummyOwnerThree.address,
    "0xDE0B6B3A7640000",
  ]);
}

/**
 * Finds all 'permissions.ts' files in a directory and its subdirectories
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
export function findPermissionsFiles(whitelistDir: string): string[] {
  if (!fs.existsSync(whitelistDir)) {
    throw new Error(`The directory ${whitelistDir} does not exist.`);
  }

  let results: string[] = [];

  // Get absolute path of whitelistDir
  const absoluteWhitelistDir = path.resolve(process.cwd(), whitelistDir);

  const files = fs.readdirSync(absoluteWhitelistDir);

  for (const file of files) {
    const filePath = path.join(absoluteWhitelistDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories by calling findPermissionsFiles again
      results = results.concat(findPermissionsFiles(filePath));
    } else if (file === "permissions.ts") {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Finds all classes that extend Whitelist in a directory
 * @param {string} whitelistDir - Directory to search
 * @returns {{ path: string, className: string }[]} Array of objects containing path and class name
 */
export function findWhitelistClasses(
  whitelistDir: string
): { path: string; className: string }[] {
  const project = new Project();

  fs.readdirSync(whitelistDir, { recursive: true }).forEach(file => {
    if (typeof file === "string" && file.endsWith(".ts")) {
      project.addSourceFileAtPath(path.join(whitelistDir, file));
    }
  });

  const whitelistExtensions: { path: string; className: string }[] = [];

  project.getSourceFiles().forEach(sourceFile => {
    const classes = sourceFile.getDescendantsOfKind(
      SyntaxKind.ClassDeclaration
    );

    classes.forEach((classDeclaration: ClassDeclaration) => {
      const heritage = classDeclaration.getHeritageClauses();

      if (
        heritage.some(clause =>
          clause.getTypeNodes().some(node => {
            const text = node.getText();
            return (
              text.includes("Whitelist") ||
              text.includes("AbstractPendleWhitelist")
            );
          })
        )
      ) {
        const absolutePath = sourceFile.getFilePath();
        whitelistExtensions.push({
          path: absolutePath,
          className: classDeclaration.getName() ?? "",
        });
      }
    });
  });

  // Filter out AccessControllerWhitelist classes
  const filteredExtensions = whitelistExtensions.filter(
    extension => !extension.className.includes("AccessControllerWhitelist")
  );

  // @todo filter pendle abstract class from list
  const filteredWithoutAbstractPendle = filteredExtensions.filter(
    extension => !extension.className.includes("AbstractPendleWhitelist")
  );

  whitelistExtensions.length = 0;
  whitelistExtensions.push(...filteredWithoutAbstractPendle);

  console.log("Classes extending Whitelist:", whitelistExtensions);

  return whitelistExtensions;
}

/**
 * Checks if required environment variables are present
 * @param {string[]} requiredVariables - Array of required variable names
 * @returns {boolean} True if all required variables are present, false otherwise
 */
export function checkRequiredEnvVariables(requiredVariables: string[]) {
  const missingVariables = requiredVariables.filter(
    variable => !(variable in config)
  );

  if (missingVariables.length > 0) {
    console.log(
      `Missing required environment variables: ${missingVariables.join(", ")}`
    );
    return false;
  }

  console.log("All required environment variables are present.");
  return true;
}

export async function predictRolesModAddress(
  signer: any,
  owner: string,
  avatar: string,
  target: string,
  rolesVersion: RolesVersion
) {
  const encodedInitParams = defaultAbiCoder.encode(
    ["address", "address", "address"],
    [owner, avatar, target]
  );

  const rolesContract =
    rolesVersion == "v1" ? KnownContracts.ROLES_V1 : KnownContracts.ROLES_V2;

  const moduleSetupData = ContractFactories[rolesContract]
    .createInterface()
    .encodeFunctionData("setUp", [encodedInitParams]);

  return calculateProxyAddress(
    ContractFactories[KnownContracts.FACTORY].connect(
      ContractAddresses[1][KnownContracts.FACTORY],
      signer
    ) as any,
    ContractAddresses[1][rolesContract],
    moduleSetupData,
    SALT
  );
}

/**
 * Predicts the address of a Safe proxy that will be deployed through a Safe proxy factory
 * @param {Contract} safeProxyFactory - Instance of the Safe proxy factory contract
 * @param {string} safeMasterCopy - Address of the Safe master copy implementation
 * @param {string} data - Initialization data for the Safe proxy
 * @param {number} saltNonce - Nonce used as salt for address calculation
 * @returns {Promise<string>} The predicted address of the Safe proxy
 * @description Uses the proxy factory's calculateCreateProxyWithNonceAddress method to predict
 * the deterministic address where a Safe proxy will be deployed based on the initialization parameters
 */
export async function predictSafeAddress(
  safeProxyFactory: Contract,
  safeMasterCopy: string,
  data: string,
  saltNonce: number
) {
  return await safeProxyFactory.calculateCreateProxyWithNonceAddress(
    safeMasterCopy,
    data,
    saltNonce,
    {
      gasLimit: BigNumber.from("3000000"),
    }
  );
}

/**
 * Sets the current block number to a target block number by increasing blocks
 * @param {number} targetBlock - The desired block number to reach
 * @returns {Promise<void>} A promise that resolves when blocks have been increased
 * @description This function is useful for testing scenarios that require being at a specific block number.
 * It calculates the difference between current and target block numbers and increases blocks accordingly.
 */
export async function setUniformBlockNumber(targetBlock: number) {
  const currentBlock = await network.provider.send("eth_blockNumber");
  const currentBlockDecimal = parseInt(currentBlock, 16);
  const blocksToIncrease = targetBlock - currentBlockDecimal;

  console.log("targetBlock:", targetBlock);
  console.log("currentBlock:", currentBlockDecimal);
  console.log("blocksToIncrease:", blocksToIncrease);

  await network.provider.request({
    method: "evm_increaseBlocks",
    params: [ethers.utils.hexValue(blocksToIncrease)],
  });
}
