import path from "path";
// @ts-ignore
import { ethers } from "hardhat";
import {
  checkRequiredEnvVariables,
  findWhitelistClasses,
  setGas,
} from "../utils/util";
import config from "../env-config";

export async function whitelistSafesV1(
  whitelistDirectory: string = "../access-control-safes/src/whitelist"
) {
  const callerDir = process.cwd();
  const absoluteWhitelistDirectory = path.resolve(
    callerDir,
    whitelistDirectory
  );
  console.log("absoluteWhitelistDirectory: ", absoluteWhitelistDirectory);

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

  // @note the safes and roles addresses are read from the .env file
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

  // grab all files from src/whitelist and those that are extensions of the whitelist class should be extracted into a new array
  let whitelists: { path: string; className: string }[] = [];
  try {
    whitelists = findWhitelistClasses(whitelistDirectory);
  } catch (error) {
    console.error("Error finding permissions files:", error);
    process.exit(1);
  }

  console.log(`\n🔍 Found ${whitelists.length} whitelists to execute:\n`);
  whitelists.forEach((w, i) => console.log(`  ${i + 1}. ${w.className}`));
  console.log("");

  // Track results for summary
  const results: { className: string; success: boolean; error?: string }[] = [];

  // iterate over all whitelists and execute them
  for (const whitelist of whitelists) {
    const { className, path: whitelistPath } = whitelist;

    console.log(`\n📋 Executing whitelist: ${className}`);
    console.log(`   Path: ${whitelistPath}`);

    try {
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

      // execute the whitelist
      await whitelistClassInstance.execute(
        ACCESS_CONTROL_ROLES_ADDRESS,
        INVESTMENT_SAFE_ADDRESS
      );

      console.log(`   ✓ ${className} executed successfully`);
      results.push({ className, success: true });
    } catch (error: any) {
      console.error(`   ✗ ${className} failed: ${error.message}`);
      results.push({ className, success: false, error: error.message });
      // Continue with next whitelist instead of stopping
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 WHITELIST EXECUTION SUMMARY");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✓ Successful: ${successful.length}/${results.length}`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`  - ${r.className}`));
  }
  
  if (failed.length > 0) {
    console.log(`\n✗ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`  - ${r.className}: ${r.error}`));
  }
  
  console.log("\n" + "=".repeat(60));

  // Exit with error if any whitelists failed
  if (failed.length > 0) {
    console.error(`\n❌ ${failed.length} whitelist(s) failed. See errors above.`);
    process.exit(1);
  }
}
