import path from "path";
// @ts-ignore
import { ethers } from "hardhat";
import { checkRequiredEnvVariables, findWhitelistClasses } from "../utils/util";

export async function whitelistSafesV1(whitelistDirectory: string = 'src/whitelist') {
    const callerDir = process.cwd();
    const absoluteWhitelistDirectory = path.resolve(callerDir, whitelistDirectory);
    console.log("absoluteWhitelistDirectory: ", absoluteWhitelistDirectory)

    const ok = checkRequiredEnvVariables(["ACCESS_CONTROL_SAFE_ADDRESS", "INVESTMENT_SAFE_ADDRESS", "INVESTMENT_ROLES_ADDRESS", "ACCESS_CONTROL_ROLES_ADDRESS"]);
    if (!ok) {
        process.exit(1);
    }

    // @note the safes and roles addresses are read from the .env file
    const { ACCESS_CONTROL_ROLES_ADDRESS, ACCESS_CONTROL_SAFE_ADDRESS, INVESTMENT_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS } = process.env;

    // @todo get caller address
    // [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await ethers.getSigners();
    const [caller, sysAdmins, securityEOAs, managerEOAs] = await ethers.getSigners();


    // grab all files from src/whitelist and those that are extensions of the whitelist class should be extracted into a new array
    let whitelists: { path: string, className: string }[] = [];
    try {
        // console.log("whitelistDirectory: ", whitelistDirectory)
        whitelists = findWhitelistClasses(whitelistDirectory);
    } catch (error) {
        console.error('Error finding permissions files:', error);
        process.exit(1);
    }

    console.log("whitelists: ", whitelists)

    // @todo iterate over all whitelists and execute them
    for (const whitelist of whitelists) {
        const { className, path: whitelistPath } = whitelist;

        // import the whitelist class
        const whitelistClass = require(whitelistPath)[className]

        // instantiate the whitelist class
        const whitelistClassInstance = new whitelistClass(INVESTMENT_ROLES_ADDRESS, securityEOAs);

        // execute the whitelist
        await whitelistClassInstance.execute(ACCESS_CONTROL_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS);
    }
} 