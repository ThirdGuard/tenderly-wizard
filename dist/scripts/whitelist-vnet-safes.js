"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execute_whitelist_v2_1 = require("./execute-whitelist-v2");
const execute_whitelist_v1_1 = require("./execute-whitelist-v1");
const env_config_1 = __importDefault(require("../env-config"));
async function main() {
    // @audit add roles directory path to .env for more flexibility
    // const { ROLES_DIRECTORY } = config;
    // if (!ROLES_DIRECTORY) {
    //     throw new Error('ROLES_DIRECTORY is not set in the .env file');
    // }
    // await whitelistSafes(ROLES_DIRECTORY);
    const { ROLES_VERSION } = env_config_1.default;
    console.log("ROLES_VERSION: ", ROLES_VERSION);
    if (ROLES_VERSION === "v1") {
        await (0, execute_whitelist_v1_1.whitelistSafesV1)('../access-control-safes/src/whitelist');
    }
    else if (ROLES_VERSION === "v2") {
        await (0, execute_whitelist_v2_1.whitelistSafesV2)("../access-control-safes-v2/src/roles");
    }
}
main();
