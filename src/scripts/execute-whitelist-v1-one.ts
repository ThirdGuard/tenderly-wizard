// @ts-ignore
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import config from "../env-config";
import { checkRequiredEnvVariables, setGas } from "../utils/util";

// Very high gas limit for Tenderly testnet - bypass estimateGas failures
// Tenderly virtual testnets can handle high gas limits since they're simulated
const MANUAL_GAS_LIMIT = BigNumber.from("150000000"); // 150M gas

async function main() {
  const ok = checkRequiredEnvVariables([
    "ACCESS_CONTROL_SAFE_ADDRESS",
    "INVESTMENT_SAFE_ADDRESS",
    "INVESTMENT_ROLES_ADDRESS",
    "ACCESS_CONTROL_ROLES_ADDRESS",
  ]);
  if (!ok) {
    process.exit(1);
  }

  // set gas for all accounts
  await setGas();

  // @audit the whitelist object is being read from .env variables,
  // need a better solution for this. Currently, this function is
  // being called by execSync in wizard.ts
  if (!process.env.SELECTED_WHITELIST) {
    console.error("No whitelist selected");
    process.exit(1);
  }

  const whitelist: {
    className: string;
    path: string;
  } = JSON.parse(process.env.SELECTED_WHITELIST);

  const {
    ACCESS_CONTROL_ROLES_ADDRESS,
    ACCESS_CONTROL_SAFE_ADDRESS,
    INVESTMENT_ROLES_ADDRESS,
    INVESTMENT_SAFE_ADDRESS,
  } = config;

  // get caller address
  const [
    caller,
    manager,
    dummyOwnerOne,
    dummyOwnerTwo,
    dummyOwnerThree,
    security,
  ] = await ethers.getSigners();

  const { className, path: whitelistPath } = whitelist;

  console.log(`\n📋 Executing whitelist: ${className}`);
  console.log(`   Path: ${whitelistPath}`);

  // import the whitelist class
  const whitelistModule = require(whitelistPath);
  const whitelistClass = whitelistModule[className];

  // Check if the class was found
  if (!whitelistClass) {
    const availableExports = Object.keys(whitelistModule).join(", ");
    throw new Error(
      `Class "${className}" not found in module. ` +
      `Available exports: [${availableExports}]. ` +
      `This usually means the class is not exported or has a different name.`
    );
  }

  // Check if it's actually a constructor
  if (typeof whitelistClass !== "function") {
    throw new Error(
      `"${className}" is not a constructor (type: ${typeof whitelistClass}). ` +
      `Make sure the class is properly exported.`
    );
  }

  // instantiate the whitelist class
  const whitelistClassInstance = new whitelistClass(
    INVESTMENT_ROLES_ADDRESS,
    security
  );

  // execute the whitelist with gas estimation error handling
  try {
    await whitelistClassInstance.execute(
      ACCESS_CONTROL_ROLES_ADDRESS,
      INVESTMENT_SAFE_ADDRESS
    );
    console.log(`   ✓ ${className} executed successfully`);
  } catch (error: any) {
    // Check if this is a gas estimation error (UNPREDICTABLE_GAS_LIMIT)
    if (error.code === "UNPREDICTABLE_GAS_LIMIT" ||
        error.message?.includes("UNPREDICTABLE_GAS_LIMIT") ||
        error.message?.includes("cannot estimate gas")) {

      console.log(`   ⚠ Gas estimation failed, retrying with manual gas limit...`);

      // Check if the whitelist class has a build method to get the populated tx
      if (typeof whitelistClassInstance.build === "function") {
        try {
          const populatedTx = await whitelistClassInstance.build(
            ACCESS_CONTROL_ROLES_ADDRESS,
            INVESTMENT_SAFE_ADDRESS
          );

          // Send with manual gas limit to bypass estimation and see actual error
          const tx = await security.sendTransaction({
            ...populatedTx,
            gasLimit: MANUAL_GAS_LIMIT,
          });

          const receipt = await tx.wait();
          console.log(`   ✓ ${className} executed successfully (with manual gas limit)`);
          console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        } catch (retryError: any) {
          // Extract the actual revert reason if available
          let revertReason = "Unknown";
          if (retryError.reason) {
            revertReason = retryError.reason;
          } else if (retryError.error?.reason) {
            revertReason = retryError.error.reason;
          } else if (retryError.message) {
            // Try to extract revert reason from error message
            const match = retryError.message.match(/reverted with reason string '([^']+)'/);
            if (match) {
              revertReason = match[1];
            } else {
              revertReason = retryError.message.substring(0, 200);
            }
          }

          console.error(`   ✗ Transaction reverted: ${revertReason}`);
          throw retryError;
        }
      } else {
        // No build method available, re-throw original error
        console.error(`   ✗ Cannot retry: whitelist class has no build() method`);
        throw error;
      }
    } else {
      // Not a gas estimation error, re-throw
      throw error;
    }
  }
}

main();
