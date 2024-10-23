import path from "path";
// @ts-ignore
import { ethers } from "hardhat";
import { checkRequiredEnvVariables, findWhitelistClasses } from "../utils/util";

export async function whitelistSafesV1(whitelistDirectory: string = path.join(__dirname, 'src', 'whitelist')) {
    // first do a check for safes and roles addresses in .env. Throw an error if any of them are missing
    const ok = checkRequiredEnvVariables(["ACCESS_CONTROL_SAFE_ADDRESS", "INVESTMENT_SAFE_ADDRESS", "INVESTMENT_ROLES_ADDRESS", "ACCESS_CONTROL_ROLES_ADDRESS"]);
    if (!ok) {
        process.exit(1);
    }

    // @note the safes and roles addresses are read from the .env file
    const { ACCESS_CONTROL_ROLES_ADDRESS, ACCESS_CONTROL_SAFE_ADDRESS, INVESTMENT_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS } = process.env;

    // @todo get caller address
    const [caller] = await ethers.getSigners();


    // @todo grab all files from src/whitelist and those that are extensions of the whitelist class should be extracted into a new array
    let whitelists: string[] = [];
    try {
        whitelists = findWhitelistClasses(whitelistDirectory);
    } catch (error) {
        console.error('Error finding permissions files:', error);
        process.exit(1);
    }

    // @todo iterate over all whitelists and execute them
    for (const whitelist of whitelists) {
        const { default: whitelistClass } = require(whitelist);
        const whitelistInstance = new whitelistClass(INVESTMENT_ROLES_ADDRESS, caller);
        await whitelistInstance.execute(ACCESS_CONTROL_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS);
    }
}