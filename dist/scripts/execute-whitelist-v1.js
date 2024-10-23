"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelistSafesV1 = void 0;
const path_1 = __importDefault(require("path"));
// @ts-ignore
const hardhat_1 = require("hardhat");
const util_1 = require("../utils/util");
async function whitelistSafesV1(whitelistDirectory = path_1.default.join(__dirname, 'src', 'whitelist')) {
    // first do a check for safes and roles addresses in .env. Throw an error if any of them are missing
    const ok = (0, util_1.checkRequiredEnvVariables)(["ACCESS_CONTROL_SAFE_ADDRESS", "INVESTMENT_SAFE_ADDRESS", "INVESTMENT_ROLES_ADDRESS", "ACCESS_CONTROL_ROLES_ADDRESS"]);
    if (!ok) {
        process.exit(1);
    }
    // @note the safes and roles addresses are read from the .env file
    const { ACCESS_CONTROL_ROLES_ADDRESS, ACCESS_CONTROL_SAFE_ADDRESS, INVESTMENT_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS } = process.env;
    // @todo get caller address
    const [caller] = await hardhat_1.ethers.getSigners();
    // @todo grab all files from src/whitelist and those that are extensions of the whitelist class should be extracted into a new array
    let whitelists = [];
    try {
        whitelists = (0, util_1.findWhitelistClasses)(whitelistDirectory);
    }
    catch (error) {
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
exports.whitelistSafesV1 = whitelistSafesV1;
