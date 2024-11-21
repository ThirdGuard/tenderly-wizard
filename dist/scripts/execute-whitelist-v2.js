"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelistSafesV2 = void 0;
const hardhat_1 = require("hardhat");
const whitelist_class_1 = require("../whitelist/whitelist-class");
const util_1 = require("../utils/util");
const path_1 = __importDefault(require("path"));
const env_config_1 = __importDefault(require("../env-config"));
const virtual_test_net_1 = __importDefault(require("./virtual-test-net"));
async function whitelistSafesV2(rolesDirectory = 'src/roles') {
    const callerDir = process.cwd();
    const absoluteWhitelistDirectory = path_1.default.resolve(callerDir, rolesDirectory);
    console.log("absoluteWhitelistDirectory: ", absoluteWhitelistDirectory);
    // find all files named permissions.ts in the src/roles directory
    let permissionsFiles = [];
    try {
        permissionsFiles = (0, util_1.findPermissionsFiles)(rolesDirectory);
    }
    catch (error) {
        console.error('Error finding permissions files:', error);
        process.exit(1);
    }
    // if no permissions files are found, throw an error
    if (permissionsFiles.length === 0) {
        throw new Error(`No permissions.ts files found in the ${rolesDirectory} directory or its subdirectories.`);
    }
    // set gas for all accounts
    await (0, util_1.setGas)();
    // get roles version from .env
    const rolesVersion = env_config_1.default.ROLES_VERSION;
    // get chain
    const chainId = env_config_1.default.TENDERLY_FORK_ID;
    // iterate all permissions files
    for (const file of permissionsFiles) {
        const { default: permissions, chainId: permissionsChainId } = require(file);
        console.log("permissions: ", permissions);
        console.log("permissionsChainId: ", permissionsChainId);
        try {
            // check if the current permission chainId matches the chainId in .env
            if (permissionsChainId === chainId) {
                await (0, whitelist_class_1.executeWhitelistV2)(permissions, chainId, rolesVersion);
                console.log(`Whitelist executed successfully for ${file}`);
            }
        }
        catch (error) {
            console.error(`Error executing whitelist for ${file}:`, error);
        }
    }
    // save snapshot to .env
    const postWhitelistSnapshot = await hardhat_1.network.provider.send("evm_snapshot", []);
    console.log("postWhitelistSnapshot: ", postWhitelistSnapshot);
    virtual_test_net_1.default.addToEnvFile("TENDERLY_SNAPSHOT", postWhitelistSnapshot);
    // return base;
}
exports.whitelistSafesV2 = whitelistSafesV2;
