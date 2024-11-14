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
const env_config_1 = __importDefault(require("../env-config"));
async function whitelistSafesV1(whitelistDirectory = 'src/whitelist') {
    const callerDir = process.cwd();
    const absoluteWhitelistDirectory = path_1.default.resolve(callerDir, whitelistDirectory);
    console.log("absoluteWhitelistDirectory: ", absoluteWhitelistDirectory);
    const ok = (0, util_1.checkRequiredEnvVariables)(["ACCESS_CONTROL_SAFE_ADDRESS", "INVESTMENT_SAFE_ADDRESS", "INVESTMENT_ROLES_ADDRESS", "ACCESS_CONTROL_ROLES_ADDRESS"]);
    if (!ok) {
        process.exit(1);
    }
    // set gas for all accounts
    await (0, util_1.setGas)();
    // @note the safes and roles addresses are read from the .env file
    const { ACCESS_CONTROL_ROLES_ADDRESS, ACCESS_CONTROL_SAFE_ADDRESS, INVESTMENT_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS } = env_config_1.default;
    // @todo get caller address
    const [caller, manager, dummyOwnerOne, dummyOwnerTwo, dummyOwnerThree, security] = await hardhat_1.ethers.getSigners();
    // grab all files from src/whitelist and those that are extensions of the whitelist class should be extracted into a new array
    let whitelists = [];
    try {
        // console.log("whitelistDirectory: ", whitelistDirectory)
        whitelists = (0, util_1.findWhitelistClasses)(whitelistDirectory);
    }
    catch (error) {
        console.error('Error finding permissions files:', error);
        process.exit(1);
    }
    // @todo iterate over all whitelists and execute them
    for (const whitelist of whitelists) {
        const { className, path: whitelistPath } = whitelist;
        // import the whitelist class
        const whitelistClass = require(whitelistPath)[className];
        // instantiate the whitelist class
        const whitelistClassInstance = new whitelistClass(INVESTMENT_ROLES_ADDRESS, security);
        // execute the whitelist
        await whitelistClassInstance.execute(ACCESS_CONTROL_ROLES_ADDRESS, INVESTMENT_SAFE_ADDRESS);
    }
}
exports.whitelistSafesV1 = whitelistSafesV1;
