// @ts-ignore
import { ethers } from "hardhat";
import config from "../env-config";
import { checkRequiredEnvVariables, setGas } from "../utils/util";

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

  // execute the whitelist
  await whitelistClassInstance.execute(
    ACCESS_CONTROL_ROLES_ADDRESS,
    INVESTMENT_SAFE_ADDRESS
  );

  console.log(`   ✓ ${className} executed successfully`);
}

main();
