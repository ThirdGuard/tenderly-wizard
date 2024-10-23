import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber, BigNumberish, Contract, PopulatedTransaction, utils } from "ethers";
import { MetaTransaction, encodeMulti } from "ethers-multisend";
import { formatBytes32String } from "ethers/lib/utils";
import fs from 'fs';
import path from "path";
// @ts-ignore
import { ethers, network } from "hardhat";
import { Project, ClassDeclaration, SyntaxKind } from 'ts-morph';
import { execSync } from "child_process";

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

export const getABICodedAddress = (address: string) => utils.defaultAbiCoder.encode(["address"], [address]);

export function numberToBytes32(num: number): `0x${string}` {
  // Convert the number to a hex string
  let hexString = utils.hexlify(num);

  // Remove the "0x" prefix
  hexString = hexString.slice(2);

  // Pad the hex string to make sure it's 64 characters long (32 bytes)
  const paddedHexString = hexString.padStart(64, "0");

  // Add the "0x" prefix back
  return `0x${paddedHexString}`;
}

export const encodeBytes32String = formatBytes32String as (text: string) => `0x${string}`;

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
  const value = BigNumber.from(amount).toHexString();
  await network.provider.request({
    method: "tenderly_setErc20Balance",
    params: [token, address, value.replace("0x0", "0x")],
  });
};

export async function setGas() {
  const { VIRTUAL_MAINNET_RPC } = process.env;
  let caller: SignerWithAddress;
  let manager: SignerWithAddress;
  let dummyOwnerOne: SignerWithAddress;
  let dummyOwnerTwo: SignerWithAddress;
  let dummyOwnerThree: SignerWithAddress;
  let security: SignerWithAddress;
  [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await ethers.getSigners();
  const provider = new ethers.providers.JsonRpcProvider(VIRTUAL_MAINNET_RPC);
  await provider.send("tenderly_setBalance", [
    caller.address,
    "0xDE0B6B3A7640000",
  ]);
  await provider.send("tenderly_setBalance", [
    manager.address,
    "0xDE0B6B3A7640000",
  ]);
  await provider.send("tenderly_setBalance", [
    security.address,
    "0xDE0B6B3A7640000",
  ]);
  await provider.send("tenderly_setBalance", [
    dummyOwnerOne.address,
    "0xDE0B6B3A7640000",
  ]);
}

export function findPermissionsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`The directory ${dir} does not exist.`);
  }

  let results: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findPermissionsFiles(filePath));
    } else if (file === 'permissions.ts') {
      results.push(filePath);
    }
  }
  return results;
}


export function findWhitelistClasses(whitelistDir: string): string[] {
  const project = new Project();

  // Add all TypeScript files from the whitelist directory to the project
  fs.readdirSync(whitelistDir, { recursive: true }).forEach(file => {
    if (typeof file === 'string' && file.endsWith('.ts')) {
      project.addSourceFileAtPath(path.join(whitelistDir, file));
    }
  });

  const whitelistExtensions: string[] = [];

  // Iterate through all source files
  project.getSourceFiles().forEach(sourceFile => {
    // Find all class declarations in the file
    const classes = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);

    classes.forEach((classDeclaration: ClassDeclaration) => {
      const heritage = classDeclaration.getHeritageClauses();

      // Check if the class extends Whitelist
      if (heritage.some(clause =>
        clause.getTypeNodes().some(node =>
          node.getText().includes('Whitelist')
        )
      )) {
        whitelistExtensions.push(classDeclaration.getName() || 'AnonymousClass');
      }
    });
  });

  console.log('Classes extending Whitelist:', whitelistExtensions);

  return whitelistExtensions;
}


export function checkRequiredEnvVariables(requiredVariables: string[]) {
  const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

  console.log({ missingVariables });

  if (missingVariables.length > 0) {
    console.log(`Missing required environment variables: ${missingVariables.join(", ")}`);
    return false;
  }

  console.log("All required environment variables are present.");
  return true;
}

export function updatePackageJson() {
  // get the path of the tenderly-wizard package
  const tenderlyWizardPath = execSync('which tenderly-wizard').toString().trim()
  console.log("tenderlyWizardPath: ", tenderlyWizardPath)

  const appPath = execSync(`readlink -f ${tenderlyWizardPath}`).toString().trim().replace(/(.*tenderly-wizard).*/, '$1')
  console.log("appPath: ", appPath)

  // /Users/michaellungu/.nvm/versions/node/v20.13.0/lib/node_modules/tenderly-wizard/src/scripts/save-vnet-snapshot.ts

  // dist/scripts/save-vnet-snapshot.js

  const scriptsToAdd = {
    "deploy:vnet": `hardhat run ${appPath}/dist/scripts/deploy-vnet-safes.js --network virtual_mainnet`,
    "deploy:whitelist": `hardhat run ${appPath}/dist/scripts/whitelist-vnet-safes.js --network virtual_mainnet`,
    "save:vnet-snapshot": `hardhat run ${appPath}/dist/scripts/save-vnet-snapshot.js --network virtual_mainnet`
  };

  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    Object.assign(packageJson.scripts, scriptsToAdd);

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Scripts added to package.json successfully.');
  } else {
    console.error('package.json not found in the current working directory.');
  }
}