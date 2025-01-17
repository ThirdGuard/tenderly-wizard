// @ts-ignore
import { ethers } from "hardhat";
import config from "../env-config";

async function main() {
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

  // import the whitelist class
  const whitelistClass = require(whitelistPath)[className];

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
}

main();
